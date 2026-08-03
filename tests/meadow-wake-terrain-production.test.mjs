import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

import {
  COMPASS_COINS_PER_LEVEL,
  LEVEL_COUNT_BY_WORLD,
  TOTAL_COMPASS_COIN_SLOTS,
  TOTAL_COMPLETION_SLOTS
} from '../src/campaign-level-count.js';
import { VERDANT_VALE_TERRAIN_STANDARD } from '../src/canonical-data.js';
import {
  MEADOW_WAKE_AUTHORED_TERRAIN_SHAPES,
  MEADOW_WAKE_BLOCK_DEFINITIONS,
  MEADOW_WAKE_BLOCK_PHRASES,
  MEADOW_WAKE_COMPASS_COIN_DEFINITIONS,
  MEADOW_WAKE_GAMEPLAY_ROOMS,
  MEADOW_WAKE_PITS,
  MEADOW_WAKE_PLATFORMS,
  MEADOW_WAKE_TERRAIN_MODULES,
  MEADOW_WAKE_WORLD_END,
  meadowWakeBlockPhraseCoverage,
  meadowWakePitRatio,
  meadowWakeRoomCoverage,
  meadowWakeTerrainModuleCoverage
} from '../src/content/meadow-wake-course.js';
import { MEADOW_WAKE_LEVEL_DATA } from '../src/content/meadow-wake-level-data.js';
import {
  MEADOW_WAKE_GAMEPLAY_LANDMARKS,
  MEADOW_WAKE_ROOM_FINISH_PROFILES,
  MEADOW_WAKE_TERRAIN_ANCHORS
} from '../src/content/meadow-wake-scenery.js';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const foregroundSource = read('../src/environment/meadow-wake-foreground.js');
const terrainKitSource = read('../src/environment/verdant-vale-terrain-kit.js');
const rendererSource = read('../src/character-renderer.js');
const gameSource = read('../src/game.js');
const htmlSource = read('../index.html');
const blenderSource = read('../tools/blender/build_verdant_vale_terrain_kit.py');
const livingSurfaceBuilderSource = read('../tools/blender/environment/build_verdant_vale_terrain_bank_quality_gate.py');

assert.equal(MEADOW_WAKE_GAMEPLAY_ROOMS.length, 12);
assert.equal(meadowWakeRoomCoverage(), 1);
for (let index = 0; index < MEADOW_WAKE_GAMEPLAY_ROOMS.length; index += 1) {
  const room = MEADOW_WAKE_GAMEPLAY_ROOMS[index];
  assert.ok(room.landmark);
  assert.ok(room.terrainLanguage);
  assert.ok(room.gameplayPhrase);
  if (index === 0) assert.equal(room.range[0], 0);
  else assert.equal(room.range[0], MEADOW_WAKE_GAMEPLAY_ROOMS[index - 1].range[1]);
}
assert.equal(MEADOW_WAKE_GAMEPLAY_ROOMS.at(-1).range[1], MEADOW_WAKE_WORLD_END);

assert.equal(MEADOW_WAKE_GAMEPLAY_LANDMARKS.length, 12);
assert.equal(new Set(MEADOW_WAKE_GAMEPLAY_LANDMARKS.map(entry => entry.roomId)).size, 12);
assert.ok(MEADOW_WAKE_GAMEPLAY_LANDMARKS.every(entry => entry.linkedPlatformIds.length >= 1));

assert.equal(MEADOW_WAKE_ROOM_FINISH_PROFILES.length, 12);
assert.equal(new Set(MEADOW_WAKE_ROOM_FINISH_PROFILES.map(entry => entry.roomId)).size, 12);
assert.deepEqual(
  new Set(MEADOW_WAKE_ROOM_FINISH_PROFILES.map(entry => entry.roomId)),
  new Set(MEADOW_WAKE_GAMEPLAY_ROOMS.map(entry => entry.id))
);
assert.ok(MEADOW_WAKE_ROOM_FINISH_PROFILES.every(entry => (
  entry.component.startsWith('TerrainKit_')
  && entry.scale > 0
  && Number.isFinite(entry.x)
  && Number.isFinite(entry.depth)
)));

