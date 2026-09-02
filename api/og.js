// Server-rendered pages for crawlers and AI answer engines.
//
// Real visitors always get the SPA untouched — only crawlers/bots are routed
// here (via User-Agent conditions in the root vercel.json). For a bot we return
// a compact HTML document carrying:
//   • Open Graph / Twitter tags (rich link previews when shared), and
//   • schema.org JSON-LD structured data (Event / Restaurant / Organization),
//     which is what lets Google show rich results and lets AI answer engines
//     (ChatGPT, Perplexity, Gemini, Claude) parse and cite Party Time.
//
// One function serves three shapes based on the query:
//   ?slug=<event>   → Event page   (Event + Offer JSON-LD)
//   ?venue=<id>     → Venue page    (Restaurant/BarOrPub/NightClub JSON-LD)
//   (neither)       → Home page     (Organization + WebSite JSON-LD)

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://psyhhkmadllvywdnckgz.supabase.co';
const SUPABASE_ANON =
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_F20bL_Y47zAfZH5H8PHQuA_7UK_4vlH';
const SITE = 'https://partytime.africa';
const DEFAULT_TITLE = 'Party Time — Uganda’s nightlife, ticketed';
const DEFAULT_DESC =
  'Discover events, get tickets, and find Kampala’s best bars & restaurants. Promote your event and sell tickets safely on Party Time — where Kampala goes out.';

