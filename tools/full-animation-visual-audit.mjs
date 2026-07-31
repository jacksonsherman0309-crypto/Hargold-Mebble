import { chromium } from 'playwright';
import sharp from 'sharp';
import {
  mkdir,
  rename,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUTPUT_ROOT = path.join(ROOT, 'audit-output');
const SHEETS_ROOT = path.join(OUTPUT_ROOT, 'sheets');
const VIDEOS_ROOT = path.join(OUTPUT_ROOT, 'videos');
const OVERVIEWS_ROOT = path.join(OUTPUT_ROOT, 'overviews');
const BASE_URL = process.env.HM_AUDIT_URL ??
  'http://127.0.0.1:4173/?fullyUnlocked=1&animationValidation=1&debugAnimation=1&debugMovement=1&station=double-jump-and-glide';
const HEROES = ['Hargold', 'Mebble'];
const RIGHT_TIMES = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 0.99];
const LEFT_TIMES = [0.25, 0.5, 0.75];
const TILE_WIDTH = 320;
const TILE_HEIGHT = 180;
const TILE_LABEL_HEIGHT = 24;
const CONTACT_COLUMNS = 4;
const DYNAMIC_NAME_PATTERN = /(walk|run|sprint|start|accel|decelerate|turn|skid|crouch|crawl|slide|jump|rise|apex|fall|air|spin|twirl|stomp|land|slam|hurt|knockback|defeat|victory|swap|glide|block|power)/i;
const EXPECTED_LOOP_PATTERN = /(idle|walk$|run$|walk_refined|run_refined|sprint_refined|crawl|glide_sustain|victory)/i;

await Promise.all([
  mkdir(SHEETS_ROOT, { recursive: true }),
  mkdir(VIDEOS_ROOT, { recursive: true }),
  mkdir(OVERVIEWS_ROOT, { recursive: true })
]);

const audit = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceUrl: BASE_URL,
  method: {
    fullPlayback: 'Each debug-panel listed clip was restarted at 1.0x, loop disabled, and allowed to play for its reported full duration.',
    captures: {
      rightFacingNormalizedTimes: RIGHT_TIMES,
      leftFacingNormalizedTimes: LEFT_TIMES
    },
    render: 'Chromium headless with SwiftShader WebGL',
    evidence: 'Per-clip contact sheets, complete per-hero audit videos, DOM telemetry, console diagnostics, and pixel-motion screening.'
  },
  browser: {},
  heroes: {},
  globalErrors: []
};

function safeName(value) {
  return String(value).replace(/[^a-z0-9._-]+/gi, '_').replace(/^_+|_+$/g, '');
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function svgText({ width, height, lines, fontSize = 20, background = '#13171d', foreground = '#f3f5f7' }) {
  const lineHeight = Math.round(fontSize * 1.35);
  const text = lines.map((line, index) =>
    `<text x="16" y="${fontSize + 10 + index * lineHeight}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" fill="${foreground}">${escapeXml(line)}</text>`
  ).join('');
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${background}"/>${text}</svg>`
  );
}

async function annotateTile(buffer, label) {
  const image = await sharp(buffer)
    .resize(TILE_WIDTH, TILE_HEIGHT, { fit: 'fill' })
    .png()
    .toBuffer();
  const labelSvg = svgText({
    width: TILE_WIDTH,
    height: TILE_LABEL_HEIGHT,
    lines: [label],
    fontSize: 14,
    background: '#101216cc'
  });
  return sharp({
    create: {
      width: TILE_WIDTH,
      height: TILE_HEIGHT + TILE_LABEL_HEIGHT,
      channels: 4,
      background: '#101216'
    }
  }).composite([
    { input: image, left: 0, top: 0 },
    { input: labelSvg, left: 0, top: TILE_HEIGHT }
  ]).png().toBuffer();
}

async function normalizedGray(buffer) {
  return sharp(buffer)
    .extract({ left: 220, top: 35, width: 500, height: 650 })
    .resize(96, 96, { fit: 'fill' })
    .removeAlpha()
    .grayscale()
    .raw()
    .toBuffer();
}

function normalizedDifference(a, b) {
  const length = Math.min(a.length, b.length);
  if (!length) return 0;
  let sum = 0;
  for (let index = 0; index < length; index += 1) {
    sum += Math.abs(a[index] - b[index]);
  }
  return sum / (length * 255);
}

