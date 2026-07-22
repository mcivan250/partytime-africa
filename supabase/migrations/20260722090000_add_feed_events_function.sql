-- Vibe Feed data source: public published events with live aggregate signals
-- (going_count and a 12h trending_score). SECURITY DEFINER so it can count
-- RSVPs regardless of per-event guest-list visibility, but it only returns
-- AGGREGATE counts for public, published events — no private data leaks.
-- Applied to the live project psyhhkmadllvywdnckgz.
create or replace function public.feed_events()
returns table (
  id uuid,
  slug text,
  title text,
  starts_at timestamptz,
  ends_at timestamptz,
  venue_name text,
  address text,
  cover_url text,
  timezone text,
  currency text,
  capacity integer,
  is_ticketed boolean,
  going_count bigint,
  trending_score bigint
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    e.id, e.slug, e.title, e.starts_at, e.ends_at, e.venue_name, e.address,
    e.cover_url, e.timezone, e.currency, e.capacity, e.is_ticketed,
    count(r.*) filter (where r.status = 'going') as going_count,
    count(r.*) filter (
      where r.status = 'going' and r.created_at > now() - interval '12 hours'
    ) as trending_score
  from events e
  left join rsvps r on r.event_id = e.id
  where e.status = 'published'::event_status
    and e.visibility = 'public'::event_visibility
    and (e.ends_at is null or e.ends_at > now() - interval '6 hours')
  group by e.id
  order by e.starts_at asc nulls last;
$$;

grant execute on function public.feed_events() to anon, authenticated;