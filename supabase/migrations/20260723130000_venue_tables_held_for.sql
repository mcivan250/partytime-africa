-- Let hosts note who a held/comp table is reserved for (no payment).
-- venue_tables.status now spans: available | booked (paid) | held | comp.
-- Applied to the live project psyhhkmadllvywdnckgz.
alter table public.venue_tables
  add column if not exists held_for text;
