-- WhatsApp phone verification + messaging consent.
--
-- Users register a phone number and confirm it with a one-time code delivered
-- to their WhatsApp (via the send-otp / verify-otp edge functions, which use
-- the Meta WhatsApp Cloud API). A verified, opted-in number can then be
-- messaged. The OTP table is only ever touched by the edge functions
-- (service role), so it has RLS enabled with no policies.

alter table public.profiles
  add column if not exists phone_verified boolean not null default false,
  add column if not exists wa_opt_in boolean not null default false;

create table if not exists public.phone_verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  phone text not null,            -- E.164 digits, no '+'
  code_hash text not null,        -- sha256(code + pepper), never the raw code
  attempts int not null default 0,
  verified_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists phone_verifications_lookup
  on public.phone_verifications (profile_id, phone, created_at desc);

alter table public.phone_verifications enable row level security;
-- Intentionally no policies: only the edge functions (service role) read/write.
