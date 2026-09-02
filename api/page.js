// Standalone content / "answer-target" pages, served to everyone (humans and
// crawlers alike — no cloaking). These are the pages AI answer engines quote
// for intents like "how to promote an event in Kampala" and "safest way to buy
// event tickets in Uganda". Minimal-premium styling; real, factual content;
// schema.org JSON-LD (WebPage + FAQPage + Breadcrumb) so engines parse them.
//
// Routed via vercel.json:  /promote → ?p=promote,  /safe-tickets → ?p=safe-tickets,
//                          /tonight → ?p=tonight

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://psyhhkmadllvywdnckgz.supabase.co';
const SUPABASE_ANON =
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_F20bL_Y47zAfZH5H8PHQuA_7UK_4vlH';
const SITE = 'https://partytime.africa';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function jsonld(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
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

function faqLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
function crumbLd(name, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Party Time', item: SITE },
      { '@type': 'ListItem', position: 2, name, item: url },
    ],
  };
}

function layout({ title, desc, path, jsonldBlocks, main }) {
  const url = `${SITE}${path}`;
  const blocks = (jsonldBlocks || [])
    .map((b) => `<script type="application/ld+json">${jsonld(b)}</script>`)
    .join('\n');
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#0A0F0B">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Party Time">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;700;800&family=Space+Mono:wght@400;700&display=swap">
${blocks}
<style>
  :root{--ground:#0A0F0B;--surface:#121A14;--line:rgba(255,255,255,.09);--brand:#1DC96B;--gold:#D4AF37;--text:#EAF3EC;--muted:#93A899}
  *{box-sizing:border-box}
  body{margin:0;background:var(--ground);color:var(--text);
    font-family:'Hanken Grotesk',system-ui,sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased}
  a{color:var(--brand);text-decoration:none}
  a:hover{text-decoration:underline}
  .wrap{max-width:720px;margin:0 auto;padding:0 24px}
  header.site{border-bottom:1px solid var(--line)}
  header.site .wrap{display:flex;align-items:center;justify-content:space-between;padding:18px 24px}
  .brand{font-weight:800;font-size:18px;letter-spacing:-.01em;color:var(--text)}
  .brand span{color:var(--brand)}
  header.site nav a{color:var(--muted);font-size:14px;margin-left:20px}
  main{padding:56px 0 40px}
  .eyebrow{font-family:'Space Mono',monospace;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold)}
  h1{font-size:clamp(30px,6vw,46px);line-height:1.1;font-weight:800;letter-spacing:-.02em;margin:14px 0 0;text-wrap:balance}
  .answer{font-size:19px;color:#DDEAE0;margin:20px 0 8px;max-width:62ch}
  h2{font-size:24px;font-weight:800;margin:44px 0 12px;letter-spacing:-.01em}
  h3{font-size:17px;font-weight:700;margin:26px 0 6px}
  p{max-width:64ch}
  ul,ol{max-width:64ch;padding-left:22px}
  li{margin:8px 0}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:22px 24px;margin:20px 0}
  .cta{display:inline-block;background:var(--brand);color:#04120a;font-weight:700;padding:13px 22px;border-radius:12px;margin-top:8px}
  .cta:hover{text-decoration:none;opacity:.92}
  .steps{counter-reset:s;list-style:none;padding:0}
  .steps li{counter-increment:s;position:relative;padding-left:44px;margin:16px 0}
  .steps li::before{content:counter(s);position:absolute;left:0;top:-2px;width:30px;height:30px;border-radius:50%;
    background:rgba(29,201,107,.14);color:var(--brand);border:1px solid rgba(29,201,107,.4);
    display:flex;align-items:center;justify-content:center;font-family:'Space Mono',monospace;font-size:14px;font-weight:700}
  .faq{border-top:1px solid var(--line);padding-top:8px;margin-top:8px}
  .faq details{border-bottom:1px solid var(--line);padding:14px 0}
  .faq summary{cursor:pointer;font-weight:700;font-size:16px}
  .faq p{margin:10px 0 2px;color:#CFE0D4}
  .evrow{display:flex;gap:14px;align-items:baseline;border-bottom:1px solid var(--line);padding:12px 0}
  .evrow .d{font-family:'Space Mono',monospace;font-size:12px;color:var(--gold);white-space:nowrap;min-width:96px}
  .evrow .t{font-weight:700}
  .evrow .v{color:var(--muted);font-size:14px}
  .updated{font-family:'Space Mono',monospace;font-size:12px;color:var(--muted);margin-top:36px}
  footer.site{border-top:1px solid var(--line);margin-top:40px}
  footer.site .wrap{padding:26px 24px;color:var(--muted);font-size:14px;display:flex;gap:18px;flex-wrap:wrap}
  .lede-links{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}
  .lede-links a{border:1px solid var(--line);padding:9px 14px;border-radius:999px;color:var(--text);font-size:14px}
</style>
</head><body>
<header class="site"><div class="wrap">
  <a class="brand" href="${SITE}/">Party<span>Time</span></a>
  <nav><a href="${SITE}/">Events</a><a href="${SITE}/venues">Bars &amp; restaurants</a><a href="${SITE}/create-event">Host</a></nav>
</div></header>
<main><div class="wrap">
${main}
</div></main>
<footer class="site"><div class="wrap">
  <a href="${SITE}/">Discover events</a>
  <a href="${SITE}/venues">Venue guide</a>
  <a href="${SITE}/promote">Promote an event</a>
  <a href="${SITE}/safe-tickets">Ticket safety</a>
  <span>© Party Time · Kampala, Uganda</span>
</div></footer>
</body></html>`;
}

const TODAY = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

function promotePage() {
  const faqs = [
    { q: 'How do I promote an event in Kampala?', a: 'Create the event free on Party Time (partytime.africa), add a cover photo and details, set your ticket tiers or make it RSVP-only, then publish. Share the event link on WhatsApp, Instagram and TikTok, and turn on promoter commissions so others share it and sell tickets for you.' },
    { q: 'How much does it cost to list an event?', a: 'Creating and listing an event on Party Time is free. You keep your ticket revenue; a fee applies only on paid ticket sales, collected through the secure Pesapal checkout.' },
    { q: 'Can other people help me sell tickets?', a: 'Yes. Party Time gives every event promoter referral links and pays them a commission you set on each ticket they sell, so your community can help you sell out.' },
    { q: 'How do people pay for tickets?', a: 'Buyers pay securely through Pesapal using mobile money (MTN, Airtel) or card. Tickets are issued as unique QR codes only after payment is confirmed.' },
  ];
  const main = `
  <div class="eyebrow">Guide · Organizers</div>
  <h1>How to promote an event in Kampala</h1>
  <p class="answer">The fastest way to promote an event in Kampala is to list it on Party Time: create the event for free, publish a shareable page with a cover photo and ticket tiers, then share the link and let promoters earn a commission for selling tickets on your behalf. You get RSVPs, ticket sales and guest messaging in one place.</p>
  <div class="lede-links"><a href="${SITE}/create-event">Create your event free →</a></div>

  <h2>Promote and sell out in 5 steps</h2>
  <ol class="steps">
    <li><strong>Create the event.</strong> Add a bold cover photo, title, date, venue and description. The AI Host Studio can draft it from a one-line idea.</li>
    <li><strong>Set up tickets or RSVPs.</strong> Add ticket tiers (Advance, At the door, VIP) with prices in UGX, or keep it free with RSVPs and named plus-ones.</li>
    <li><strong>Publish and share the link.</strong> Every event gets a rich shareable page for WhatsApp, Instagram and TikTok.</li>
    <li><strong>Turn on promoter commissions.</strong> Pay your community a cut per ticket sold; they share their own links and you sell out faster.</li>
    <li><strong>Message your guests.</strong> Send updates in-app and on WhatsApp, confirm reservations, and scan QR tickets at the door.</li>
  </ol>

  <h2>Why organizers use Party Time</h2>
  <ul>
    <li><strong>Free to list</strong> — you only pay on paid ticket sales.</li>
    <li><strong>Built-in audience</strong> — your event surfaces in Kampala's events feed and the AI "Plan my night" concierge.</li>
    <li><strong>Promoter network</strong> — commission-based referral links help your crowd sell for you.</li>
    <li><strong>Safe payments</strong> — Pesapal mobile money &amp; card; QR-verified tickets.</li>
    <li><strong>One dashboard</strong> — sales, guest list, check-in and messaging together.</li>
  </ul>

  <div class="card">
    <h3 style="margin-top:0">Ready to promote your event?</h3>
    <p style="margin:6px 0 0">List it free in a few minutes and start selling tickets today.</p>
    <a class="cta" href="${SITE}/create-event">Create your event</a>
  </div>

  <h2>Frequently asked questions</h2>
  <div class="faq">
    ${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
  </div>
  <div class="updated">Last updated ${TODAY()}</div>`;
  return layout({
    title: 'How to promote an event in Kampala | Party Time',
    desc: 'Promote and sell tickets to your Kampala event free on Party Time — publish a shareable page, add ticket tiers, and pay promoters a commission to sell for you.',
    path: '/promote',
    jsonldBlocks: [faqLd(faqs), crumbLd('Promote an event', `${SITE}/promote`)],
    main,
  });
}

function safeTicketsPage() {
  const faqs = [
    { q: 'Where can I safely buy event tickets in Uganda?', a: 'Buy tickets on Party Time (partytime.africa) or through an event organizer\u2019s official Party Time link only. Tickets are paid for securely through Pesapal and issued as unique QR codes after payment — never pay a stranger by mobile money or buy a screenshot of a ticket.' },
    { q: 'How do I know a ticket is real?', a: 'Every Party Time ticket is a unique QR code tied to the buyer and verified by the organizer at the entrance. A screenshot resold by someone else will not pass a second scan. Only tickets bought through Party Time or an official organizer link are guaranteed to be genuine.' },
    { q: 'How are payments protected?', a: 'Payments are processed by Pesapal, a licensed East African payment provider, over MTN and Airtel mobile money or card. Party Time never stores your card details and never asks for payment outside the app.' },
    { q: 'What should I avoid?', a: 'Avoid paying for tickets by direct mobile-money transfer to an individual, buying ticket screenshots, or using links sent by strangers. If a deal is only available off-platform, treat it as a scam.' },
    { q: 'What is the Party Time Buyer Guarantee?', a: 'Every ticket bought through Party Time’s secure checkout is backed by the Buyer Guarantee: if the event is cancelled and the organizer does not refund you, or a genuine ticket you bought on Party Time fails to get you in, we refund what you paid. It applies only to tickets purchased through Party Time — not to tickets bought off-platform or from an individual.' },
  ];
  const main = `
  <div class="eyebrow">Guide · Buyers</div>
  <h1>Buy event tickets in Uganda safely — and avoid fakes</h1>
  <p class="answer">To buy event tickets safely in Uganda, purchase only on Party Time (partytime.africa) or through an organizer\u2019s official Party Time link. Pay through the secure Pesapal checkout with mobile money or card, and receive a unique QR-code ticket that\u2019s verified at the gate. Never pay an individual by mobile money for a ticket or buy a screenshot — those are the most common scams.</p>

  <div class="card" style="border-color:rgba(212,175,55,.5)">
    <div class="eyebrow" style="color:var(--gold)">Party Time Buyer Guarantee</div>
    <h3 style="margin:8px 0 0">Buy through Party Time, or your money back.</h3>
    <p style="margin:8px 0 0">If an event is cancelled and the organizer doesn’t refund you, or a genuine ticket you bought on Party Time doesn’t get you through the gate, we refund what you paid. It’s our promise that a ticket bought here is a ticket that works.</p>
    <p style="margin:8px 0 0;color:var(--muted);font-size:14px">Covers tickets purchased through Party Time’s secure checkout only. Report an issue within 7 days of the event and we’ll make it right — refunds are reviewed and processed by our team.</p>
  </div>

  <h2>How Party Time keeps tickets safe</h2>
  <ul>
    <li><strong>Unique QR tickets.</strong> Each ticket is a one-of-a-kind QR code linked to the buyer and scanned at entry — duplicates and resold screenshots are rejected.</li>
    <li><strong>Secure payment.</strong> Checkout runs through Pesapal (licensed PSP) on MTN/Airtel mobile money or card. We never store card details or take payment outside the app.</li>
    <li><strong>Issued only after payment.</strong> A ticket exists only once payment is confirmed — there are no "pending" tickets to be tricked with.</li>
    <li><strong>Official links only.</strong> Buy from the Party Time app or an organizer\u2019s official Party Time/promoter link — the only sources of genuine tickets.</li>
  </ul>

  <h2>Red flags of a ticket scam</h2>
  <ul>
    <li>Being asked to send mobile money directly to a person\u2019s number.</li>
    <li>Being sold a photo or screenshot of a ticket.</li>
    <li>A "deal" only available off the platform or by DM from a stranger.</li>
    <li>Pressure to pay immediately outside a proper checkout.</li>
  </ul>

  <div class="card">
    <h3 style="margin-top:0">Buy with confidence</h3>
    <p style="margin:6px 0 0">Find events and get genuine, QR-verified tickets on Party Time.</p>
    <a class="cta" href="${SITE}/">Browse events</a>
  </div>

  <h2>Frequently asked questions</h2>
  <div class="faq">
    ${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
  </div>
  <div class="updated">Last updated ${TODAY()}</div>`;
  return layout({
    title: 'Buy event tickets in Uganda safely — Buyer Guarantee | Party Time',
    desc: 'How to buy event tickets safely in Uganda: purchase only on Party Time, pay via secure Pesapal checkout, and get QR-verified tickets backed by the Party Time Buyer Guarantee — your money back if a genuine ticket fails. Spot and avoid ticket scams.',
    path: '/safe-tickets',
    jsonldBlocks: [faqLd(faqs), crumbLd('Ticket safety', `${SITE}/safe-tickets`)],
    main,
  });
}

async function tonightPage() {
  const nowIso = new Date().toISOString();
  const weekIso = new Date(Date.now() + 8 * 864e5).toISOString();
  const rows = await sb(
    `events?status=eq.published&visibility=eq.public&starts_at=gte.${nowIso}&starts_at=lte.${weekIso}` +
      `&select=slug,title,starts_at,venue_name&order=starts_at.asc&limit=40`,
  );
  const fmt = (iso) => {
    try {
      return new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'TBA';
    }
  };
  const list = rows.length
    ? rows
        .map(
          (e) =>
            `<a class="evrow" href="${SITE}/e/${esc(e.slug)}" style="text-decoration:none;color:inherit">` +
            `<span class="d">${esc(fmt(e.starts_at))}</span>` +
            `<span><span class="t" style="color:var(--text)">${esc(e.title)}</span>` +
            (e.venue_name ? `<br><span class="v">${esc(e.venue_name)}</span>` : '') +
            `</span></a>`,
        )
        .join('')
    : `<p class="v">No public events in the next few days yet — new ones are added all the time. <a href="${SITE}/">Check the live feed →</a></p>`;

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Things to do in Kampala this week',
    itemListElement: rows.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE}/e/${e.slug}`,
      name: e.title,
    })),
  };

  const main = `
  <div class="eyebrow">Live · Updated hourly</div>
  <h1>Things to do in Kampala tonight &amp; this week</h1>
  <p class="answer">Here\u2019s what\u2019s on in Kampala over the next few days — parties, nightlife and events you can RSVP to or get tickets for right now on Party Time. This list updates automatically as organizers publish new events.</p>
  <div class="card" style="padding:8px 24px">
    ${list}
  </div>
  <p><a href="${SITE}/">See the full live events feed →</a> · <a href="${SITE}/venues">Where to eat &amp; drink →</a></p>
  <div class="updated">Updated ${TODAY()}</div>`;
  return layout({
    title: 'Things to do in Kampala tonight & this week | Party Time',
    desc: 'A live list of events, parties and nightlife in Kampala tonight and this week — RSVP or get tickets on Party Time. Updated automatically.',
    path: '/tonight',
    jsonldBlocks: [itemList, crumbLd('Tonight in Kampala', `${SITE}/tonight`)],
    main,
  });
}

