import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'audit-output');
const SHEETS = path.join(OUT, 'sheets');
const OVERVIEWS = path.join(OUT, 'overviews');
const VIDEOS = path.join(OUT, 'videos');
const URL = process.env.HM_AUDIT_URL ??
  'http://127.0.0.1:4173/?fullyUnlocked=1&animationValidation=1&debugAnimation=1&station=acceleration-skid-lane';
const HEROES = ['Hargold', 'Mebble'];
const RIGHT_TIMES = [0, 0.25, 0.5, 0.75, 0.99];
const LEFT_TIMES = [0.5];
const DYNAMIC = /(walk|run|sprint|start|accel|decelerate|turn|skid|crouch|crawl|slide|jump|rise|apex|fall|air|spin|stomp|land|slam|hurt|knockback|defeat|victory|swap|glide|block|power)/i;
const LOOPED = /(idle|walk$|run$|walk_refined|run_refined|sprint_refined|crawl|glide_sustain|victory)/i;

await Promise.all([
  mkdir(SHEETS, { recursive: true }),
  mkdir(OVERVIEWS, { recursive: true }),
  mkdir(VIDEOS, { recursive: true })
]);

function safe(value) {
  return String(value).replace(/[^a-z0-9._-]+/gi, '_').replace(/^_+|_+$/g, '');
}

function xml(value) {
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
    `<text x="14" y="${fontSize + 8 + index * lineHeight}" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" fill="#f3f5f7">${xml(line)}</text>`
  ).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${background}"/>${text}</svg>`);
}

function difference(a, b) {
  const length = Math.min(a.length, b.length);
  let total = 0;
  for (let index = 0; index < length; index += 1) total += Math.abs(a[index] - b[index]);
  return length ? total / (length * 255) : 0;
}

async function gray(buffer) {
  return sharp(buffer).resize(80, 96).removeAlpha().grayscale().raw().toBuffer();
}

async function metrics(buffers, clipId) {
  const samples = await Promise.all(buffers.map(gray));
  const adjacent = samples.slice(1).map((sample, index) => difference(samples[index], sample));
  const unique = [];
  for (const sample of samples) {
    if (!unique.some(existing => difference(existing, sample) < 0.0015)) unique.push(sample);
  }
  const mean = adjacent.reduce((sum, value) => sum + value, 0) / Math.max(1, adjacent.length);
  const maximum = Math.max(0, ...adjacent);
  const seam = difference(samples[0], samples.at(-1));
  const warnings = [];
  if (DYNAMIC.test(clipId) && maximum < 0.003) warnings.push('near-static-dynamic-clip');
  if (DYNAMIC.test(clipId) && unique.length < 3) warnings.push('insufficient-pose-variation');
  if (LOOPED.test(clipId) && seam > 0.04) warnings.push('possible-loop-seam');
  return {
    meanAdjacentDifference: Number(mean.toFixed(6)),
    maximumAdjacentDifference: Number(maximum.toFixed(6)),
    firstToLastDifference: Number(seam.toFixed(6)),
    uniqueSampledFrames: unique.length,
    warnings
  };
}

async function buildSheet(hero, clip, frames, screening) {
  const tileWidth = 400;
  const imageHeight = 464;
  const captionHeight = 28;
  const headerHeight = 116;
  const columns = 3;
  const rows = 2;
  const width = tileWidth * columns;
  const height = headerHeight + rows * (imageHeight + captionHeight);
  const composites = [{
    input: textSvg(width, headerHeight, [
      `${hero} · ${clip.id}`,
      clip.label,
      `duration ${clip.durationSeconds.toFixed(3)}s · full playback at 1.0× confirmed`,
      `motion mean ${screening.meanAdjacentDifference.toFixed(5)} · max ${screening.maximumAdjacentDifference.toFixed(5)} · seam ${screening.firstToLastDifference.toFixed(5)} · ${screening.warnings.join(', ') || 'no automated warning'}`
    ]),
    left: 0,
    top: 0
  }];
  for (let index = 0; index < frames.length; index += 1) {
    const image = await sharp(frames[index].buffer)
      .resize(tileWidth, imageHeight, { fit: 'fill' })
      .jpeg({ quality: 88 })
      .toBuffer();
    const caption = textSvg(tileWidth, captionHeight, [frames[index].label], 14, '#0f1318');
    const left = index % columns * tileWidth;
    const top = headerHeight + Math.floor(index / columns) * (imageHeight + captionHeight);
    composites.push({ input: image, left, top });
    composites.push({ input: caption, left, top: top + imageHeight });
  }
  const file = path.join(SHEETS, hero.toLowerCase(), `${safe(clip.id)}.jpg`);
  await mkdir(path.dirname(file), { recursive: true });
  await sharp({ create: { width, height, channels: 3, background: '#11151a' } })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toFile(file);
  return path.relative(OUT, file);
}

