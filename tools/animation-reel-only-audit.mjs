import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const URL = 'http://127.0.0.1:4173/?fullyUnlocked=1&animationValidation=1&debugAnimation=1&station=acceleration-skid-lane';
const OUT = path.resolve('animation-reel-only-output');
const HEROES = ['Hargold', 'Mebble'];
const EXPECTED = { Hargold: 41, Mebble: 43 };

async function setChecked(locator, checked) {
  if ((await locator.isChecked()) === checked) return;
  if (checked) await locator.check();
  else await locator.uncheck();
}

async function setRange(locator, value) {
  await locator.evaluate((element, next) => {
    element.value = String(next);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

await mkdir(path.join(OUT, 'video'), { recursive: true });
const diagnostics = { console: [], pageErrors: [], requestFailures: [] };
const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-dev-shm-usage']
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: path.join(OUT, 'video'), size: { width: 1440, height: 900 } }
});
const createdAt = Date.now();
const page = await context.newPage();
const video = page.video();
page.on('console', message => {
  if (['error', 'warning'].includes(message.type())) diagnostics.console.push(`${message.type()}: ${message.text()}`);
});
page.on('pageerror', error => diagnostics.pageErrors.push(String(error?.stack || error)));
page.on('requestfailed', request => diagnostics.requestFailures.push(`${request.failure()?.errorText ?? 'failed'}: ${request.url()}`));

let report;
try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForSelector('.animation-debug-panel', { timeout: 120_000 });
  await page.waitForSelector('canvas.character-layer', { timeout: 120_000 });
  await page.waitForFunction(() => {
    const text = document.querySelector('#status')?.textContent ?? '';
    return text.includes('PLAYING') && !text.includes('ERROR');
  }, null, { timeout: 120_000 });
  await page.waitForTimeout(4_000);

  const catalog = await page.evaluate(async () => {
    const module = await import('/src/animation/character-animation-config.js?v=reel-only-audit-1');
    return Object.fromEntries(['Hargold', 'Mebble'].map(hero => [hero,
      module.IMPORTED_CHARACTER_ANIMATIONS[hero].clips.map(clip => ({
        id: clip.id,
        label: clip.label,
        durationSeconds: clip.durationSeconds,
        loop: clip.loop,
        source: clip.source,
        footLock: clip.footLock,
        footLockAxes: [...(clip.footLockAxes ?? [])],
        markers: [...(clip.markers ?? [])]
      }))
    ]));
  });

  const panel = page.locator('.animation-debug-panel');
  const heroSelect = panel.locator('select').nth(0);
  const clipSelect = panel.locator('select').nth(1);
  const facingSelect = panel.locator('select').nth(2);
  const pause = panel.locator('input[type="checkbox"]').nth(0);
  const loop = panel.locator('input[type="checkbox"]').nth(1);
  const speed = panel.locator('input[type="range"]').nth(0);
  const restart = panel.getByRole('button', { name: 'Restart clip' });
  const telemetry = panel.locator('pre.animation-debug-telemetry');
  await setRange(speed, 1);

  await page.evaluate(() => {
    const label = document.createElement('div');
    label.id = 'reel-only-label';
    Object.assign(label.style, {
      position: 'fixed', left: '16px', top: '16px', zIndex: '999999',
      maxWidth: '900px', padding: '12px 16px', borderRadius: '10px',
      background: 'rgba(0,0,0,.9)', border: '2px solid rgba(255,255,255,.5)',
      color: 'white', font: '700 18px ui-monospace, monospace', lineHeight: '1.35',
      whiteSpace: 'pre-wrap', pointerEvents: 'none'
    });
    document.body.append(label);
  });

  const timeline = [];
  let ordinal = 0;
  for (const hero of HEROES) {
    await heroSelect.selectOption(hero);
    await page.waitForTimeout(300);
    const ids = await clipSelect.locator('option').evaluateAll(options => options.map(option => option.value));
    if (ids.length !== EXPECTED[hero]) throw new Error(`${hero}: ${ids.length}/${EXPECTED[hero]} clips`);
    if (JSON.stringify(ids) !== JSON.stringify(catalog[hero].map(clip => clip.id))) {
      throw new Error(`${hero}: selector order differs from catalog`);
    }
    for (const clip of catalog[hero]) {
      ordinal += 1;
      await page.locator('#reel-only-label').evaluate((element, data) => {
        element.textContent = `${data.ordinal}/84 · ${data.hero} · ${data.id}\n${data.label}\n${data.durationSeconds.toFixed(3)} s · ${data.loop ? 'loop' : 'one-shot'} · ${data.source}`;
      }, { ordinal, hero, ...clip });
      await clipSelect.selectOption(clip.id);
      await facingSelect.selectOption('1');
      await setChecked(loop, clip.loop);
      await setChecked(pause, false);
      await restart.click();
      const start = Date.now();
      const startTelemetry = await telemetry.textContent();
      const playSeconds = Math.max(0.55, Math.min(3.4, clip.durationSeconds));
      await page.waitForTimeout(Math.round(playSeconds * 1000));
      const end = Date.now();
      const endTelemetry = await telemetry.textContent();
      await setChecked(pause, true);
      timeline.push({
        ordinal, hero, ...clip, playSeconds,
        startMillisecondsFromPageCreation: start - createdAt,
        endMillisecondsFromPageCreation: end - createdAt,
        startTelemetry, endTelemetry
      });
      console.log(`PLAYED ${ordinal}/84 ${hero} ${clip.id}`);
      await page.waitForTimeout(70);
    }
  }

  await page.locator('#reel-only-label').evaluate(element => {
    element.textContent = 'COMPLETE · ALL 84 LISTED ANIMATIONS PLAYED';
  });
  await page.waitForTimeout(900);
  report = {
    schemaVersion: 1,
    runtimeStatus: await page.locator('#status').textContent(),
    expected: EXPECTED,
    played: timeline.length,
    createdAt,
    completedAt: Date.now(),
    diagnostics,
    catalog,
    timeline
  };
  await writeFile(path.join(OUT, 'timeline.json'), `${JSON.stringify(report, null, 2)}\n`);
  if (timeline.length !== 84) throw new Error(`played ${timeline.length}/84 clips`);
  if (diagnostics.pageErrors.length || diagnostics.requestFailures.length) {
    throw new Error('browser errors occurred during reel');
  }
} finally {
  await context.close();
  await video.saveAs(path.join(OUT, 'video', 'all-84-listed-animations.webm'));
  await browser.close();
}

await writeFile(path.join(OUT, 'README.md'), [
  '# Complete 84-animation reel evidence',
  '',
  `Played: ${report?.played ?? 0}/84`,
  `Runtime: ${report?.runtimeStatus ?? 'not reached'}`,
  `Page errors: ${diagnostics.pageErrors.length}`,
  `Request failures: ${diagnostics.requestFailures.length}`,
  '',
  'Every selector-listed Hargold and Mebble animation is played at 1.0× speed on the actual locked models. Timeline metadata is included for frame extraction and individual review.'
].join('\n'));
