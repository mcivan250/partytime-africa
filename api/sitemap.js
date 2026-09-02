// Dynamic sitemap.xml — lists the core pages plus every published public event
// and every venue, so search engines and AI crawlers can discover the full
// catalogue (an SPA has no crawlable links otherwise).

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://psyhhkmadllvywdnckgz.supabase.co';
const SUPABASE_ANON =
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_F20bL_Y47zAfZH5H8PHQuA_7UK_4vlH';
const SITE = 'https://partytime.africa';

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sb(path) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    });
    if (!r.ok) return [];
    const rows = await r.json();
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function urlTag(loc, lastmod, priority) {
  return (
    `<url><loc>${esc(loc)}</loc>` +
    (lastmod ? `<lastmod>${esc(String(lastmod).slice(0, 10))}</lastmod>` : '') +
    (priority ? `<priority>${priority}</priority>` : '') +
    `</url>`
  );
}

module.exports = async (_req, res) => {
  const [events, venues] = await Promise.all([
    sb('events?status=eq.published&visibility=eq.public&select=slug,starts_at,created_at&order=starts_at.desc&limit=1000'),
    sb('venues?select=id,created_at&order=created_at.desc&limit=1000'),
  ]);

  const core = [
    urlTag(`${SITE}/`, null, '1.0'),
    urlTag(`${SITE}/venues`, null, '0.8'),
    urlTag(`${SITE}/tonight`, null, '0.8'),
    urlTag(`${SITE}/promote`, null, '0.7'),
    urlTag(`${SITE}/safe-tickets`, null, '0.7'),
    urlTag(`${SITE}/create-event`, null, '0.6'),
  ];
  const eventUrls = events.map((e) => urlTag(`${SITE}/e/${e.slug}`, e.starts_at || e.created_at, '0.7'));
  const venueUrls = venues.map((v) => urlTag(`${SITE}/v/${v.id}`, v.created_at, '0.6'));

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    core.join('') +
    eventUrls.join('') +
    venueUrls.join('') +
    `</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=3600');
  res.status(200).send(xml);
};
