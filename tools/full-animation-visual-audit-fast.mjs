import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const HERO = process.env.HM_AUDIT_HERO;
if (!['Hargold', 'Mebble'].includes(HERO)) {
  throw new Error('HM_AUDIT_HERO must be Hargold or Mebble');
}

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'audit-output-fast', HERO.toLowerCase());
const SHEETS = path.join(OUT, 'sheets');
const BASE_URL = process.env.HM_AUDIT_URL ??
  'http://127.0.0.1:4173/?fullyUnlocked=1&animationValidation=1&debugAnimation=1&station=acceleration-skid-lane';
const RIGHT_TIMES = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 0.99];
const LEFT_TIMES = [0.25, 0.5, 0.75];
const DYNAMIC_PATTERN = /(walk|run|sprint|start|accel|decelerate|turn|skid|crouch|crawl|slide|jump|rise|apex|fall|air|spin|twirl|stomp|land|slam|hurt|knockback|defeat|victory|swap|glide|block|power)/i;
const LOOP_PATTERN = /(idle|walk$|run$|walk_refined|run_refined|sprint_refined|crawl|glide_sustain|victory)/i;

await Promise.all([
  mkdir(OUT, { recursive: true }),
  mkdir(SHEETS, { recursive: true })
]);

function safe(value) {
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

function textSvg(width, height, lines, fontSize = 18, background = '#12161c') {
  const lineHeight = Math.round(fontSize * 1.35);
  const text = lines.map((line, index) =>
    `<text x="14" y="${fontSize + 8 + index * lineHeight}" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" fill="#f4f6f8">${escapeXml(line)}</text>`
  ).join('');
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${background}"/>${text}</svg>`
  );
}

function difference(a, b) {
  const length = Math.min(a.length, b.length);
  if (!length) return 0;
  let total = 0;
  for (let index = 0; index < length; index += 1) {
    total += Math.abs(a[index] - b[index]);
  }
  return total / (length * 255);
}

async function gray(buffer) {
  return sharp(buffer)
    .resize(90, 108, { fit: 'fill' })
    .removeAlpha()
    .grayscale()
    .raw()
    .toBuffer();
}

async function motionMetrics(buffers, clipId) {
  const samples = await Promise.all(buffers.map(gray));
  const adjacent = samples.slice(1).map((sample, index) => difference(samples[index], sample));
  const unique = [];
  for (const sample of samples) {
    if (!unique.some(existing => difference(existing, sample) < 0.0015)) unique.push(sample);
  }
  const mean = adjacent.reduce((sum, value) => sum + value, 0) / Math.max(1, adjacent.length);
  const maximum = Math.max(0, ...adjacent);
  const startEnd = difference(samples[0], samples.at(-1));
  const warnings = [];
  if (DYNAMIC_PATTERN.test(clipId) && maximum < 0.003) warnings.push('near-static-dynamic-clip');
  if (DYNAMIC_PATTERN.test(clipId) && unique.length < 4) warnings.push('insufficient-pose-variation');
  if (LOOP_PATTERN.test(clipId) && startEnd > 0.04) warnings.push('possible-loop-seam');
  return {
    meanAdjacentDifference: Number(mean.toFixed(6)),
    maximumAdjacentDifference: Number(maximum.toFixed(6)),
    firstToLastDifference: Number(startEnd.toFixed(6)),
    uniqueSampledFrames: unique.length,
    warnings
  };
}

async function cropCharacterView(fullCanvasBuffer) {
  const metadata = await sharp(fullCanvasBuffer).metadata();
  const width = metadata.width ?? 1280;
  const height = metadata.height ?? 720;
  const left = Math.max(0, Math.round(width * 0.12));
  const top = Math.max(0, Math.round(height * 0.015));
  const cropWidth = Math.min(width - left, Math.round(width * 0.48));
  const cropHeight = Math.min(height - top, Math.round(height * 0.97));
  return sharp(fullCanvasBuffer)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .jpeg({ quality: 90 })
    .toBuffer();
}