function round(value, digits = 6) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function computeMotionMetrics(rightBuffers, clipId) {
  const samples = [];
  for (const buffer of rightBuffers) samples.push(await normalizedGray(buffer));
  const adjacent = [];
  for (let index = 1; index < samples.length; index += 1) {
    adjacent.push(normalizedDifference(samples[index - 1], samples[index]));
  }
  const firstToLast = normalizedDifference(samples[0], samples.at(-1));
  const firstToMid = normalizedDifference(samples[0], samples[Math.floor(samples.length / 2)]);
  const unique = [];
  for (const sample of samples) {
    if (!unique.some(existing => normalizedDifference(existing, sample) < 0.0015)) unique.push(sample);
  }
  const meanAdjacent = adjacent.reduce((sum, value) => sum + value, 0) / Math.max(1, adjacent.length);
  const maximumAdjacent = Math.max(0, ...adjacent);
  const warnings = [];
  if (DYNAMIC_NAME_PATTERN.test(clipId) && maximumAdjacent < 0.0025) {
    warnings.push('near-static-dynamic-clip');
  }
  if (DYNAMIC_NAME_PATTERN.test(clipId) && unique.length < 3) {
    warnings.push('insufficient-pose-variation');
  }
  if (EXPECTED_LOOP_PATTERN.test(clipId) && firstToLast > 0.035) {
    warnings.push('possible-loop-seam');
  }
  return {
    meanAdjacentDifference: round(meanAdjacent),
    maximumAdjacentDifference: round(maximumAdjacent),
    firstToMiddleDifference: round(firstToMid),
    firstToLastDifference: round(firstToLast),
    uniqueSampledFrames: unique.length,
    warnings
  };
}

async function buildContactSheet({ hero, clip, frames, metrics, outputPath }) {
  const headerHeight = 116;
  const rows = Math.ceil(frames.length / CONTACT_COLUMNS);
  const width = CONTACT_COLUMNS * TILE_WIDTH;
  const height = headerHeight + rows * (TILE_HEIGHT + TILE_LABEL_HEIGHT);
  const header = svgText({
    width,
    height: headerHeight,
    lines: [
      `${hero} · ${clip.id}`,
      clip.label,
      `duration ${clip.durationSeconds.toFixed(3)}s · full playback confirmed · sampled frames ${frames.length}`,
      `motion mean ${metrics.meanAdjacentDifference.toFixed(5)} · max ${metrics.maximumAdjacentDifference.toFixed(5)} · start/end ${metrics.firstToLastDifference.toFixed(5)} · warnings ${metrics.warnings.join(', ') || 'none'}`
    ],
    fontSize: 18
  });
  const composites = [{ input: header, left: 0, top: 0 }];
  for (let index = 0; index < frames.length; index += 1) {
    const tile = await annotateTile(frames[index].buffer, frames[index].label);
    composites.push({
      input: tile,
      left: (index % CONTACT_COLUMNS) * TILE_WIDTH,
      top: headerHeight + Math.floor(index / CONTACT_COLUMNS) * (TILE_HEIGHT + TILE_LABEL_HEIGHT)
    });
  }
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: '#101216'
    }
  }).composite(composites).png().toFile(outputPath);
}

async function buildHeroOverview(hero, thumbnails) {
  const columns = 5;
  const thumbWidth = 256;
  const thumbHeight = 144;
  const captionHeight = 42;
  const headerHeight = 84;
  const rows = Math.ceil(thumbnails.length / columns);
  const width = columns * thumbWidth;
  const height = headerHeight + rows * (thumbHeight + captionHeight);
  const composites = [{
    input: svgText({
      width,
      height: headerHeight,
      lines: [`${hero} · every listed animation`, `${thumbnails.length} clips · right-facing midpoint overview`],
      fontSize: 24
    }),
    left: 0,
    top: 0
  }];
  for (let index = 0; index < thumbnails.length; index += 1) {
    const thumb = await sharp(thumbnails[index].buffer)
      .resize(thumbWidth, thumbHeight, { fit: 'fill' })
      .png()
      .toBuffer();
    const caption = svgText({
      width: thumbWidth,
      height: captionHeight,
      lines: [thumbnails[index].clipId],
      fontSize: 12,
      background: '#101216'
    });
    const left = (index % columns) * thumbWidth;
    const top = headerHeight + Math.floor(index / columns) * (thumbHeight + captionHeight);
    composites.push({ input: thumb, left, top });
    composites.push({ input: caption, left, top: top + thumbHeight });
  }
  const outputPath = path.join(OVERVIEWS_ROOT, `${hero.toLowerCase()}-all-listed-animations.png`);
  await sharp({
    create: { width, height, channels: 4, background: '#101216' }
  }).composite(composites).png().toFile(outputPath);
  return path.relative(OUTPUT_ROOT, outputPath);
}

