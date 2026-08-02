import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';

const readJson = async relative => JSON.parse(await readFile(new URL(relative, import.meta.url), 'utf8'));
const stableJson = value => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};
const sha256 = value => createHash('sha256').update(stableJson(value)).digest('hex');

const layout = await readJson('../data/level-art/world-1/meadow-wake-opening-layout.json');
const architecture = await readJson('../data/level-art/world-1/meadow-wake-terrain-architecture.json');
const collision = architecture.collisionMaster;
const visible = architecture.visibleMaster;

assert.equal(architecture.status, 'COLLISION_FROZEN_BROWSER_VISUAL_FROZEN_DCC_VISIBLE_NOT_AUTHORED');
assert.equal(architecture.emergencyTerrainFreeze.active, true);
assert.equal(architecture.emergencyTerrainFreeze.approvedVisibleCommit, '55cd085');
assert.equal(architecture.emergencyTerrainFreeze.proceduralVisibleTerrainAllowed, false);
assert.equal(collision.objectName, 'Terrain_Collision_Master');
assert.equal(visible.objectName, 'Terrain_Visible_Master');
assert.equal(visible.status, 'NOT_AUTHORED');
assert.equal(visible.meshName, null);
assert.equal(visible.unityAsset, null);
assert.equal(visible.authoringPolicy.generatedMeshForbidden, true);
assert.equal(visible.authoringPolicy.primitiveApproximationForbidden, true);
assert.equal(visible.authoringPolicy.visibleExportAllowedBeforeApproval, false);
assert.equal(layout.terrain.collisionMaster, collision.objectName);
assert.equal(layout.terrain.visibleMaster, visible.objectName);
assert.equal(layout.terrain.mastersShareGeometry, false);
assert.equal(collision.visibleInGame, false);
assert.equal(collision.renderersEnabled, false);
assert.notEqual(collision.authoringCollection, visible.authoringCollection);
assert.notEqual(collision.exportCollection, visible.exportCollection);

const collisionPayload = {
  name: collision.objectName,
  halfDepthMetres: collision.halfDepthMetres,
  closureBottomZMetres: collision.closureBottomZMetres,
  groundProfile: layout.terrain.groundProfile.map(point => [point.x, point.blenderZ])
};
assert.equal(sha256(collisionPayload), collision.geometryFingerprintSha256);

const protectedGameplay = {
  spawn: layout.spawn,
  exitTransition: layout.exitTransition,
  gameplayPlane: layout.gameplayPlane,
  groundProfile: layout.terrain.groundProfile,
  pits: layout.terrain.pits,
  safeLandingZones: layout.safeLandingZones,
  platforms: layout.gameplayObjects.platforms,
  blocks: layout.gameplayObjects.blocks,
  enemyAnchors: layout.gameplayObjects.enemyAnchors,
  camera: layout.camera
};
assert.equal(sha256(protectedGameplay), architecture.protectedGameplaySnapshot.sha256);

await access(new URL(`../${collision.unityAsset}`, import.meta.url));
await assert.rejects(
  access(new URL('../unity/HargoldMebble/Assets/Game/Worlds/World01_MeadowWake/Art/Source/Terrain_Visible_Master_SCULPT_REQUIRED.fbx', import.meta.url)),
  'a generated visible-terrain FBX must not exist'
);

const blenderBuilder = await readFile(
  new URL('../tools/blender/build_meadow_wake_opening_vertical_slice.py', import.meta.url),
  'utf8'
);
const blenderValidator = await readFile(
  new URL('../tools/blender/validate_meadow_wake_opening_vertical_slice.py', import.meta.url),
  'utf8'
);
const unityImporter = await readFile(
  new URL('../unity/HargoldMebble/Assets/Game/Worlds/World01_MeadowWake/Editor/MWOpeningLayoutImporter.cs', import.meta.url),
  'utf8'
);

assert.match(blenderBuilder, /build_dcc_handoff_targets/);
assert.match(blenderBuilder, /procedural_visible_terrain_allowed/);
assert.match(blenderBuilder, /90_EXPORT_COLLISION/);
assert.doesNotMatch(blenderBuilder, /def visible_sculpt_cage/);
assert.doesNotMatch(blenderBuilder, /Terrain_Visible_Master_SCULPT_REQUIRED\.fbx/);
assert.doesNotMatch(blenderBuilder, /render_previews/);
assert.match(blenderValidator, /no-generated-visible-proxy-meshes/);
assert.match(unityImporter, /renderer\.enabled = false/);
assert.match(unityImporter, /Terrain_Visible_Master__AUTHORED_DCC_ASSET_REQUIRED/);
assert.match(unityImporter, /visibleRenderers\.Length > 0 \|\| visibleMeshFilters\.Length > 0/);
assert.match(unityImporter, /Validate Terrain Separation/);
assert.doesNotMatch(unityImporter, /VisibleFbxPath/);
assert.doesNotMatch(unityImporter, /MW_Opening_BlockoutGuide/);

const blenderValidation = await readJson('../data/level-art/world-1/meadow-wake-opening-blender-validation.json');
assert.equal(blenderValidation.status, 'PASS_DCC_HANDOFF_ONLY_VISIBLE_REPLACEMENT_NOT_AUTHORED');
for (const id of [
  'procedural-visible-terrain-frozen',
  'visible-terrain-target-present',
  'visible-terrain-not-authored',
  'frozen-collision-fingerprint',
  'protected-gameplay-snapshot',
  'dedicated-collision-export',
  'visible-export-withheld',
  'visible-collision-disabled',
  'no-generated-visible-proxy-meshes',
  'collision-master-low-poly'
]) {
  assert.equal(blenderValidation.checks.find(check => check.id === id)?.pass, true, id);
}

console.log('Meadow Wake terrain freeze and DCC handoff tests passed.');
