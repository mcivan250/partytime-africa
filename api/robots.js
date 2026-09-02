// robots.txt — welcomes search + AI crawlers and points them at the sitemap
// and the llms.txt summary.
const SITE = 'https://partytime.africa';

module.exports = (_req, res) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${SITE}/sitemap.xml`,
    `# AI summary: ${SITE}/llms.txt`,
    '',
  ].join('\n');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).send(body);
};
