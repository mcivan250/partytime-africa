-- Auto-create a "24h before" SMS reminder when an event is published, as long
-- as that moment is still in the future and one doesn't already exist. Also
-- backfills reminders for existing published events. Applied to the live
-- project psyhhkmadllvywdnckgz.
create or replace function public.create_default_reminder()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status = 'published'::event_status and new.starts_at is not null
     and new.starts_at - interval '24 hours' > now() then
    insert into reminders (event_id, kind, send_at)
    select new.id, 'sms_24h', new.starts_at - interval '24 hours'
    where not exists (
      select 1 from reminders r where r.event_id = new.id and r.kind = 'sms_24h'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists events_default_reminder on public.events;
create trigger events_default_reminder
after insert or update of status on public.events
for each row execute function public.create_default_reminder();

insert into reminders (event_id, kind, send_at)
select e.id, 'sms_24h', e.starts_at - interval '24 hours'
from events e
where e.status = 'published'::event_status
  and e.starts_at is not null
  and e.starts_at - interval '24 hours' > now()
  and not exists (
    select 1 from reminders r where r.event_id = e.id and r.kind = 'sms_24h'
  );