async function captureCanvas(page, facing, normalizedTime) {
  await setControl(page, 'facing', facing);
  await setControl(page, 'scrub', normalizedTime, 'input');
  const dataUrl = await page.evaluate(async () => {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        const canvas = document.querySelector('canvas.character-layer');
        if (!(canvas instanceof HTMLCanvasElement)) {
          resolve(null);
          return;
        }
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      });
    });
  });
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    throw new Error('WebGL canvas capture returned no image data');
  }
  const buffer = Buffer.from(dataUrl.split(',', 2)[1], 'base64');
  const stats = await sharp(buffer).stats();
  const entropy = stats.entropy ?? 0;
  if (entropy < 0.03) {
    throw new Error(`WebGL canvas capture appears blank (entropy ${entropy})`);
  }
  return {
    full: buffer,
    cropped: await cropCharacterView(buffer),
    entropy: Number(entropy.toFixed(6))
  };
}

async function buildContactSheet(clip, frames, metrics) {
  const tileWidth = 310;
  const tileHeight = 350;
  const captionHeight = 25;
  const headerHeight = 122;
  const columns = 4;
  const rows = Math.ceil(frames.length / columns);
  const width = columns * tileWidth;
  const height = headerHeight + rows * (tileHeight + captionHeight);
  const composites = [{
    input: textSvg(width, headerHeight, [
      `${HERO} · ${clip.id}`,
      clip.label,
      `duration ${clip.durationSeconds.toFixed(3)}s · played end ${clip.playedEndSeconds.toFixed(3)}s · complete ${clip.fullPlaybackConfirmed}`,
      `motion mean ${metrics.meanAdjacentDifference.toFixed(5)} · max ${metrics.maximumAdjacentDifference.toFixed(5)} · start/end ${metrics.firstToLastDifference.toFixed(5)} · ${metrics.warnings.join(', ') || 'no automated warning'}`
    ]),
    left: 0,
    top: 0
  }];

  for (let index = 0; index < frames.length; index += 1) {
    const image = await sharp(frames[index].buffer)
      .resize(tileWidth, tileHeight, { fit: 'fill' })
      .jpeg({ quality: 88 })
      .toBuffer();
    const caption = textSvg(tileWidth, captionHeight, [frames[index].label], 13, '#0f1318');
    const left = index % columns * tileWidth;
    const top = headerHeight + Math.floor(index / columns) * (tileHeight + captionHeight);
    composites.push({ input: image, left, top });
    composites.push({ input: caption, left, top: top + tileHeight });
  }

  const outputPath = path.join(SHEETS, `${safe(clip.id)}.jpg`);
  await sharp({
    create: { width, height, channels: 3, background: '#11151a' }
  }).composite(composites).jpeg({ quality: 91 }).toFile(outputPath);
  return path.relative(OUT, outputPath);
}

async function buildOverview(thumbnails) {
  const columns = 6;
  const tileWidth = 205;
  const tileHeight = 235;
  const captionHeight = 38;
  const headerHeight = 80;
  const rows = Math.ceil(thumbnails.length / columns);
  const width = columns * tileWidth;
  const height = headerHeight + rows * (tileHeight + captionHeight);
  const composites = [{
    input: textSvg(width, headerHeight, [
      `${HERO} · every listed animation`,
      `${thumbnails.length} clips · right-facing midpoint overview`
    ], 22),
    left: 0,
    top: 0
  }];

  for (let index = 0; index < thumbnails.length; index += 1) {
    const image = await sharp(thumbnails[index].buffer)
      .resize(tileWidth, tileHeight, { fit: 'fill' })
      .jpeg({ quality: 86 })
      .toBuffer();
    const caption = textSvg(tileWidth, captionHeight, [thumbnails[index].id], 11, '#0f1318');
    const left = index % columns * tileWidth;
    const top = headerHeight + Math.floor(index / columns) * (tileHeight + captionHeight);
    composites.push({ input: image, left, top });
    composites.push({ input: caption, left, top: top + tileHeight });
  }

  const outputPath = path.join(OUT, `${HERO.toLowerCase()}-all-listed-animations.jpg`);
  await sharp({
    create: { width, height, channels: 3, background: '#11151a' }
  }).composite(composites).jpeg({ quality: 91 }).toFile(outputPath);
  return path.relative(OUT, outputPath);
}

