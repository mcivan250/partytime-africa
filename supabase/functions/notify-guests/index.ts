// notify-guests: lets an event host/co-host send an SMS "blast" to their
// guests via Africa's Talking. Only managers of the event may call it — the
// caller's JWT is verified (verify_jwt on) and checked against the event.
//
// Secrets (set in Supabase → Project Settings → Edge Functions):
//   AFRICASTALKING_API_KEY       (required)
//   AFRICASTALKING_USERNAME      (required; "sandbox" uses the sandbox API)
//   AFRICASTALKING_SENDER_ID     (optional shortcode/sender id)
//   AFRICASTALKING_DEFAULT_CC    (optional, default "+256") for local numbers
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Best-effort E.164 normalisation. Numbers already starting with "+" are kept;
// "00" prefixes become "+"; local "0…" numbers get the default country code.
function normalisePhone(raw: string, defaultCc: string): string | null {
  const trimmed = raw.replace(/[\s-()]/g, '');
  if (!trimmed) return null;
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('00')) return `+${trimmed.slice(2)}`;
  if (trimmed.startsWith('0')) return `${defaultCc}${trimmed.slice(1)}`;
  if (/^\d{7,15}$/.test(trimmed)) return `+${trimmed}`;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const apiKey = Deno.env.get('AFRICASTALKING_API_KEY');
  const username = Deno.env.get('AFRICASTALKING_USERNAME');
  if (!apiKey || !username) {
    return json({ error: 'SMS is not configured yet. Ask the host to set it up.' }, 503);
  }
  const senderId = Deno.env.get('AFRICASTALKING_SENDER_ID') ?? '';
  const defaultCc = Deno.env.get('AFRICASTALKING_DEFAULT_CC') ?? '+256';

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const eventId = typeof body.event_id === 'string' ? body.event_id : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const audience = body.audience === 'all' ? 'all' : 'going';
  if (!eventId) return json({ error: 'Missing event.' }, 400);
  if (message.length < 1 || message.length > 480) {
    return json({ error: 'Message must be 1–480 characters.' }, 400);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  // Identify the caller from their JWT.
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await userClient.auth.getUser();
  const user = userData.user;
  if (!user) return json({ error: 'You must be signed in.' }, 401);

  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Authorise: caller must be the host or a co-host of the event.
  const { data: event } = await admin
    .from('events')
    .select('id, host_id, title')
    .eq('id', eventId)
    .maybeSingle();
  if (!event) return json({ error: 'Event not found.' }, 404);
  let isManager = event.host_id === user.id;
  if (!isManager) {
    const { data: coHost } = await admin
      .from('co_hosts')
      .select('profile_id')
      .eq('event_id', eventId)
      .eq('profile_id', user.id)
      .maybeSingle();
    isManager = !!coHost;
  }
  if (!isManager) return json({ error: 'Only the host can message guests.' }, 403);

  // Collect recipient phone numbers.
  let query = admin
    .from('rsvps')
    .select('guest_phone, status')
    .eq('event_id', eventId)
    .not('guest_phone', 'is', null);
  if (audience === 'going') query = query.eq('status', 'going');
  const { data: rsvps } = await query;

  const numbers = Array.from(
    new Set(
      (rsvps ?? [])
        .map((r) => normalisePhone(String(r.guest_phone ?? ''), defaultCc))
        .filter((n): n is string => !!n),
    ),
  );
  if (numbers.length === 0) {
    return json({ sent: 0, recipients: 0, note: 'No guests with phone numbers yet.' });
  }

  // Send via Africa's Talking.
  const base =
    username === 'sandbox'
      ? 'https://api.sandbox.africastalking.com'
      : 'https://api.africastalking.com';
  const form = new URLSearchParams();
  form.set('username', username);
  form.set('to', numbers.join(','));
  form.set('message', message);
  if (senderId) form.set('from', senderId);

  const atRes = await fetch(`${base}/version1/messaging`, {
    method: 'POST',
    headers: {
      apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: form.toString(),
  });
  const atBody = await atRes.json().catch(() => ({}));
  if (!atRes.ok) {
    return json({ error: 'SMS provider rejected the request.', detail: atBody }, 502);
  }

  const recipients = atBody?.SMSMessageData?.Recipients ?? [];
  const sent = Array.isArray(recipients)
    ? recipients.filter((r: { status?: string }) => r.status === 'Success').length
    : 0;
  return json({ sent, recipients: numbers.length });
});
