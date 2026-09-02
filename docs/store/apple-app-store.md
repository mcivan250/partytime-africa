# Apple App Store — Submission Pack (Party Time)

> Scope: everything you enter in **App Store Connect** for the iOS build of Party Time
> (`africa.partytime.app`, Expo SDK 57). Grounded in the actual app config
> (`mobile/app.json`, `mobile/eas.json`) and data flows. Sourced against the
> **current (2026) App Review Guidelines** — see [Sources](#sources).
>
> ⚠️ **Blocker before you can pass review:** the app has **no in-app account
> deletion** today (only Sign out, in `mobile/src/app/(tabs)/profile.tsx`). Apple
> requires it under **5.1.1(v)**. See [Account deletion](#account-deletion-511v).

---

## 1. App information

| Field | Value |
|---|---|
| App name (30 char max) | `Party Time` |
| Bundle ID | `africa.partytime.app` |
| Primary category | Entertainment |
| Secondary category | Food & Drink *(bars/restaurants guide + reservations)* |
| Version string | `1.0.0` (matches `app.json` → `expo.version`) |
| Build number | Managed by EAS (`appVersionSource: "remote"`, `autoIncrement: true`) |
| Content rights | Contains no third-party content you don't have rights to — confirm the "some/all third-party content" question honestly (event cover art is uploaded by organizers; see UGC risk below) |

### Localization
Primary language: **English (U.S.)**. Kampala market also uses English as the
lingua franca, so a single English listing is fine for v1. Prices display in UGX
in-app; no App Store price tiers are used (all payments are external/real-world —
see [Review risk: payments](#a-payments--iap-311--313-the-big-one)).

---

## 2. Listing copy

### App name
```
Party Time
```

### Subtitle (30 characters max)
```
Kampala nightlife & events
```
*(26 chars.)* Alternatives if you want to test:
- `Events, tickets & tables` (24)
- `Your night out, sorted` (22)

### Promotional text (170 chars max — editable anytime without a new build)
```
Fresh drops every week: the parties worth leaving the house for, tickets on your
phone, and the tables everyone's fighting for. Tap in.
```

### Keywords (100 characters max, comma-separated, NO spaces after commas)
```
nightlife,events,party,tickets,kampala,uganda,clubs,bars,rsvp,tables,concert,dj,afrobeats,bookings
```
*(99 chars. Don't repeat the app name or category — Apple already indexes those.
Don't use competitor brand names.)*

### Description (full)
```
Party Time is how Kampala goes out.

Discover the parties, concerts and nights worth showing up for — updated every
week — then get in with a tap.

DISCOVER
• A curated feed of events across the city, from rooftop sundowners to warehouse
  raves.
• See what's on near you, tonight and this weekend.
• A guide to the bars and restaurants worth your evening — with the tables people
  actually want.

GET IN
• Buy tickets in seconds and pay the way Kampala pays — mobile money or card.
• Your ticket lives on your phone as a secure QR code that refreshes itself, so it
  can't be screenshotted and resold.
• Reserve a table at the spot before you leave the house.

BRING THE CREW
• RSVP to events and add your plus-ones by name.
• Message friends and organizers in the app to sort out the night.
• Ask the AI concierge to plan your night around what you're into.

FOR ORGANIZERS & PROMOTERS
• List an event, sell tickets, and check guests in at the door by scanning their
  QR.
• Promoters earn commission on every ticket sold through their referral link.

Party Time is built for real nights out in real venues. Tickets and table
bookings are for physical, real-world events.

Questions? [SUPPORT_EMAIL_PLACEHOLDER]
```

> Editing rule: the **name, subtitle, and keywords** are locked to a version and
> can only change with a new build (or while the version is editable). **Promotional
> text** can change anytime.

---

## 3. App Privacy — the "nutrition label"

Fill this in App Store Connect → **App Privacy**. Below is the mapping from Party
Time's real data flows. For each type Apple asks: *(a)* is it collected, *(b)* the
purpose(s), *(c)* is it **linked to the user's identity**, and *(d)* is it used to
**track** (i.e. linked with third-party data for ads/measurement across other
companies' apps/sites).

**Party Time does NOT track.** There is no advertising SDK, no ad network, no
data broker, and no cross-app measurement. Analytics are first-party (the
`app_events` table) and Sentry is used only for crash/diagnostics. So **"Used to
Track You" = No for every type.** (Answer "Data Not Collected" for Advertising
categories.)

| Apple data type | Collected? | Purpose(s) | Linked to identity? | Used to track? | Source in app |
|---|---|---|---|---|---|
| **Email address** (Contact Info) | Yes | App Functionality (account) | Yes | No | Supabase Auth sign-up (`signUp`, `signInWithPassword`) |
| **Name** (Contact Info → Name) | Yes | App Functionality (display name, RSVPs, plus-one names) | Yes | No | Profile + RSVP plus-ones |
| **Phone number** (Contact Info) | Yes (optional) | App Functionality (WhatsApp phone verification) | Yes | No | `send-otp` / `verify-otp` (Meta WhatsApp OTP) |
| **Coarse / approximate location** (Location) | Yes | App Functionality (nearby events/venues), Product Personalization | Yes | No | `expo-location`, `mobile/src/lib/location.ts` |
| **Photos** (User Content) | Yes | App Functionality (event covers, avatars, shared moments) | Yes | No | `expo-image-picker` → public Storage buckets |
| **Customer support / other user content** (User Content) | Yes | App Functionality (in-app chat/DMs) | Yes | No | DM screens (`app/dm`, `app/messages`) |
| **User ID** (Identifiers) | Yes | App Functionality | Yes | No | Supabase `profile_id` |
| **Purchase history** (Purchases) | Yes | App Functionality (tickets, table bookings, promoter commission) | Yes | No | Orders (`create-order`, `pesapal-ipn`) |
| **Product interaction / usage data** (Usage Data) | Yes | Analytics, Product Personalization | Yes | No | First-party `app_events` (`lib/analytics.ts`) |
| **Crash data, performance data, other diagnostics** (Diagnostics) | Yes | App Functionality (crash reporting) | No* | No | Sentry (`app/_layout.tsx`) |
| **Payment info** (Financial Info — card number) | **No — not collected by the app** | — | — | — | Card/mobile-money data is entered on **Pesapal's** hosted checkout (WebView), never in Party Time. Declare it **only if** Sentry or logs ever capture it (they must not). |
| **Precise location** | No | — | — | — | App requests approximate use; do not declare precise unless you enable it |
| **Contacts, Browsing history, Search history, Health, Financial (bank), Sensitive info** | No | — | — | — | Not collected |

\* Sentry can attach a user id if you call `Sentry.setUser`. Today the code does
not, so Diagnostics is effectively **not linked**. If you later attach the
Supabase user id to Sentry, change Diagnostics → **Linked: Yes**.

> **Consistency rule (enforced by both stores):** this label must match the
> Privacy Policy and the Google Play Data Safety form **exactly**. If you add an
> ad SDK, attribution SDK, or push provider that collects device IDs later, this
> becomes tracking and must be re-declared.

**Privacy Policy URL (required):** host `privacy-policy.md` (rendered) at a
public URL, e.g. `https://partytime.africa/privacy` → enter in App Privacy.

---

## 4. Age rating

Apple replaced the old 12+/17+ bands. As of the **January 31, 2026** deadline the
tiers are **4+, 9+, 13+, 16+, 18+**, and every app must complete the **new**
questionnaire or it is blocked from submission.

**Two things force Party Time up the scale:**
1. **Social features (chat/DMs, user photos, an activity feed).** Since September
   2025 Apple assigns a **minimum 13+** to apps with social feeds / messaging.
2. **Alcohol references.** A nightlife app centered on bars, clubs and drinking
   culture will trigger the alcohol/tobacco/drugs section. *Frequent* references
   push above 13+.

**Recommended answers (confirm in the live questionnaire):**

| Questionnaire section | Answer |
|---|---|
| Alcohol, Tobacco, or Drug Use or References | **Yes — frequent/intense** (bars, clubs, nightlife are core) |
| Sexual Content or Nudity | None (moderate UGC to none — see UGC note) |
| Profanity or Crude Humor | Infrequent/Mild (user chat) |
| Violence (all types) | None |
| Horror/Fear | None |
| Gambling / Contests | None (promoter commissions are referral payouts, **not** gambling — do not check gambling) |
| Unrestricted web access | No |
| Medical/Treatment info | None |
| User-generated content / social | **Yes** (chat, DMs, photos, RSVPs) |
| Age assurance / minimum age | Set a **minimum age of your choosing** — for an alcohol/nightlife product, **18+** is the safest and most defensible position given local licensing norms |

**Likely resulting rating: 16+ at minimum, and 18+ is defensible and
recommended** for an alcohol-centric nightlife product with UGC. Set the minimum
age to 18+ deliberately if you want to gate under-18s.

---

## 5. Export compliance (encryption)

Party Time uses **only standard HTTPS/TLS** (Supabase, Pesapal, Sentry, WhatsApp
API) and platform crypto for the HMAC-signed ticket tokens (`ticket-token`
function). This is **exempt** encryption.

- **App Store Connect answer:** *"Does your app use encryption?"* → **Yes** (you
  use HTTPS) → *"Does it qualify for the exemptions?"* → **Yes** (only standard
  encryption). Result: **no CCATS / no annual self-classification report needed.**
- Set it in `app.json` so EAS/Xcode stops asking every build:
  ```json
  "ios": { "infoPlist": { "ITSAppUsesNonExemptEncryption": false } }
  ```
  *(Add under the existing `ios` block in `mobile/app.json`.)*

---

## 6. Sign-in, and Account deletion (5.1.1(v))

### Sign in with Apple — NOT required here
Guideline **4.8** only compels an equivalent privacy-preserving login (Sign in
with Apple, or any provider meeting Apple's three criteria) **when you offer
third-party or social login** (Google, Facebook, etc.). Party Time uses
**email + password only** (`supabase.auth.signInWithPassword` / `signUp`, with
email confirmation) — no social login — so **4.8 does not apply** and you are not
obligated to add Sign in with Apple. *(If you ever add "Continue with Google,"
4.8 immediately applies and you'll need an equivalent option.)*

### Account deletion (5.1.1(v)) — ⚠️ MISSING, must build before submission
Since June 30, 2022, any app that supports **account creation** must let users
**initiate account deletion from within the app** — not just deactivate, and not
"email us to delete." This is one of the **most common 2026 rejection reasons.**

**Current state:** `profile.tsx` offers **Sign out only**. There is no delete
path and no `delete-account` edge function. **This will be rejected.**

**What to build (minimum to pass):**
1. A visible "Delete account" control in Profile/Settings.
2. A confirmation step, then a call to a new **SECURITY DEFINER** RPC or edge
   function (e.g. `delete-account`) that:
   - deletes the auth user (`auth.admin.deleteUser`) and cascades/erases the
     profile, RSVPs, orders' PII, DMs, uploaded photos in Storage, phone, and
     `app_events` rows tied to the user;
   - retains only what law/finance requires (e.g. transaction records for tax),
     in de-identified form — state this in the Privacy Policy retention section.
3. Because you don't use Sign in with Apple, **no** Sign in with Apple token
   revocation is required.

> Also satisfies Google Play's account-deletion policy — build once, use for both.
> See `google-play.md` and the retention section of `privacy-policy.md`.

---

## 7. Demo / review account (App Review Information)

Reviewers must reach **all** functionality without a real Ugandan phone or mobile
money. Provide, in **App Review Information → Sign-In required = Yes**:

- A working **email + password** demo login (pre-seeded, verified).
- **Notes** covering:
  - **How to test a purchase without paying:** point reviewers at Pesapal
    **sandbox** (`PESAPAL_ENV=sandbox`) OR seed the demo account with an
    already-issued ticket so they can open the rotating QR wallet without paying.
    State clearly which. *(Do not make them attempt a real mobile-money charge.)*
  - **Phone verification is optional** — reviewers can skip WhatsApp OTP and use
    the app fully; say so, or pre-verify the demo account's phone.
  - **How to see the door/check-in flow:** the demo account is an organizer for a
    seeded event, so the camera QR scanner is reachable.
  - **AI concierge** ("Plan my night") is reachable from [screen] and returns
    itinerary suggestions.
  - **Where account deletion lives** (Profile → Delete account) — reviewers
    actively check 5.1.1(v).
- A **contact phone + email** for the review team.

---

## 8. Required assets & screenshot sizes (2026)

In 2026 you only upload the **largest** size per device family; Apple
auto-scales down to older devices.

| Asset | Spec | Required? |
|---|---|---|
| App icon | 1024×1024 px, PNG, no alpha/transparency, no rounded corners | Yes (from `assets/images/icon.png`, exported at 1024) |
| iPhone screenshots (6.9") | **1320×2868** portrait (also accepts 1290×2796 / 1260×2736) | **Yes**, 2–10 |
| iPad screenshots (13") | **2064×2752** portrait | **Yes** — `app.json` sets `supportsTablet: true`, so iPad screenshots are required (or set `supportsTablet:false` to drop iPad support and this requirement) |
| App preview video (optional) | Per family, ≤30s, portrait | Optional |

**Screenshot content plan (both families, portrait):**
1. Discover feed — "Kampala's nights, curated"
2. Event detail with ticket tiers — "Get in with a tap"
3. Rotating QR ticket wallet — "A ticket that can't be resold"
4. Bars/restaurants guide + table reservation
5. AI concierge "Plan my night"
6. RSVP with named plus-ones / chat

> Avoid putting a device frame that hides real UI, and don't imply features that
> aren't in the build. No pricing/"free" claims baked into images.

---

## 9. Review-risk section (READ BEFORE SUBMITTING)

### A. Payments — IAP (3.1.1 / 3.1.3) — the big one
**Position: Party Time sells access to physical, real-world events and services,
so Apple In-App Purchase is *not* required and Pesapal is correct.**

- **3.1.1** requires Apple IAP when you unlock **digital content or features
  consumed inside the app** (subscriptions, premium in-app content, in-app
  currency). It bans your own checkout **for those digital goods**.
- **3.1.3(e) / "physical goods and services"** is the carve-out: apps selling
  **physical goods or services consumed outside the app** — Apple's own examples
  include **event tickets, concert tickets, and food** — **must use a payment
  method other than IAP**. Party Time's tickets admit you to a **real party at a
  real venue**, and table reservations are for **dining/bottle service in person**.
  That is squarely a real-world service. **IAP would actually be the wrong choice
  here.**
- **Promoter commissions** are payouts on real-world ticket sales — real-world
  money movement, not digital content. Not IAP.

**How to present it to reviewers (put this in App Review Notes verbatim-ish):**
> "All purchases in Party Time are for physical, real-world experiences: admission
> tickets to in-person events at Kampala venues, and table/bottle reservations
> consumed at the venue. Under Guideline 3.1.3, physical goods and real-world
> services must not use in-app purchase; payment is handled by Pesapal (mobile
> money and card), the standard processor in Uganda. No digital content, feature
> unlock, or subscription is sold. The AI concierge and all app features are free."

**Where you could still get rejected — avoid these:**
- Do **not** describe or sell anything as an in-app "premium," "pro," "unlock,"
  "boost," "coins," or "credits." Any of those reads as digital content →
  triggers 3.1.1 and forces IAP. If promoters "boost" a listing for a fee, that
  is a **digital service** and **would** require IAP (or must be moved to a
  clearly real-world/organizer web flow). Keep v1 clean of this.
- Don't show a raw external "pay on our website" link inside iOS UI for digital
  goods. (The external-link allowance from the 2021/2025 US ruling applies to the
  US storefront and is a separate, riskier path — you don't need it, because your
  goods are physical.)
- Make the physical/real-world nature obvious in the **listing description and
  the checkout screen** ("Admission to [venue], [date]"), so a reviewer sees it
  without reading notes.

### B. User-generated content (Guideline 1.2) — second-biggest risk
Party Time has **chat/DMs, user photos, event covers, and RSVP names** = UGC.
Apple 1.2 requires **all** of the following, or it rejects:
- A method to **filter objectionable content** (profanity/abuse filter on chat &
  captions).
- A mechanism for users to **flag/report** objectionable content **and to report
  abusive users**.
- The ability to **block abusive users**.
- **Published contact info** for reporting (support email in-app + listing).
- Act on reports (remove content, eject users) within ~24h.

**Status:** verify these exist in the DM/feed screens. If reporting/blocking is
missing, **build it before submitting** — this is a hard requirement, not a nice-to-have.

### C. AI concierge (generative content)
The "Plan my night" / concierge feature generates text. Apple expects generative
features to have **content moderation/safety** so they can't produce objectionable
output, and the app's UGC-reporting must cover AI output too. Ensure the model has
guardrails and note it in review.

### D. Uploaded photos are in PUBLIC Storage buckets
`lib/storage.ts` uploads avatars/event photos/feed images to **public** buckets
(`getPublicUrl`). That's a **privacy expectation** issue, not an Apple-specific
one, but reviewers and users assume shared photos aren't world-readable by URL.
Make sure the Privacy Policy is explicit that uploaded photos are publicly
accessible, and consider signed URLs for anything personal (DM images, avatars).

### E. Location purpose string
`app.json` sets a location permission string via `expo-location`. It requests
**When In Use**; confirm the app does **not** request Always/background location
(the current `locationAlwaysAndWhenInUsePermission` string implies Always —
Apple rejects Always requests without a background use). For nearby
recommendations you only need **When In Use**; align the plist keys accordingly.

### F. Age gate for alcohol
Given the alcohol/nightlife focus, having a **date-of-birth / 18+ gate** at
sign-up strengthens the case for the age rating and pre-empts questions. Not
strictly mandated by Apple, but recommended.

### G. Sentry DSN is hard-coded
`app/_layout.tsx` ships a hard-coded Sentry DSN as a fallback. That's a **public
client key** (safe to ship), but disclose Sentry in the privacy label/policy
(done above) and keep `enabled: !__DEV__` so dev noise doesn't leak.

---

## Sources
- [App Review Guidelines — Apple Developer (current)](https://developer.apple.com/app-store/review/guidelines/)
- [Guideline 3.1.1 in-app purchase / digital goods rejection fix — PTKD](https://ptkd.com/journal/guideline-3-1-1-in-app-purchase-digital-goods-rejection-fix)
- [Account deletion requirement (5.1.1(v)) — Apple Developer News](https://developer.apple.com/news/?id=12m75xbj)
- [Account deletion within apps — Apple upcoming requirements](https://developer.apple.com/news/upcoming-requirements/?id=06302022b)
- [Guideline 4.8 Sign in with Apple / login services fix — PTKD](https://ptkd.com/journal/app-store-rejection-4-8-sign-in-with-apple-requirement-fix)
- [Updated age ratings in App Store Connect — Apple Developer News](https://developer.apple.com/news/?id=ks775ehf)
- [Age Rating Updates — Apple upcoming requirements](https://developer.apple.com/news/upcoming-requirements/?id=07242025a)
- [Apple forces 13+ on apps with social feeds — PPC Land](https://ppc.land/apple-forces-13-rating-on-apps-with-social-feeds-from-september/)
- [App Store screenshot sizes 2026 — AppScreens](https://appscreens.com/app-store-screenshot-sizes)
- [App Store screenshot sizes 2026 — Screenhance](https://screenhance.com/blog/app-store-screenshot-dimensions-2026)