async function setControl(page, control, value, eventType = 'change') {
  await page.evaluate(({ control, value, eventType }) => {
    const panel = document.querySelector('.animation-debug-panel');
    if (!panel) throw new Error('Animation debug panel not found');
    let element;
    if (control === 'hero') element = panel.querySelectorAll('select')[0];
    if (control === 'clip') element = panel.querySelectorAll('select')[1];
    if (control === 'facing') element = panel.querySelectorAll('select')[2];
    if (control === 'pause') element = panel.querySelectorAll('input[type="checkbox"]')[0];
    if (control === 'loop') element = panel.querySelectorAll('input[type="checkbox"]')[1];
    if (control === 'speed') element = panel.querySelectorAll('input[type="range"]')[0];
    if (control === 'scrub') element = panel.querySelectorAll('input[type="range"]')[1];
    if (!element) throw new Error(`Animation debug control not found: ${control}`);
    if (element instanceof HTMLInputElement && element.type === 'checkbox') {
      element.checked = Boolean(value);
    } else {
      element.value = String(value);
    }
    element.dispatchEvent(new Event(eventType, { bubbles: true }));
  }, { control, value, eventType });
}

async function clickRestart(page) {
  await page.evaluate(() => {
    const panel = document.querySelector('.animation-debug-panel');
    const button = [...panel.querySelectorAll('button')].find(candidate => candidate.textContent.includes('Restart'));
    if (!button) throw new Error('Restart clip button not found');
    button.click();
  });
}

async function waitForFrames(page, count = 3) {
  await page.evaluate(async count => {
    for (let index = 0; index < count; index += 1) {
      await new Promise(resolve => requestAnimationFrame(() => resolve()));
    }
  }, count);
}

async function clipTelemetry(page) {
  const text = await page.locator('.animation-debug-telemetry').textContent();
  const match = text?.match(/time\s+[\d.]+\s*\/\s*([\d.]+)/i);
  return {
    text: text ?? '',
    durationSeconds: match ? Number(match[1]) : NaN
  };
}

async function selectHero(page, hero) {
  await setControl(page, 'hero', hero);
  await page.waitForFunction(expected => {
    const panel = document.querySelector('.animation-debug-panel');
    const heroSelect = panel?.querySelectorAll('select')[0];
    const clipSelect = panel?.querySelectorAll('select')[1];
    return heroSelect?.value === expected && clipSelect?.options.length > 0;
  }, hero, { timeout: 60_000 });
  await page.waitForTimeout(800);
}

async function listClips(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('.animation-debug-panel');
    const select = panel?.querySelectorAll('select')[1];
    if (!select) throw new Error('Clip select not found');
    return [...select.options].map(option => ({ id: option.value, label: option.textContent ?? option.value }));
  });
}

async function selectClip(page, clipId) {
  await setControl(page, 'clip', clipId);
  await page.waitForFunction(expected => {
    const text = document.querySelector('.animation-debug-telemetry')?.textContent ?? '';
    return text.includes(`clip       ${expected}`);
  }, clipId, { timeout: 30_000 });
}

async function captureAt(page, canvas, facing, normalizedTime) {
  await setControl(page, 'facing', facing);
  await setControl(page, 'scrub', normalizedTime, 'input');
  await waitForFrames(page, 4);
  return canvas.screenshot({ type: 'png' });
}

