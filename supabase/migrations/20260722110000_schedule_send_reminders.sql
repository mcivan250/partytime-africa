-- Run the send-reminders Edge Function every 30 minutes via pg_cron + pg_net.
-- Applied to the live project psyhhkmadllvywdnckgz.
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('send-reminders-30m');
exception when others then
  null;
end $$;

select cron.schedule(
  'send-reminders-30m',
  '*/30 * * * *',
  $cron$
  select net.http_post(
    url := 'https://psyhhkmadllvywdnckgz.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $cron$
);