async function setControl(page, control, value, eventType = 'change') {
  await page.evaluate(({ control, value, eventType }) => {
    const panel = document.querySelector('.animation-debug-panel');
    if (!panel) throw new Error('Animation debug panel missing');
    const selects = panel.querySelectorAll('select');
    const checks = panel.querySelectorAll('input[type="checkbox"]');
    const ranges = panel.querySelectorAll('input[type="range"]');
    const map = {
      hero: selects[0],
      clip: selects[1],
      facing: selects[2],
      pause: checks[0],
      loop: checks[1],
      speed: ranges[0],
      scrub: ranges[1]
    };
    const element = map[control];
    if (!element) throw new Error(`Missing animation debug control: ${control}`);
    if (element instanceof HTMLInputElement && element.type === 'checkbox') {
      element.checked = Boolean(value);
    } else {
      element.value = String(value);
    }
    element.dispatchEvent(new Event(eventType, { bubbles: true }));
  }, { control, value, eventType });
}

async function restartClip(page) {
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('.animation-debug-panel button')]
      .find(candidate => candidate.textContent.includes('Restart'));
    if (!button) throw new Error('Restart clip button missing');
    button.click();
  });
}

async function readTelemetry(page) {
  const text = await page.locator('.animation-debug-telemetry').textContent() ?? '';
  const timeMatch = text.match(/time\s+([\d.]+)\s*\/\s*([\d.]+)/i);
  return {
    text,
    timeSeconds: timeMatch ? Number(timeMatch[1]) : NaN,
    durationSeconds: timeMatch ? Number(timeMatch[2]) : NaN
  };
}

async function selectHero(page) {
  await setControl(page, 'hero', HERO);
  await page.waitForFunction(expected => {
    const selects = document.querySelectorAll('.animation-debug-panel select');
    return selects[0]?.value === expected && selects[1]?.options.length > 0;
  }, HERO, { timeout: 60_000 });
  await page.waitForTimeout(500);
}

async function listClips(page) {
  return page.evaluate(() => {
    const select = document.querySelectorAll('.animation-debug-panel select')[1];
    return [...select.options].map(option => ({
      id: option.value,
      label: option.textContent ?? option.value
    }));
  });
}

async function selectClip(page, id) {
  await setControl(page, 'clip', id);
  await page.waitForFunction(expected => {
    const text = document.querySelector('.animation-debug-telemetry')?.textContent ?? '';
    return text.includes(`clip       ${expected}`);
  }, id, { timeout: 30_000 });
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  hero: HERO,
  sourceUrl: BASE_URL,
  method: {
    fullPlayback: 'Restarted each debug-listed clip at 1.0x with looping disabled and waited through the complete reported duration.',
    renderedEvidence: 'Captured the live WebGL canvas directly at nine right-facing and three left-facing normalized times.',
    rightFacingTimes: RIGHT_TIMES,
    leftFacingTimes: LEFT_TIMES
  },
  browser: {},
  clips: [],
  runtimeErrors: []
};

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
report.browser.version = await browser.version();

const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('pageerror', error => report.runtimeErrors.push(`pageerror: ${error.stack ?? error.message}`));
page.on('console', message => {
  if (message.type() === 'error') report.runtimeErrors.push(`console: ${message.text()}`);
});
page.on('requestfailed', request => {
  report.runtimeErrors.push(`requestfailed: ${request.url()} · ${request.failure()?.errorText ?? 'unknown'}`);
});

await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
await page.waitForSelector('.animation-debug-panel', { timeout: 120_000 });
await page.waitForSelector('canvas.character-layer', { timeout: 120_000 });
await page.waitForFunction(() => {
  const status = document.querySelector('#status')?.textContent ?? '';
  return /PLAYING|ready/i.test(status) && !/ERROR/i.test(status);
}, null, { timeout: 120_000 });
await selectHero(page);
await setControl(page, 'speed', 1, 'input');
await setControl(page, 'loop', false);

const listed = await listClips(page);
const thumbnails = [];

