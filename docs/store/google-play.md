# Google Play — Submission Pack (Party Time)

> Scope: everything you enter in **Google Play Console** for the Android build of
> Party Time (`africa.partytime.app`, Expo SDK 57). Grounded in the real app
> config (`mobile/app.json`, `mobile/eas.json`) and data flows, and sourced
> against **current (2026) Google Play policy** — see [Sources](#sources).
>
> ⚠️ **Blocker:** Google Play requires **both** an **in-app** account-deletion
> path **and** a **public "Delete account" web URL** for any app with account
> creation. Party Time has **neither** today. See
> [Account deletion](#account-deletion-requirement--blocker).

---

## 1. App details

| Field | Value |
|---|---|
| App name (30 char max) | `Party Time` |
| Package name | `africa.partytime.app` |
| Default language | English (United States) |
| App or game | App |
| Category | Events *(or Entertainment; secondary: Food & Drink)* |
| Free / Paid | **Free** app (purchases are external real-world tickets via Pesapal, **not** Google Play Billing — see [Payments](#payments--google-play-billing-not-required)) |
| Contains ads | **No** (no ad SDK in the build) |

---

## 2. Store listing copy

### Short description (80 characters max)
```
Kampala nightlife: discover events, buy tickets & reserve tables in seconds.
```
*(75 chars.)*

### Full description (4000 characters max)
```
Party Time is how Kampala goes out.

Discover the parties, concerts and nights actually worth showing up for — updated
every week — then get in with a tap.

DISCOVER WHAT'S ON
• A curated feed of events across the city, from rooftop sundowners to warehouse
  raves.
• See what's happening near you, tonight and this weekend.
• A guide to the bars and restaurants worth your evening, and the tables everyone
  wants.

GET IN, FAST
• Buy tickets in seconds and pay the way Kampala pays — mobile money or card,
  through Pesapal.
• Your ticket lives on your phone as a secure QR code that refreshes on its own,
  so it can't be screenshotted and resold.
• Reserve a table at the venue before you leave home.

BRING THE CREW
• RSVP to events and add your plus-ones by name.
• Message friends and organizers in the app to plan the night.
• Ask the AI concierge to build a night around what you're into.

FOR ORGANIZERS & PROMOTERS
• List an event, sell tickets, and check guests in at the door by scanning their
  QR code.
• Promoters earn commission on every ticket sold through their referral link.

Party Time is built for real nights out at real venues. Tickets and table
reservations are for physical, in-person events.

Questions or feedback? [SUPPORT_EMAIL_PLACEHOLDER]
```

---

## 3. Data safety form

Play Console → **App content → Data safety**. This is Google's public data
declaration; it must match the Apple privacy label and the Privacy Policy. For
each type: *collected?*, *shared?* (sent off-device to a third party), *purpose*,
*required or optional*, *processed ephemerally?*, and whether it's **encrypted in
transit** (yes — everything is HTTPS/TLS) and whether users can **request
deletion** (yes — see account deletion).

**Security practices to declare:**
- ✅ Data is **encrypted in transit** (TLS everywhere: Supabase, Pesapal, Sentry,
  WhatsApp).
- ✅ Users can **request that data be deleted** (in-app deletion + web URL — once
  built).
- ✅ You follow the Play **Families**/permissions policy (not targeted at children).
- ❌ You do **not** sell data. No data shared for advertising.

| Data type (Google taxonomy) | Collected | Shared | Purpose(s) | Optional? | Notes |
|---|---|---|---|---|---|
| **Email address** (Personal info) | Yes | No | Account management, App functionality | Required | Supabase Auth |
| **Name** (Personal info) | Yes | No | App functionality (profile, RSVP plus-ones) | Optional | Display name + plus-one names |
| **Phone number** (Personal info) | Yes | Yes* | Account management (verification) | Optional | *Shared with **Meta/WhatsApp** only to deliver the OTP (`send-otp`) |
| **Approximate location** (Location) | Yes | No | App functionality, Personalization | Optional | `expo-location` (coarse). Do **not** declare Precise location |
| **Photos** (Photos and videos) | Yes | No** | App functionality (covers, avatars, feed) | Optional | **Uploaded to **public** Storage buckets — see risk note |
| **In-app messages** (Messages) | Yes | No | App functionality (chat/DMs) | Optional | DM feature |
| **Purchase history** (Financial info) | Yes | Yes*** | App functionality (tickets, tables, payouts) | — | ***Order/amount data shared with **Pesapal** to process payment |
| **Payment info** (Financial info) | **Not collected by app** | — | — | — | Card/mobile-money entered on Pesapal's hosted page; app never receives it |
| **App interactions / other actions** (App activity) | Yes | No | Analytics, Personalization | — | First-party `app_events` table |
| **Crash logs** (App info & performance) | Yes | Yes | App functionality (crash reporting) | — | Shared with **Sentry** (processor) |
| **Diagnostics / performance** (App info & performance) | Yes | Yes | App functionality | — | Sentry |
| **User IDs** (Identifiers) | Yes | No | App functionality | — | Supabase profile id |
| **Device or other IDs** (advertising ID) | **No** | — | — | — | No ad SDK; do not request `AD_ID` |

> Because there's no advertising ID and no ad SDK, **remove the `com.google.android.gms.permission.AD_ID`** permission if any dependency injects it, or you must declare advertising-ID use. Verify with `expo prebuild` output / merged manifest.

**Data safety also asks for two URLs:**
- **Privacy policy URL** (required): `https://partytime.africa/privacy`
- **Account/data deletion URL** (required for apps with accounts): `https://partytime.africa/delete-account` — see below.

---

## 4. Account deletion requirement — ⚠️ BLOCKER

Google Play requires, for **any** app that lets users **create an account**
(email/username or third-party login — mandatory or optional, it doesn't matter):

1. **An in-app path** to delete the account and its associated data.
2. **A publicly reachable web URL** where a user can request account **and data**
   deletion **even after uninstalling** — this URL is entered in the Data safety
   form and is enforced **independently** of the rest of the form.
3. The web resource must not be buried behind a login the deleted user can't
   reach, and must let users request deletion of data (not just the account
   shell).

**Current state:** Party Time has only **Sign out**. **Build both** before
submission:
- In-app: Profile → Delete account → confirm → `delete-account` RPC/edge function
  (erases auth user, profile, RSVPs, DMs, uploaded photos, phone, `app_events`;
  retains only finance/tax records de-identified).
- Web: a simple public page (`partytime.africa/delete-account`) explaining what's
  deleted, what's retained and why, and how to request it (form or email to
  `[SUPPORT_EMAIL_PLACEHOLDER]`) with an SLA.

*(This is the same deletion backend Apple 5.1.1(v) needs — build once.)*

---

## 5. Content rating (IARC questionnaire)

Play Console → **App content → Content rating**. Answers generate ratings across
IARC boards (ESRB, PEGI, etc.). Answer honestly for a nightlife app:

| Question area | Answer |
|---|---|
| Category | Reference, News, or Educational? → **No.** Social/communication? → **Yes** (chat/DMs) |
| Violence | None |
| Sexuality | None (moderate UGC risk only) |
| Language / profanity | Mild, possible in user chat |
| Controlled substances — **references to alcohol/tobacco/drugs** | **Yes** (bars, clubs, nightlife are the core theme) |
| Gambling | **No** (promoter referral commissions are not gambling; no simulated gambling) |
| Users interact / share content / share location | **Yes** — the app has user-to-user communication, user-generated content, and shares approximate location among users where relevant |
| Digital purchases | **Yes** (tickets/tables — real-world) |

**Likely outcome:** **Teen / PEGI 12–16** driven by alcohol references + social
interaction. Consider declaring a **higher minimum age (18+)** to match the
alcohol focus. The "users interact" flag typically adds an interactive-elements
label (Users Interact, Shares Location, Digital Purchases).

---

## 6. Target audience & content / Ads

Play Console → **App content**:

- **Target audience:** select age bands **18+** (or 16+/18+). **Do not** include
  any under-13 band — an alcohol/nightlife app must **not** target children, which
  keeps it out of scope for the **Families / Designed for Families** program and
  the strictest child-data rules.
- **Appeals to children?** → **No.**
- **Ads:** **No, the app does not contain ads.** (Keep this true — adding an ad
  SDK later flips this and the Data safety advertising-ID declaration.)
- **News app?** → No.
- **COVID-19 / contact tracing?** → No.
- **Government app?** → No.
- **Financial features?** → It **facilitates payments** for third-party events via
  a licensed processor (Pesapal); it is not a lending/banking/crypto app. Answer
  the financial-features questions as a **payment facilitation for goods/services**
  (not a regulated financial product). If Play surfaces the payments/financial
  declaration, describe it as event-ticket commerce processed by Pesapal.

---

## 7. Permissions justification

Play flags sensitive permissions; keep this rationale ready (and in the listing /
Data safety). All are tied to a clear user-facing feature and requested
**at point of use**:

| Permission (Android) | Feature | Justification |
|---|---|---|
| `CAMERA` (`expo-camera`) | Door check-in QR scanner | Organizers scan guests' rotating ticket QR codes at the venue entrance. Not used for surveillance/recording. |
| `ACCESS_COARSE_LOCATION` (`expo-location`) | Nearby events & venues | Approximate location powers "near you" recommendations. **No background/`ACCESS_FINE_LOCATION` or `ACCESS_BACKGROUND_LOCATION`** — foreground, coarse only. If a dependency adds FINE, remove it or you must justify precise location. |
| `READ_MEDIA_IMAGES` / photo picker (`expo-image-picker`) | Event covers, avatars, feed photos | User chooses images to upload. Prefer the Android **Photo Picker** (no broad storage permission needed on Android 13+). |
| `POST_NOTIFICATIONS` | Event reminders, RSVP/DM alerts, payment confirmations | Reminders and transactional alerts. Requested at runtime on Android 13+. |
| `INTERNET` / `ACCESS_NETWORK_STATE` | Core | Standard networking. |

**Must NOT be present (verify merged manifest):**
- `AD_ID` (no ads) — remove or declare.
- `ACCESS_BACKGROUND_LOCATION` — you don't need it; its presence triggers a
  heavyweight background-location review/declaration and a demo video.
- `READ_MEDIA_VIDEO`, `RECORD_AUDIO`, contacts, SMS, call log — none are used.

> `MOVE_TASKS_TO_BACK` / foreground-service permissions from Expo modules should
> also be checked; only ship what the features use.

---

## 8. Required assets & sizes (2026)

| Asset | Spec | Required? |
|---|---|---|
| App icon (hi-res) | **512×512** px, 32-bit PNG (with alpha) | Yes |
| Feature graphic | **1024×500** px, JPEG or 24-bit PNG **(no transparency)** | **Yes — mandatory** |
| Phone screenshots | 16:9 or 9:16, each side **320–3840 px**; **min 2, up to 8**. Use **1080×1920** portrait | Yes |
| 7" tablet screenshots | up to 8 | Only if you market tablet; app supports tablet, so recommended |
| 10" tablet screenshots | up to 8 | Recommended (see below) |
| Promo/preview video (YouTube URL) | optional | Optional |

> `app.json` sets `supportsTablet: true` on iOS; Android tablets aren't
> explicitly excluded, so provide tablet screenshots or expect a "not optimized
> for tablets/large screens" note. Google increasingly weights large-screen
> quality — supplying 7"/10" screenshots avoids a warning.

**App bundle:** ship an **AAB** (`eas build --platform android --profile
production` produces `.aab`). APKs are not accepted for new apps.

---

## 9. Policy-risk notes

### Payments — Google Play Billing not required
Google Play Billing is mandatory for **in-app digital goods/content**. It is
**not** required for **physical goods or services consumed outside the app**.
Party Time sells **admission to real in-person events** and **table reservations
at physical venues** — real-world goods/services — so **Pesapal is the correct
and compliant processor**, exactly as it is on iOS. Keep the listing and checkout
copy explicit that tickets/tables are for physical, real-world events. **Do not**
sell any in-app-only digital unlock, "boost," coins, or subscription through
Pesapal — that would require Play Billing and cause a payments-policy violation.

### User-generated content & social features
Chat/DMs, photos, and a feed put the app under Play's **UGC policy**. Required:
in-app **reporting** of content and users, **blocking**, a content moderation/
filtering approach, and a way to act on reports. Have a moderation plan and a
published contact. Missing report/block flows are a common rejection.

### Photos are world-readable
`lib/storage.ts` writes uploaded images to **public** Storage buckets. Disclose
this plainly in the Privacy Policy; consider signed URLs for personal images
(avatars, DM attachments) to meet user expectations and Play's data-handling
scrutiny.

### AI features
The AI concierge generates content — ensure safety guardrails; Play's UGC/AI
expectations require that generative output can be reported and doesn't produce
policy-violating content.

### Health/alcohol & regional
Alcohol-related apps must not target minors (handled via target-audience 18+ and
content rating). No special alcohol-sales license flow is triggered because the
app sells **event admission**, not alcohol directly — but keep messaging about
drinking responsible.

### Deceptive/permissions minimization
Only request permissions the current features use, at point of use. Remove
`AD_ID` and any background-location/FINE-location permission pulled in
transitively, or you'll face extra declarations and a possible rejection.

### Data safety accuracy
Google actively cross-checks the Data safety form against observed behavior and
the privacy policy. Keep all three (this form, Apple's label, the policy)
identical. Update within the required window whenever data practices change.

---

## Sources
- [About the Data Safety form and account deletion — Google Play Developer Community](https://support.google.com/googleplay/android-developer/community-guide/246344978/about-the-data-safety-form-and-account-deletion?hl=en)
- [Understanding Google Play's app account deletion requirements — Play Console Help](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)
- [Add preview assets to showcase your app — Play Console Help](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)
- [Google Play Data Safety form complete guide 2026 — App Lander](https://www.applander.io/blog/google-play-data-safety-form-complete-guide)
- [Delete Account URL in the Data Safety form — TermsFeed](https://www.termsfeed.com/blog/google-data-safety-form-delete-account-url/)
- [Google Play feature graphic & screenshot sizes 2026 — echodesigns](https://www.echodesigns.space/blog/google-play-feature-graphic-screenshot-sizes)
- [Google Play store listing guide & checklist 2026 — InspiringApps](https://www.inspiringapps.com/blog/google-play-store-listing)
