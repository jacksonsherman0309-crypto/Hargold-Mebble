import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const URL = process.env.HM_AUDIT_URL ??
  'http://127.0.0.1:4173/?fullyUnlocked=1&animationValidation=1&debugAnimation=1&station=acceleration-skid-lane';
const OUT = path.resolve('animation-reel-audit-output');
const EXPECTED = Object.freeze({ Hargold: 41, Mebble: 43 });
const HEROES = Object.freeze(['Hargold', 'Mebble']);

async function setRange(locator, value) {
  await locator.evaluate((element, nextValue) => {
    element.value = String(nextValue);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function setChecked(locator, checked) {
  if ((await locator.isChecked()) === checked) return;
  if (checked) await locator.check();
  else await locator.uncheck();
}

function controls(page) {
  const panel = page.locator('.animation-debug-panel');
  return {
    panel,
    hero: panel.locator('select').nth(0),
    clip: panel.locator('select').nth(1),
    facing: panel.locator('select').nth(2),
    pause: panel.locator('input[type="checkbox"]').nth(0),
    loop: panel.locator('input[type="checkbox"]').nth(1),
    speed: panel.locator('input[type="range"]').nth(0),
    scrub: panel.locator('input[type="range"]').nth(1),
    restart: panel.getByRole('button', { name: 'Restart clip' }),
    telemetry: panel.locator('pre.animation-debug-telemetry')
  };
}

await mkdir(OUT, { recursive: true });
const diagnostics = { console: [], pageErrors: [], requestFailures: [] };
const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-angle=swiftshader',
    '--use-gl=angle',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--disable-dev-shm-usage'
  ]
});
const videoDirectory = path.join(OUT, 'video');
await mkdir(videoDirectory, { recursive: true });
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 1,
  recordVideo: { dir: videoDirectory, size: { width: 1600, height: 900 } }
});
const pageCreationWallMs = Date.now();
const page = await context.newPage();
const video = page.video();
page.on('console', message => {
  if (['error', 'warning'].includes(message.type())) {
    diagnostics.console.push({ type: message.type(), text: message.text() });
  }
});
page.on('pageerror', error => diagnostics.pageErrors.push(String(error?.stack || error)));
page.on('requestfailed', request => diagnostics.requestFailures.push({
  url: request.url(),
  failure: request.failure()?.errorText ?? 'unknown request failure'
}));

