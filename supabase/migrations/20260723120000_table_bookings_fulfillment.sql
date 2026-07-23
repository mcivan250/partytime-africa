-- Table bookings: let 'table' orders flow through the same Pesapal checkout +
-- IPN fulfilment as tickets. Applied to the live project psyhhkmadllvywdnckgz.
-- (venues / venue_tables / table_bookings + their RLS already existed.)

-- Link a 'table' order to the specific venue table it is buying.
alter table public.orders
  add column if not exists table_id uuid references public.venue_tables(id);

-- Extend the atomic fulfilment to handle table bookings alongside tickets.
-- On payment: create the booking (idempotent via the unique table_id) and
-- flip the table to 'booked' so it disappears from the buyable list.
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

  elsif o.kind = 'table'::order_kind and o.table_id is not null then
    insert into table_bookings (event_id, table_id, order_id, booker_name, booker_phone)
    values (o.event_id, o.table_id, o.id, o.buyer_name, o.buyer_phone)
    on conflict (table_id) do nothing;

    update venue_tables set status = 'booked' where id = o.table_id;
  end if;
end;
$$;

revoke execute on function public.fulfill_paid_order(uuid) from public, anon, authenticated;
