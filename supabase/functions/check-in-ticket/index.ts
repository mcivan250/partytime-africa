// check-in-ticket: verifies a scanned code at the door and checks the guest in.
// Accepts BOTH a rotating signed token (ptk1.<id>.<exp>.<sig>) and a legacy
// static qr_code, so existing tickets keep working. Only an event manager can
// call it. Returns whether the scan was "live" (a fresh rotating code) so staff
// can be warned about static codes (possible screenshots).
//
// Optional secret: TICKET_QR_SECRET (must match ticket-token; falls back to the
// service-role key).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

function b64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function sign(msg: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return b64url(new Uint8Array(sig));
}
// Constant-time-ish string compare.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: userData } = await userClient.auth.getUser();
  const user = userData.user;
  if (!user) return json({ error: 'Please sign in.' }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const code = (typeof body.code === 'string' ? body.code : '').trim();
  const eventId = typeof body.event_id === 'string' ? body.event_id : '';
  if (!code || !eventId) return json({ error: 'Missing code or event.' }, 400);

  // Authorise: caller must manage this event.
  const { data: canManage } = await userClient.rpc('is_event_manager', { e: eventId });
  if (canManage !== true) return json({ kind: 'error', text: 'Only the host can check guests in.' }, 403);

  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Resolve the code → a ticket id (rotating token) or a legacy qr_code.
  let live = false;
  let ticketQuery;
  if (code.startsWith('ptk1.')) {
    const parts = code.split('.');
    if (parts.length !== 4) return json({ kind: 'error', text: 'Unreadable ticket code.' }, 200);
    const [, id, expStr, sig] = parts;
    const secret = Deno.env.get('TICKET_QR_SECRET') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const expected = await sign(`${id}.${expStr}`, secret);
    if (!safeEqual(sig, expected)) {
      return json({ kind: 'error', text: 'Invalid ticket code.' }, 200);
    }
    if (Number(expStr) * 1000 < Date.now()) {
      return json({ kind: 'error', text: 'Code expired — ask the guest to refresh their ticket.' }, 200);
    }
    live = true;
    ticketQuery = admin
      .from('tickets')
      .select('id, attendee_name, status, ticket_tiers(name)')
      .eq('id', id)
      .eq('event_id', eventId)
      .maybeSingle();
  } else {
    ticketQuery = admin
      .from('tickets')
      .select('id, attendee_name, status, ticket_tiers(name)')
      .eq('qr_code', code)
      .eq('event_id', eventId)
      .maybeSingle();
  }

  const { data: ticket } = await ticketQuery;
  if (!ticket) return json({ kind: 'error', text: 'Ticket not found for this event.' }, 200);

  const tier = (ticket.ticket_tiers as { name: string } | null)?.name;
  if (ticket.status === 'void') {
    return json({ kind: 'error', text: `${ticket.attendee_name}: ticket is void.`, live }, 200);
  }
  if (ticket.status === 'checked_in') {
    return json({ kind: 'warn', text: `${ticket.attendee_name} is already checked in.`, live }, 200);
  }

  const { error: updErr } = await admin
    .from('tickets')
    .update({ status: 'checked_in', checked_in_at: new Date().toISOString(), checked_in_by: user.id })
    .eq('id', ticket.id)
    .eq('status', 'valid'); // single-use guard against a double-scan race
  if (updErr) return json({ kind: 'error', text: 'Could not check in — try again.' }, 200);

  return json({
    kind: 'ok',
    text: `✓ ${ticket.attendee_name} in${tier ? ` · ${tier}` : ''}`,
    live,
    name: ticket.attendee_name,
  });
});
