// /go/<code> — the landing "moment" a physical experiential activation points
// to (QR on a pop-up, billboard, installation, launch). It:
//   1. logs the scan to app_events (so it's counted),
//   2. resolves the code to a linked event (if any),
//   3. shows a bold, screenshot-worthy on-brand page,
//   4. routes the visitor into the app carrying ?c=<code> so everything they do
//      next is attributed to this activation.
// Routed via vercel.json:  /go/:code → /api/go?code=:code

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://psyhhkmadllvywdnckgz.supabase.co';
const SUPABASE_ANON =
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_F20bL_Y47zAfZH5H8PHQuA_7UK_4vlH';
const SITE = 'https://partytime.africa';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function resolveCampaign(code) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/resolve_campaign`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_code: code }),
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch {
    return null;
  }
}

async function logScan(code) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/app_events`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ name: 'campaign_scan', props: { campaign: code }, platform: 'web' }),
    });
  } catch {
    // best-effort — the page still renders and routes
  }
}

function page({ code, campaign }) {
  const hasEvent = campaign && campaign.event_slug;
  const target = hasEvent
    ? `${SITE}/e/${encodeURIComponent(campaign.event_slug)}?c=${encodeURIComponent(code)}`
    : `${SITE}/?c=${encodeURIComponent(code)}`;
  const kicker = campaign && campaign.name ? esc(campaign.name) : 'Party Time';
  const headline = hasEvent ? esc(campaign.event_title || 'You’re invited') : 'You found it.';
  const subline = hasEvent
    ? 'Tap in to see the moment, grab your spot and get a QR ticket that scans at the door.'
    : 'Kampala’s nightlife, events and tables — in one place. Tap in and see what’s on tonight.';
  const cta = hasEvent ? 'See the event →' : 'Open Party Time →';

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${kicker} · Party Time</title>
<meta name="robots" content="noindex">
<meta property="og:title" content="${kicker} · Party Time">
<meta property="og:description" content="${esc(subline)}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="theme-color" content="#0A0F0B">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@500;700;800&family=Space+Mono:wght@700&display=swap">
<style>
  *{box-sizing:border-box;margin:0}
  html,body{height:100%}
  body{background:#07100A;color:#EAF3EC;font-family:'Hanken Grotesk',system-ui,sans-serif;
    min-height:100%;display:flex;flex-direction:column;overflow:hidden;position:relative}
  .glow{position:absolute;inset:0;z-index:0;
    background:
      radial-gradient(60% 45% at 20% 10%, rgba(29,201,107,.35), transparent 70%),
      radial-gradient(55% 40% at 90% 20%, rgba(212,175,55,.22), transparent 70%),
      radial-gradient(70% 50% at 50% 110%, rgba(29,201,107,.25), transparent 70%);
    animation:drift 12s ease-in-out infinite alternate}
  @keyframes drift{from{transform:translateY(-2%) scale(1)}to{transform:translateY(3%) scale(1.06)}}
  @media (prefers-reduced-motion: reduce){.glow{animation:none}}
  .wrap{position:relative;z-index:1;flex:1;display:flex;flex-direction:column;justify-content:center;
    gap:22px;max-width:560px;width:100%;margin:0 auto;padding:40px 28px}
  .brand{font-family:'Space Mono',monospace;font-size:13px;letter-spacing:.32em;text-transform:uppercase;
    color:#1DC96B}
  .kicker{font-family:'Space Mono',monospace;font-size:12px;letter-spacing:.2em;text-transform:uppercase;
    color:#D4AF37}
  h1{font-size:clamp(40px,12vw,68px);line-height:.98;font-weight:800;letter-spacing:-.03em;text-wrap:balance}
  p.sub{font-size:18px;line-height:1.5;color:#C9DACF;max-width:36ch}
  .cta{display:inline-flex;align-items:center;justify-content:center;background:#1DC96B;color:#04120a;
    font-weight:800;font-size:18px;padding:18px 26px;border-radius:16px;text-decoration:none;
    box-shadow:0 16px 40px rgba(29,201,107,.35);transition:transform .15s ease}
  .cta:active{transform:scale(.97)}
  .foot{position:relative;z-index:1;text-align:center;padding:20px;color:#6d8073;font-size:13px}
  .live{display:inline-flex;align-items:center;gap:8px;color:#93A899;font-size:13px;
    font-family:'Space Mono',monospace;letter-spacing:.06em}
  .dot{width:8px;height:8px;border-radius:50%;background:#1DC96B;box-shadow:0 0 0 0 rgba(29,201,107,.6);
    animation:pulse 1.8s infinite}
  @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(29,201,107,.55)}70%{box-shadow:0 0 0 12px rgba(29,201,107,0)}100%{box-shadow:0 0 0 0 rgba(29,201,107,0)}}
</style>
</head><body>
<div class="glow"></div>
<div class="wrap">
  <div class="brand">Party<span style="color:#EAF3EC">Time</span></div>
  <div class="kicker">${kicker}</div>
  <h1>${headline}</h1>
  <p class="sub">${esc(subline)}</p>
  <div><a class="cta" href="${esc(target)}">${cta}</a></div>
  <div class="live"><span class="dot"></span> Live in Kampala</div>
</div>
<div class="foot">partytime.africa</div>
<script>
  // Auto-continue into the app after a beat so the moment reads, then routes.
  setTimeout(function(){ try{ window.location.href = ${JSON.stringify(
    hasEvent
      ? `${SITE}/e/${campaign ? campaign.event_slug : ''}?c=${code}`
      : `${SITE}/?c=${code}`,
  )}; }catch(e){} }, 4200);
</script>
</body></html>`;
}

module.exports = async (req, res) => {
  const code = req.query && req.query.code ? String(req.query.code).slice(0, 80) : '';
  if (!code) {
    res.statusCode = 302;
    res.setHeader('Location', SITE);
    res.end();
    return;
  }
  const [campaign] = await Promise.all([resolveCampaign(code), logScan(code)]);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(page({ code, campaign }));
};