async function buildOverview(hero, thumbs) {
  const columns = 6;
  const tileWidth = 210;
  const imageHeight = 244;
  const captionHeight = 38;
  const headerHeight = 78;
  const rows = Math.ceil(thumbs.length / columns);
  const width = columns * tileWidth;
  const height = headerHeight + rows * (imageHeight + captionHeight);
  const composites = [{
    input: textSvg(width, headerHeight, [`${hero} · all listed animations`, `${thumbs.length} right-facing midpoint poses`], 22),
    left: 0,
    top: 0
  }];
  for (let index = 0; index < thumbs.length; index += 1) {
    const image = await sharp(thumbs[index].buffer)
      .resize(tileWidth, imageHeight, { fit: 'fill' })
      .jpeg({ quality: 84 })
      .toBuffer();
    const caption = textSvg(tileWidth, captionHeight, [thumbs[index].id], 11, '#0f1318');
    const left = index % columns * tileWidth;
    const top = headerHeight + Math.floor(index / columns) * (imageHeight + captionHeight);
    composites.push({ input: image, left, top });
    composites.push({ input: caption, left, top: top + imageHeight });
  }
  const file = path.join(OVERVIEWS, `${hero.toLowerCase()}-all-listed-animations.jpg`);
  await sharp({ create: { width, height, channels: 3, background: '#11151a' } })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toFile(file);
  return path.relative(OUT, file);
}

async function setControl(page, control, value, eventType = 'change') {
  await page.evaluate(({ control, value, eventType }) => {
    const panel = document.querySelector('.animation-debug-panel');
    if (!panel) throw new Error('Animation debug panel missing');
    const selects = panel.querySelectorAll('select');
    const checks = panel.querySelectorAll('input[type="checkbox"]');
    const ranges = panel.querySelectorAll('input[type="range"]');
    const map = {
      hero: selects[0], clip: selects[1], facing: selects[2],
      pause: checks[0], loop: checks[1], speed: ranges[0], scrub: ranges[1]
    };
    const element = map[control];
    if (!element) throw new Error(`Debug control missing: ${control}`);
    if (element.type === 'checkbox') element.checked = Boolean(value);
    else element.value = String(value);
    element.dispatchEvent(new Event(eventType, { bubbles: true }));
  }, { control, value, eventType });
}

async function restart(page) {
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('.animation-debug-panel button')]
      .find(candidate => candidate.textContent.includes('Restart'));
    if (!button) throw new Error('Restart button missing');
    button.click();
  });
}

async function telemetry(page) {
  const text = await page.locator('.animation-debug-telemetry').textContent() ?? '';
  const match = text.match(/time\s+[\d.]+\s*\/\s*([\d.]+)/i);
  return { text, durationSeconds: match ? Number(match[1]) : NaN };
}

async function waitFrame(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
}

async function selectHero(page, hero) {
  await setControl(page, 'hero', hero);
  await page.waitForFunction(expected => {
    const selects = document.querySelectorAll('.animation-debug-panel select');
    return selects[0]?.value === expected && selects[1]?.options.length > 0;
  }, hero, { timeout: 60_000 });
  await page.waitForTimeout(500);
}

async function clips(page) {
  return page.evaluate(() => [...document.querySelectorAll('.animation-debug-panel select')[1].options]
    .map(option => ({ id: option.value, label: option.textContent ?? option.value })));
}

