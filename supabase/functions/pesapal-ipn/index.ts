// pesapal-ipn: Pesapal calls this when a payment status changes. We never
// trust the callback blindly — we re-fetch the authoritative status from
// Pesapal, then fulfil (issue tickets) or fail the order. Idempotent via
// fulfill_paid_order. verify_jwt is off (Pesapal has no Supabase JWT).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

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
  const data = await res.json();
  if (!data?.token) throw new Error('Pesapal auth failed');
  return data.token;
}

Deno.serve(async (req) => {
  // Pesapal sends GET (query params) for GET-type IPNs; support POST too.
  const url = new URL(req.url);
  let trackingId = url.searchParams.get('OrderTrackingId');
  let merchantRef = url.searchParams.get('OrderMerchantReference');
  const notifType = url.searchParams.get('OrderNotificationType') ?? 'IPNCHANGE';
  if (!trackingId && req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    trackingId = body.OrderTrackingId ?? null;
    merchantRef = body.OrderMerchantReference ?? merchantRef;
  }

  const respond = (status: number) =>
    new Response(
      JSON.stringify({
        orderNotificationType: notifType,
        orderTrackingId: trackingId,
        orderMerchantReference: merchantRef,
        status,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

  if (!trackingId) return respond(500);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: order } = await admin
    .from('orders')
    .select('id, status')
    .eq('provider_flw_id', trackingId)
    .maybeSingle();
  if (!order) return respond(500);
  if (order.status === 'paid') return respond(200); // already handled

  try {
    const base = pesapalBase();
    const token = await pesapalToken(base);
    const res = await fetch(
      `${base}/api/Transactions/GetTransactionStatus?orderTrackingId=${trackingId}`,
      { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } },
    );
    const status = await res.json();
    const desc = String(status?.payment_status_description ?? '').toUpperCase();
    const code = Number(status?.status_code);

    if (desc === 'COMPLETED' || code === 1) {
      await admin.rpc('fulfill_paid_order', { p_order_id: order.id });
    } else if (desc === 'FAILED' || desc === 'INVALID' || code === 2) {
      await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
    }
    return respond(200);
  } catch (_e) {
    return respond(500);
  }
});
