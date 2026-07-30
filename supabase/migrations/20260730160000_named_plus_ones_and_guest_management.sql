-- Named plus-ones with shareable invite links, a host guest list with contact
-- info, and re-inviting past guests to a new event.
--
-- Plus-ones used to be just an integer count on the RSVP. Now each plus-one is
-- a named guest with a unique share token, so the inviter can send them a
-- personal "you're my plus one" link that lets them create an account and land
-- on the event. Hosts get a proper guest list (name, contact, plus-one names)
-- and can re-invite everyone who came to a past event.

create table if not exists public.event_plus_ones (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  rsvp_id uuid references public.rsvps(id) on delete cascade,
  inviter_profile_id uuid references public.profiles(id) on delete set null,
  inviter_name text not null default 'A friend',
  name text not null check (char_length(btrim(name)) between 1 and 120),
  invite_token uuid not null unique default gen_random_uuid(),
  claimed_profile_id uuid references public.profiles(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists event_plus_ones_event_idx on public.event_plus_ones (event_id);
create index if not exists event_plus_ones_rsvp_idx on public.event_plus_ones (rsvp_id);
create index if not exists event_plus_ones_inviter_idx on public.event_plus_ones (inviter_profile_id);

alter table public.event_plus_ones enable row level security;

-- The inviter can read their own plus-ones; event managers can read all of
-- their event's. All writes go through the SECURITY DEFINER RPCs below, so
-- there are deliberately no insert/update/delete policies.
drop policy if exists "plus_ones readable by inviter or manager" on public.event_plus_ones;
create policy "plus_ones readable by inviter or manager" on public.event_plus_ones
  for select to authenticated
  using (inviter_profile_id = auth.uid() or public.is_event_manager(event_id));

-- Replace the caller's named plus-ones for an RSVP they own. Existing rows
-- (and their share tokens / claims) are preserved for names that are unchanged;
-- removed unclaimed names are dropped. Keeps rsvps.plus_ones in sync.
create or replace function public.set_plus_ones(p_rsvp_id uuid, p_names text[])
returns table (id uuid, name text, invite_token uuid, claimed boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_event uuid;
  v_owner uuid;
  v_inviter_name text;
  v_clean text[];
  v_name text;
begin
  select r.event_id, r.profile_id into v_event, v_owner from rsvps r where r.id = p_rsvp_id;
  if v_event is null then raise exception 'RSVP not found'; end if;
  if v_owner is distinct from auth.uid() then raise exception 'Not your RSVP'; end if;

  select array_agg(t order by t) into v_clean
  from (select distinct btrim(x) as t from unnest(coalesce(p_names, '{}')) as x where btrim(x) <> '') s;
  v_clean := coalesce(v_clean, '{}');
  if coalesce(array_length(v_clean, 1), 0) > 20 then
    v_clean := v_clean[1:20];
  end if;

  select coalesce(display_name, 'A friend') into v_inviter_name from profiles where id = auth.uid();

  delete from event_plus_ones e
   where e.rsvp_id = p_rsvp_id
     and e.claimed_profile_id is null
     and not (e.name = any (v_clean));

  foreach v_name in array v_clean loop
    if not exists (select 1 from event_plus_ones e where e.rsvp_id = p_rsvp_id and e.name = v_name) then
      insert into event_plus_ones (event_id, rsvp_id, inviter_profile_id, inviter_name, name)
      values (v_event, p_rsvp_id, auth.uid(), v_inviter_name, v_name);
    end if;
  end loop;

  update rsvps set plus_ones = coalesce(array_length(v_clean, 1), 0) where id = p_rsvp_id;

  return query
    select e.id, e.name, e.invite_token, e.claimed_profile_id is not null
    from event_plus_ones e where e.rsvp_id = p_rsvp_id order by e.created_at;
end $$;

-- Full guest list for an event's manager: contact info + each guest's plus-one
-- names. Returns nothing to non-managers.
create or replace function public.host_guest_list(p_event_id uuid)
returns table (
  rsvp_id uuid,
  profile_id uuid,
  guest_name text,
  guest_phone text,
  status text,
  plus_ones integer,
  avatar_url text,
  username text,
  created_at timestamptz,
  plus_one_names text[]
)
language sql security definer set search_path = public as $$
  select r.id, r.profile_id, r.guest_name, r.guest_phone, r.status::text, r.plus_ones,
         p.avatar_url, p.username, r.created_at,
         coalesce((select array_agg(e.name order by e.created_at)
                   from event_plus_ones e where e.rsvp_id = r.id), '{}')
  from rsvps r
  left join profiles p on p.id = r.profile_id
  where r.event_id = p_event_id
    and public.is_event_manager(p_event_id)
  order by case r.status when 'going' then 0 when 'maybe' then 1 else 2 end, r.created_at desc;
$$;

-- Invite everyone who's going/maybe on a source event to another event you
-- manage. Registered guests get an in-app notification; phone-only guests are
-- reported as skipped. Won't double-invite anyone already on the target.
create or replace function public.invite_past_guests(p_source_event uuid, p_target_event uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_slug text;
  v_title text;
  v_host text;
  v_notified int := 0;
  v_skipped int := 0;
begin
  if not public.is_event_manager(p_source_event) or not public.is_event_manager(p_target_event) then
    raise exception 'Not allowed';
  end if;
  select slug, title into v_slug, v_title from events where id = p_target_event;
  if v_slug is null then raise exception 'Target event not found'; end if;
  select coalesce(display_name, 'A host') into v_host from profiles where id = auth.uid();

  with recips as (
    select distinct r.profile_id
    from rsvps r
    where r.event_id = p_source_event
      and r.status in ('going', 'maybe')
      and r.profile_id is not null
      and not exists (
        select 1 from rsvps t where t.event_id = p_target_event and t.profile_id = r.profile_id
      )
  ), ins as (
    insert into notifications (profile_id, ntype, payload)
    select profile_id, 'event_invite',
           jsonb_build_object('event_id', p_target_event, 'slug', v_slug, 'title', v_title, 'from', v_host)
    from recips
    returning 1
  )
  select count(*) into v_notified from ins;

  select count(distinct r.guest_phone) into v_skipped
  from rsvps r
  where r.event_id = p_source_event
    and r.status in ('going', 'maybe')
    and r.profile_id is null
    and r.guest_phone is not null;

  return jsonb_build_object('notified', v_notified, 'skipped', v_skipped);
end $$;

-- Claim a plus-one invite: mark it claimed, make sure the claimer is RSVP'd
-- "going", and let the inviter know their guest joined.
create or replace function public.claim_plus_one(p_token uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_rec record;
  v_name text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;

  select e.id, e.event_id, e.name, e.inviter_profile_id, ev.slug, ev.title
    into v_rec
  from event_plus_ones e
  join events ev on ev.id = e.event_id
  where e.invite_token = p_token;
  if v_rec.id is null then raise exception 'Invite not found'; end if;

  update event_plus_ones
     set claimed_profile_id = auth.uid(), claimed_at = coalesce(claimed_at, now())
   where id = v_rec.id and claimed_profile_id is null;

  select coalesce(display_name, 'Guest') into v_name from profiles where id = auth.uid();
  if not exists (select 1 from rsvps where event_id = v_rec.event_id and profile_id = auth.uid()) then
    insert into rsvps (event_id, profile_id, guest_name, status, plus_ones)
    values (v_rec.event_id, auth.uid(), v_name, 'going', 0);
  end if;

  if v_rec.inviter_profile_id is not null and v_rec.inviter_profile_id <> auth.uid() then
    insert into notifications (profile_id, ntype, payload)
    values (v_rec.inviter_profile_id, 'plus_one_joined',
            jsonb_build_object('name', v_rec.name, 'slug', v_rec.slug, 'title', v_rec.title));
  end if;

  return jsonb_build_object('slug', v_rec.slug, 'title', v_rec.title);
end $$;

-- Lock down execution: authenticated users only (never anon).
revoke all on function public.set_plus_ones(uuid, text[]) from public, anon;
revoke all on function public.host_guest_list(uuid) from public, anon;
revoke all on function public.invite_past_guests(uuid, uuid) from public, anon;
revoke all on function public.claim_plus_one(uuid) from public, anon;
grant execute on function public.set_plus_ones(uuid, text[]) to authenticated;
grant execute on function public.host_guest_list(uuid) to authenticated;
grant execute on function public.invite_past_guests(uuid, uuid) to authenticated;
grant execute on function public.claim_plus_one(uuid) to authenticated;
