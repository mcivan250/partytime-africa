# Privacy Policy — Party Time

> ⚠️ **DRAFT — must be reviewed by a qualified lawyer before publishing.** This
> draft is tailored to Party Time's actual data flows (Supabase, Pesapal, Sentry,
> WhatsApp OTP, first-party analytics) but is **not legal advice**. Uganda's **Data
> Protection and Privacy Act, 2019** and its Regulations apply; if you serve users
> in the EU/UK, GDPR/UK-GDPR obligations may also apply. Fill every
> `[PLACEHOLDER]` and confirm the lawful bases, retention periods and cross-border
> transfer wording.
>
> Publish the rendered version at a stable public URL (e.g.
> `https://partytime.africa/privacy`) and enter it in App Store Connect and Play
> Console.

**Effective date:** [EFFECTIVE_DATE_PLACEHOLDER]
**Last updated:** [LAST_UPDATED_PLACEHOLDER]

---

## 1. Who we are

Party Time ("Party Time," "we," "us") is a nightlife and events platform for
discovering events, buying tickets, reserving tables, and connecting with
organizers and friends in Kampala, Uganda and beyond.

- **Legal entity:** [LEGAL_ENTITY_NAME_PLACEHOLDER]
- **Registered address:** [COMPANY_ADDRESS_PLACEHOLDER]
- **Data controller contact:** [CONTACT_EMAIL_PLACEHOLDER]
- **Data Protection Officer / privacy contact:** [DPO_NAME_AND_EMAIL_PLACEHOLDER]

This policy covers the Party Time mobile apps (iOS and Android) and the website at
partytime.africa.

---

## 2. The data we collect

We collect only what the app's features need. We do **not** run advertising, we do
**not** sell your personal data, and we do **not** track you across other
companies' apps or websites.

| Data | What it is | Why we collect it | Provided by |
|---|---|---|---|
| Email address | Your sign-in email | Create and secure your account; important service messages | You (sign-up) |
| Display name | Your name/handle shown in the app | Profile, RSVPs, messages | You |
| Plus-one names | Names you add for guests | RSVP guest lists | You |
| Phone number (optional) | Mobile number you verify | Optional phone verification via WhatsApp | You |
| Approximate location | Coarse device location | Recommend events, bars and restaurants near you | Your device (with permission) |
| Photos you upload | Event covers, profile pictures, feed images | Show your content in the app | You |
| Messages | Chat / direct messages you send | Deliver in-app messaging | You |
| Purchases | Tickets and table reservations you buy, amounts, order status | Issue tickets, honor reservations, calculate promoter commissions, support | You + payment processor |
| Usage analytics | Actions in the app (e.g. app opened, event viewed, checkout started) | Understand and improve the product (first-party only) | Automatically |
| Diagnostics / crash data | Crash reports and performance/diagnostic data | Keep the app stable and fix bugs | Automatically |
| Account identifiers | Your Party Time user ID | Operate your account | Automatically |

**Payment card and mobile-money details:** entered directly on **Pesapal's**
secure checkout. **Party Time never receives or stores your full card number or
mobile-money PIN.** We store only the order reference, amount, status, and the
tickets/reservations issued.

**We do not collect:** precise/background location, contacts, browsing or search
history, health data, or advertising identifiers.

---

## 3. How and why we use your data (lawful bases)

We process your data to:

- **Provide the service** (accounts, discovery, tickets, QR entry, reservations,
  RSVPs, messaging, AI concierge) — *performance of a contract with you*.
- **Process payments and issue tickets/reservations, and pay promoter
  commissions** — *performance of a contract*.
- **Verify your phone number** (if you choose to) — *your consent*.
- **Recommend nearby events and venues** using approximate location — *your
  consent* (you can decline the location permission).
- **Keep the app safe and stable** (crash reporting, fraud/abuse prevention,
  moderating user content) — *legitimate interests*.
- **Improve the product** with first-party analytics — *legitimate interests*.
- **Send you service messages** (booking confirmations, event reminders, security
  notices) — *contract / legitimate interests*. Marketing messages, if any, are
  sent only with your *consent* and you can opt out.

*(Confirm the exact lawful bases with counsel for each jurisdiction you operate
in.)*

---

## 4. Content that is publicly visible

Some information is visible to other users by design:
- Your display name and profile photo.
- Events, photos, captions and comments you post.
- Your presence on guest lists / RSVPs where the organizer or feature makes it
  visible.

**Uploaded images (event covers, profile pictures and feed photos) are stored in
publicly accessible storage and can be viewed by anyone who has the image link.**
Do not upload anything you want to keep private. *(Engineering note: personal
images such as avatars and message attachments should be moved to signed/private
URLs; update this section once that change ships.)*

---

## 5. Who we share data with

We share data only with service providers ("processors") that help us run Party
Time, and only as needed:

