import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.HM_AUDIT_URL ??
  'http://127.0.0.1:4173/?fullyUnlocked=1&animationValidation=1&debugAnimation=1&station=acceleration-skid-lane';
const OUTPUT_ROOT = path.resolve(process.env.HM_AUDIT_OUTPUT ?? 'animation-audit-output');
const EXPECTED_COUNTS = Object.freeze({ Hargold: 41, Mebble: 43 });
const RIGHT_PHASES = Object.freeze([0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 0.995]);
const LEFT_PHASES = Object.freeze([0.25, 0.75]);
const HEROES = Object.freeze(['Hargold', 'Mebble']);

function safeName(value) {
  return String(value).replace(/[^a-z0-9_.-]+/gi, '-').replace(/^-+|-+$/g, '');
}

async function settle(page, milliseconds = 90) {
  await page.waitForTimeout(milliseconds);
  await page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

async function openAuditPage(context, diagnostics) {
  const page = await context.newPage();
  page.on('console', message => {
    const type = message.type();
    if (type === 'error' || type === 'warning') {
      diagnostics.console.push({ type, text: message.text() });
    }
  });
  page.on('pageerror', error => {
    diagnostics.pageErrors.push(String(error?.stack || error));
  });
  page.on('requestfailed', request => {
    diagnostics.requestFailures.push({
      url: request.url(),
      failure: request.failure()?.errorText ?? 'unknown request failure'
    });
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForSelector('.animation-debug-panel', { timeout: 120_000 });
  await page.waitForSelector('canvas.character-layer', { timeout: 120_000 });
  await page.waitForFunction(() => {
    const text = document.querySelector('#status')?.textContent ?? '';
    return text.includes('PLAYING') && !text.includes('ERROR');
  }, null, { timeout: 120_000 });
  await page.waitForTimeout(5_000);
  const status = await page.locator('#status').textContent();
  if (!status?.includes('PLAYING') || status.includes('ERROR')) {
    throw new Error(`runtime did not reach a healthy playing state: ${status}`);
  }
  return page;
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

async function setRange(locator, value) {
  await locator.evaluate((element, nextValue) => {
    element.value = String(nextValue);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function setCheckbox(locator, checked) {
  if ((await locator.isChecked()) !== checked) {
    if (checked) await locator.check();
    else await locator.uncheck();
  }
}

async function browserCatalog(page) {
  return page.evaluate(async () => {
    const module = await import('/src/animation/character-animation-config.js?v=all-animation-audit-1');
    const result = {};
    for (const hero of ['Hargold', 'Mebble']) {
      result[hero] = module.IMPORTED_CHARACTER_ANIMATIONS[hero].clips.map(clip => ({
        id: clip.id,
        label: clip.label,
        durationSeconds: clip.durationSeconds,
        loop: clip.loop,
        footLock: clip.footLock,
        footLockAxes: [...(clip.footLockAxes ?? [])],
        markers: [...(clip.markers ?? [])],
        source: clip.source,
        authoredSpeedMetresPerSecond: clip.authoredSpeedMetresPerSecond ?? 0
      }));
    }
    return result;
  });
}

async function captureCatalogStills(browser, report) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 980 },
    deviceScaleFactor: 1
  });
  const page = await openAuditPage(context, report.diagnostics);
  const ui = controls(page);
  await setCheckbox(ui.pause, true);
  await setCheckbox(ui.loop, true);
  await setRange(ui.speed, 1);
  const catalog = await browserCatalog(page);
  report.catalog = catalog;

  for (const hero of HEROES) {
    await ui.hero.selectOption(hero);
    await settle(page, 550);
    const optionValues = await ui.clip.locator('option').evaluateAll(options =>
      options.map(option => ({ value: option.value, label: option.textContent }))
    );
    if (optionValues.length !== EXPECTED_COUNTS[hero]) {
      throw new Error(`${hero} exposes ${optionValues.length} clips, expected ${EXPECTED_COUNTS[hero]}`);
    }
    const metadataIds = catalog[hero].map(clip => clip.id);
    const optionIds = optionValues.map(option => option.value);
    if (JSON.stringify(metadataIds) !== JSON.stringify(optionIds)) {
      throw new Error(`${hero} DOM clip order does not match imported animation metadata`);
    }

    for (const clip of catalog[hero]) {
      const clipDirectory = path.join(OUTPUT_ROOT, 'stills', hero, safeName(clip.id));
      await mkdir(clipDirectory, { recursive: true });
      await ui.clip.selectOption(clip.id);
      await setCheckbox(ui.pause, true);
      await setCheckbox(ui.loop, clip.loop);
      await setRange(ui.speed, 1);
      await ui.facing.selectOption('1');
      await ui.restart.click();
      await settle(page, 140);

      const samples = [];
      for (const phase of RIGHT_PHASES) {
        await setRange(ui.scrub, phase);
        await settle(page);
        const fileName = `right-${phase.toFixed(3).replace('.', '_')}.jpg`;
        const filePath = path.join(clipDirectory, fileName);
        await page.locator('canvas.character-layer').screenshot({
          path: filePath,
          type: 'jpeg',
          quality: 84,
          animations: 'disabled'
        });
        samples.push({
          facing: 'right',
          normalizedTime: phase,
          file: path.relative(OUTPUT_ROOT, filePath),
          telemetry: await ui.telemetry.textContent()
        });
      }

      await ui.facing.selectOption('-1');
      for (const phase of LEFT_PHASES) {
        await setRange(ui.scrub, phase);
        await settle(page);
        const fileName = `left-${phase.toFixed(3).replace('.', '_')}.jpg`;
        const filePath = path.join(clipDirectory, fileName);
        await page.locator('canvas.character-layer').screenshot({
          path: filePath,
          type: 'jpeg',
          quality: 84,
          animations: 'disabled'
        });
        samples.push({
          facing: 'left',
          normalizedTime: phase,
          file: path.relative(OUTPUT_ROOT, filePath),
          telemetry: await ui.telemetry.textContent()
        });
      }
      report.clips.push({ hero, ...clip, samples });
      process.stdout.write(`captured ${hero} ${clip.id} (${samples.length} frames)\n`);
    }
  }
  report.runtimeStatus = await page.locator('#status').textContent();
  await context.close();
}

async function capturePlaybackReel(browser, report) {
  const videoDirectory = path.join(OUTPUT_ROOT, 'video');
  await mkdir(videoDirectory, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: videoDirectory,
      size: { width: 1600, height: 900 }
    }
  });
  const page = await openAuditPage(context, report.diagnostics);
  const video = page.video();
  const ui = controls(page);
  await page.evaluate(() => {
    const label = document.createElement('div');
    label.id = 'animation-audit-label';
    Object.assign(label.style, {
      position: 'fixed',
      left: '18px',
      top: '18px',
      zIndex: '10000',
      maxWidth: '820px',
      padding: '12px 16px',
      borderRadius: '10px',
      background: 'rgba(0,0,0,.84)',
      color: 'white',
      font: '700 18px ui-monospace, SFMono-Regular, Menlo, monospace',
      whiteSpace: 'pre-wrap',
      pointerEvents: 'none'
    });
    document.body.append(label);
  });
  await setRange(ui.speed, 1);

  for (const hero of HEROES) {
    await ui.hero.selectOption(hero);
    await settle(page, 500);
    for (const clip of report.catalog[hero]) {
      await page.locator('#animation-audit-label').evaluate((element, data) => {
        element.textContent = `${data.hero} · ${data.id}\n${data.label}\n${data.duration.toFixed(3)} s · ${data.loop ? 'loop' : 'one-shot'} · ${data.source}`;
      }, {
        hero,
        id: clip.id,
        label: clip.label,
        duration: clip.durationSeconds,
        loop: clip.loop,
        source: clip.source
      });
      await ui.clip.selectOption(clip.id);
      await ui.facing.selectOption('1');
      await setCheckbox(ui.loop, clip.loop);
      await setCheckbox(ui.pause, false);
      await ui.restart.click();
      const playbackSeconds = Math.min(3.4, Math.max(0.55, clip.durationSeconds));
      await page.waitForTimeout(Math.round(playbackSeconds * 1000 + 180));
      await setCheckbox(ui.pause, true);
      await page.waitForTimeout(110);
    }
  }
  await page.locator('#animation-audit-label').evaluate(element => {
    element.textContent = 'END OF COMPLETE HARGOLD & MEBBLE ANIMATION CATALOG';
  });
  await page.waitForTimeout(850);
  await context.close();
  const sourcePath = await video.path();
  const targetPath = path.join(videoDirectory, 'all-listed-animations.webm');
  await video.saveAs(targetPath);
  report.playbackReel = path.relative(OUTPUT_ROOT, targetPath);
  report.playbackReelSource = sourcePath;
}

async function writeReport(report) {
  report.completedAt = new Date().toISOString();
  report.summary = {
    expectedClips: Object.values(EXPECTED_COUNTS).reduce((sum, count) => sum + count, 0),
    capturedClips: report.clips.length,
    capturedFrames: report.clips.reduce((sum, clip) => sum + clip.samples.length, 0),
    consoleWarningsOrErrors: report.diagnostics.console.length,
    pageErrors: report.diagnostics.pageErrors.length,
    requestFailures: report.diagnostics.requestFailures.length
  };
  await writeFile(
    path.join(OUTPUT_ROOT, 'animation-catalog-audit.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  const lines = [
    '# Complete Listed Animation Capture Evidence',
    '',
    `- Runtime status: ${report.runtimeStatus}`,
    `- Clips captured: ${report.summary.capturedClips}/${report.summary.expectedClips}`,
    `- Representative stills: ${report.summary.capturedFrames}`,
    `- Continuous playback reel: ${report.playbackReel}`,
    `- Console warnings/errors: ${report.summary.consoleWarningsOrErrors}`,
    `- Page errors: ${report.summary.pageErrors}`,
    `- Request failures: ${report.summary.requestFailures}`,
    '',
    'This artifact is capture evidence, not an automatic artistic approval. Each clip must still receive an explicit visual verdict against the project standards.',
    '',
    '## Catalog',
    ''
  ];
  for (const hero of HEROES) {
    lines.push(`### ${hero}`, '');
    for (const clip of report.catalog[hero]) {
      lines.push(`- \`${clip.id}\` — ${clip.label} (${clip.durationSeconds.toFixed(3)} s, ${clip.loop ? 'loop' : 'one-shot'}, ${clip.source})`);
    }
    lines.push('');
  }
  await writeFile(path.join(OUTPUT_ROOT, 'README.md'), `${lines.join('\n')}\n`, 'utf8');
}

await mkdir(OUTPUT_ROOT, { recursive: true });
const report = {
  schemaVersion: 1,
  baseUrl: BASE_URL,
  startedAt: new Date().toISOString(),
  expectedCounts: EXPECTED_COUNTS,
  phases: { right: RIGHT_PHASES, left: LEFT_PHASES },
  diagnostics: { console: [], pageErrors: [], requestFailures: [] },
  catalog: {},
  clips: []
};

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

try {
  await captureCatalogStills(browser, report);
  await capturePlaybackReel(browser, report);
  await writeReport(report);
  if (report.summary.capturedClips !== report.summary.expectedClips) {
    throw new Error(`captured ${report.summary.capturedClips} of ${report.summary.expectedClips} clips`);
  }
  if (report.summary.capturedFrames !== report.summary.expectedClips * (RIGHT_PHASES.length + LEFT_PHASES.length)) {
    throw new Error(`unexpected frame count: ${report.summary.capturedFrames}`);
  }
  if (report.summary.pageErrors > 0 || report.summary.requestFailures > 0) {
    throw new Error('runtime errors occurred during exhaustive animation capture');
  }
} finally {
  await browser.close();
}