try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForSelector('.animation-debug-panel', { timeout: 120_000 });
  await page.waitForSelector('canvas.character-layer', { timeout: 120_000 });
  await page.waitForFunction(() => {
    const status = document.querySelector('#status')?.textContent ?? '';
    return status.includes('PLAYING') && !status.includes('ERROR');
  }, null, { timeout: 120_000 });
  await page.waitForTimeout(4_000);

  const catalog = await page.evaluate(async () => {
    const module = await import('/src/animation/character-animation-config.js?v=reel-audit-1');
    return Object.fromEntries(['Hargold', 'Mebble'].map(hero => [
      hero,
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

  const ui = controls(page);
  await setRange(ui.speed, 1);
  await page.evaluate(() => {
    const label = document.createElement('div');
    label.id = 'complete-animation-reel-label';
    Object.assign(label.style, {
      position: 'fixed',
      left: '16px',
      top: '16px',
      zIndex: '999999',
      maxWidth: '940px',
      padding: '12px 16px',
      borderRadius: '10px',
      background: 'rgba(0,0,0,.88)',
      border: '2px solid rgba(255,255,255,.45)',
      color: '#fff',
      font: '700 18px ui-monospace, SFMono-Regular, Menlo, monospace',
      lineHeight: '1.35',
      whiteSpace: 'pre-wrap',
      pointerEvents: 'none'
    });
    document.body.append(label);
  });

  const timeline = [];
  let ordinal = 0;
  for (const hero of HEROES) {
    await ui.hero.selectOption(hero);
    await page.waitForTimeout(350);
    const selectorIds = await ui.clip.locator('option').evaluateAll(options =>
      options.map(option => option.value)
    );
    const catalogIds = catalog[hero].map(clip => clip.id);
    if (selectorIds.length !== EXPECTED[hero]) {
      throw new Error(`${hero} exposes ${selectorIds.length} clips; expected ${EXPECTED[hero]}`);
    }
    if (JSON.stringify(selectorIds) !== JSON.stringify(catalogIds)) {
      throw new Error(`${hero} selector order differs from catalog metadata`);
    }

    for (const clip of catalog[hero]) {
      ordinal += 1;
      await page.locator('#complete-animation-reel-label').evaluate((element, data) => {
        element.textContent = [
          `${String(data.ordinal).padStart(2, '0')} / 84 · ${data.hero} · ${data.id}`,
          data.label,
          `${data.duration.toFixed(3)} seconds · ${data.loop ? 'loop' : 'one-shot'} · ${data.source}`
        ].join('\n');
      }, {
        ordinal,
        hero,
        id: clip.id,
        label: clip.label,
        duration: clip.durationSeconds,
        loop: clip.loop,
        source: clip.source
      });
      await ui.clip.selectOption(clip.id);
      await ui.facing.selectOption('1');
      await setChecked(ui.loop, clip.loop);
      await setChecked(ui.pause, false);
      await ui.restart.click();
      const startWallMs = Date.now();
      const startTelemetry = await ui.telemetry.textContent();
      const playSeconds = Math.max(0.55, Math.min(3.4, clip.durationSeconds));
      await page.waitForTimeout(Math.round(playSeconds * 1000));
      const endTelemetry = await ui.telemetry.textContent();
      const endWallMs = Date.now();
      await setChecked(ui.pause, true);
      timeline.push({
        ordinal,
        hero,
        ...clip,
        playSeconds,
        startMillisecondsFromPageCreation: startWallMs - pageCreationWallMs,
        endMillisecondsFromPageCreation: endWallMs - pageCreationWallMs,
        startTelemetry,
        endTelemetry
      });
      console.log(`played ${ordinal}/84 ${hero} ${clip.id}`);
      await page.waitForTimeout(90);
    }
  }

  await page.locator('#complete-animation-reel-label').evaluate(element => {
    element.textContent = 'COMPLETE · ALL 84 LISTED HARGOLD & MEBBLE ANIMATIONS PLAYED';
  });
  await page.waitForTimeout(1_000);

  const report = {
    schemaVersion: 1,
    url: URL,
    runtimeStatus: await page.locator('#status').textContent(),
    expected: EXPECTED,
    played: timeline.length,
    pageCreationWallMs,
    completedWallMs: Date.now(),
    diagnostics,
    catalog,
    timeline
  };
  await writeFile(path.join(OUT, 'animation-reel-timeline.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(OUT, 'README.md'), [
    '# Complete Hargold & Mebble Animation Reel',
    '',
    `Animations played: ${timeline.length}/84`,
    `Runtime: ${report.runtimeStatus}`,
    `Page errors: ${diagnostics.pageErrors.length}`,
    `Request failures: ${diagnostics.requestFailures.length}`,
    '',
    'The video plays every selector-listed animation at 1.0× speed on the actual locked models. The timeline JSON records the exact order, metadata, approximate video intervals, and debug telemetry. This is evidence for artistic review, not automatic approval.'
  ].join('\n'));
  if (timeline.length !== 84) throw new Error(`played ${timeline.length}/84 animations`);
  if (diagnostics.pageErrors.length || diagnostics.requestFailures.length) {
    throw new Error('browser runtime errors occurred during complete animation reel');
  }
} finally {
  await page.close();
  const destination = path.join(videoDirectory, 'all-84-listed-animations.webm');
  await video.saveAs(destination);
  await context.close();
  await browser.close();
}
