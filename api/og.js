// Server-rendered link previews for shared event pages.
//
// Only social crawlers are routed here (via a User-Agent condition in the root
// vercel.json) — real visitors always get the SPA untouched. For a crawler we
// return a compact HTML document whose <head> carries the specific event's Open
// Graph / Twitter tags, so a shared link shows the event's poster and title
// instead of a generic Party Time card. Falls back to the default branding when
// the event can't be resolved.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://psyhhkmadllvywdnckgz.supabase.co';
const SUPABASE_ANON =
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_F20bL_Y47zAfZH5H8PHQuA_7UK_4vlH';
const SITE = 'https://partytime.africa';
const DEFAULT_TITLE = 'Party Time — Uganda’s nightlife, ticketed';
const DEFAULT_DESC =
  'Discover events, get tickets, and find the city’s best bars & restaurants. Where Kampala goes out.';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchEvent(slug) {
  if (!slug) return null;
  try {
    // RLS restricts anon to published public/unlisted events — exactly the
    // shared-link case. Anything else returns empty and we fall back.
    const url =
      `${SUPABASE_URL}/rest/v1/events?slug=eq.${encodeURIComponent(slug)}` +
      `&select=title,description,cover_url,venue_name,starts_at&limit=1`;
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  const slug = req.query && req.query.slug ? String(req.query.slug).trim() : '';
  const ev = await fetchEvent(slug);

  const pageUrl = `${SITE}/e/${encodeURIComponent(slug)}`;
  let title = DEFAULT_TITLE;
  let desc = DEFAULT_DESC;
  let image = `${SITE}/og-image.png`;

  if (ev) {
    title = `${ev.title} · Party Time`;
    const bits = [];
    if (ev.starts_at) {
      try {
        bits.push(
          new Date(ev.starts_at).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          }),
        );
      } catch {
        /* ignore bad dates */
      }
    }
    if (ev.venue_name) bits.push(ev.venue_name);
    const prefix = bits.length ? `${bits.join(' · ')} — ` : '';
    const body = (ev.description || 'Get your tickets on Party Time.').replace(/\s+/g, ' ').trim();
    desc = (prefix + body).slice(0, 200);
    if (ev.cover_url) image = ev.cover_url;
  }

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#111811">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Party Time">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${esc(pageUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(image)}">
</head><body>
<p><a href="${esc(pageUrl)}">${esc(ev ? ev.title : 'Party Time')}</a> — where Kampala goes out.</p>
</body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
  res.status(200).send(html);
};
