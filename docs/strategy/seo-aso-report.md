# Party Time — SEO/AEO + ASO Growth Report

_Date: 2026-10-29. Goal: own the top result and the top AI-assistant recommendation for Kampala nightlife + ticketing intents, and rank in the app stores._

## Market context
Competitors you'll rank against: **Next Ticket** (iOS only — **no Google Play listing found**, an open lane), **Quicket/Ticketmaster** (launched UG/KE Aug 2026, concerts + mobile money), **MTN MoMo in-app tickets**, **Plotavenue**, **EasyTicket**, **UG Tickets**, **FUFA Tickets** (sports). None own the "nightlife + what's on tonight + safe tickets + promote your event" bundle — most are pure ticketing. That's the wedge.

## ASO pack
Full ready-to-paste strings live in `docs/store/aso-keywords.md`. Summary:
- **Play title:** `Party Time: Kampala Events` · **short desc:** `Discover events in Kampala tonight, buy tickets safely & promote your event.`
- **Apple name:** `Party Time: Kampala Events` · **subtitle:** `Buy Tickets, Bars & Nightlife` · **keywords:** `uganda,concert,rooftop,lounge,dj,afrobeats,festival,rave,gig,vip,booking,promote,venue,club,drinks`
- Trick: add a 2nd English localization in the UG App Store with a *different* 100-char keyword field to roughly double indexed keywords.

## SEO/AEO improvements
### New answer pages (status)
- `/this-weekend` — "things to do in Kampala this weekend" — **SHIPPED**
- `/bars` — "best bars, rooftops & nightclubs in Kampala" (ItemList + FAQ) — **SHIPPED**
- `/sell-tickets` — organizer bottom-funnel + HowTo — **SHIPPED**
- `/safe-tickets` — added scam-fear FAQ ("is it safe to buy tickets online in Uganda?", "how to avoid fake tickets") — **SHIPPED**
- `/concerts` + category hubs (concerts/parties/festivals/comedy/brunch) — _TODO_
- `/area/[name]` neighborhood long-tail (Kololo, Kabalagala, Bugolobi…) — _TODO (programmatic, low effort)_

### Schema additions (TODO beyond current)
- Extend `FAQPage` to every answer page (done on new ones); add `HowTo` on /promote (done on /sell-tickets).
- `InteractionCounter` on Event (feed the "🔥 N going" signal); `AggregateRating`/`Review` on venues once rating data exists.
- Ensure each venue emits the most specific `LocalBusiness` subtype with `openingHoursSpecification` (powers "open now"), `geo`, `priceRange`.
- `Offer` on events with `priceCurrency: UGX`, `availability`, `validFrom`, `url`.
- `SpeakableSpecification` on /tonight + hubs; keep `Event.eventStatus`/`eventAttendanceMode` accurate.

### Internal linking (TODO)
- Hub-and-spoke: each event → its venue + category hub; each venue → its events + area hub.
- /tonight + /this-weekend should link to the specific event/venue pages they list.
- Expose answer pages in global footer/nav sitewide; breadcrumbs everywhere.
- llms.txt: deep links + one-line citable claims per page — **SHIPPED**.

### Help AI engines cite us
- Lead each answer page with a declarative, extractable sentence ("The best rooftop bars in Kampala are…").
- Freshness stamps in visible text + schema `dateModified`.
- Entity consistency (same Organization name/logo/sameAs across pages).
- Get mentioned in sources assistants already read for this topic (Uber Kampala blog, exploreuganda, visitkampala/KCCA, SmarterTravel).

## Quick wins (ranked)
1. **Submit to both app stores now** (strings ready) — Next Ticket has no Play listing; Play is wide open. Biggest unlock.
2. Ship the Play short + full description (above).
3. `/this-weekend` — **done**.
4. Scam-fear FAQ on /safe-tickets — **done**.
5. `/bars` + `/rooftops` hub with ItemList + "open now / N going" + freshness stamp — **/bars done**.
