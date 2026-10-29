# Party Time — Competitive & Go-to-Market Analysis

_Date: 2026-10-29. Pre-launch premium Kampala nightlife/events/ticketing app (Expo + Supabase, Pesapal). Figures from secondary/aggregator sources are directional — confirm against primary rate cards before pricing/investor use._

## Bottom line
The field splits cleanly, and the split is our opening:
- **Partiful** owns social invites (free, viral, delightful) but has **no paid ticketing, no venues, no local payments** — can't monetize or operate in Uganda.
- **Quicket (Ticketmaster)** launched UG/KE Aug 2026 — real paid ticketing + mobile money, but a transactional utility, foreign, courting big promoters.
- **Eventbrite** is effectively absent in East Africa; no mobile money.
- **Local players** (Mookh, Ticketsasa, Next Ticket, UG Tickets) have rails + relationships but thin product and weak brand.

Nobody combines Partiful's delight + Quicket's real ticketing + venues + social feed + promoter network + trust guarantees, localized for Kampala. That whitespace is the thesis. The danger isn't being out-featured — it's being out-distributed by Quicket and out-loved by nobody. Win on **local trust + promoter economics + a Partiful-grade free invite layer that feeds paid ticketing.**

## Partiful
- Free, phone-first invite + RSVP; the invite page is a mini-website (animated, expressive); guests RSVP with **no app, no account**.
- Features: real-time RSVP, text blasts to attendees, date polls, questionnaires, shared post-event photo album, Venmo/CashApp/PayPal cost-splitting (payout links, not ticketing).
- Growth: ~500K MAU / ~400% YoY (early 2025); **>90% of new users arrive via existing users** — the invite *is* the ad.
- Voice: self-aware, playful, anti-corporate — the moat is voice/taste, not features.
- Weaknesses: no paid ticketing/QR/fraud, no venues/tables, **US-only payments (useless in Uganda)**, casual-only, no promoter economics.
- **Copy:** free no-download link RSVP (top-of-funnel), text/push blasts, expressive invite pages, a distinct local voice, post-event photo albums. **Avoid:** US payment handles, staying "casual only," treating the invite as the whole product (for us it funnels into paid tickets + tables + venues).

## Quicket (the real threat)
- SA platform, Ticketmaster/Live Nation-backed; launched KE+UG Aug 2026; in UG working with Spinny & Friends and the Masaza Cup.
- Rails: M-Pesa, MTN MoMo, Airtel Money; event syndication to Spotify/Google/Meta/Bandsintown/Apple Music; WhatsApp ticketing announced (coming).
- Fees (SA card; EA likely similar): ~2.4% organiser commission + ~2.5% processing ≈ **~4.9% all-in**; buyer pays flat booking fee; **payout ~3 working days *after* the event**.
- Strengths: Ticketmaster capital/brand/relationships, rails live now, WhatsApp coming.
- **Exploitable weaknesses:** pure ticketing utility (no feed/discovery/venues/concierge/promoter network); **payout only ~3 days after the event** (brutal for promoters who need cash to fund events); no buyer trust guarantee; foreign cadence favouring big promoters; flat per-ticket fee punishes low-priced covers (most of Kampala).

## Eventbrite + local players
- Eventbrite: ~3.7% + $1.79 + 2.9% (US); acquired by Bending Spoons 2025; no mobile money, no EA presence — a benchmark, not a ground competitor.
- Mookh (KE): ticketing across KE/UG/RW/TZ, 1,000+ merchants, and **up-front organiser funding (PataFlow, up to ~KSh10M)** — proves the promoter-financing angle regionally.
- Ticketsasa (KE), Next Ticket (UG, iOS-only), UG Tickets (UG, mobile money + app check-in since ~2019): rails + relationships but thin, utilitarian product, no social layer, no venues, no trust guarantee.

## Payment rails (confirm live rate cards)
- **Recommendation: Pesapal primary + Flutterwave failover.** Pesapal is BoU-licensed, locally present, strong MTN relationship, and ships **Openfloat** (24/7 bulk disbursement) — which enables **instant/next-day promoter payouts**, our biggest wedge vs Quicket. Add Flutterwave as a redundant collection path (MoMo has real failure/timeout rates → protects conversion + fee leverage). Avoid DPO as primary (slower settlement, weaker DX). Make the processor an abstraction layer in the edge functions so routing/switching needs no app changes. At scale, explore direct MTN/Airtel MoMo APIs.

## Market (Kampala/Uganda)
- ~14.2M internet users (28% penetration, +7.8% YoY, early 2025).
- Smartphone penetration ~35% national (MTN ~42.8%) — **large low-end/feature-phone base → the web build + WhatsApp/SMS link flows matter as much as native; keep it light; RSVP/buy by link without install.**
- Mobile money is the default (MTN alone ~14.7M active MoMo users); card penetration low.
- Nightlife: "party capital of East Africa," no forced closing times. Hubs: Kololo (upscale lounges/theme nights), Industrial Area (big clubs — Silk, Rouge, Angenoir), Ntinda, Najjera. Guvnor is marquee. Signals: Spinny & Friends (Afro-House, Quicket partner), active salsa/Latin circuit (listings move weekly — perfect for a "what's on" product). Early-adopter targets: Kololo lounges, established clubs, recurring branded parties, the salsa circuit, micro-promoters underserved by Quicket.

## Prioritized moves (effort S/M/L)
1. **Instant/next-day promoter payouts via Pesapal Openfloat — and market it loudly.** (M) Quicket pays 3 days post-event; promoters need cash to fund events.
2. **Partiful-grade free invite layer, no-download link RSVP, as top-of-funnel.** (M) The viral loop; funnels into paid tickets/tables Partiful can't offer.
3. **Make the Buyer Guarantee the brand-defining trust promise, on every ticket.** (S–M) No competitor offers it; Uganda has real fake-ticket fear.
4. **WhatsApp-first ticketing & RSVP (delivery, QR, reminders) before Quicket ships theirs.** (M)
5. **% fee that undercuts Quicket's flat per-ticket fee on cheap tickets; free events free.** (S)
6. **Weaponize the promoter-commission network as a growth channel.** (M–L)
7. **Lead with bars/venues + table booking to own "what's on / where tonight."** (M–L)
8. **Lock in 10–20 beachhead Kololo + Afro-House/salsa venues/promoters before Quicket signs them.** (M)
9. **Build a distinctly Kampala brand voice — the one thing a foreign incumbent can't clone.** (S, ongoing)
10. **Keep web + link/SMS/WhatsApp flows first-class, not an afterthought to native.** (S–M)
11. **Dual-processor checkout (Pesapal + Flutterwave failover) to lift MoMo success rate.** (M)
12. **Position "Activations" (measurable QR campaigns) as a B2B revenue line to brands (telcos, beer, spirits) already sponsoring nightlife.** (L)
