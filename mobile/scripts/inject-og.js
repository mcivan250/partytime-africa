// Injects branded link-preview (Open Graph / Twitter) meta into the exported
// web index.html. `web.output: "single"` uses Expo's default HTML template and
// ignores app/+html.tsx, so we post-process the built file instead. Runs after
// `expo export` in the Vercel build command. Idempotent.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'dist', 'index.html');
if (!fs.existsSync(file)) {
  console.error('inject-og: dist/index.html not found (did expo export run?)');
  process.exit(0);
}

const TITLE = 'Party Time — Uganda’s nightlife, ticketed';
const DESC =
  'Discover the hottest events in Kampala. Tickets, tables and merch — pay with mobile money, share with your people.';
// Branded 1200×630 card shipped from mobile/public/og-image.png.
const IMG = 'https://partytime.africa/og-image.png';

let html = fs.readFileSync(file, 'utf8');

if (html.includes('property="og:title"')) {
  console.log('inject-og: meta already present, skipping');
  process.exit(0);
}

const esc = (s) => s.replace(/"/g, '&quot;');
const tags = `
    <meta name="description" content="${esc(DESC)}" />
    <meta name="theme-color" content="#111811" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Party Time" />
    <meta property="og:title" content="${esc(TITLE)}" />
    <meta property="og:description" content="${esc(DESC)}" />
    <meta property="og:image" content="${IMG}" />
    <meta property="og:url" content="https://partytime.africa" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(TITLE)}" />
    <meta name="twitter:description" content="${esc(DESC)}" />
    <meta name="twitter:image" content="${IMG}" />
`;

html = html.replace('</head>', `${tags}  </head>`);
html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(TITLE)}</title>`);
fs.writeFileSync(file, html);
console.log('inject-og: injected link-preview meta into index.html');
