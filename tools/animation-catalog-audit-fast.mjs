import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const URL = process.env.HM_AUDIT_URL ??
  'http://127.0.0.1:4173/?fullyUnlocked=1&animationValidation=1&debugAnimation=1&station=acceleration-skid-lane';
const OUT = path.resolve('animation-audit-fast-output');
const HEROES = ['Hargold', 'Mebble'];
const EXPECTED = { Hargold: 41, Mebble: 43 };
const RIGHT_PHASES = [0, 0.333, 0.667, 0.995];
const LEFT_PHASES = [0.5];

const clean = value => String(value).replace(/[^a-z0-9_.-]+/gi, '-');
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function twoFrames(page) {
  await page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

function panel(page) {
  const root = page.locator('.animation-debug-panel');
  return {
    root,
    hero: root.locator('select').nth(0),
    clip: root.locator('select').nth(1),
    facing: root.locator('select').nth(2),
    pause: root.locator('input[type="checkbox"]').nth(0),
    loop: root.locator('input[type="checkbox"]').nth(1),
    speed: root.locator('input[type="range"]').nth(0),
    scrub: root.locator('input[type="range"]').nth(1),
    restart: root.getByRole('button', { name: 'Restart clip' }),
    telemetry: root.locator('pre')
  };
}

async function setRange(locator, value) {
  await locator.evaluate((element, next) => {
    element.value = String(next);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function setChecked(locator, checked) {
  if ((await locator.isChecked()) === checked) return;
  if (checked) await locator.check();
  else await locator.uncheck();
}

async function openPage(context, diagnostics) {
  const page = await context.newPage();
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) {
      diagnostics.console.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', error => diagnostics.pageErrors.push(String(error?.stack || error)));
  page.on('requestfailed', request => diagnostics.requestFailures.push(
    `${request.failure()?.errorText ?? 'failed'}: ${request.url()}`
  ));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForSelector('.animation-debug-panel', { timeout: 120_000 });
  await page.waitForSelector('canvas.character-layer', { timeout: 120_000 });
  await page.waitForFunction(() => {
    const status = document.querySelector('#status')?.textContent ?? '';
    return status.includes('PLAYING') && !status.includes('ERROR');
  }, null, { timeout: 120_000 });
  await page.waitForTimeout(4_000);
  return page;
}

async function catalog(page) {
  return page.evaluate(async () => {
    const module = await import('/src/animation/character-animation-config.js?v=fast-catalog-audit-1');
    return Object.fromEntries(['Hargold', 'Mebble'].map(hero => [
      hero,
      module.IMPORTED_CHARACTER_ANIMATIONS[hero].clips.map(clip => ({
        id: clip.id,
        label: clip.label,
        durationSeconds: clip.durationSeconds,
        loop: clip.loop,
        source: clip.source,
        footLock: clip.footLock,
        footLockAxes: [...(clip.footLockAxes ?? [])]
      }))
    ]));
  });
}

async function captureFrame(page, layerBox, target) {
  await twoFrames(page);
  await page.screenshot({
    path: target,
    type: 'jpeg',
    quality: 78,
    clip: {
      x: layerBox.x + layerBox.width * 0.08,
      y: layerBox.y + layerBox.height * 0.02,
      width: layerBox.width * 0.58,
      height: layerBox.height * 0.96
    }
  });
}

async function captureStills(browser, report) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 980 } });
  const page = await openPage(context, report.diagnostics);
  const ui = panel(page);
  report.catalog = await catalog(page);
  await setChecked(ui.pause, true);
  await setRange(ui.speed, 1);
  const layerBox = await page.locator('canvas.character-layer').boundingBox();
  if (!layerBox) throw new Error('3D character layer has no capture bounds');

  for (const hero of HEROES) {
    await ui.hero.selectOption(hero);
    await page.waitForTimeout(450);
    const listed = await ui.clip.locator('option').evaluateAll(options =>
      options.map(option => option.value)
    );
    if (listed.length !== EXPECTED[hero]) {
      throw new Error(`${hero} listed ${listed.length}; expected ${EXPECTED[hero]}`);
    }
    if (JSON.stringify(listed) !== JSON.stringify(report.catalog[hero].map(clip => clip.id))) {
      throw new Error(`${hero} selector and catalog metadata differ`);
    }

    for (const clip of report.catalog[hero]) {
      const directory = path.join(OUT, 'stills', hero, clean(clip.id));
      await mkdir(directory, { recursive: true });
      await ui.clip.selectOption(clip.id);
      await setChecked(ui.pause, true);
      await setChecked(ui.loop, clip.loop);
      await ui.facing.selectOption('1');
      await ui.restart.click();
      await page.waitForTimeout(70);
      const samples = [];
      for (const phase of RIGHT_PHASES) {
        await setRange(ui.scrub, phase);
        await page.waitForTimeout(35);
        const file = path.join(directory, `right-${String(phase).replace('.', '_')}.jpg`);
        await captureFrame(page, layerBox, file);
        samples.push({ facing: 'right', phase, file: path.relative(OUT, file), telemetry: await ui.telemetry.textContent() });
      }
      await ui.facing.selectOption('-1');
      for (const phase of LEFT_PHASES) {
        await setRange(ui.scrub, phase);
        await page.waitForTimeout(35);
        const file = path.join(directory, `left-${String(phase).replace('.', '_')}.jpg`);
        await captureFrame(page, layerBox, file);
        samples.push({ facing: 'left', phase, file: path.relative(OUT, file), telemetry: await ui.telemetry.textContent() });
      }
      report.clips.push({ hero, ...clip, samples });
      console.log(`stills ${report.clips.length}/84: ${hero} ${clip.id}`);
    }
  }
  report.status = await page.locator('#status').textContent();
  await context.close();
}

