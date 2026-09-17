// admin-readiness: a launch-readiness check for admins. Reports whether each
// system is CONFIGURED (presence of secrets — never their values) plus a few
// live data signals, so the founder can see at a glance what's really wired up
// before going live. Admin-gated.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

const has = (k: string) => (Deno.env.get(k) ?? '').trim().length > 0;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData.user) return json({ error: 'Please sign in.' }, 401);
  const { data: isAdmin } = await userClient.rpc('is_admin');
  if (isAdmin !== true) return json({ error: 'Admins only.' }, 403);

  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const nowIso = new Date().toISOString();
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString();

  const [upcoming, paid30, lastPaid] = await Promise.all([
    admin
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('visibility', 'public')
      .gt('starts_at', nowIso),
    admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'paid')
      .gt('created_at', monthAgo),
    admin.from('orders').select('created_at').eq('status', 'paid').order('created_at', { ascending: false }).limit(1),
  ]);

  const pesapalEnv = (Deno.env.get('PESAPAL_ENV') ?? '').trim().toLowerCase();
  const pesapalConfigured = has('PESAPAL_CONSUMER_KEY') && has('PESAPAL_CONSUMER_SECRET');

  return json({
    checked_at: nowIso,
    payments: {
      configured: pesapalConfigured,
      mode: pesapalEnv || 'unset',
      live: pesapalConfigured && (pesapalEnv === 'live' || pesapalEnv === 'production'),
    },
    ai: {
      gemini: has('GEMINI_API_KEY'),
      anthropic: has('ANTHROPIC_API_KEY'),
    },
    otp: {
      whatsapp: has('WHATSAPP_TOKEN') && has('WHATSAPP_PHONE_NUMBER_ID') && has('WHATSAPP_OTP_TEMPLATE'),
      sms: has('AFRICASTALKING_API_KEY') && has('AFRICASTALKING_USERNAME'),
      pepper: has('OTP_PEPPER'),
    },
    tickets: { qr_secret: has('TICKET_QR_SECRET') },
    reminders: { cron_secret: has('CRON_SECRET') },
    data: {
      upcoming_events: upcoming.count ?? 0,
      paid_last_30d: paid30.count ?? 0,
      last_paid_at: lastPaid.data && lastPaid.data[0] ? (lastPaid.data[0] as { created_at: string }).created_at : null,
    },
  });
});
