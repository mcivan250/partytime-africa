// send-otp: sends a one-time verification code to a signed-in user's WhatsApp
// via the Meta WhatsApp Cloud API, and stores its hash for later checking by
// verify-otp. Requires the user to be signed in (the code verifies a number
// onto their profile). Rate-limited per profile.
//
// Required secrets (Supabase → Project Settings → Edge Functions) once your
// WhatsApp Business account + authentication template are approved:
//   WHATSAPP_TOKEN            – permanent access token for the WABA
//   WHATSAPP_PHONE_NUMBER_ID  – the sender phone number's ID
//   WHATSAPP_OTP_TEMPLATE     – approved authentication template name
//   WHATSAPP_OTP_LANG         – template language code (e.g. en_US)  [default en_US]
//   WHATSAPP_OTP_BUTTON       – 'copy_code' (default) or 'one_tap'
//   WHATSAPP_API_VERSION      – Graph API version (default v21.0)
//   OTP_PEPPER                – secret mixed into the code hash (optional)
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

// E.164 digits, no '+'. Ugandan local numbers (leading 0) default to +256.
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
  if (!phone) return json({ error: 'Enter a valid phone number.' }, 400);

  const token = Deno.env.get('WHATSAPP_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  if (!token || !phoneNumberId) {
    return json({ error: 'WhatsApp verification is not switched on yet.' }, 503);
  }

  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Rate limit: max 5 codes/hour per profile, and 30s between sends.
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { data: recent } = await admin
    .from('phone_verifications')
    .select('created_at')
    .eq('profile_id', user.id)
    .gte('created_at', hourAgo)
    .order('created_at', { ascending: false });
  if ((recent?.length ?? 0) >= 5) {
    return json({ error: 'Too many attempts. Try again in an hour.' }, 429);
  }
  if (recent && recent[0] && Date.now() - new Date(recent[0].created_at).getTime() < 30_000) {
    return json({ error: 'Please wait a few seconds before requesting another code.' }, 429);
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const pepper = Deno.env.get('OTP_PEPPER') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const codeHash = await sha256Hex(`${code}:${pepper}`);
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();

  const { error: insErr } = await admin.from('phone_verifications').insert({
    profile_id: user.id,
    phone,
    code_hash: codeHash,
    expires_at: expiresAt,
  });
  if (insErr) return json({ error: 'Could not start verification. Try again.' }, 500);

  // Build the authentication-template send payload. The code appears in both
  // the body and the button, per Meta's authentication template spec.
  const buttonStyle = (Deno.env.get('WHATSAPP_OTP_BUTTON') ?? 'copy_code').toLowerCase();
  const buttonComponent =
    buttonStyle === 'one_tap'
      ? { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] }
      : { type: 'button', sub_type: 'copy_code', index: '0', parameters: [{ type: 'coupon_code', coupon_code: code }] };

  const version = Deno.env.get('WHATSAPP_API_VERSION') ?? 'v21.0';
  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: Deno.env.get('WHATSAPP_OTP_TEMPLATE') ?? 'otp_verification',
      language: { code: Deno.env.get('WHATSAPP_OTP_LANG') ?? 'en_US' },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: code }] },
        buttonComponent,
      ],
    },
  };

  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Surface Meta's reason (template mismatch, unregistered number, etc.).
      const detail = data?.error?.message || `HTTP ${res.status}`;
      console.error('send-otp: WhatsApp API error', res.status, JSON.stringify(data).slice(0, 600));
      return json({ error: `Could not send the code: ${detail}` }, 502);
    }
  } catch (e) {
    console.error('send-otp: WhatsApp call failed', e instanceof Error ? e.message : String(e));
    return json({ error: 'Could not reach WhatsApp. Try again.' }, 502);
  }

  return json({ ok: true, phone, expires_in: 600 });
});
