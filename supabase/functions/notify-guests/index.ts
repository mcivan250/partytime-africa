// notify-guests: lets an event host/co-host message their guests. Every
// registered guest receives an in-app notification (works with no external
// setup); if Africa's Talking SMS is configured, guests with phone numbers
// also get an SMS as a bonus. Only managers of the event may call it.
//
// Optional SMS secrets (Supabase → Project Settings → Edge Functions):
//   AFRICASTALKING_API_KEY, AFRICASTALKING_USERNAME (use "sandbox" for tests)
//   AFRICASTALKING_SENDER_ID (optional), AFRICASTALKING_DEFAULT_CC (default "+256")
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

// Best-effort E.164 normalisation.
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
  const smsConfigured = !!apiKey && !!username;
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
    .select('id, host_id, title, slug')
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

  // Collect recipients (registered guests for in-app, phone numbers for SMS).
  let query = admin
    .from('rsvps')
    .select('profile_id, guest_phone, status')
    .eq('event_id', eventId);
  if (audience === 'going') query = query.eq('status', 'going');
  const { data: rsvps } = await query;

  const profileIds = Array.from(
    new Set((rsvps ?? []).map((r) => r.profile_id).filter((p): p is string => !!p)),
  ).filter((p) => p !== user.id); // don't notify the sender

  const numbers = Array.from(
    new Set(
      (rsvps ?? [])
        .map((r) => normalisePhone(String(r.guest_phone ?? ''), defaultCc))
        .filter((n): n is string => !!n),
    ),
  );

  // 1) In-app notifications for every registered guest.
  let sentInApp = 0;
  if (profileIds.length > 0) {
    const rows = profileIds.map((pid) => ({
      profile_id: pid,
      ntype: 'event_message',
      payload: {
        event_id: event.id,
        event_slug: event.slug,
        event_title: event.title,
        message,
      },
    }));
    const { error: notifErr } = await admin.from('notifications').insert(rows);
    if (!notifErr) sentInApp = rows.length;
  }

  // 2) Best-effort SMS (only if configured).
  let sentSms = 0;
  if (smsConfigured && numbers.length > 0) {
    try {
      const base =
        username === 'sandbox'
          ? 'https://api.sandbox.africastalking.com'
          : 'https://api.africastalking.com';
      const form = new URLSearchParams();
      form.set('username', username!);
      form.set('to', numbers.join(','));
      form.set('message', message);
      if (senderId) form.set('from', senderId);
      const atRes = await fetch(`${base}/version1/messaging`, {
        method: 'POST',
        headers: {
          apiKey: apiKey!,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: form.toString(),
      });
      const atBody = await atRes.json().catch(() => ({}));
      const recipients = atBody?.SMSMessageData?.Recipients ?? [];
      sentSms = Array.isArray(recipients)
        ? recipients.filter((r: { status?: string }) => r.status === 'Success').length
        : 0;
    } catch {
      // Swallow SMS errors — the in-app message already went out.
      sentSms = 0;
    }
  }

  const total = sentInApp + sentSms;
  const note =
    total === 0
      ? 'No guests to notify yet — invite people or wait for RSVPs.'
      : `Notified ${sentInApp} guest(s) in-app${sentSms > 0 ? ` and ${sentSms} by SMS` : ''}. 📣`;

  return json({ ok: true, sent: total, sent_inapp: sentInApp, sent_sms: sentSms, note });
});
