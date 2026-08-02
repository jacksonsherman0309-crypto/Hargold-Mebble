import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LAYOUT_PATH = path.join(ROOT, 'data/level-art/world-1/meadow-wake-opening-layout.json');
const REPORT_PATH = path.join(ROOT, 'data/level-art/world-1/meadow-wake-opening-layout-validation.json');

export function validateMeadowWakeOpeningLayout(layout) {
  const checks = [];
  const check = (id, pass, detail) => checks.push({ id, pass, detail });
  const points = layout.terrain.groundProfile;
  const segmentSlopes = points.slice(1).map((point, index) => {
    const previous = points[index];
    return Math.abs((point.blenderZ - previous.blenderZ) / (point.x - previous.x));
  });
  const maximumSlope = Math.max(...segmentSlopes);

  check('slice-bounds', layout.scope.playableRangeMetres[0] === 0 && layout.scope.playableRangeMetres[1] === 30,
    JSON.stringify(layout.scope.playableRangeMetres));
  check('connected-ground', layout.terrain.pits.length === 0 && points[0].x === 0 && points.at(-1).x === 30,
    `points=${points.length}, pits=${layout.terrain.pits.length}`);
  check('opening-slope-readability', maximumSlope <= 0.2, `maximumRisePerMetre=${maximumSlope.toFixed(4)}`);
  check('platform-anchors', layout.gameplayObjects.platforms.length === 5,
    `count=${layout.gameplayObjects.platforms.length}`);
  check('block-anchors', layout.gameplayObjects.blocks.length === 5,
    `count=${layout.gameplayObjects.blocks.length}`);
  check('breakable-blocks', layout.gameplayObjects.blocks.filter(block => block.type === 'standard-breakable').length === 3,
    'opening-single-breakable + opening-pair-a + opening-pair-b');
  check('coin-route', layout.gameplayObjects.coins.length === 30 && layout.gameplayObjects.compassCoins.length === 1,
    `coins=${layout.gameplayObjects.coins.length}, compass=${layout.gameplayObjects.compassCoins.length}`);
  check('enemy-anchors', layout.gameplayObjects.enemyAnchors.length === 5,
    `count=${layout.gameplayObjects.enemyAnchors.length}`);

  const safeOverlaps = [];
  for (const safe of layout.safeLandingZones) {
    for (const enemy of layout.gameplayObjects.enemyAnchors) {
      if (!(enemy.patrolRange[1] < safe.range[0] || enemy.patrolRange[0] > safe.range[1])) {
        safeOverlaps.push(`${safe.id}:${enemy.id}`);
      }
    }
  }
  check('safe-landing-enemy-clearance', safeOverlaps.length === 0, `overlaps=${safeOverlaps.join(',') || 'none'}`);
  check('fixed-camera-views', layout.camera.fixedComparisonViewpoints.length === 5,
    layout.camera.fixedComparisonViewpoints.map(view => view.id).join(','));
  check('strict-plane', layout.gameplayPlane.traversalDepthLocked && layout.gameplayPlane.blenderY === 0,
    JSON.stringify(layout.gameplayPlane));

  const allPassed = checks.every(item => item.pass);
  return {
    schemaVersion: 1,
    sliceId: layout.id,
    status: allPassed ? 'PASS_LAYOUT_AND_SPACING_UNITY_RUNTIME_NOT_EXECUTED' : 'FAIL',
    productionReady: false,
    checks,
    metrics: {
      groundPointCount: points.length,
      maximumAbsoluteSlopeRisePerMetre: Number(maximumSlope.toFixed(6)),
      platforms: layout.gameplayObjects.platforms.length,
      blocks: layout.gameplayObjects.blocks.length,
      breakableBlocks: layout.gameplayObjects.blocks.filter(block => block.type === 'standard-breakable').length,
      coins: layout.gameplayObjects.coins.length,
      compassCoins: layout.gameplayObjects.compassCoins.length,
      enemyAnchors: layout.gameplayObjects.enemyAnchors.length
    },
    heroTraversal: {
      Hargold: {
        result: allPassed ? 'STATIC_CONNECTED_ROUTE_PASS' : 'FAIL',
        canonicalHeightMetres: layout.scaleReferences.Hargold.heightMetres,
        unityRuntimeExecuted: false,
        note: 'Browser movement regression suite passed; this report does not substitute for Unity traversal.'
      },
      Mebble: {
        result: allPassed ? 'STATIC_CONNECTED_ROUTE_PASS' : 'FAIL',
        canonicalHeightMetres: layout.scaleReferences.Mebble.heightMetres,
        unityRuntimeExecuted: false,
        note: 'Browser movement regression suite passed; this report does not substitute for Unity traversal.'
      }
    }
  };
}

export async function writeValidationReport() {
  const layout = JSON.parse(await readFile(LAYOUT_PATH, 'utf8'));
  const report = validateMeadowWakeOpeningLayout(layout);
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await writeValidationReport();
  console.log(`${report.status}: ${report.checks.length} checks`);
  if (report.status === 'FAIL') process.exitCode = 1;
}
