import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = process.env.HM_CAPTURE_OUTPUT ?? '/tmp/meadow-wake-evidence';
const base = process.env.HM_CAPTURE_URL ?? 'http://127.0.0.1:4173';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
const views = [
  { name: '01-opening', x: 4.5 }, { name: '02-log-lesson', x: 20.5 },
  { name: '03-quarry-route', x: 35.8 }, { name: '04-creek-clue', x: 57.1 },
  { name: '05-bridge-checkpoint', x: 70.5 }, { name: '06-root-ruins', x: 93.3 },
  { name: '07-three-gap-finale', x: 118 },
  { name: '08-mobile-opening', x: 4.5, mobile: true },
  { name: '09-mobile-finale', x: 118, mobile: true }
];
const report = { status: 'running', rendering: 'Chromium software WebGL; not target-device certification', views: [] };
try {
  for (const view of views) {
    const viewport = view.mobile ? { width: 844, height: 390 } : { width: 1536, height: 864 };
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: Boolean(view.mobile) });
    const page = await context.newPage();
    const errors = [], failures = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) failures.push(`${response.status()} ${response.url()}`); });
    let ready = false;
    try {
      await page.goto(`${base}/?artPreview=${view.x}&qaRoute=1`, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForFunction(() => document.querySelector('#status')?.textContent.includes('3D characters + layered Meadow Wake environment ready'), null, { timeout: 90000 });
      await page.waitForTimeout(1200);
      ready = true;
    } catch (error) { errors.push(error.message); }
    const evidence = await page.evaluate(() => ({
      status: document.querySelector('#status')?.textContent,
      route: window.__HM_ROUTE_QA__ ?? null,
      terrainMetrics: window.__HM_TERRAIN_METRICS__ ?? null,
      touchControls: document.querySelectorAll('.controls button').length,
      documentOverflow: getComputedStyle(document.body).overflow,
      viewport: { width: innerWidth, height: innerHeight }
    })).catch(error => ({ error: error.message }));
    await page.screenshot({ path: `${output}/${view.name}.png`, fullPage: false, timeout: 90000 });
    report.views.push({ ...view, ready, errors, failures, ...evidence });
    await writeFile(`${output}/browser-report.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ view: view.name, ready, errors, failures, status: evidence.status }));
    await context.close();
  }
  report.status = report.views.every(view => view.ready && !view.errors.length && !view.failures.length) ? 'pass-runtime-load-and-captures' : 'fail';
} finally {
  await browser.close();
  await writeFile(`${output}/browser-report.json`, JSON.stringify(report, null, 2));
}
if (report.status !== 'pass-runtime-load-and-captures') process.exitCode = 1;
