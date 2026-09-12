import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = process.env.HM_CAPTURE_OUTPUT ?? '/tmp/meadow-wake-terrain';
const base = process.env.HM_CAPTURE_URL ?? 'http://127.0.0.1:4173';
await mkdir(output, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});

const views = [
  { name: 'terrain-opening', x: 8.4 },
  { name: 'terrain-quarry', x: 35.2 },
  { name: 'terrain-creek', x: 59.2 },
  { name: 'terrain-finale', x: 118.2 }
];
const report = { status: 'running', scope: 'terrain-only visual review', views: [] };

try {
  for (const view of views) {
    const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    const failures = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) failures.push(`${response.status()} ${response.url()}`);
    });

    await page.goto(`${base}/?artPreview=${view.x}&qaRoute=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => {
      const text = document.querySelector('#status')?.textContent ?? '';
      return text.includes('3D characters + layered Meadow Wake environment ready') || /ERROR|fallback active/.test(text);
    }, null, { timeout: 60000 });
    await page.waitForTimeout(900);
    const status = await page.locator('#status').textContent();
    const ready = status?.includes('3D characters + layered Meadow Wake environment ready') ?? false;
    const canvas = page.locator('#game');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Game canvas has no bounding box');

    await canvas.screenshot({ path: `${output}/${view.name}-full.png`, timeout: 60000 });
    const cropHeight = Math.floor(box.height * 0.63);
    const cropY = box.y + box.height - cropHeight;
    await page.screenshot({
      path: `${output}/${view.name}-snippet.png`,
      clip: { x: box.x, y: cropY, width: box.width, height: cropHeight },
      timeout: 60000
    });

    const metrics = await page.evaluate(() => ({
      status: document.querySelector('#status')?.textContent,
      terrainMetrics: window.__HM_TERRAIN_METRICS__ ?? null,
      route: window.__HM_ROUTE_QA__ ?? null
    }));
    report.views.push({ ...view, ready, errors, failures, ...metrics });
    await context.close();
  }
  report.status = report.views.length === views.length && report.views.every(view => view.ready && !view.errors.length && !view.failures.length)
    ? 'pass-runtime-and-terrain-captures'
    : 'fail';
} finally {
  await browser.close();
  await writeFile(`${output}/terrain-browser-report.json`, JSON.stringify(report, null, 2));
}

if (report.status !== 'pass-runtime-and-terrain-captures') process.exitCode = 1;
