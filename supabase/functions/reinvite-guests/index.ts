// reinvite-guests: invite everyone who came to one of your events to another
// of your events. Registered guests get an in-app notification (via the
// invite_past_guests RPC, which also enforces that the caller manages BOTH
// events); phone-only guests get a best-effort SMS with the event link if
// Africa's Talking is configured. Only reachable by a signed-in manager.
//
// Optional SMS secrets (Supabase → Project Settings → Edge Functions):
//   AFRICASTALKING_API_KEY, AFRICASTALKING_USERNAME (use "sandbox" for tests)
//   AFRICASTALKING_SENDER_ID (optional), AFRICASTALKING_DEFAULT_CC (default "+256")
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const sourceId = typeof body.source_event === 'string' ? body.source_event : '';
  const targetId = typeof body.target_event === 'string' ? body.target_event : '';
  if (!sourceId || !targetId) return json({ error: 'Missing events.' }, 400);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const authHeader = req.headers.get('Authorization') ?? '';

  // Caller-scoped client: the RPC's own is_event_manager() checks run as them.
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData.user) return json({ error: 'Please sign in.' }, 401);

  // 1) In-app notifications for registered guests. This also authorises the
  //    whole request: the RPC raises if the caller doesn't manage both events.
  const { data: rpcData, error: rpcError } = await userClient.rpc('invite_past_guests', {
    p_source_event: sourceId,
    p_target_event: targetId,
  });
  if (rpcError) {
    return json({ error: rpcError.message || 'Not allowed.' }, 403);
  }
  const notified = Number((rpcData as { notified?: number })?.notified ?? 0);

  // 2) Best-effort SMS to phone-only guests of the source event.
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: target } = await admin
    .from('events')
    .select('slug, title')
    .eq('id', targetId)
    .maybeSingle();

  const apiKey = Deno.env.get('AFRICASTALKING_API_KEY');
  const username = Deno.env.get('AFRICASTALKING_USERNAME');
  const smsConfigured = !!apiKey && !!username;
  const senderId = Deno.env.get('AFRICASTALKING_SENDER_ID') ?? '';
  const defaultCc = Deno.env.get('AFRICASTALKING_DEFAULT_CC') ?? '+256';

  let smsSent = 0;
  let phoneGuests = 0;
  if (target) {
    const { data: phoneRows } = await admin
      .from('rsvps')
      .select('guest_phone')
      .eq('event_id', sourceId)
      .is('profile_id', null)
      .in('status', ['going', 'maybe'])
      .not('guest_phone', 'is', null);

    const numbers = Array.from(
      new Set(
        (phoneRows ?? [])
          .map((r) => normalisePhone(String(r.guest_phone ?? ''), defaultCc))
          .filter((n): n is string => !!n),
      ),
    ).slice(0, 500);
    phoneGuests = numbers.length;

    if (smsConfigured && numbers.length > 0) {
      const message = `You're invited to ${target.title} on Party Time! RSVP here: https://partytime.africa/e/${target.slug}`;
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
        smsSent = Array.isArray(recipients)
          ? recipients.filter((r: { status?: string }) => r.status === 'Success').length
          : 0;
      } catch (e) {
        console.error('reinvite-guests: SMS failed', e instanceof Error ? e.message : String(e));
      }
    }
  }

  return json({
    notified,
    sms_sent: smsSent,
    phone_guests: phoneGuests,
    sms_configured: smsConfigured,
  });
});