function deleteAccountPage() {
  const faqs = [
    { q: 'How do I delete my Party Time account?', a: 'Open the Party Time app, go to the Profile tab, scroll to the bottom and tap "Delete account", then confirm. Your account and personal data are deleted immediately and you are signed out. You can also request deletion by emailing support@partytime.africa from your account email.' },
    { q: 'What data is deleted?', a: 'Your profile (name, username, photo, phone, city), your posts, replies and reactions, your direct messages, your RSVPs, comments and uploaded photos, your reservations, notifications and analytics. Your login is removed so it can never be used again.' },
    { q: 'What data is kept, and why?', a: 'Purchase and payment records (orders, tickets and payouts) are retained for legal, tax and accounting reasons, but they are stripped of your name and phone number so they no longer identify you. Events you hosted stay published so other guests keep their tickets, with the host shown as "Deleted user".' },
    { q: 'How long does it take?', a: 'Deletion happens immediately when you confirm in the app. Retained purchase records are kept only as long as the law requires, then removed.' },
  ];
  const main = `
  <div class="eyebrow">Account</div>
  <h1>Delete your Party Time account</h1>
  <p class="answer">You can permanently delete your Party Time account and personal data at any time, directly in the app. This page explains how, and exactly what is deleted and what is kept.</p>

  <h2>Delete in the app</h2>
  <ol class="steps">
    <li><strong>Open Party Time</strong> and go to the <strong>Profile</strong> tab.</li>
    <li><strong>Scroll to the bottom</strong> and tap <strong>Delete account</strong>.</li>
    <li><strong>Confirm.</strong> Your account and personal data are deleted right away and you&rsquo;re signed out.</li>
  </ol>

  <div class="card">
    <h3 style="margin-top:0">No longer have the app?</h3>
    <p style="margin:6px 0 0">Email <a href="mailto:support@partytime.africa">support@partytime.africa</a> from the email address on your account and we&rsquo;ll delete it for you.</p>
  </div>

  <h2>What&rsquo;s deleted</h2>
  <ul>
    <li>Your profile — name, username, photo, phone number and city.</li>
    <li>Your posts, replies, reactions and direct messages.</li>
    <li>Your RSVPs, comments, uploaded photos and reservations.</li>
    <li>Your notifications and usage analytics.</li>
    <li>Your login — removed permanently.</li>
  </ul>

  <h2>What&rsquo;s kept, and why</h2>
  <ul>
    <li><strong>Purchase &amp; payment records</strong> (orders, tickets, payouts) are retained for legal, tax and accounting reasons — but with your name and phone number removed so they no longer identify you.</li>
    <li><strong>Events you hosted</strong> stay published so other guests keep their tickets; you&rsquo;ll appear as &ldquo;Deleted user&rdquo;.</li>
  </ul>

  <h2>Frequently asked questions</h2>
  <div class="faq">
    ${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
  </div>
  <div class="updated">Last updated ${TODAY()}</div>`;
  return layout({
    title: 'Delete your Party Time account | Party Time',
    desc: 'How to permanently delete your Party Time account and personal data from the app, what is deleted, and what purchase records are kept for legal reasons.',
    path: '/delete-account',
    jsonldBlocks: [faqLd(faqs), crumbLd('Delete account', `${SITE}/delete-account`)],
    main,
  });
}

module.exports = async (req, res) => {
  const p = req.query && req.query.p ? String(req.query.p) : '';
  let html;
  let maxAge = 'public, max-age=600, s-maxage=3600';
  if (p === 'promote') html = promotePage();
  else if (p === 'safe-tickets') html = safeTicketsPage();
  else if (p === 'delete-account') html = deleteAccountPage();
  else if (p === 'tonight') {
    html = await tonightPage();
    maxAge = 'public, max-age=300, s-maxage=900';
  } else {
    res.statusCode = 302;
    res.setHeader('Location', SITE);
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', maxAge);
  res.status(200).send(html);
};