const ZERO_DECIMAL = new Set(['UGX', 'KES', 'TZS', 'RWF', 'JPY']);

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Safe to embed inside <script type="application/ld+json">.
function jsonld(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

function money(minor, ccy) {
  const c = (ccy || 'UGX').toUpperCase();
  const major = ZERO_DECIMAL.has(c) ? minor : minor / 100;
  return { amount: major, currency: c };
}

async function sb(path) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

function page({ title, desc, image, url, canonical, jsonldBlocks, bodyHtml }) {
  const blocks = (jsonldBlocks || [])
    .map((b) => `<script type="application/ld+json">${jsonld(b)}</script>`)
    .join('\n');
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical || url)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#111811">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Party Time">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(image)}">
${blocks}
</head><body>
${bodyHtml}
</body></html>`;
}

async function eventPage(slug) {
  const rows = await sb(
    `events?slug=eq.${encodeURIComponent(slug)}` +
      `&select=title,description,cover_url,venue_name,address,starts_at,ends_at,is_ticketed,currency,ticket_tiers(price_minor,currency)&limit=1`,
  );
  const ev = rows && rows[0];
  const url = `${SITE}/e/${encodeURIComponent(slug)}`;
  if (!ev) {
    return page({ title: DEFAULT_TITLE, desc: DEFAULT_DESC, image: `${SITE}/og-image.png`, url, jsonldBlocks: [], bodyHtml: `<p><a href="${SITE}">Party Time</a> — where Kampala goes out.</p>` });
  }
  const title = `${ev.title} · Party Time`;
  const bits = [];
  if (ev.starts_at) {
    try {
      bits.push(new Date(ev.starts_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }));
    } catch {
      /* ignore */
    }
  }
  if (ev.venue_name) bits.push(ev.venue_name);
  const prefix = bits.length ? `${bits.join(' · ')} — ` : '';
  const body = (ev.description || 'Get your tickets on Party Time.').replace(/\s+/g, ' ').trim();
  const desc = (prefix + body).slice(0, 300);
  const image = ev.cover_url || `${SITE}/og-image.png`;

  const tiers = Array.isArray(ev.ticket_tiers) ? ev.ticket_tiers : [];
  const min = tiers.length ? tiers.reduce((a, b) => (b.price_minor < a.price_minor ? b : a)) : null;
  const offer = min
    ? (() => {
        const m = money(min.price_minor, min.currency);
        return { '@type': 'Offer', price: String(m.amount), priceCurrency: m.currency, availability: 'https://schema.org/InStock', url };
      })()
    : { '@type': 'Offer', price: '0', priceCurrency: ev.currency || 'UGX', availability: 'https://schema.org/InStock', url };

  const eventLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    description: body.slice(0, 500),
    url,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(ev.cover_url ? { image: [ev.cover_url] } : {}),
    ...(ev.starts_at ? { startDate: ev.starts_at } : {}),
    ...(ev.ends_at ? { endDate: ev.ends_at } : {}),
    location: {
      '@type': 'Place',
      name: ev.venue_name || 'Kampala',
      address: { '@type': 'PostalAddress', ...(ev.address ? { streetAddress: ev.address } : {}), addressLocality: 'Kampala', addressCountry: 'UG' },
    },
    organizer: { '@type': 'Organization', name: 'Party Time', url: SITE },
    offers: offer,
  };

  const bodyHtml =
    `<h1>${esc(ev.title)}</h1>` +
    (bits.length ? `<p>${esc(bits.join(' · '))}</p>` : '') +
    `<p>${esc(body.slice(0, 400))}</p>` +
    `<p><a href="${esc(url)}">Get tickets & RSVP on Party Time</a></p>`;

  return page({ title, desc, image, url, jsonldBlocks: [eventLd], bodyHtml });
}

const VENUE_SCHEMA = { restaurant: 'Restaurant', bar: 'BarOrPub', club: 'NightClub', lounge: 'BarOrPub' };

async function venuePage(id) {
  const rows = await sb(
    `venues?id=eq.${encodeURIComponent(id)}` +
      `&select=name,kind,city,address,description,cover_url,phone,price_range,cuisines,lat,lng&limit=1`,
  );
  const v = rows && rows[0];
  const url = `${SITE}/v/${encodeURIComponent(id)}`;
  if (!v) {
    return page({ title: DEFAULT_TITLE, desc: DEFAULT_DESC, image: `${SITE}/og-image.png`, url, jsonldBlocks: [], bodyHtml: `<p><a href="${SITE}">Party Time</a> — Kampala’s bars & restaurants guide.</p>` });
  }
  const kindLabel = { restaurant: 'Restaurant', bar: 'Bar', club: 'Nightclub', lounge: 'Lounge' }[v.kind] || 'Venue';
  const title = `${v.name} · ${kindLabel} in Kampala · Party Time`;
  const cuisines = Array.isArray(v.cuisines) ? v.cuisines : [];
  const descBase = v.description || `${v.name} — a ${kindLabel.toLowerCase()} in ${v.city || 'Kampala'}. Reserve a table on Party Time.`;
  const desc = [v.price_range, cuisines.slice(0, 3).join(', '), descBase].filter(Boolean).join(' · ').replace(/\s+/g, ' ').slice(0, 300);
  const image = v.cover_url || `${SITE}/og-image.png`;

  const venueLd = {
    '@context': 'https://schema.org',
    '@type': VENUE_SCHEMA[v.kind] || 'LocalBusiness',
    name: v.name,
    description: (v.description || descBase).slice(0, 500),
    url,
    ...(v.cover_url ? { image: [v.cover_url] } : {}),
    ...(cuisines.length ? { servesCuisine: cuisines } : {}),
    ...(v.price_range ? { priceRange: v.price_range } : {}),
    ...(v.phone ? { telephone: v.phone } : {}),
    address: { '@type': 'PostalAddress', ...(v.address ? { streetAddress: v.address } : {}), addressLocality: v.city || 'Kampala', addressCountry: 'UG' },
    ...(v.lat != null && v.lng != null ? { geo: { '@type': 'GeoCoordinates', latitude: v.lat, longitude: v.lng } } : {}),
  };

  const bodyHtml =
    `<h1>${esc(v.name)}</h1>` +
    `<p>${esc([kindLabel, v.price_range, v.city || 'Kampala'].filter(Boolean).join(' · '))}</p>` +
    `<p>${esc((v.description || descBase).slice(0, 400))}</p>` +
    `<p><a href="${esc(url)}">Reserve a table on Party Time</a></p>`;

  return page({ title, desc, image, url, jsonldBlocks: [venueLd], bodyHtml });
}

function homePage() {
  const url = SITE;
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Party Time',
    url,
    logo: `${SITE}/og-image.png`,
    description: DEFAULT_DESC,
    areaServed: { '@type': 'City', name: 'Kampala', address: { '@type': 'PostalAddress', addressCountry: 'UG' } },
  };
  const siteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Party Time',
    url,
    description: DEFAULT_DESC,
  };
  const bodyHtml =
    `<h1>Party Time — Kampala’s events, tickets & nightlife guide</h1>` +
    `<p>${esc(DEFAULT_DESC)}</p>` +
    `<ul>` +
    `<li><a href="${SITE}/">Discover events in Kampala</a></li>` +
    `<li><a href="${SITE}/venues">Best bars & restaurants in Kampala</a></li>` +
    `<li><a href="${SITE}/create-event">Promote your event & sell tickets</a></li>` +
    `</ul>` +
    `<p>Party Time lets organizers promote events and sell tickets safely in Uganda — secure Pesapal payments, QR-verified tickets, and RSVPs — and helps guests find what’s on and book tables at the city’s best venues.</p>`;
  return page({ title: DEFAULT_TITLE, desc: DEFAULT_DESC, image: `${SITE}/og-image.png`, url, jsonldBlocks: [orgLd, siteLd], bodyHtml });
}

module.exports = async (req, res) => {
  const q = req.query || {};
  const slug = q.slug ? String(q.slug).trim() : '';
  const venue = q.venue ? String(q.venue).trim() : '';
  let html;
  if (slug) html = await eventPage(slug);
  else if (venue) html = await venuePage(venue);
  else html = homePage();

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
  res.status(200).send(html);
};
