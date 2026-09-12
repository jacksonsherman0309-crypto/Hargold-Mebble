import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = process.env.HM_CAPTURE_OUTPUT ?? '/tmp/meadow-wake-visual';
const base = process.env.HM_CAPTURE_URL ?? 'http://127.0.0.1:4173';
await mkdir(output, { recursive: true });

const views = [
  { name: '01-opening', x: 4.5, viewport: { width: 1536, height: 864 }, touch: false },
  { name: '02-log-lesson', x: 18.8, viewport: { width: 1536, height: 864 }, touch: false },
  { name: '08-mobile-opening', x: 4.5, viewport: { width: 844, height: 390 }, touch: true }
];

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
const report = { status: 'running', views: [] };

try {
  for (const view of views) {
    const context = await browser.newContext({ viewport: view.viewport, hasTouch: view.touch, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const pageErrors = [];
    const failedResponses = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    });
    await page.goto(`${base}/?artPreview=${view.x}&qaRoute=1`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => {
      const status = document.querySelector('#status')?.textContent ?? '';
      return status.includes('3D characters + layered Meadow Wake environment ready') || /ERROR|fallback active/.test(status);
    }, null, { timeout: 45000 });
    await page.waitForTimeout(900);
    const status = await page.locator('#status').textContent();
    const ready = status.includes('3D characters + layered Meadow Wake environment ready');
    await page.screenshot({ path: `${output}/${view.name}.png`, timeout: 30000 });
    report.views.push({ name: view.name, x: view.x, ready, status, pageErrors, failedResponses, viewport: view.viewport });
    await context.close();
    if (!ready || pageErrors.length || failedResponses.length) break;
  }
} finally {
  await browser.close();
}

report.status = report.views.length === views.length && report.views.every(view => view.ready && !view.pageErrors.length && !view.failedResponses.length)
  ? 'pass-runtime-load-and-opening-captures'
  : 'fail';
await writeFile(`${output}/browser-report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass-runtime-load-and-opening-captures') process.exitCode = 1;
