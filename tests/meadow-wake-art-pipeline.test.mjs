import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(readFileSync(
  new URL('../assets/blender/world-1/meadow-wake-vertical-slice-manifest.json', import.meta.url),
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
assert.match(renderer, /loadMeadowWakeAssets/);
assert.match(renderer, /meadow_wake_opening_environment\.glb/);
assert.match(renderer, /camp_critter\.glb/);
assert.match(renderer, /shellback\.glb/);
assert.match(renderer, /breakable_block\.glb/);
assert.match(renderer, /hargold_block\.glb/);
assert.match(renderer, /meadow_ledge\.glb/);
assert.match(renderer, /backgroundFar\.position\.x = -cameraX \* 0\.06/);
assert.match(renderer, /backgroundMid\.position\.x = -cameraX \* 0\.16/);

console.log(`Meadow Wake art pipeline checks passed from ${root}`);
