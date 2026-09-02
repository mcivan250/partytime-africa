// ticket-token: mints a short-lived, HMAC-signed token for a ticket the caller
// owns, so the wallet can show a QR that rotates every ~30s. A screenshot of a
// rotating code expires in seconds and can't be resold — unlike a static QR.
// The door (check-in-ticket) verifies the signature and expiry server-side.
//
// Optional secret: TICKET_QR_SECRET (falls back to the service-role key).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

const TTL_SECONDS = 45;

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
  const ticketId = typeof body.ticket_id === 'string' ? body.ticket_id : '';
  if (!ticketId) return json({ error: 'Missing ticket.' }, 400);

  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: ticket } = await admin
    .from('tickets')
    .select('id, status, orders!inner(profile_id)')
    .eq('id', ticketId)
    .maybeSingle();

  const owner = (ticket?.orders as { profile_id: string } | null)?.profile_id;
  if (!ticket || owner !== user.id) return json({ error: 'Not your ticket.' }, 403);
  if (ticket.status === 'void') return json({ error: 'This ticket is void.' }, 409);

  const secret = Deno.env.get('TICKET_QR_SECRET') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `${ticket.id}.${exp}`;
  const sig = await sign(payload, secret);
  const token = `ptk1.${payload}.${sig}`;

  return json({ token, ttl: TTL_SECONDS });
});
