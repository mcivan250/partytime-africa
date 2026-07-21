// rsvp-guest: lets anonymous guests (from a web invite link) RSVP without an
// account. RLS only permits signed-in users to insert RSVPs directly, so this
// function validates the request and inserts with the service role, returning
// the edit_token the guest can later use to amend their RSVP.
//
// verify_jwt is intentionally disabled: guests have no user session, and the
// app calls this with the publishable key (not a JWT). Authorization is the
// validation below — the event must exist, be published, and be within its
// RSVP deadline.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Status = 'going' | 'maybe' | 'declined';
const VALID_STATUS: Status[] = ['going', 'maybe', 'declined'];

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const guestName = typeof body.guest_name === 'string' ? body.guest_name.trim() : '';
  const guestPhone = typeof body.guest_phone === 'string' ? body.guest_phone.trim() : null;
  const status = body.status as Status;
  const plusOnesRaw = Number(body.plus_ones ?? 0);

  if (!slug) return json({ error: 'Missing event.' }, 400);
  if (guestName.length < 1 || guestName.length > 120) {
    return json({ error: 'Please enter your name.' }, 400);
  }
  if (!VALID_STATUS.includes(status)) {
    return json({ error: 'Invalid RSVP status.' }, 400);
  }
  if (guestPhone && guestPhone.length > 40) {
    return json({ error: 'Invalid phone number.' }, 400);
  }
  const plusOnes = Number.isFinite(plusOnesRaw)
    ? Math.min(Math.max(Math.trunc(plusOnesRaw), 0), 20)
    : 0;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, status, rsvp_deadline')
    .eq('slug', slug)
    .maybeSingle();

  if (eventError) {
    return json({ error: 'Could not look up the event.' }, 500);
  }
  if (!event || event.status !== 'published') {
    return json({ error: 'This event is not open for RSVPs.' }, 404);
  }
  if (event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date()) {
    return json({ error: 'The RSVP deadline has passed.' }, 409);
  }

  const { data: inserted, error: insertError } = await supabase
    .from('rsvps')
    .insert({
      event_id: event.id,
      profile_id: null,
      guest_name: guestName,
      guest_phone: guestPhone,
      status,
      plus_ones: plusOnes,
    })
    .select('id, edit_token')
    .single();

  if (insertError) {
    return json({ error: 'Could not save your RSVP. Please try again.' }, 500);
  }

  return json({ id: inserted.id, edit_token: inserted.edit_token }, 200);
});
