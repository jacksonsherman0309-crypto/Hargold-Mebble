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

assert.equal(manifest.courseId, '1-1');
assert.match(manifest.status, /vertical-slice-wip/);

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
assert.match(renderer, /loadMeadowWakeAssets/);
assert.match(renderer, /meadow_wake_opening_environment\.glb/);
assert.match(renderer, /camp_critter\.glb/);
assert.match(renderer, /shellback\.glb/);
assert.match(renderer, /breakable_block\.glb/);
assert.match(renderer, /hargold_block\.glb/);
assert.match(renderer, /meadow_ledge\.glb/);
assert.match(renderer, /buildMeadowBlockVisual/);
assert.match(renderer, /chamferedBlockGeometry/);
assert.match(renderer, /hand-set-breakable-stone/);
assert.match(renderer, /volumetric-block-debris/);
assert.match(renderer, /block-reward-coin-pop/);
assert.match(renderer, /spent-block-body/);
assert.match(renderer, /MeadowWakeEnvironmentArt/);
assert.match(renderer, /environmentArt\.update\(cameraX, deltaSeconds\)/);
assert.match(environmentRenderer, /backgroundFar\.position\.x = -cameraX \* 0\.018/);
assert.match(environmentRenderer, /backgroundMid\.position\.x = -cameraX \* 0\.11/);
assert.match(environmentRenderer, /applyLedgeMaterials/);
assert.match(environmentRenderer, /configureColorTexture\(soil, \{ repeat: true \}\)/);
assert.match(renderer, /name === 'sprint'/);

for (const texture of Object.values(manifest.environmentTextures)) {
  if (!texture.endsWith?.('.png')) continue;
  const texturePath = new URL(`../assets/blender/world-1/${texture}`, import.meta.url);
  assert.ok(statSync(texturePath).size > 1_000_000, `${texture} must be a production-resolution texture`);
}

assert.match(characterManifest.status, /full-replacement/);
assert.match(characterManifest.status, /continuous-skin/);
assert.ok(characterManifest.sharedAnimationClipsRequired.includes('sprint'));
assert.ok(characterManifest.sharedAnimationClipsRequired.includes('crawl'));
assert.ok(characterManifest.sharedAnimationClipsRequired.includes('victory'));
for (const hero of ['Hargold', 'Mebble']) {
  const spec = characterManifest.characters[hero];
  assert.match(spec.status, /no-prior-geometry-reused/);
  assert.match(spec.status, /continuous-skin/);
  assert.ok(
    statSync(new URL(`../assets/blender/${spec.blend}`, import.meta.url)).size > 1_000_000,
    `${hero} replacement source must contain the modeled, rigged, textured asset`
  );
  assert.ok(
    statSync(new URL(`../assets/exports/${hero.toLowerCase()}_character.glb`, import.meta.url)).size > 5_000_000,
    `${hero} replacement GLB must contain the full animation library`
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
assert.match(deformableBuilder, /union-remeshed-continuous-surface/);
assert.match(deformableBuilder, /normalized-four-influence-skin/);
assert.match(characterValidator, /segmented rigid limb geometry is forbidden/);

const liveHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.match(liveHtml, /data-action="sprint"/);
assert.match(liveHtml, /block-production-1/);
assert.match(renderer, /continuous-skin-3/);

console.log(`Meadow Wake art pipeline checks passed from ${root}`);