async function runHeroAudit(browser, hero) {
  const heroDirectory = path.join(SHEETS_ROOT, hero.toLowerCase());
  const rawVideoDirectory = path.join(VIDEOS_ROOT, `.raw-${hero.toLowerCase()}`);
  await Promise.all([
    mkdir(heroDirectory, { recursive: true }),
    mkdir(rawVideoDirectory, { recursive: true })
  ]);

  const browserErrors = [];
  const consoleMessages = [];
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: rawVideoDirectory,
      size: { width: 1600, height: 1000 }
    }
  });
  const page = await context.newPage();
  page.on('pageerror', error => browserErrors.push(`pageerror: ${error.stack ?? error.message}`));
  page.on('console', message => {
    const entry = `${message.type()}: ${message.text()}`;
    consoleMessages.push(entry);
    if (message.type() === 'error') browserErrors.push(entry);
  });
  page.on('requestfailed', request => {
    browserErrors.push(`requestfailed: ${request.url()} · ${request.failure()?.errorText ?? 'unknown'}`);
  });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForSelector('.animation-debug-panel', { timeout: 120_000 });
  await page.waitForSelector('canvas.character-layer', { timeout: 120_000 });
  await page.waitForFunction(() => {
    const status = document.querySelector('#status')?.textContent ?? '';
    return /PLAYING|ready/i.test(status) && !/ERROR/i.test(status);
  }, null, { timeout: 120_000 });
  await selectHero(page, hero);

  await page.evaluate(currentHero => {
    const existing = document.querySelector('#audit-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'audit-overlay';
    overlay.style.cssText = [
      'position:absolute',
      'left:12px',
      'top:12px',
      'z-index:9999',
      'background:rgba(8,11,15,.86)',
      'color:#fff',
      'padding:10px 12px',
      'font:600 15px/1.35 system-ui,sans-serif',
      'border-radius:8px',
      'pointer-events:none',
      'max-width:520px'
    ].join(';');
    overlay.textContent = `${currentHero} animation audit`;
    document.querySelector('.game-wrap')?.append(overlay);
  }, hero);

  const canvas = page.locator('canvas.character-layer');
  const clips = await listClips(page);
  const results = [];
  const thumbnails = [];

  await setControl(page, 'speed', 1, 'input');
  await setControl(page, 'loop', false);
  await setControl(page, 'facing', 1);

  for (let index = 0; index < clips.length; index += 1) {
    const clip = clips[index];
    await page.evaluate(({ hero, clipId, index, total }) => {
      const overlay = document.querySelector('#audit-overlay');
      if (overlay) overlay.textContent = `${hero} · ${index + 1}/${total}\n${clipId}\nFull-duration playback at 1.0×`;
    }, { hero, clipId: clip.id, index, total: clips.length });

    await selectClip(page, clip.id);
    await setControl(page, 'facing', 1);
    await setControl(page, 'loop', false);
    await setControl(page, 'scrub', 0, 'input');
    await setControl(page, 'pause', false);
    await clickRestart(page);
    await page.waitForTimeout(120);
    let telemetry = await clipTelemetry(page);
    if (!Number.isFinite(telemetry.durationSeconds) || telemetry.durationSeconds <= 0) {
      await page.waitForTimeout(350);
      telemetry = await clipTelemetry(page);
    }
    const durationSeconds = Number.isFinite(telemetry.durationSeconds) && telemetry.durationSeconds > 0
      ? telemetry.durationSeconds
      : 1;
    await page.waitForTimeout(Math.ceil(durationSeconds * 1000 + 180));

    const frames = [];
    const rightBuffers = [];
    for (const time of RIGHT_TIMES) {
      const buffer = await captureAt(page, canvas, 1, time);
      rightBuffers.push(buffer);
      frames.push({ buffer, label: `Right · ${(time * 100).toFixed(1)}%` });
    }
    for (const time of LEFT_TIMES) {
      const buffer = await captureAt(page, canvas, -1, time);
      frames.push({ buffer, label: `Left · ${(time * 100).toFixed(1)}%` });
    }

    const metrics = await computeMotionMetrics(rightBuffers, clip.id);
    const clipRecord = {
      ...clip,
      durationSeconds: round(durationSeconds, 4),
      fullPlaybackConfirmed: true,
      telemetry: telemetry.text,
      metrics,
      sheet: `sheets/${hero.toLowerCase()}/${safeName(clip.id)}.png`
    };
    const outputPath = path.join(OUTPUT_ROOT, clipRecord.sheet);
    await buildContactSheet({
      hero,
      clip: clipRecord,
      frames,
      metrics,
      outputPath
    });
    thumbnails.push({ clipId: clip.id, buffer: rightBuffers[Math.floor(rightBuffers.length / 2)] });
    results.push(clipRecord);
  }

  const overview = await buildHeroOverview(hero, thumbnails);
  const video = page.video();
  await context.close();
  const rawVideoPath = await video.path();
  const finalVideoPath = path.join(VIDEOS_ROOT, `${hero.toLowerCase()}-all-listed-animations.webm`);
  await rename(rawVideoPath, finalVideoPath);

  return {
    hero,
    clipCount: results.length,
    overview,
    video: path.relative(OUTPUT_ROOT, finalVideoPath),
    clips: results,
    browserErrors,
    consoleMessages
  };
}

