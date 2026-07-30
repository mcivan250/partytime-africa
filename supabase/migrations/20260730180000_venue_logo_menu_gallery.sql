-- Richer venue media: a logo, a menu (PDF/image), and a photo gallery.
-- Uploaded by the venue's owner or an admin (same authority as set_venue_cover).

alter table public.venues
  add column if not exists logo_url text,
  add column if not exists menu_url text;

create table if not exists public.venue_photos (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists venue_photos_venue_idx on public.venue_photos (venue_id, position);

alter table public.venue_photos enable row level security;

-- Venues are a public directory, so the gallery is world-readable. All writes
-- go through the SECURITY DEFINER RPCs below.
drop policy if exists "venue_photos readable by all" on public.venue_photos;
create policy "venue_photos readable by all" on public.venue_photos for select using (true);

create or replace function public.venue_can_manage(p_venue_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select is_admin() or exists (select 1 from venues where id = p_venue_id and owner_id = auth.uid());
$$;

create or replace function public.set_venue_logo(p_id uuid, p_logo_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not venue_can_manage(p_id) then raise exception 'not authorized'; end if;
  update venues set logo_url = nullif(p_logo_url, '') where id = p_id;
end; $$;

create or replace function public.set_venue_menu(p_id uuid, p_menu_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not venue_can_manage(p_id) then raise exception 'not authorized'; end if;
  update venues set menu_url = nullif(p_menu_url, '') where id = p_id;
end; $$;

create or replace function public.add_venue_photo(p_venue_id uuid, p_url text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if not venue_can_manage(p_venue_id) then raise exception 'not authorized'; end if;
  if coalesce(p_url, '') = '' then raise exception 'missing url'; end if;
  insert into venue_photos (venue_id, url, position)
  values (p_venue_id, p_url,
          coalesce((select max(position) + 1 from venue_photos where venue_id = p_venue_id), 0))
  returning id into new_id;
  return new_id;
end; $$;

create or replace function public.remove_venue_photo(p_photo_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_venue uuid;
begin
  select venue_id into v_venue from venue_photos where id = p_photo_id;
  if v_venue is null then return; end if;
  if not venue_can_manage(v_venue) then raise exception 'not authorized'; end if;
  delete from venue_photos where id = p_photo_id;
end; $$;

revoke all on function public.venue_can_manage(uuid) from public, anon;
revoke all on function public.set_venue_logo(uuid, text) from public, anon;
revoke all on function public.set_venue_menu(uuid, text) from public, anon;
revoke all on function public.add_venue_photo(uuid, text) from public, anon;
revoke all on function public.remove_venue_photo(uuid) from public, anon;
grant execute on function public.venue_can_manage(uuid) to authenticated;
grant execute on function public.set_venue_logo(uuid, text) to authenticated;
grant execute on function public.set_venue_menu(uuid, text) to authenticated;
grant execute on function public.add_venue_photo(uuid, text) to authenticated;
grant execute on function public.remove_venue_photo(uuid) to authenticated;
