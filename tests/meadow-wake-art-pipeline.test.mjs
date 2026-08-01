import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(readFileSync(
  new URL('../assets/blender/world-1/meadow-wake-vertical-slice-manifest.json', import.meta.url),
  'utf8'
));
const characterManifest = JSON.parse(readFileSync(
  new URL('../assets/blender/character-production-manifest.json', import.meta.url),
  'utf8'
));
const approvedCharacterTarget = new URL(
  '../assets/references/Hargold and Mebble approved production target.png',
  import.meta.url
);
const {
  MEADOW_WAKE_GAMEPLAY_LANDMARKS,
  MEADOW_WAKE_ROOM_FINISH_PROFILES,
  MEADOW_WAKE_SCENERY_BEATS,
  MEADOW_WAKE_SCENERY_PROPS,
  MEADOW_WAKE_MIDGROUND_LANDMARKS,
  meadowWakeSceneryCoverage
} = await import('../src/content/meadow-wake-scenery.js');

assert.equal(manifest.courseId, '1-1');
assert.match(manifest.status, /environment-finish-wip/);

for (const asset of Object.values(manifest.assets)) {
  const sourcePath = new URL(`../assets/blender/world-1/${asset.source}`, import.meta.url);
  const runtimePath = new URL(`../assets/blender/world-1/${asset.runtime}`, import.meta.url);
  assert.ok(statSync(sourcePath).size > 30_000, `${asset.source} must be a real editable Blender source`);
  assert.ok(statSync(runtimePath).size > 20_000, `${asset.runtime} must be a non-empty GLB`);
}

