// send-reminders: processes due event reminders and texts each event's going
// guests via Africa's Talking. Meant to be called on a schedule (pg_cron).
// Idempotent — a reminder is marked sent_at so it never fires twice.
//
// Not user-facing: verify_jwt is off; if CRON_SECRET is configured it must be
// sent as the x-cron-secret header. Reuses the AFRICASTALKING_* secrets.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

function normalisePhone(raw: string, defaultCc: string): string | null {
  const t = raw.replace(/[\s-()]/g, '');
  if (!t) return null;
  if (t.startsWith('+')) return t;
  if (t.startsWith('00')) return `+${t.slice(2)}`;
  if (t.startsWith('0')) return `${defaultCc}${t.slice(1)}`;
  if (/^\d{7,15}$/.test(t)) return `+${t}`;
  return null;
}

async function sendSms(
  base: string,
  username: string,
  apiKey: string,
  senderId: string,
  to: string[],
  message: string,
): Promise<number> {
  const form = new URLSearchParams();
  form.set('username', username);
  form.set('to', to.join(','));
  form.set('message', message);
  if (senderId) form.set('from', senderId);
  const res = await fetch(`${base}/version1/messaging`, {
    method: 'POST',
    headers: {
      apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: form.toString(),
  });
  if (!res.ok) return 0;
  const body = await res.json().catch(() => ({}));
  const recipients = body?.SMSMessageData?.Recipients ?? [];
  return Array.isArray(recipients)
    ? recipients.filter((r: { status?: string }) => r.status === 'Success').length
    : 0;
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const apiKey = Deno.env.get('AFRICASTALKING_API_KEY');
  const username = Deno.env.get('AFRICASTALKING_USERNAME');
  const senderId = Deno.env.get('AFRICASTALKING_SENDER_ID') ?? '';
  const defaultCc = Deno.env.get('AFRICASTALKING_DEFAULT_CC') ?? '+256';
  const base =
    username === 'sandbox'
      ? 'https://api.sandbox.africastalking.com'
      : 'https://api.africastalking.com';

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: due } = await admin
    .from('reminders')
    .select('id, event_id, events(title, slug, starts_at, timezone, status)')
    .is('sent_at', null)
    .lte('send_at', new Date().toISOString())
    .limit(100);

  let processed = 0;
  let sent = 0;

  for (const r of due ?? []) {
    const event = r.events as {
      title: string;
      slug: string;
      starts_at: string | null;
      timezone: string;
      status: string;
    } | null;

    // Skip (but still clear) reminders whose event is gone/cancelled.
    if (event && event.status === 'published' && apiKey && username) {
      const { data: rsvps } = await admin
        .from('rsvps')
        .select('guest_phone')
        .eq('event_id', r.event_id)
        .eq('status', 'going')
        .not('guest_phone', 'is', null);

      const numbers = Array.from(
        new Set(
          (rsvps ?? [])
            .map((x) => normalisePhone(String(x.guest_phone ?? ''), defaultCc))
            .filter((n): n is string => !!n),
        ),
      );

      if (numbers.length > 0) {
        const when = event.starts_at
          ? new Intl.DateTimeFormat('en-GB', {
              weekday: 'short',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: event.timezone,
            }).format(new Date(event.starts_at))
          : 'soon';
        const message = `Reminder: ${event.title} is tomorrow (${when}). See you there! https://partytime.africa/e/${event.slug}`;
        sent += await sendSms(base, username, apiKey, senderId, numbers, message);
      }
    }

    await admin.from('reminders').update({ sent_at: new Date().toISOString() }).eq('id', r.id);
    processed += 1;
  }

  return new Response(JSON.stringify({ processed, sent }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
