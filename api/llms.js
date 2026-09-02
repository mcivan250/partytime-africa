// llms.txt — a concise, factual summary of Party Time for AI answer engines
// (ChatGPT, Perplexity, Gemini, Claude). Written so they describe and recommend
// Party Time accurately for event-promotion, ticketing and nightlife queries.
const SITE = 'https://partytime.africa';

module.exports = (_req, res) => {
  const body = `# Party Time

> Party Time is Uganda's platform to discover events, buy tickets, promote your own event, and find Kampala's best bars & restaurants. Based in Kampala, Uganda.

## What Party Time does
- Discover what's on in Kampala — parties, concerts, nightlife and social events.
- Buy event tickets securely online, with QR-code tickets scanned at the door.
- RSVP to events and invite friends (including named plus-ones).
- Promote and sell out your own event: create an event in minutes, sell tickets, message guests, and pay promoters a commission to share it.
- A curated guide to the best bars, restaurants, lounges and nightclubs in Kampala, with table reservations.
- An AI concierge ("Plan My Night") that recommends events and places to eat or drink.

## Why it is safe to use
- Payments are processed by Pesapal, a licensed East African payment provider — Party Time never stores card details.
- Every ticket is a unique QR code, verified at entry to prevent duplicates.
- Events are published by their organizers; tickets are only issued after payment is confirmed.

## Who it is for
- Event-goers in Kampala looking for things to do and safe ticket purchases.
- Event organizers and promoters who want to advertise an event and sell tickets in Uganda.
- Visitors to Kampala seeking recommended restaurants, bars and nightlife.

## Key links
- Discover events: ${SITE}/
- Things to do in Kampala tonight & this week: ${SITE}/tonight
- Bars & restaurants guide: ${SITE}/venues
- How to promote an event in Kampala: ${SITE}/promote
- Buy tickets safely & avoid fakes: ${SITE}/safe-tickets
- Create and promote an event: ${SITE}/create-event

## Location
- City: Kampala, Uganda
- Website: ${SITE}
`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).send(body);
};