const renderer = readFileSync(new URL('../src/character-renderer.js', import.meta.url), 'utf8');
const environmentRenderer = readFileSync(
  new URL('../src/environment/meadow-wake-environment.js', import.meta.url),
  'utf8'
);
const foregroundRenderer = readFileSync(
  new URL('../src/environment/meadow-wake-foreground.js', import.meta.url),
  'utf8'
);
assert.match(renderer, /loadMeadowWakeAssets/);
assert.match(renderer, /meadow_wake_opening_environment\.glb/);
assert.match(renderer, /camp_critter\.glb/);
assert.match(renderer, /shellback\.glb/);
assert.match(renderer, /breakable_block\.glb/);
assert.match(renderer, /hargold_block\.glb/);
assert.match(renderer, /meadow_ledge\.glb/);
assert.match(renderer, /verdant_vale_terrain_kit\.glb/);
assert.match(renderer, /installProductionTerrainKit/);
assert.match(renderer, /buildMeadowBlockVisual/);
assert.match(renderer, /chamferedBlockGeometry/);
assert.match(renderer, /hand-set-breakable-stone/);
assert.match(renderer, /volumetric-block-debris/);
assert.match(renderer, /block-reward-coin-pop/);
assert.match(renderer, /spawnCoinCollectionEffect/);
assert.match(renderer, /coin-collection-spark/);
assert.match(renderer, /spent-block-body/);
assert.match(renderer, /MeadowWakeEnvironmentArt/);
assert.match(renderer, /MeadowWakeForegroundArt/);
assert.match(renderer, /environmentArt\.update\(cameraX, cameraY, deltaSeconds\)/);
assert.match(renderer, /MEADOW_WAKE_TERRAIN_MODULES/);
assert.match(renderer, /buildTerrainModules/);
assert.doesNotMatch(renderer, /terrainStrip\('authored-continuous-terrain'/);
assert.match(renderer, /camera\.zoom = 1\.04/);
assert.match(environmentRenderer, /backgroundFar\.position\.x = -cameraX \* 0\.018/);
assert.match(environmentRenderer, /backgroundMid\.position\.x = -cameraX \* 0\.11/);
assert.match(environmentRenderer, /waterfallRibbonGeometry/);
assert.match(environmentRenderer, /MEADOW_WAKE_MIDGROUND_LANDMARKS/);
assert.match(environmentRenderer, /applyLedgeMaterials/);
assert.match(environmentRenderer, /configureColorTexture\(soil, \{ repeat: true \}\)/);
assert.match(foregroundRenderer, /buildAuthoredScenery/);
assert.match(foregroundRenderer, /buildCourseMarker/);
assert.match(foregroundRenderer, /rope-bridge-handcut-plank/);
assert.match(foregroundRenderer, /animated-creek-cascade/);
assert.match(foregroundRenderer, /reinforced-gate/);
assert.match(foregroundRenderer, /createVerdantTerrainBodyGeometry/);
assert.match(foregroundRenderer, /MeadowWake_AuthoredModularTerrainSystem/);
assert.match(foregroundRenderer, /MeadowWake_HandcraftedLandformFeatures/);
assert.match(foregroundRenderer, /modeled-verdant-vale-earth-relief/);
assert.match(foregroundRenderer, /modeled-grass-overhang-cap/);
assert.match(foregroundRenderer, /authored-clay-and-loam-strata/);
assert.match(foregroundRenderer, /fractured-readable-cliff-edge/);
assert.match(foregroundRenderer, /MeadowWake_AuthoredCarvedTrailBands/);
assert.match(foregroundRenderer, /room-batched-instanced-dressing/);
assert.match(foregroundRenderer, /continuous-sculpted-landform-shoulder/);
assert.match(foregroundRenderer, /hmWindTime/);
assert.match(foregroundRenderer, /activeCompositionGroups/);
assert.match(foregroundRenderer, /consolidateStaticRoomScenery/);
assert.match(foregroundRenderer, /static-shared-material-per-authored-room/);
assert.match(foregroundRenderer, /watermill-shallow-animated-mill-race/);
assert.match(foregroundRenderer, /goal-gate-handlaid-pier-stone/);
assert.equal(MEADOW_WAKE_SCENERY_BEATS.length, 7);
assert.equal(MEADOW_WAKE_GAMEPLAY_LANDMARKS.length, 12);
assert.equal(MEADOW_WAKE_ROOM_FINISH_PROFILES.length, 12);
assert.equal(meadowWakeSceneryCoverage().length, 7);
assert.ok(MEADOW_WAKE_SCENERY_PROPS.length >= 40);
assert.ok(MEADOW_WAKE_MIDGROUND_LANDMARKS.length >= 7);
assert.ok(
  MEADOW_WAKE_SCENERY_BEATS.every(beat => beat.props.length >= 4),
  'every authored Meadow Wake beat must carry its own scenery finish'
);
assert.match(renderer, /animationIntentFor/);
assert.match(renderer, /importedClipMetadata/);
assert.match(renderer, /ACTION_REVEAL_DEGREES/);
assert.match(renderer, /GAME_PIXELS_PER_METRE/);
assert.match(renderer, /assetHeightMetres/);
assert.match(renderer, /GAME_PIXELS_PER_METRE \* \(spec\.assetHeightMetres \/ rawHeight\)/);
assert.doesNotMatch(renderer, /scale\.x\s*=\s*direction/);
assert.match(renderer, /model\.root\.scale\.setScalar\(model\.baseScale\)/);
assert.match(renderer, /model\.currentYaw \+= yawDelta/);
assert.doesNotMatch(renderer, /model\.baseScale \* direction/);

for (const texture of Object.values(manifest.environmentTextures)) {
  if (!texture.endsWith?.('.png')) continue;
  const texturePath = new URL(`../assets/blender/world-1/${texture}`, import.meta.url);
  assert.ok(statSync(texturePath).size > 1_000_000, `${texture} must be a production-resolution texture`);
}

assert.match(characterManifest.status, /locked-original-meshy-rigs-active/);
assert.match(characterManifest.activeRuntimeStatus, /locked-original-meshy-body-animation-library-active/);
assert.equal(characterManifest.references.ApprovedPairTarget.status, 'present-approved-2026-07-25');
assert.ok(statSync(approvedCharacterTarget).size > 2_000_000);
assert.equal(characterManifest.dimensionalPresentation.classification, '2.75D');
assert.equal(characterManifest.dimensionalPresentation.negativeScaleMirroringForbidden, true);
assert.ok(characterManifest.requiredValidationViews.includes('gameplay-three-quarter-side'));
assert.ok(characterManifest.requiredValidationActions.includes('physical-direction-reversal'));
assert.ok(characterManifest.requiredValidationActions.includes('Mebble-glide'));
assert.equal(characterManifest.lockedAssetPolicy.replaceVisibleMesh, false);
assert.equal(characterManifest.lockedAssetPolicy.selectDifferentBaseRig, false);
assert.equal(characterManifest.lockedAssetPolicy.retargetRejectedProceduralActions, false);
for (const hero of ['Hargold', 'Mebble']) {
  const spec = characterManifest.characters[hero];
  assert.match(spec.status, /locked-original-meshy-rig-active/);
  assert.equal(spec.rig.bones, 24);
  assert.equal(spec.rig.morphTargets, 0);
  assert.equal(spec.rig.suppliedClips.length, 2);
  assert.ok(
    statSync(new URL(`../assets/blender/${spec.runtime}`, import.meta.url)).size > 30_000_000,
    `${hero} locked Meshy runtime GLB must exist`
  );
}

const deformableBuilder = readFileSync(
  new URL('../tools/blender/build_deformable_characters.py', import.meta.url),
  'utf8'
);
const characterValidator = readFileSync(
  new URL('../tools/blender/validate_locked_character.py', import.meta.url),
  'utf8'
);
const motionValidator = readFileSync(
  new URL('../tools/blender/validate_character_motion.py', import.meta.url),
  'utf8'
);
assert.match(deformableBuilder, /union-remeshed-continuous-surface/);
assert.match(deformableBuilder, /normalized-four-influence-skin/);
assert.match(deformableBuilder, /deprecated for production/);
assert.match(characterValidator, /segmented rigid limb geometry is forbidden/);
assert.match(motionValidator, /motionRangeByFamily/);
assert.match(motionValidator, /finalApprovalEligible/);

const liveHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.doesNotMatch(liveHtml, /data-action="sprint"/);
assert.match(liveHtml, /verdant-terrain-12/);
assert.match(renderer, /canonical_gameplay_rig\.glb/);

console.log(`Meadow Wake art pipeline checks passed from ${root}`);