async function selectClip(page, id) {
  await setControl(page, 'clip', id);
  await page.waitForFunction(expected =>
    (document.querySelector('.animation-debug-telemetry')?.textContent ?? '').includes(`clip       ${expected}`),
  id, { timeout: 30_000 });
}

async function cleanCapture(page, canvasBox, facing, time) {
  await setControl(page, 'facing', facing);
  await setControl(page, 'scrub', time, 'input');
  await waitFrame(page);
  await page.evaluate(() => {
    for (const selector of ['.hud', '.controls', 'footer', '.animation-debug-panel', '.animation-validation-panel', '#audit-overlay']) {
      const element = document.querySelector(selector);
      if (element) element.style.visibility = 'hidden';
    }
  });
  const buffer = await page.screenshot({
    type: 'jpeg',
    quality: 84,
    clip: {
      x: canvasBox.x + 170,
      y: canvasBox.y + 35,
      width: 560,
      height: 650
    }
  });
  await page.evaluate(() => {
    for (const selector of ['.hud', '.controls', 'footer', '.animation-debug-panel', '.animation-validation-panel', '#audit-overlay']) {
      const element = document.querySelector(selector);
      if (element) element.style.visibility = '';
    }
  });
  return buffer;
}

async function auditHero(browser, hero) {
  const errors = [];
  const rawVideo = path.join(VIDEOS, `.raw-${hero.toLowerCase()}`);
  await mkdir(rawVideo, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: rawVideo, size: { width: 1280, height: 800 } }
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`pageerror: ${error.stack ?? error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('requestfailed', request => errors.push(`requestfailed: ${request.url()} · ${request.failure()?.errorText ?? 'unknown'}`));

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForSelector('.animation-debug-panel', { timeout: 120_000 });
  await page.waitForSelector('canvas.character-layer', { timeout: 120_000 });
  await page.waitForFunction(() => {
    const status = document.querySelector('#status')?.textContent ?? '';
    return /PLAYING|ready/i.test(status) && !/ERROR/i.test(status);
  }, null, { timeout: 120_000 });
  await selectHero(page, hero);

  await page.evaluate(currentHero => {
    const overlay = document.createElement('div');
    overlay.id = 'audit-overlay';
    overlay.style.cssText = 'position:absolute;left:12px;top:12px;z-index:9999;background:rgba(8,11,15,.88);color:white;padding:10px 12px;font:600 15px/1.35 system-ui;border-radius:8px;white-space:pre-line;pointer-events:none';
    overlay.textContent = `${currentHero} animation audit`;
    document.querySelector('.game-wrap')?.append(overlay);
  }, hero);

  const canvasBox = await page.locator('canvas.character-layer').boundingBox();
  if (!canvasBox) throw new Error('Character canvas has no bounding box');
  const listed = await clips(page);
  const records = [];
  const thumbs = [];
  await setControl(page, 'speed', 1, 'input');
  await setControl(page, 'loop', false);

  for (let index = 0; index < listed.length; index += 1) {
    const clip = listed[index];
    console.log(`[${hero}] ${index + 1}/${listed.length} ${clip.id}`);
    await page.evaluate(({ hero, clipId, index, total }) => {
      const overlay = document.querySelector('#audit-overlay');
      if (overlay) overlay.textContent = `${hero} · ${index + 1}/${total}\n${clipId}\nfull playback at 1.0×`;
    }, { hero, clipId: clip.id, index, total: listed.length });

    await selectClip(page, clip.id);
    await setControl(page, 'facing', 1);
    await setControl(page, 'loop', false);
    await setControl(page, 'scrub', 0, 'input');
    await setControl(page, 'pause', false);
    await restart(page);
    await page.waitForTimeout(120);
    let info = await telemetry(page);
    if (!Number.isFinite(info.durationSeconds) || info.durationSeconds <= 0) {
      await page.waitForTimeout(250);
      info = await telemetry(page);
    }
    const durationSeconds = Number.isFinite(info.durationSeconds) && info.durationSeconds > 0 ? info.durationSeconds : 1;
    await page.waitForTimeout(Math.ceil(durationSeconds * 1000 + 120));

    const frames = [];
    const right = [];
    for (const time of RIGHT_TIMES) {
      const buffer = await cleanCapture(page, canvasBox, 1, time);
      right.push(buffer);
      frames.push({ buffer, label: `Right · ${(time * 100).toFixed(0)}%` });
    }
    for (const time of LEFT_TIMES) {
      const buffer = await cleanCapture(page, canvasBox, -1, time);
      frames.push({ buffer, label: `Left · ${(time * 100).toFixed(0)}%` });
    }
    const screening = await metrics(right, clip.id);
    const record = {
      ...clip,
      durationSeconds: Number(durationSeconds.toFixed(4)),
      fullPlaybackConfirmed: true,
      screening
    };
    record.sheet = await buildSheet(hero, record, frames, screening);
    thumbs.push({ id: clip.id, buffer: right[2] });
    records.push(record);
  }

  const overview = await buildOverview(hero, thumbs);
  const video = page.video();
  await context.close();
  const sourceVideo = await video.path();
  const finalVideo = path.join(VIDEOS, `${hero.toLowerCase()}-all-listed-animations.webm`);
  await rename(sourceVideo, finalVideo);
  return {
    hero,
    clipCount: records.length,
    overview,
    video: path.relative(OUT, finalVideo),
    clips: records,
    errors
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  sourceUrl: URL,
  method: 'Every debug-panel clip is played once at 1.0× with looping disabled, sampled at five right-facing times and one left-facing midpoint, and recorded in a complete per-hero video.',
  browser: {},
  heroes: {},
  globalErrors: []
};

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-gpu-sandbox', '--disable-dev-shm-usage', '--no-sandbox']
});
report.browser.version = await browser.version();
for (const hero of HEROES) {
  try {
    report.heroes[hero] = await auditHero(browser, hero);
  } catch (error) {
    report.globalErrors.push(`${hero}: ${error.stack ?? error.message}`);
    report.heroes[hero] = { hero, clipCount: 0, clips: [], errors: [error.stack ?? error.message] };
  }
}
await browser.close();

const all = Object.values(report.heroes).flatMap(hero => hero.clips ?? []);
const errors = [...report.globalErrors, ...Object.values(report.heroes).flatMap(hero => hero.errors ?? [])];
report.summary = {
  totalClips: all.length,
  allListedClipsPlayed: all.length >= 80 && report.globalErrors.length === 0,
  screeningFlags: all.filter(clip => clip.screening?.warnings?.length).length,
  runtimeErrors: errors.length
};
await writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

const markdown = [
  '# Full Animation Visual Audit',
  '',
  `Generated: ${report.generatedAt}`,
  `Source: ${report.sourceUrl}`,
  '',
  `- Clips played in full: **${report.summary.totalClips}**`,
  `- Automated screening flags: **${report.summary.screeningFlags}**`,
  `- Browser/runtime errors: **${report.summary.runtimeErrors}**`,
  '',
  'Contact sheets and videos are visual evidence. Automated flags are screening signals, not final artistic approval.',
  '',
  ...HEROES.flatMap(hero => {
    const data = report.heroes[hero];
    return [
      `## ${hero}`,
      '',
      `Overview: \`${data.overview ?? 'missing'}\``,
      `Video: \`${data.video ?? 'missing'}\``,
      '',
      '| # | Clip | Duration | Motion | Seam | Unique | Screening |',
      '|---:|---|---:|---:|---:|---:|---|',
      ...(data.clips ?? []).map((clip, index) => `| ${index + 1} | ${clip.id} | ${clip.durationSeconds.toFixed(3)}s | ${clip.screening.meanAdjacentDifference.toFixed(5)} | ${clip.screening.firstToLastDifference.toFixed(5)} | ${clip.screening.uniqueSampledFrames} | ${clip.screening.warnings.join(', ') || 'none'} |`),
      ''
    ];
  }),
  '## Diagnostics',
  '',
  ...(errors.length ? errors.map(error => `- ${error}`) : ['- No browser, WebGL, asset-loading, page, or console errors were recorded.']),
  ''
].join('\n');
await writeFile(path.join(OUT, 'report.md'), markdown);

console.log(JSON.stringify(report.summary, null, 2));
if (!report.summary.allListedClipsPlayed || errors.length) process.exitCode = 1;
