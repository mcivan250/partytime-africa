# Party Time — repository guide

The product is a single **Expo (SDK 57) + Expo Router** app in **`mobile/`** — it
builds to native (iOS/Android) and to web. The web build is deployed to
**partytime.africa** via `expo export --platform web` (see `vercel.json`).

The backend is **Supabase**: Postgres + RLS, SECURITY DEFINER RPCs, and edge
functions under **`supabase/functions/`**. Schema changes are applied as
migrations.

Before writing any app code, read **`mobile/AGENTS.md`** — Expo SDK 57 has
breaking changes from older versions, so consult the versioned docs.

`migrations/` and `mockups/` are historical reference only; the live schema is
managed through Supabase.
