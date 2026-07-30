// create-order: starts a Pesapal payment for a ticket tier OR a VIP table.
// Signed-in buyer only (money is server-side). Validates the tier/table and
// its availability, creates a pending order, and returns Pesapal's hosted-
// checkout redirect_url. Tickets/table bookings are only issued later by the
// pesapal-ipn webhook (via fulfill_paid_order) once payment completes.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

const ZERO_DECIMAL = new Set(['UGX', 'KES', 'TZS', 'RWF', 'XOF', 'XAF', 'BIF', 'DJF', 'JPY']);
const toMajor = (minor: number, ccy: string) =>
  ZERO_DECIMAL.has(ccy.toUpperCase()) ? minor : minor / 100;

function pesapalBase() {
  return (Deno.env.get('PESAPAL_ENV') ?? 'sandbox').toLowerCase() === 'live'
    ? 'https://pay.pesapal.com/v3'
    : 'https://cybqa.pesapal.com/pesapalv3';
}

async function pesapalToken(base: string): Promise<string> {
  const res = await fetch(`${base}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      consumer_key: Deno.env.get('PESAPAL_CONSUMER_KEY'),
      consumer_secret: Deno.env.get('PESAPAL_CONSUMER_SECRET'),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data?.token) {
    // Surface Pesapal's actual rejection reason (e.g. invalid key/secret,
    // account not activated) into the logs and the thrown error.
    const detail = data?.error?.code || data?.error?.message || data?.message || `HTTP ${res.status}`;
    console.error('pesapal auth failed', res.status, JSON.stringify(data));
    throw new Error(`Pesapal auth failed: ${detail}`);
  }
  return data.token;
}

// Register the IPN URL once and cache the id in app_config.
async function ensureIpnId(base: string, token: string, admin: ReturnType<typeof createClient>) {
  const { data: cached } = await admin
    .from('app_config')
    .select('value')
    .eq('key', 'pesapal_ipn_id')
    .maybeSingle();
  if (cached?.value) return cached.value as string;

  const ipnUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/pesapal-ipn`;
  const res = await fetch(`${base}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url: ipnUrl, ipn_notification_type: 'GET' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data?.ipn_id) {
    console.error('pesapal IPN registration failed', res.status, JSON.stringify(data));
    throw new Error(`Pesapal IPN registration failed: ${data?.error?.code || data?.message || res.status}`);
  }
  await admin
    .from('app_config')
    .upsert({ key: 'pesapal_ipn_id', value: data.ipn_id, updated_at: new Date().toISOString() });
  return data.ipn_id as string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  if (!Deno.env.get('PESAPAL_CONSUMER_KEY') || !Deno.env.get('PESAPAL_CONSUMER_SECRET')) {
    return json({ error: 'Payments are not set up yet.' }, 503);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const tierId = typeof body.tier_id === 'string' ? body.tier_id : '';
  const tableId = typeof body.table_id === 'string' ? body.table_id : '';
  const quantity = Math.max(1, Math.min(20, Math.trunc(Number(body.quantity ?? 1)) || 1));
  const buyerName = typeof body.buyer_name === 'string' ? body.buyer_name.trim() : '';
  const buyerPhone = typeof body.buyer_phone === 'string' ? body.buyer_phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!tierId && !tableId) return json({ error: 'Missing ticket tier or table.' }, 400);
  if (!buyerName) return json({ error: 'Enter the buyer name.' }, 400);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: userData } = await userClient.auth.getUser();
  const user = userData.user;
  if (!user) return json({ error: 'Please sign in to buy.' }, 401);

  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Resolve what's being bought into a common shape: amount, currency,
  // description, and the order row to insert. Tables and ticket tiers share
  // the same Pesapal checkout + IPN fulfilment path.
  let amountMinor: number;
  let currency: string;
  let description: string;
  let orderInsert: Record<string, unknown>;

  if (tableId) {
    const { data: table } = await admin
      .from('venue_tables')
      .select('id, event_id, price_minor, currency, name, status, seats, events(slug, status, title)')
      .eq('id', tableId)
      .maybeSingle();
    if (!table) return json({ error: 'Table not found.' }, 404);
    const event = table.events as { slug: string; status: string; title: string } | null;
    if (!event || event.status !== 'published') return json({ error: 'This event is not on sale.' }, 409);
    if (table.status !== 'available') return json({ error: 'Sorry, that table is already taken.' }, 409);

    amountMinor = table.price_minor;
    currency = table.currency;
    description = `${table.name} (table for ${table.seats}) — ${event.title}`;
    orderInsert = {
      event_id: table.event_id,
      table_id: table.id,
      quantity: 1,
      kind: 'table',
    };
  } else {
    const { data: tier } = await admin
      .from('ticket_tiers')
      .select('id, event_id, price_minor, currency, quantity, sold, per_order_limit, name, events(slug, status, title)')
      .eq('id', tierId)
      .maybeSingle();
    if (!tier) return json({ error: 'Ticket tier not found.' }, 404);
    const event = tier.events as { slug: string; status: string; title: string } | null;
    if (!event || event.status !== 'published') return json({ error: 'Tickets are not on sale.' }, 409);
    if (quantity > tier.per_order_limit) {
      return json({ error: `Max ${tier.per_order_limit} per order.` }, 409);
    }
    if (tier.quantity - tier.sold < quantity) return json({ error: 'Not enough tickets left.' }, 409);

    amountMinor = tier.price_minor * quantity;
    currency = tier.currency;
    description = `${quantity} x ${tier.name} — ${event.title}`;
    orderInsert = {
      event_id: tier.event_id,
      tier_id: tier.id,
      quantity,
      kind: 'ticket',
    };
  }

  const merchantRef = `PT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      ...orderInsert,
      amount_minor: amountMinor,
      currency,
      buyer_name: buyerName,
      buyer_phone: buyerPhone || null,
      profile_id: user.id,
      provider: 'pesapal',
      provider_tx_ref: merchantRef,
      status: 'pending',
    })
    .select('id')
    .single();
  if (orderError || !order) return json({ error: 'Could not start the order.' }, 500);

  try {
    const base = pesapalBase();
    const token = await pesapalToken(base);
    const ipnId = await ensureIpnId(base, token, admin);

    const submit = await fetch(`${base}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: merchantRef,
        currency,
        amount: toMajor(amountMinor, currency),
        description: description.slice(0, 100),
        callback_url: 'https://partytime.africa/payment-complete',
        notification_id: ipnId,
        billing_address: {
          email_address: email || user.email || undefined,
          phone_number: buyerPhone || undefined,
          first_name: buyerName,
        },
      }),
    });
    const submitData = await submit.json();
    if (!submitData?.redirect_url || !submitData?.order_tracking_id) {
      await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
      return json({ error: 'Payment provider error. Try again.' }, 502);
    }

    await admin
      .from('orders')
      .update({ provider_flw_id: submitData.order_tracking_id })
      .eq('id', order.id);

    return json({ redirect_url: submitData.redirect_url, order_id: order.id });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error('create-order failed:', detail);
    await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
    // Pass the (non-sensitive) provider reason back so it's visible while
    // going live; it's a Pesapal error code, never our keys.
    return json({ error: `Payment setup failed — ${detail}` }, 502);
  }
});