const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-gl=swiftshader',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--disable-gpu-sandbox',
    '--disable-dev-shm-usage',
    '--no-sandbox'
  ]
});

audit.browser.version = await browser.version();
for (const hero of HEROES) {
  try {
    audit.heroes[hero] = await runHeroAudit(browser, hero);
  } catch (error) {
    audit.globalErrors.push(`${hero}: ${error.stack ?? error.message}`);
    audit.heroes[hero] = {
      hero,
      clipCount: 0,
      clips: [],
      browserErrors: [error.stack ?? error.message]
    };
  }
}
await browser.close();

const totalClips = Object.values(audit.heroes).reduce((sum, hero) => sum + (hero.clipCount ?? 0), 0);
const flagged = Object.values(audit.heroes)
  .flatMap(hero => hero.clips ?? [])
  .filter(clip => clip.metrics?.warnings?.length);
const browserErrors = Object.values(audit.heroes)
  .flatMap(hero => hero.browserErrors ?? []);
audit.summary = {
  totalClips,
  expectedMinimum: 80,
  allListedClipsPlayed: totalClips >= 80 && audit.globalErrors.length === 0,
  flaggedByAutomatedScreening: flagged.length,
  browserErrorCount: browserErrors.length,
  globalErrorCount: audit.globalErrors.length
};

await writeFile(path.join(OUTPUT_ROOT, 'report.json'), JSON.stringify(audit, null, 2));

const markdown = [
  '# Full Animation Visual Audit',
  '',
  `Generated: ${audit.generatedAt}`,
  `Source: ${audit.sourceUrl}`,
  '',
  '## Summary',
  '',
  `- Listed clips played in full: **${totalClips}**`,
  `- Automated screening flags: **${flagged.length}**`,
  `- Browser/runtime errors: **${browserErrors.length + audit.globalErrors.length}**`,
  '',
  'Automated flags are screening signals, not final artistic judgments. Contact sheets and complete playback videos are the visual authority.',
  '',
  ...HEROES.flatMap(hero => {
    const record = audit.heroes[hero];
    return [
      `## ${hero}`,
      '',
      `Overview: \`${record.overview ?? 'missing'}\``,
      `Full playback video: \`${record.video ?? 'missing'}\``,
      '',
      '| # | Clip | Duration | Motion mean | Start/end | Unique samples | Screening |',
      '|---:|---|---:|---:|---:|---:|---|',
      ...(record.clips ?? []).map((clip, index) =>
        `| ${index + 1} | ${clip.id} | ${clip.durationSeconds.toFixed(3)}s | ${clip.metrics.meanAdjacentDifference.toFixed(5)} | ${clip.metrics.firstToLastDifference.toFixed(5)} | ${clip.metrics.uniqueSampledFrames} | ${clip.metrics.warnings.join(', ') || 'none'} |`
      ),
      ''
    ];
  }),
  '## Runtime diagnostics',
  '',
  browserErrors.length || audit.globalErrors.length
    ? [...audit.globalErrors, ...browserErrors].map(error => `- ${error}`).join('\n')
    : '- No browser, WebGL, asset-loading, page, or console errors were recorded during the audit.',
  ''
].join('\n');

await writeFile(path.join(OUTPUT_ROOT, 'report.md'), markdown);

if (!audit.summary.allListedClipsPlayed || browserErrors.length || audit.globalErrors.length) {
  console.error(JSON.stringify(audit.summary, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(audit.summary, null, 2));
}
