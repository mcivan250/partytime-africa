-- Optional Spotify/YouTube playlist link shown on the event page for vibe.
-- Applied to the live project psyhhkmadllvywdnckgz.
alter table public.events add column if not exists playlist_url text;