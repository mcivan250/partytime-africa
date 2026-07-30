// plus-one-invite: resolves a plus-one share token into the (non-sensitive)
// details needed to render the invite landing page — the inviter's name, the
// plus-one's name, and the public event card. Runs with the service role
// because the invited guest has no account yet, so RLS would otherwise hide
// the row. verify_jwt is disabled: anyone with the token link can view it, and
// only public event fields are returned.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

// Accept a UUID token only, to avoid probing.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!UUID.test(token)) return json({ error: 'Invalid invite.' }, 400);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: row } = await admin
    .from('event_plus_ones')
    .select('name, inviter_name, claimed_at, events(slug, title, cover_url, starts_at, venue_name, timezone, status)')
    .eq('invite_token', token)
    .maybeSingle();

  const ev = row?.events as
    | { slug: string; title: string; cover_url: string | null; starts_at: string | null; venue_name: string | null; timezone: string; status: string }
    | null;
  if (!row || !ev || ev.status !== 'published') {
    return json({ error: 'This invite is no longer available.' }, 404);
  }

  return json({
    name: row.name,
    inviter_name: row.inviter_name,
    claimed: !!row.claimed_at,
    event: {
      slug: ev.slug,
      title: ev.title,
      cover_url: ev.cover_url,
      starts_at: ev.starts_at,
      venue_name: ev.venue_name,
      timezone: ev.timezone,
    },
  });
});
