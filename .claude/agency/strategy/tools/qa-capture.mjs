// qa-capture.mjs: usage: node qa-capture.mjs <url> <outdir>
// Captures full-page screenshots per device (light + dark), console errors,
// failed requests, and load timing into <outdir>/test-results.json.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // project or global install
import { mkdir, writeFile } from 'node:fs/promises';

const [url, outDir = 'qa-screenshots'] = process.argv.slice(2);
if (!url) { console.error('usage: node qa-capture.mjs <url> <outdir>'); process.exit(2); }
await mkdir(outDir, { recursive: true });

const devices = [
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
  { name: 'tablet',  viewport: { width: 768,  height: 1024 }, isMobile: true, hasTouch: true },
  { name: 'mobile',  viewport: { width: 375,  height: 667 },  isMobile: true, hasTouch: true },
];

const browser = await chromium.launch();
const results = { url, capturedAt: new Date().toISOString(), runs: [] };

for (const device of devices) {
  for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({ ...device, colorScheme });
    const page = await context.newPage();
    const run = { device: device.name, colorScheme, status: 'TESTED', consoleErrors: [], failedRequests: [] };
    page.on('console', (m) => { if (m.type() === 'error') run.consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => run.consoleErrors.push(String(e)));
    page.on('requestfailed', (r) => run.failedRequests.push(`${r.method()} ${r.url()}: ${r.failure()?.errorText}`));
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      run.httpStatus = response?.status();
      run.timing = await page.evaluate(() => {
        const [nav] = performance.getEntriesByType('navigation');
        return nav ? { domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd), loadMs: Math.round(nav.loadEventEnd) } : null;
      });
      run.screenshot = `${outDir}/${device.name}-${colorScheme}.png`;
      await page.screenshot({ path: run.screenshot, fullPage: true });
      if (run.httpStatus >= 400 || run.consoleErrors.length || run.failedRequests.length) run.status = 'ERROR';
    } catch (e) {
      run.status = 'ERROR';
      run.error = String(e);
    }
    results.runs.push(run);
    await context.close();
  }
}

await browser.close();
await writeFile(`${outDir}/test-results.json`, JSON.stringify(results, null, 2));
const errors = results.runs.filter((r) => r.status === 'ERROR').length;
console.log(`${results.runs.length} captures, ${errors} with errors → ${outDir}/test-results.json`);
process.exit(errors ? 1 : 0);
