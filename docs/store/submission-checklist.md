# Pre-Submission Checklist — Party Time (iOS + Android)

> Ordered, do-this-then-that checklist tied to the real config in
> `mobile/app.json` and `mobile/eas.json`. Companion docs: `apple-app-store.md`,
> `google-play.md`, `privacy-policy.md`, `terms-of-service.md`.
>
> Legend: **[BLOCKER]** = will cause rejection / cannot ship without it.

---

## Phase 0 — Blockers to build in the app first

- [ ] **[BLOCKER] In-app account deletion.** Today only "Sign out" exists
      (`mobile/src/app/(tabs)/profile.tsx`). Build Profile → **Delete account** →
      confirm → `delete-account` RPC/edge function that erases auth user, profile,
      RSVPs, DMs, uploaded photos (Storage), phone, and `app_events`, retaining
      only de-identified finance records. Required by **Apple 5.1.1(v)** and
      **Google Play**.
- [ ] **[BLOCKER] Public account/data deletion web page** at
      `partytime.africa/delete-account` (works after uninstall). Required by Google
      Play Data safety.
- [ ] **[BLOCKER] UGC safety controls** (Apple 1.2 / Play UGC): in-app **report
      content**, **report/block user**, content filtering, and a published support
      contact. Verify these exist in DM/feed screens; build if missing.
- [ ] AI concierge output has safety guardrails and is covered by the reporting
      flow.
- [ ] Location: confirm the app requests **When In Use / coarse** only, not
      Always/background. Fix the `expo-location` permission string / plist keys in
      `app.json` accordingly (current string mentions "Always").
- [ ] Remove unused sensitive permissions from the merged manifest (`AD_ID`,
      `ACCESS_BACKGROUND_LOCATION`, `ACCESS_FINE_LOCATION` if present) — check via
      `npx expo prebuild` output.
- [ ] Consider signed/private URLs for personal images (avatars, DM attachments)
      instead of public buckets (`mobile/src/lib/storage.ts`).
- [ ] Add an 18+ / date-of-birth gate at sign-up (recommended for alcohol/nightlife).

---

## Phase 1 — Accounts, legal & hosting

- [ ] **Apple Developer Program** membership active ($99/yr), and **App Store
      Connect** app record created with bundle ID `africa.partytime.app`.
- [ ] **Google Play Console** account active ($25 one-time), app created with
      package `africa.partytime.app`, and **D-U-N-S / org verification + payments
      profile** completed (required for org accounts and for paid/commerce apps).
- [ ] Legal entity, address, support email, DPO finalized (fill `[PLACEHOLDER]`s).
- [ ] **Lawyer reviews** `privacy-policy.md` and `terms-of-service.md`.
- [ ] Publish live URLs:
  - [ ] Privacy policy → `https://partytime.africa/privacy`
  - [ ] Terms → `https://partytime.africa/terms`
  - [ ] Account deletion → `https://partytime.africa/delete-account`
  - [ ] Support/marketing page + support email reachable.

---

## Phase 2 — Config & secrets

- [ ] `app.json` version is correct (`1.0.0`). Build numbers are remote/auto
      (`eas.json`: `appVersionSource: "remote"`, production `autoIncrement: true`)
      — no manual bump needed.
- [ ] Add iOS export-compliance flag to `app.json`:
      `ios.infoPlist.ITSAppUsesNonExemptEncryption = false`.
- [ ] Confirm all four permission strings in `app.json` read well to a reviewer
      (photos, camera, location) and match actual use.
