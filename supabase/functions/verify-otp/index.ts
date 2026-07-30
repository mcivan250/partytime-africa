// verify-otp: checks a code sent by send-otp. On success it marks the number
// verified on the signed-in user's profile and opts them in to updates.
// Requires the user to be signed in.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

function normalisePhone(raw: string): string | null {
  let t = raw.replace(/[^\d+]/g, '');
  if (t.startsWith('+')) t = t.slice(1);
  else if (t.startsWith('00')) t = t.slice(2);
  else if (t.startsWith('0')) t = `256${t.slice(1)}`;
  return /^\d{7,15}$/.test(t) ? t : null;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
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
  if (!user) return json({ error: 'Please sign in first.' }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const phone = normalisePhone(typeof body.phone === 'string' ? body.phone : '');
  const code = (typeof body.code === 'string' ? body.code : '').replace(/\D/g, '');
  if (!phone) return json({ error: 'Enter a valid phone number.' }, 400);
  if (code.length < 4) return json({ error: 'Enter the code from WhatsApp.' }, 400);

  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: row } = await admin
    .from('phone_verifications')
    .select('id, code_hash, attempts, expires_at, verified_at')
    .eq('profile_id', user.id)
    .eq('phone', phone)
    .is('verified_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return json({ error: 'No pending code — request a new one.' }, 404);
  if (new Date(row.expires_at) < new Date()) {
    return json({ error: 'That code expired — request a new one.' }, 410);
  }
  if (row.attempts >= 5) {
    return json({ error: 'Too many tries — request a new code.' }, 429);
  }

  await admin.from('phone_verifications').update({ attempts: row.attempts + 1 }).eq('id', row.id);

  const pepper = Deno.env.get('OTP_PEPPER') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const codeHash = await sha256Hex(`${code}:${pepper}`);
  if (codeHash !== row.code_hash) {
    return json({ error: 'That code is incorrect.' }, 401);
  }

  // Success: mark the row verified and stamp the profile.
  await admin.from('phone_verifications').update({ verified_at: new Date().toISOString() }).eq('id', row.id);
  const { error: updErr } = await admin
    .from('profiles')
    .update({ phone: `+${phone}`, phone_verified: true, wa_opt_in: true })
    .eq('id', user.id);
  if (updErr) return json({ error: 'Verified, but could not save. Try again.' }, 500);

  return json({ verified: true, phone: `+${phone}` });
});
