-- Fix: infinite recursion between the events and rsvps SELECT policies.
--
-- The "events" SELECT policy referenced the rsvps table (EXISTS a row for the
-- viewer), and the "rsvps" SELECT policy referenced the events table (EXISTS a
-- published, guest-list-visible event). Each subquery was itself subject to the
-- other table's RLS, so evaluating one triggered the other endlessly →
-- SQLSTATE 42P17 "infinite recursion detected in policy for relation events",
-- surfaced to clients as HTTP 500 on every events query.
--
-- Move both cross-table lookups into SECURITY DEFINER helpers, which run with
-- RLS bypassed and therefore break the cycle. Authorization semantics are
-- unchanged. Applied to the live project psyhhkmadllvywdnckgz.

create or replace function public.user_has_rsvp(e uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from rsvps where event_id = e and profile_id = auth.uid()
  );
$$;

create or replace function public.event_guest_list_public(e uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from events
    where id = e and guest_list_visible and status = 'published'::event_status
  );
$$;

drop policy if exists "published events visible" on public.events;
create policy "published events visible" on public.events
for select using (
  (status = 'published'::event_status
    and visibility = any (array['public'::event_visibility, 'unlisted'::event_visibility]))
  or is_event_manager(id)
  or public.user_has_rsvp(id)
);

drop policy if exists "rsvps visible" on public.rsvps;
create policy "rsvps visible" on public.rsvps
for select using (
  is_event_manager(event_id)
  or (profile_id = auth.uid())
  or public.event_guest_list_public(event_id)
);