assert.ok(MEADOW_WAKE_TERRAIN_MODULES.length >= 20);
assert.ok(MEADOW_WAKE_TERRAIN_MODULES.every(module => module.roomId));
assert.ok(MEADOW_WAKE_TERRAIN_MODULES.every(module => (
  module.visibleRepresentation === 'verdant-vale-relief-mesh'
  && module.collisionRepresentation === 'meadow-wake-ground-profile'
)));
assert.equal(Object.keys(MEADOW_WAKE_AUTHORED_TERRAIN_SHAPES).length, MEADOW_WAKE_TERRAIN_MODULES.length);
assert.ok(MEADOW_WAKE_TERRAIN_MODULES.every(module => (
  module.lowerProfile.length >= 5
  && new Set(module.lowerProfile).size >= 4
  && module.lowerInset.length === 2
  && module.textureScale >= 6.5
)));
assert.equal(MEADOW_WAKE_TERRAIN_MODULES[0].from, 0);
assert.ok(MEADOW_WAKE_TERRAIN_MODULES[0].visualFrom < 0);
assert.equal(MEADOW_WAKE_TERRAIN_MODULES.at(-1).to, MEADOW_WAKE_WORLD_END);
assert.ok(MEADOW_WAKE_TERRAIN_MODULES.at(-1).visualTo > MEADOW_WAKE_WORLD_END);
assert.ok(meadowWakeTerrainModuleCoverage() >= 0.8);
assert.ok(meadowWakeTerrainModuleCoverage() <= 0.93);
assert.ok(meadowWakePitRatio() >= 0.08);
assert.ok(meadowWakePitRatio() <= 0.1);
assert.equal(MEADOW_WAKE_PITS.length, 5);
assert.equal(MEADOW_WAKE_PITS.filter(pit => pit.bridged).length, 1);

assert.equal(MEADOW_WAKE_LEVEL_DATA.terrainGeometry.representation, 'simplified-gameplay-collision-only');
assert.equal(MEADOW_WAKE_LEVEL_DATA.terrainGeometry.visibleTerrainCollisionEnabled, false);
assert.equal(MEADOW_WAKE_LEVEL_DATA.visualEnvironment.terrainSystem.representation, 'independent-visible-3d-relief');
assert.equal(MEADOW_WAKE_LEVEL_DATA.visualEnvironment.terrainSystem.collisionBearing, false);
assert.equal(MEADOW_WAKE_LEVEL_DATA.visualEnvironment.terrainSystem.generatedCourseLayout, false);
assert.equal(MEADOW_WAKE_LEVEL_DATA.visualEnvironment.terrainSystem.roomFinishProfiles.length, 12);
assert.ok(MEADOW_WAKE_LEVEL_DATA.terrainGeometry.hazardSurfaces.every(hazard => (
  hazard.representation === 'dedicated-fatal-hazard-volume'
  && hazard.artGeometryReference === null
)));

const checkpoints = MEADOW_WAKE_LEVEL_DATA.entrances.filter(entry => entry.type === 'checkpoint');
assert.equal(checkpoints.length, 1);
assert.equal(checkpoints[0].id, 'checkpoint');
assert.equal(MEADOW_WAKE_LEVEL_DATA.entrances.filter(entry => entry.isLevelExit).length, 1);
assert.equal(MEADOW_WAKE_COMPASS_COIN_DEFINITIONS.length, 3);
assert.equal(new Set(MEADOW_WAKE_COMPASS_COIN_DEFINITIONS.map(entry => entry.solution)).size, 3);