| Provider | Role | Data shared |
|---|---|---|
| **Supabase** | Database, authentication, file storage, backend functions (hosting infrastructure) | Account data, profiles, messages, uploads, orders, analytics |
| **Pesapal** | Payment processing (mobile money and card) for tickets and reservations | Order amount, reference, and the payment details you enter on Pesapal's own checkout |
| **Meta Platforms (WhatsApp Business/Cloud API)** | Deliver phone-verification one-time codes | Your phone number and the OTP message, only if you use phone verification |
| **Sentry** | Crash and error reporting | Diagnostic/crash data and technical device information |
| **Event organizers / venues** | Fulfil the events and reservations you book | Your name and booking details necessary to admit you or honor your reservation |
| **Promoters** | Referral commissions | Aggregate/attribution data about tickets sold via their link (not your payment details) |

We may also disclose data where **required by law**, to enforce our Terms, or to
protect the rights and safety of users and the public. If Party Time is involved
in a merger or acquisition, data may transfer subject to this policy.

**We do not sell your personal data and we do not share it for third-party
advertising.**

---

## 6. International data transfers

Our processors (Supabase, Sentry, Pesapal, Meta) may process data on servers
**outside Uganda**, including in the United States and Europe. Where data leaves
Uganda or another region with data-protection laws, we rely on appropriate
safeguards (e.g. provider data-processing agreements and standard contractual
clauses). *(Confirm the exact transfer mechanism and the Supabase project region
with counsel — the backend project is hosted in [SUPABASE_REGION_PLACEHOLDER].)*

---

## 7. How long we keep data (retention)

| Data | Retention |
|---|---|
| Account data (email, name, profile) | While your account is active; deleted on account deletion (see §9) |
| Messages, RSVPs, uploads | While your account is active; removed/de-identified on deletion |
| Location | Used transiently for recommendations; not stored as a location history [CONFIRM_PLACEHOLDER] |
| Analytics (`app_events`) | [RETENTION_PERIOD_PLACEHOLDER, e.g. 24 months], then aggregated/deleted |
| Crash/diagnostics (Sentry) | Per Sentry's retention, typically [SENTRY_RETENTION_PLACEHOLDER, e.g. 90 days] |
| Transaction/order records | Retained after account deletion **only** as required for tax, accounting, fraud and legal purposes, in de-identified form where possible [LEGAL_RETENTION_PERIOD_PLACEHOLDER] |

---

## 8. Your rights

Subject to applicable law (including Uganda's Data Protection and Privacy Act,
2019, and GDPR/UK-GDPR where relevant), you may:

- **Access** the personal data we hold about you.
- **Correct** inaccurate data (much of it is editable in your profile).
- **Delete** your account and associated data (see §9).
- **Object to or restrict** certain processing.
- **Withdraw consent** (e.g. turn off location permission, opt out of marketing).
- **Data portability** where applicable.
- **Lodge a complaint** with a supervisory authority — in Uganda, the **Personal
  Data Protection Office (PDPO)**.

To exercise any right, contact [CONTACT_EMAIL_PLACEHOLDER]. We respond within the
timeframe required by law.

---

## 9. Deleting your account and data

You can delete your Party Time account and associated personal data at any time:

- **In the app:** Profile → Settings → **Delete account**, then confirm.
- **On the web:** visit **[https://partytime.africa/delete-account]** and follow
  the instructions — this works even if you have uninstalled the app.
- **By email:** write to [CONTACT_EMAIL_PLACEHOLDER] from your account email.

When you delete your account we remove or de-identify your profile, messages,
RSVPs, uploaded photos, verified phone number and analytics records. We retain
limited transaction records only where required by law (see §7). Some backups may
persist for a short period before being overwritten.

---

## 10. Children

Party Time is a nightlife product intended for adults and is **not directed at
children**. You must be at least **18** (or the legal age to attend the events
sold) to use it. We do not knowingly collect data from anyone under this age; if
we learn we have, we will delete it. Contact [CONTACT_EMAIL_PLACEHOLDER] if you
believe a minor has provided us data.

---

## 11. Security

We use encryption in transit (HTTPS/TLS) for all data, access controls and
row-level security on our database, and short-lived, cryptographically signed
codes for ticket QR entry. No system is perfectly secure; please use a strong,
unique password and keep it confidential.

---

## 12. Changes to this policy

We may update this policy. We will post the new version here and update the "Last
updated" date; material changes will be notified in the app or by email.

---

## 13. Contact

- **Privacy questions:** [CONTACT_EMAIL_PLACEHOLDER]
- **Data Protection Officer / representative:** [DPO_NAME_AND_EMAIL_PLACEHOLDER]
- **Postal:** [COMPANY_ADDRESS_PLACEHOLDER]

---

*This document is a draft prepared to accompany app-store submission and must be
reviewed and finalized by a qualified lawyer before publication.*