- [ ] Production **environment variables / EAS secrets** set for the build:
  - [ ] `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (publishable
        key, not secret).
  - [ ] `EXPO_PUBLIC_SENTRY_DSN` (or accept the hard-coded fallback in
        `app/_layout.tsx`).
- [ ] Backend edge-function secrets set in Supabase (server-side): `PESAPAL_ENV`
      (**`live`** for production), `PESAPAL_CONSUMER_KEY`, `PESAPAL_CONSUMER_SECRET`,
      `TICKET_QR_SECRET`, WhatsApp OTP vars (`WHATSAPP_TOKEN`,
      `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_OTP_TEMPLATE`, etc.), `OTP_PEPPER`.
- [ ] Pesapal **live** account activated and IPN URL reachable
      (`/functions/v1/pesapal-ipn`). Do a real end-to-end test purchase + refund.

---

## Phase 3 — Store listings & assets

**Shared**
- [ ] App icon exported at 1024×1024 (Apple, no alpha) and 512×512 (Play, alpha).
- [ ] Screenshots captured (see plan in `apple-app-store.md` §8):
  - [ ] iPhone 6.9" **1320×2868** (2–10).
  - [ ] iPad 13" **2064×2752** (required — `supportsTablet:true`), or set
        `supportsTablet:false` to drop iPad.
  - [ ] Android phone **1080×1920** (min 2, up to 8).
  - [ ] Android 7"/10" tablet screenshots (recommended).
- [ ] **Play feature graphic 1024×500** (mandatory, no transparency).

**Apple (App Store Connect)** — from `apple-app-store.md`
- [ ] Name, subtitle (≤30), promotional text, description, keywords (≤100).
- [ ] App Privacy label completed (all types; **Tracking = No** everywhere).
- [ ] Age rating questionnaire completed (expect **16+/18+**; social feed forces
      ≥13+, alcohol pushes higher).
- [ ] Export compliance answered (exempt).
- [ ] Privacy policy URL + support URL entered.
- [ ] Category (Entertainment), pricing (Free).

**Google (Play Console)** — from `google-play.md`
- [ ] Short (≤80) + full description.
- [ ] **Data safety** form completed and consistent with Apple label + policy;
      deletion URL entered.
- [ ] Content rating (IARC) questionnaire completed.
- [ ] Target audience **18+** (no child bands); "appeals to children" = No.
- [ ] Ads declaration = **No ads**.
- [ ] Privacy policy URL entered.
- [ ] App access instructions provided (login required — see demo account).

---

## Phase 4 — Demo/review account & review notes

- [ ] Seeded **email+password** demo account (verified), given to **both** stores.
- [ ] Demo account is an **Organizer** for a seeded upcoming event (so reviewers
      reach create-event, check-in QR scanner, and an issued rotating-QR ticket).
- [ ] Review notes explain (see `apple-app-store.md` §7):
  - [ ] Purchases are **physical/real-world** (tickets + tables) → **no IAP / no
        Play Billing required**, paid via Pesapal (paste the 3.1.3 wording).
  - [ ] How to test payment **without paying** (Pesapal sandbox, or pre-issued
        ticket on the demo account).
  - [ ] Phone verification is optional (or pre-verify the demo phone).
  - [ ] Where **Delete account** lives.
- [ ] Reviewer contact name/email/phone filled in.

---

## Phase 5 — Build & submit with EAS

Run from `mobile/`.

- [ ] `eas.json` **submit → production → ios** placeholders replaced:
      `appleId`, `ascAppId`, `appleTeamId` (currently `REPLACE_WITH_...`).
- [ ] `eas.json` **android** service account: place
      `google-play-service-account.json` (Play Console → API access → service
      account with release permissions) at the path referenced, and keep it out of
      git (verify `.gitignore`). Change `track` from `internal` to your rollout
      track when ready.

**iOS**
- [ ] `eas build --platform ios --profile production`
- [ ] `eas submit --platform ios --profile production`
- [ ] In App Store Connect, attach build, complete all metadata, submit for review.

**Android**
- [ ] `eas build --platform android --profile production` (produces **AAB**).
- [ ] `eas submit --platform android --profile production` (starts on `internal`
      track).
- [ ] Test on **internal testing**, then promote to **closed → open/production**.

---

## Phase 6 — Pre-flight verification

- [ ] Fresh install → sign up → email confirmation works.
- [ ] Buy a ticket end-to-end on **production Pesapal** (real small charge) and
      confirm ticket issues via `pesapal-ipn`; test a refund.
- [ ] Rotating QR displays and check-in scan admits (first valid scan wins).
- [ ] Table reservation request flow works.
- [ ] Location permission prompt uses the right (When In Use) string; nearby recs
      work and app still works if denied.
- [ ] Photo upload works; DMs work; report/block works.
- [ ] AI concierge returns results and behaves safely.
- [ ] **Delete account** fully removes data and the account can't sign back in.
- [ ] Sentry receives a test crash from a production build; no PII/payment data in
      events.
- [ ] Privacy/Terms/Delete URLs load publicly.
- [ ] No crash on cold start on a low-end Android and a current iPhone.

---

## Known rejection triggers (from the review-risk sections)

1. **No in-app account deletion** (Apple 5.1.1(v) / Play) — Phase 0.
2. **Missing UGC report/block** (Apple 1.2 / Play UGC) — Phase 0.
3. **Any in-app digital "unlock/boost/premium/coins"** sold via Pesapal → forces
   IAP/Play Billing. Keep v1 free of digital goods.
4. **Data safety / privacy label mismatch** across the three surfaces.
5. **Background/precise location or `AD_ID`** requested without justification.
6. **Age rating** not reflecting alcohol + social content.