const blockTypes = new Set(MEADOW_WAKE_BLOCK_DEFINITIONS.map(block => block.type));
assert.deepEqual(
  blockTypes,
  new Set(['standard-breakable', 'coin', 'power-up', 'hargold-only'])
);
assert.ok(MEADOW_WAKE_BLOCK_DEFINITIONS.some(block => block.type === 'standard-breakable'));
assert.ok(MEADOW_WAKE_BLOCK_DEFINITIONS.some(block => block.hidden));
assert.equal(meadowWakeBlockPhraseCoverage(), 1);
assert.ok(MEADOW_WAKE_BLOCK_PHRASES.length >= 12);

const motionKinds = new Set(
  MEADOW_WAKE_PLATFORMS.map(platform => platform.motion?.kind).filter(Boolean)
);
assert.ok(motionKinds.has('vertical'));
assert.ok(motionKinds.has('orbit'));
assert.ok(motionKinds.has('falling'));
assert.ok(motionKinds.has('seesaw'));
assert.ok(MEADOW_WAKE_PLATFORMS.some(platform => platform.visual === 'rope-bridge'));

assert.ok(MEADOW_WAKE_TERRAIN_ANCHORS.length >= (
  MEADOW_WAKE_BLOCK_DEFINITIONS.length + MEADOW_WAKE_PLATFORMS.length
));
assert.ok(MEADOW_WAKE_TERRAIN_ANCHORS.every(anchor => anchor.roomId));
assert.ok(MEADOW_WAKE_TERRAIN_ANCHORS
  .filter(anchor => ['interactive-block', 'authored-platform', 'moving-mechanism'].includes(anchor.kind))
  .every(anchor => anchor.remainsSeparateEntity));

assert.deepEqual(
  VERDANT_VALE_TERRAIN_STANDARD.materialClasses,
  [
    'grass',
    'exposed-dirt',
    'compact-loam',
    'damp-soil',
    'embedded-stone',
    'ruin-stone',
    'moss',
    'worn-path'
  ]
);
assert.equal(VERDANT_VALE_TERRAIN_STANDARD.visibleCollisionSeparationRequired, true);
assert.equal(VERDANT_VALE_TERRAIN_STANDARD.individuallyAuthoredCourseLayoutsRequired, true);
assert.equal(
  VERDANT_VALE_TERRAIN_STANDARD.referenceAsset,
  'assets/references/terrain/meadow-wake-production-quality-target.jpeg'
);
assert.equal(VERDANT_VALE_TERRAIN_STANDARD.runtimeAsset, 'assets/exports/world-1/verdant_vale_terrain_kit.glb');
assert.equal(
  VERDANT_VALE_TERRAIN_STANDARD.terrainAlbedoAsset,
  'assets/textures/world-1/meadow-wake/meadow-soil-stone-albedo-v3.png'
);
assert.equal(VERDANT_VALE_TERRAIN_STANDARD.livingSurface.maximumDepthMeters, 0.30);
assert.equal(VERDANT_VALE_TERRAIN_STANDARD.livingSurface.surfaceOnly, true);
assert.deepEqual(
  VERDANT_VALE_TERRAIN_STANDARD.livingSurface.detailSystems,
  [
    'modeled-colony-silhouette',
    'sparse-alpha-card-clumps',
    'fine-material-detail'
  ]
);
assert.equal(VERDANT_VALE_TERRAIN_STANDARD.livingSurface.individualBladeScatterAllowed, false);
assert.equal(VERDANT_VALE_TERRAIN_STANDARD.livingSurface.continuousGrassRibbonAllowed, false);
assert.equal(VERDANT_VALE_TERRAIN_STANDARD.livingSurface.textureOnlyTransitionAllowed, false);
assert.equal(VERDANT_VALE_TERRAIN_STANDARD.livingSurface.collisionBearing, false);
assert.equal(VERDANT_VALE_TERRAIN_STANDARD.livingSurface.visualApprovalRequiredBeforeIntegration, true);
assert.equal(
  VERDANT_VALE_TERRAIN_STANDARD.livingSurface.atlasAsset,
  'assets/textures/world-1/meadow-wake/verdant-vale-living-surface-atlas-v1.png'
);

