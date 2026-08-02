import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

import {
  TOTAL_COMPASS_COIN_SLOTS,
  TOTAL_COMPLETION_SLOTS
} from '../src/campaign-level-count.js';
import {
  validateMeadowWakeOpeningLayout
} from '../tools/level-art/validate-meadow-wake-opening-layout.mjs';

const fileLayout = JSON.parse(await readFile(
  new URL('../data/level-art/world-1/meadow-wake-opening-layout.json', import.meta.url),
  'utf8'
));
const sourceValidation = validateMeadowWakeOpeningLayout(fileLayout);
assert.equal(fileLayout.scope.courseId, '1-1');
assert.deepEqual(fileLayout.scope.playableRangeMetres, [0, 30]);
assert.deepEqual(fileLayout.scope.targetTraversalSeconds, [20, 30]);
assert.equal(fileLayout.unitsAndAxes.gameplayMetreToBlenderMetre, 1);
assert.equal(fileLayout.unitsAndAxes.gameplayMetreToUnityUnit, 1);
assert.equal(fileLayout.scaleReferences.Hargold.heightMetres, 1.82);
assert.equal(fileLayout.scaleReferences.Mebble.heightMetres, 2.2932);
assert.equal(fileLayout.scaleReferences.standardBlock.widthMetres, 0.74);
assert.equal(fileLayout.gameplayPlane.traversalDepthLocked, true);
assert.equal(fileLayout.terrain.pits.length, 0, 'the opening slice has no pits');
assert.equal(fileLayout.gameplayObjects.platforms.length, 5);
assert.equal(fileLayout.gameplayObjects.blocks.length, 5);
assert.equal(fileLayout.gameplayObjects.coins.length, 30);
assert.equal(fileLayout.gameplayObjects.compassCoins.length, 1);
assert.equal(fileLayout.gameplayObjects.enemyAnchors.length, 5);
assert.equal(
  fileLayout.gameplayObjects.blocks.filter(block => block.type === 'standard-breakable').length,
  3,
  'the opening slice must retain its authored breakable-block lesson'
);
assert.deepEqual(
  fileLayout.gameplayObjects.blocks.map(block => block.id),
  [
    'opening-single-breakable',
    'opening-raised-coin',
    'opening-pair-a',
    'opening-pair-b',
    'power-before-first-encounter'
  ]
);

for (const safeZone of fileLayout.safeLandingZones) {
  for (const enemy of fileLayout.gameplayObjects.enemyAnchors) {
    const [safeFrom, safeTo] = safeZone.range;
    const [patrolFrom, patrolTo] = enemy.patrolRange;
    assert.ok(
      patrolTo < safeFrom || patrolFrom > safeTo,
      `${enemy.id} patrol overlaps safe landing zone ${safeZone.id}`
    );
  }
}

assert.equal(fileLayout.camera.fixedComparisonViewpoints.length, 5);
assert.equal(fileLayout.visibleArtStatus, 'BROWSER_VISUAL_FROZEN_AT_55cd085_HUMAN_DCC_TERRAIN_NOT_AUTHORED');
assert.equal(fileLayout.completionClaim, false);

for (const requiredPath of [
  '../assets/blender/environments/world-1/meadow-wake-opening.blend',
  '../assets/exports/world-1/meadow-wake-opening/mw_opening_neutral_guide.glb',
  '../data/level-art/world-1/meadow-wake-opening-blender-validation.json',
  '../data/level-art/world-1/meadow-wake-opening-layout-validation.json',
  '../data/level-art/world-1/meadow-wake-opening-asset-manifest.json',
  '../data/level-art/world-1/meadow-wake-opening-performance-status.json',
  '../data/level-art/world-1/meadow-wake-terrain-architecture.json',
  '../unity/HargoldMebble/Assets/Game/Worlds/World01_MeadowWake/Collision/Source/Terrain_Collision_Master.fbx',
  '../unity/HargoldMebble/Assets/Game/Worlds/World01_MeadowWake/Scenes/MW_Opening_VerticalSlice.unity'
]) {
  await access(new URL(requiredPath, import.meta.url));
}

const blenderValidation = JSON.parse(await readFile(
  new URL('../data/level-art/world-1/meadow-wake-opening-blender-validation.json', import.meta.url),
  'utf8'
));
assert.equal(blenderValidation.status, 'PASS_DCC_HANDOFF_ONLY_VISIBLE_REPLACEMENT_NOT_AUTHORED');
assert.equal(blenderValidation.productionReady, false);
assert.ok(blenderValidation.checks.every(check => check.pass));

const layoutValidation = JSON.parse(await readFile(
  new URL('../data/level-art/world-1/meadow-wake-opening-layout-validation.json', import.meta.url),
  'utf8'
));
assert.deepEqual(layoutValidation, sourceValidation);
assert.equal(layoutValidation.status, 'PASS_LAYOUT_AND_SPACING_UNITY_RUNTIME_NOT_EXECUTED');
assert.equal(layoutValidation.heroTraversal.Hargold.unityRuntimeExecuted, false);
assert.equal(layoutValidation.heroTraversal.Mebble.unityRuntimeExecuted, false);

const assetManifest = JSON.parse(await readFile(
  new URL('../data/level-art/world-1/meadow-wake-opening-asset-manifest.json', import.meta.url),
  'utf8'
));
assert.equal(assetManifest.productionReady, false);
assert.equal(assetManifest.assets.length, 3);
assert.ok(assetManifest.assets.every(asset => asset.bytes > 0 && asset.sha256));

const performance = JSON.parse(await readFile(
  new URL('../data/level-art/world-1/meadow-wake-opening-performance-status.json', import.meta.url),
  'utf8'
));
assert.equal(performance.targetDevice.tested, false);
assert.equal(performance.unityRuntime.cpuFrameTimeMs, 'NOT_MEASURED');

const unityImporter = await readFile(
  new URL('../unity/HargoldMebble/Assets/Game/Worlds/World01_MeadowWake/Editor/MWOpeningLayoutImporter.cs', import.meta.url),
  'utf8'
);
const unityTraversal = await readFile(
  new URL('../unity/HargoldMebble/Assets/Game/Worlds/World01_MeadowWake/Scripts/MWOpeningTraversalProxy.cs', import.meta.url),
  'utf8'
);
assert.match(unityImporter, /meadow-wake-opening-layout\.json/);
assert.match(unityImporter, /MW_Opening_VerticalSlice\.unity/);
assert.match(unityImporter, /Collision\/Source\/Terrain_Collision_Master\.fbx/);
assert.match(unityImporter, /Terrain_Visible_Master__AUTHORED_DCC_ASSET_REQUIRED/);
assert.doesNotMatch(unityImporter, /VisibleFbxPath/);
assert.match(unityTraversal, /locked\.z = gameplayPlaneZ/);
assert.match(unityTraversal, /temporaryValidationProxy/);

assert.equal(TOTAL_COMPLETION_SLOTS, 83);
assert.equal(TOTAL_COMPASS_COIN_SLOTS, 249);

console.log('Meadow Wake opening layout freeze tests passed.');