async function captureReel(browser, report) {
  const videoDir = path.join(OUT, 'video');
  await mkdir(videoDir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } }
  });
  const page = await openPage(context, report.diagnostics);
  const video = page.video();
  const ui = panel(page);
  await page.evaluate(() => {
    const label = document.createElement('div');
    label.id = 'audit-reel-label';
    Object.assign(label.style, {
      position: 'fixed', left: '16px', top: '16px', zIndex: '99999',
      padding: '10px 14px', borderRadius: '9px', background: 'rgba(0,0,0,.86)',
      color: '#fff', font: '700 17px ui-monospace, monospace', whiteSpace: 'pre-wrap',
      pointerEvents: 'none'
    });
    document.body.append(label);
  });
  await setRange(ui.speed, 1);
  for (const hero of HEROES) {
    await ui.hero.selectOption(hero);
    await page.waitForTimeout(350);
    for (const clip of report.catalog[hero]) {
      await page.locator('#audit-reel-label').evaluate((element, data) => {
        element.textContent = `${data.hero} · ${data.id}\n${data.label}\n${data.duration.toFixed(3)} s · ${data.source}`;
      }, { hero, id: clip.id, label: clip.label, duration: clip.durationSeconds, source: clip.source });
      await ui.clip.selectOption(clip.id);
      await ui.facing.selectOption('1');
      await setChecked(ui.loop, clip.loop);
      await setChecked(ui.pause, false);
      await ui.restart.click();
      await page.waitForTimeout(Math.round(Math.max(0.55, Math.min(3.4, clip.durationSeconds)) * 1000 + 100));
      await setChecked(ui.pause, true);
      await delay(60);
    }
  }
  await page.locator('#audit-reel-label').evaluate(element => {
    element.textContent = 'COMPLETE: 41 HARGOLD + 43 MEBBLE LISTED ANIMATIONS';
  });
  await page.waitForTimeout(700);
  await context.close();
  const destination = path.join(videoDir, 'all-84-listed-animations.webm');
  await video.saveAs(destination);
  report.reel = path.relative(OUT, destination);
}

await mkdir(OUT, { recursive: true });
const report = {
  schemaVersion: 1,
  startedAt: new Date().toISOString(),
  expected: EXPECTED,
  diagnostics: { console: [], pageErrors: [], requestFailures: [] },
  catalog: {},
  clips: []
};
const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-dev-shm-usage']
});
try {
  await captureStills(browser, report);
  await captureReel(browser, report);
  report.completedAt = new Date().toISOString();
  report.summary = {
    clips: report.clips.length,
    frames: report.clips.reduce((sum, clip) => sum + clip.samples.length, 0),
    pageErrors: report.diagnostics.pageErrors.length,
    requestFailures: report.diagnostics.requestFailures.length,
    consoleWarningsOrErrors: report.diagnostics.console.length
  };
  await writeFile(path.join(OUT, 'animation-catalog-audit.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(OUT, 'README.md'), [
    '# Fast Complete Animation Catalog Evidence',
    '',
    `Captured clips: ${report.summary.clips}/84`,
    `Captured stills: ${report.summary.frames}`,
    `Playback reel: ${report.reel}`,
    `Runtime: ${report.status}`,
    '',
    'This is visual evidence for manual standards review, not automatic approval.'
  ].join('\n'));
  if (report.summary.clips !== 84 || report.summary.frames !== 420) {
    throw new Error(`incomplete catalog evidence: ${JSON.stringify(report.summary)}`);
  }
  if (report.summary.pageErrors) throw new Error(`page errors: ${report.diagnostics.pageErrors.join('\n')}`);
} finally {
  await browser.close();
}