for (let index = 0; index < listed.length; index += 1) {
  const listedClip = listed[index];
  console.log(`[${HERO}] ${index + 1}/${listed.length} ${listedClip.id}`);
  await selectClip(page, listedClip.id);
  await setControl(page, 'facing', 1);
  await setControl(page, 'loop', false);
  await setControl(page, 'scrub', 0, 'input');
  await setControl(page, 'pause', false);
  await restartClip(page);
  await page.waitForTimeout(100);

  let telemetry = await readTelemetry(page);
  if (!Number.isFinite(telemetry.durationSeconds) || telemetry.durationSeconds <= 0) {
    await page.waitForTimeout(250);
    telemetry = await readTelemetry(page);
  }
  const durationSeconds = Number.isFinite(telemetry.durationSeconds) && telemetry.durationSeconds > 0
    ? telemetry.durationSeconds
    : 1;
  await page.waitForTimeout(Math.ceil(durationSeconds * 1000 + 160));
  const endTelemetry = await readTelemetry(page);
  const playedEndSeconds = Number.isFinite(endTelemetry.timeSeconds)
    ? endTelemetry.timeSeconds
    : durationSeconds;
  const fullPlaybackConfirmed = playedEndSeconds >= durationSeconds * 0.92;

  const frames = [];
  const rightBuffers = [];
  const entropySamples = [];
  for (const normalizedTime of RIGHT_TIMES) {
    const capture = await captureCanvas(page, 1, normalizedTime);
    rightBuffers.push(capture.cropped);
    entropySamples.push(capture.entropy);
    frames.push({
      buffer: capture.cropped,
      label: `Right · ${(normalizedTime * 100).toFixed(1)}%`
    });
  }
  for (const normalizedTime of LEFT_TIMES) {
    const capture = await captureCanvas(page, -1, normalizedTime);
    entropySamples.push(capture.entropy);
    frames.push({
      buffer: capture.cropped,
      label: `Left · ${(normalizedTime * 100).toFixed(1)}%`
    });
  }

  const screening = await motionMetrics(rightBuffers, listedClip.id);
  const clip = {
    ...listedClip,
    durationSeconds: Number(durationSeconds.toFixed(4)),
    playedEndSeconds: Number(playedEndSeconds.toFixed(4)),
    fullPlaybackConfirmed,
    minimumCaptureEntropy: Math.min(...entropySamples),
    screening
  };
  clip.sheet = await buildContactSheet(clip, frames, screening);
  thumbnails.push({ id: clip.id, buffer: rightBuffers[4] });
  report.clips.push(clip);
}

report.overview = await buildOverview(thumbnails);
report.summary = {
  listedClipCount: listed.length,
  completedClipCount: report.clips.length,
  allListedClipsPlayed: report.clips.length === listed.length && report.clips.every(clip => clip.fullPlaybackConfirmed),
  automatedScreeningFlags: report.clips.filter(clip => clip.screening.warnings.length).length,
  runtimeErrorCount: report.runtimeErrors.length
};

await context.close();
await browser.close();

await writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

const markdown = [
  `# ${HERO} Full Animation Visual Audit`,
  '',
  `Generated: ${report.generatedAt}`,
  `Source: ${report.sourceUrl}`,
  '',
  `- Listed clips: **${report.summary.listedClipCount}**`,
  `- Fully played: **${report.summary.completedClipCount}**`,
  `- All completed through reported duration: **${report.summary.allListedClipsPlayed}**`,
  `- Automated screening flags: **${report.summary.automatedScreeningFlags}**`,
  `- Runtime errors: **${report.summary.runtimeErrorCount}**`,
  '',
  'Automated screening is not artistic approval. The contact sheets are the visual evidence used for the final manual judgment.',
  '',
  '| # | Clip | Duration | Played end | Complete | Motion | Start/end | Unique | Screening |',
  '|---:|---|---:|---:|---|---:|---:|---:|---|',
  ...report.clips.map((clip, index) =>
    `| ${index + 1} | ${clip.id} | ${clip.durationSeconds.toFixed(3)}s | ${clip.playedEndSeconds.toFixed(3)}s | ${clip.fullPlaybackConfirmed} | ${clip.screening.meanAdjacentDifference.toFixed(5)} | ${clip.screening.firstToLastDifference.toFixed(5)} | ${clip.screening.uniqueSampledFrames} | ${clip.screening.warnings.join(', ') || 'none'} |`
  ),
  '',
  '## Runtime diagnostics',
  '',
  ...(report.runtimeErrors.length
    ? report.runtimeErrors.map(error => `- ${error}`)
    : ['- No browser, WebGL, model-loading, page, or console errors were recorded.']),
  ''
].join('\n');
await writeFile(path.join(OUT, 'report.md'), markdown);

console.log(JSON.stringify(report.summary, null, 2));
if (!report.summary.allListedClipsPlayed || report.runtimeErrors.length) process.exitCode = 1;