const livingSurfaceAtlasPath = new URL('../assets/textures/world-1/meadow-wake/verdant-vale-living-surface-atlas-v1.png', import.meta.url);
const livingSurfaceAtlasBytes = readFileSync(livingSurfaceAtlasPath);
assert.ok(livingSurfaceAtlasBytes.length > 500_000);
assert.deepEqual([...livingSurfaceAtlasBytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
assert.match(livingSurfaceBuilderSource, /modeled gameplay silhouette/);
assert.match(livingSurfaceBuilderSource, /sparse grass cards and clumps/);
assert.match(livingSurfaceBuilderSource, /fine-scale material variation/);
assert.match(livingSurfaceBuilderSource, /individual_blade_scatter.*PROHIBITED/);

const referencePath = new URL('../assets/references/terrain/meadow-wake-production-quality-target.jpeg', import.meta.url);
const referenceBytes = readFileSync(referencePath);
assert.ok(referenceBytes.length > 500_000);
assert.equal(referenceBytes[0], 0xff);
assert.equal(referenceBytes[1], 0xd8);
assert.equal(referenceBytes.at(-2), 0xff);
assert.equal(referenceBytes.at(-1), 0xd9);

for (const path of [
  '../assets/blender/world-1/verdant_vale_terrain_kit.blend',
  '../assets/exports/world-1/verdant_vale_terrain_kit.glb'
]) {
  assert.ok(statSync(new URL(path, import.meta.url)).size > 200_000);
}

assert.match(blenderSource, /production-intent-original-terrain-kit/);
assert.match(blenderSource, /consolidate_components/);
assert.match(blenderSource, /visible_terrain_only/);
assert.match(rendererSource, /verdant_vale_terrain_kit\.glb/);
assert.match(rendererSource, /installProductionTerrainKit/);
assert.match(foregroundSource, /MeadowWake_BlenderAuthoredRoomFinishKit/);
assert.match(foregroundSource, /MeadowWake_AuthoredTerrainRelief/);
assert.match(foregroundSource, /MeadowWake_AuthoredForegroundScenery/);
assert.match(foregroundSource, /independent-visible-geometry/);
assert.match(foregroundSource, /setDebugMode/);
assert.match(foregroundSource, /residentTerrain/);
assert.match(foregroundSource, /AUTHORED_WORN_TRAIL_SEGMENTS/);
assert.match(foregroundSource, /batchStrategy: 'authored-room'/);
assert.match(foregroundSource, /visibleRange = \[cameraWorldX - 11\.25/);
assert.match(foregroundSource, /this\.windShaders/);
assert.match(rendererSource, /camera\.zoom = 1\.18/);
assert.match(gameSource, /cameraSurfaceY \* SCALE - H \* 0\.66/);
assert.match(terrainKitSource, /createVerdantTerrainBodyGeometry/);
assert.match(terrainKitSource, /createVerdantGrassOverhangGeometry/);
assert.match(terrainKitSource, /createVerdantSubsoilBackdropGeometry/);
assert.match(terrainKitSource, /createTerrainCollisionDebugGroup/);
assert.doesNotMatch(foregroundSource, /terrainFaceGeometry/);
assert.doesNotMatch(htmlSource, /data-action="sprint"/);
assert.doesNotMatch(gameSource, /data-action="sprint"/);

assert.equal(LEVEL_COUNT_BY_WORLD[1], 8);
assert.equal(LEVEL_COUNT_BY_WORLD[7], 8);
assert.equal(LEVEL_COUNT_BY_WORLD[8], 9);
assert.equal(TOTAL_COMPLETION_SLOTS, 83);
assert.equal(COMPASS_COINS_PER_LEVEL, 3);
assert.equal(TOTAL_COMPASS_COIN_SLOTS, 249);

console.log('Meadow Wake production terrain contract checks passed.');
