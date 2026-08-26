-- Growth + editing upgrade:
--   1. host_update_event  — let an event's host/manager fix its cover, words,
--      venue, time, vibe and visibility after publishing (slug is never changed,
--      so shared links keep working).
--   2. feed_events        — rank discovery by date AND traction (RSVPs + recent
--      buzz), so busy and imminent events surface, not just the soonest.
--   3. venue_directory     — order the bars & restaurants guide by completeness
--      (has a photo) and recent booking traction, then name.

create or replace function public.host_update_event(
  p_id uuid,
  p_title text,
  p_description text,
  p_venue_name text,
  p_venue_id uuid,
  p_address text,
  p_starts_at timestamptz,
  p_theme text,
  p_cover_url text,
  p_visibility text,
  p_allow_plus_ones boolean,
  p_playlist_url text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_event_manager(p_id) then
    raise exception 'not authorized';
  end if;
  update events set
    title           = coalesce(nullif(btrim(p_title), ''), title),
    description     = nullif(p_description, ''),
    venue_name      = nullif(p_venue_name, ''),
    venue_id        = p_venue_id,
    address         = nullif(p_address, ''),
    starts_at       = coalesce(p_starts_at, starts_at),
    theme           = coalesce(nullif(p_theme, ''), theme),
    cover_url       = p_cover_url,
    visibility      = coalesce(nullif(p_visibility, '')::event_visibility, visibility),
    allow_plus_ones = coalesce(p_allow_plus_ones, allow_plus_ones),
    playlist_url    = nullif(p_playlist_url, '')
  where id = p_id;
end $$;

revoke all on function public.host_update_event(uuid, text, text, text, uuid, text, timestamptz, text, text, text, boolean, text) from public, anon;
grant execute on function public.host_update_event(uuid, text, text, text, uuid, text, timestamptz, text, text, text, boolean, text) to authenticated;

-- Discovery: featured first, then a date ordering that a busy event can climb.
-- Each "going" RSVP pulls the event ~6h earlier in the sort, each RSVP in the
-- last 12h ~24h earlier, capped at 7 days — so imminent events still lead, but
-- a buzzing one rises above a quiet one at a similar date.
create or replace function public.feed_events()
returns table(id uuid, slug text, title text, starts_at timestamp with time zone, ends_at timestamp with time zone, venue_name text, address text, cover_url text, timezone text, currency text, capacity integer, is_ticketed boolean, featured boolean, sponsor_name text, going_count bigint, trending_score bigint, reaction_count bigint, comment_count bigint, i_reacted boolean)
language sql stable security definer set search_path = public as $$
  with base as (
    select
      e.id, e.slug, e.title, e.starts_at, e.ends_at, e.venue_name, e.address,
      e.cover_url, e.timezone, e.currency, e.capacity, e.is_ticketed,
      e.featured, e.sponsor_name,
      (select count(*) from rsvps r where r.event_id = e.id and r.status = 'going') as going_count,
      (select count(*) from rsvps r where r.event_id = e.id and r.status = 'going'
         and r.created_at > now() - interval '12 hours') as trending_score,
      (select count(*) from event_reactions x where x.event_id = e.id) as reaction_count,
      (select count(*) from comments c where c.event_id = e.id) as comment_count,
      exists(select 1 from event_reactions x where x.event_id = e.id and x.profile_id = auth.uid()) as i_reacted
    from events e
    where e.status = 'published'::event_status
      and e.visibility = 'public'::event_visibility
      and (e.ends_at is null or e.ends_at > now() - interval '6 hours')
  )
  select
    id, slug, title, starts_at, ends_at, venue_name, address, cover_url, timezone,
    currency, capacity, is_ticketed, featured, sponsor_name,
    going_count, trending_score, reaction_count, comment_count, i_reacted
  from base
  order by
    featured desc,
    (extract(epoch from starts_at)
       - least(going_count * 21600 + trending_score * 86400, 604800)) asc nulls last;
$$;

-- Bars & restaurants guide ordering: venues with a cover photo first, then those
-- with recent booking traction, then alphabetical.
create or replace function public.venue_directory()
returns table(id uuid, name text, kind text, city text, description text, cover_url text, logo_url text, price_range text, cuisines text[])
language sql stable security definer set search_path = public as $$
  select v.id, v.name, v.kind, v.city, v.description, v.cover_url, v.logo_url, v.price_range, v.cuisines
  from venues v
  order by
    (case when v.cover_url is not null then 1 else 0 end) desc,
    (select count(*) from reservations r where r.venue_id = v.id and r.created_at > now() - interval '60 days') desc,
    v.name asc;
$$;

revoke all on function public.venue_directory() from public;
grant execute on function public.venue_directory() to anon, authenticated;
