-- Social feed: reactions on events, plus reaction/comment counts and a live
-- activity stream surfaced in the discovery feed. Applied to project
-- psyhhkmadllvywdnckgz.

-- 1. Reactions: one 🔥 (or chosen emoji) per person per event. Toggle by
--    insert/delete. Public read for counts; you only ever write your own.
create table if not exists public.event_reactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null default '🔥',
  created_at timestamptz not null default now(),
  unique (event_id, profile_id)
);
alter table public.event_reactions enable row level security;

create policy "reactions are public" on public.event_reactions
  for select using (true);
create policy "react as yourself" on public.event_reactions
  for insert to authenticated with check (profile_id = auth.uid());
create policy "remove your reaction" on public.event_reactions
  for delete to authenticated using (profile_id = auth.uid());

create index if not exists event_reactions_event_idx on public.event_reactions(event_id);

-- 2. Extend the discovery feed with social counts + whether *you* reacted.
drop function if exists public.feed_events();
create or replace function public.feed_events()
returns table(
  id uuid, slug text, title text, starts_at timestamptz, ends_at timestamptz,
  venue_name text, address text, cover_url text, timezone text, currency text,
  capacity integer, is_ticketed boolean, featured boolean, sponsor_name text,
  going_count bigint, trending_score bigint,
  reaction_count bigint, comment_count bigint, i_reacted boolean
)
language sql stable security definer set search_path to 'public'
as $$
  select
    e.id, e.slug, e.title, e.starts_at, e.ends_at, e.venue_name, e.address,
    e.cover_url, e.timezone, e.currency, e.capacity, e.is_ticketed,
    e.featured, e.sponsor_name,
    (select count(*) from rsvps r
       where r.event_id = e.id and r.status = 'going') as going_count,
    (select count(*) from rsvps r
       where r.event_id = e.id and r.status = 'going'
         and r.created_at > now() - interval '12 hours') as trending_score,
    (select count(*) from event_reactions x where x.event_id = e.id) as reaction_count,
    (select count(*) from comments c where c.event_id = e.id) as comment_count,
    exists(
      select 1 from event_reactions x
      where x.event_id = e.id and x.profile_id = auth.uid()
    ) as i_reacted
  from events e
  where e.status = 'published'::event_status
    and e.visibility = 'public'::event_visibility
    and (e.ends_at is null or e.ends_at > now() - interval '6 hours')
  order by e.featured desc, e.starts_at asc nulls last;
$$;

-- 3. A live "right now" stream derived from real activity — recent going-RSVPs
--    and newly published public events. No fabricated data.
create or replace function public.activity_feed()
returns table(
  kind text, actor text, event_id uuid, event_slug text, event_title text,
  cover_url text, at timestamptz
)
language sql stable security definer set search_path to 'public'
as $$
  select * from (
    select 'rsvp'::text as kind, r.guest_name as actor, e.id as event_id,
           e.slug as event_slug, e.title as event_title, e.cover_url, r.created_at as at
    from rsvps r
    join events e on e.id = r.event_id
    where r.status = 'going'
      and e.status = 'published'::event_status
      and e.visibility = 'public'::event_visibility
      and r.created_at > now() - interval '14 days'
    union all
    select 'new_event'::text, coalesce(p.display_name, 'A host'), e.id, e.slug,
           e.title, e.cover_url, e.created_at
    from events e
    left join profiles p on p.id = e.host_id
    where e.status = 'published'::event_status
      and e.visibility = 'public'::event_visibility
      and e.created_at > now() - interval '14 days'
  ) items
  order by at desc
  limit 40;
$$;
grant execute on function public.activity_feed() to anon, authenticated;
