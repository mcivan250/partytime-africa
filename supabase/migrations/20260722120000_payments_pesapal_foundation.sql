-- Foundation for Pesapal ticket payments. Applied to the live project
-- psyhhkmadllvywdnckgz.

-- 1. Small server-only key/value store (e.g. the registered Pesapal IPN id).
create table if not exists public.app_config (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;
-- No policies: clients are denied; Edge Functions use the service role.

-- 2. Link an order to the tier and quantity it is buying.
alter table public.orders add column if not exists tier_id uuid references public.ticket_tiers(id);
alter table public.orders add column if not exists quantity integer not null default 1;

-- 3. Atomically fulfil a paid order: mark paid, issue tickets (unique QR via
--    the column default), and increment the tier's sold count. Idempotent.
create or replace function public.fulfill_paid_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  o record;
begin
  select * into o from orders where id = p_order_id for update;
  if not found then return; end if;
  if o.status = 'paid'::order_status then return; end if; -- already fulfilled

  update orders set status = 'paid'::order_status where id = o.id;

  if o.kind = 'ticket'::order_kind and o.tier_id is not null then
    insert into tickets (event_id, order_id, tier_id, attendee_name, status)
    select o.event_id, o.id, o.tier_id, o.buyer_name, 'valid'::ticket_status
    from generate_series(1, greatest(o.quantity, 1));

    update ticket_tiers
      set sold = sold + greatest(o.quantity, 1)
      where id = o.tier_id;
  end if;
end;
$$;

revoke execute on function public.fulfill_paid_order(uuid) from public, anon, authenticated;