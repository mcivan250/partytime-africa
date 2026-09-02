// delete-account: permanently deletes the signed-in user's account.
//
// Store requirement (Apple 5.1.1(v), Google Play): a user must be able to
// delete their account and personal data from inside the app.
//
// Design: profiles has NO cascade to auth.users, and events.host_id CASCADEs on
// profile delete — so we must NOT delete the profile row (that would wipe a
// host's events and every buyer's ticket under them). Instead we:
//   1. Delete the user's own personal content (DMs, feed posts/replies/reactions,
//      RSVPs, comments, photos, reservations, notifications, analytics, etc.).
//   2. Scrub personal identifiers from retained financial records (orders,
//      tickets, merch, table bookings) which we keep for legal/accounting reasons.
//   3. Anonymize the profile in place (so hosted events / sold tickets stay valid).
//   4. Delete the auth user so the login can never be used again.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

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

  // Require an explicit confirmation flag so this can never fire by accident.
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }
  if (body.confirm !== true) return json({ error: 'Deletion not confirmed.' }, 400);

  const uid = user.id;
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Which orders belong to this user — needed to scrub their tickets/merch/tables
  // before we detach the orders.
  const { data: myOrders } = await admin.from('orders').select('id').eq('profile_id', uid);
  const orderIds = (myOrders ?? []).map((o) => o.id as string);

  // 1. Delete purely personal content the user created.
  await admin.from('dm_messages').delete().or(`sender_id.eq.${uid},recipient_id.eq.${uid}`);
  await admin.from('friendships').delete().or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);
  await admin.from('feed_reactions').delete().eq('profile_id', uid);
  await admin.from('feed_replies').delete().eq('author_id', uid);
  await admin.from('feed_posts').delete().eq('author_id', uid);
  await admin.from('event_reactions').delete().eq('profile_id', uid);
  await admin.from('comments').delete().eq('profile_id', uid);
  await admin.from('photos').delete().eq('profile_id', uid);
  await admin.from('reservations').delete().eq('profile_id', uid);
  await admin.from('venue_claims').delete().eq('profile_id', uid);
  await admin.from('rsvps').delete().eq('profile_id', uid);
  await admin.from('notifications').delete().eq('profile_id', uid);
  await admin.from('phone_verifications').delete().eq('profile_id', uid);
  await admin.from('app_events').delete().eq('profile_id', uid);

  // 2. Scrub personal identifiers from retained financial records.
  if (orderIds.length > 0) {
    await admin.from('tickets').update({ attendee_name: 'Deleted user' }).in('order_id', orderIds);
    await admin.from('merch_purchases').update({ buyer_name: 'Deleted user' }).in('order_id', orderIds);
    await admin
      .from('table_bookings')
      .update({ booker_name: 'Deleted user', booker_phone: null })
      .in('order_id', orderIds);
  }
  await admin
    .from('orders')
    .update({ buyer_name: 'Deleted user', buyer_phone: null, profile_id: null })
    .eq('profile_id', uid);

  // Release any venues they owned (become unclaimed rather than deleted).
  await admin.from('venues').update({ owner_id: null }).eq('owner_id', uid);

  // 3. Anonymize the profile in place. Kept so hosted events / sold tickets that
  //    reference host_id stay valid; suspended so it can't act if it lingers.
  await admin
    .from('profiles')
    .update({
      display_name: 'Deleted user',
      username: null,
      avatar_url: null,
      phone: null,
      phone_verified: false,
      city: null,
      wa_opt_in: false,
      suspended: true,
    })
    .eq('id', uid);

  // 4. Delete the auth user — the login can never be used again.
  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) return json({ error: 'Could not finish deleting your account. Please contact support.' }, 500);

  return json({ ok: true });
});
