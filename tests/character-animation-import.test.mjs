import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const inventory = JSON.parse(await readFile(new URL('data/character-animation-inventory.json', root)));
const selection = JSON.parse(await readFile(new URL('data/character-rig-selection.json', root)));
const mapping = JSON.parse(await readFile(new URL('data/animation-state-mapping.json', root)));
const retarget = JSON.parse(await readFile(new URL('data/animation-retarget-map.json', root)));
const rendererSource = await readFile(new URL('src/character-renderer.js', root), 'utf8');
const debugSource = await readFile(new URL('src/animation/animation-debug-panel.js', root), 'utf8');

assert.equal(inventory.packages.length, 5);
assert.equal(new Set(inventory.packages.map(entry => entry.sha256)).size, 4);
assert.equal(inventory.unique3DAssetCount, 8);
assert.deepEqual(inventory.inspectionFailures, []);
assert.equal(inventory.assets.filter(asset => asset.actions.some(action => action.durationSeconds > 0)).length, 6);

for (const hero of ['Hargold', 'Mebble']) {
  assert.equal(selection[hero].canonicalRigName, `${hero}_Canonical_Gameplay_Rig`);
  assert.equal(selection[hero].runtimeClips.length, 2);
  assert.equal(selection[hero].runtimePolicy, undefined);
  const assetUrl = new URL(selection[hero].liveAsset, root);
  assert.ok((await stat(assetUrl)).size > 30_000_000);
}
assert.equal(selection.runtimePolicy.oneVisibleMeshPerHero, true);
assert.equal(selection.runtimePolicy.retargetingRequired, false);
assert.equal(retarget.retargetingRequiredForLiveGlbClips, false);
assert.equal(Object.keys(retarget.identityBoneMap).length, 24);
assert.equal(mapping.controllerPolicy.manualSprintAction, false);
assert.equal(mapping.requiredLiveStates.Walk.status, 'exact');
assert.equal(mapping.requiredLiveStates.Run.status, 'exact');
assert.equal(mapping.requiredLiveStates.JumpRise.status, 'missing-supplied-clip');
assert.deepEqual(mapping.debugOnlyClips, []);

function glbJson(buffer) {
  assert.equal(buffer.readUInt32LE(0), 0x46546c67);
  let offset = 12;
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    if (type === 0x4e4f534a) {
      return JSON.parse(buffer.subarray(offset + 8, offset + 8 + length).toString().trim());
    }
    offset += 8 + length;
  }
  throw new Error('missing GLB JSON chunk');
}

for (const [hero, expected] of [
  ['Hargold', ['hargold_walk', 'hargold_run']],
  ['Mebble', ['mebble_walk', 'mebble_run']]
]) {
  const document = glbJson(await readFile(new URL(selection[hero].liveAsset, root)));
  assert.equal(document.meshes.length, 1, `${hero} live GLB must contain one visible mesh`);
  assert.equal(document.skins.length, 1);
  assert.equal(document.skins[0].joints.length, 24);
  assert.deepEqual(document.animations.map(animation => animation.name).sort(), [...expected].sort());
  assert.ok(document.nodes.some(node => node.name === `${hero}_Canonical_Gameplay_Rig`));
  assert.ok(document.nodes.some(node => node.name === `${hero}_Approved_Mesh`));
}

assert.match(rendererSource, /hargold_canonical_gameplay_rig\.glb/);
assert.match(rendererSource, /mebble_canonical_gameplay_rig\.glb/);
assert.match(rendererSource, /setAnimationDebugOverride/);
for (const phrase of ['pause', 'scrub', 'speed', 'loop', 'facing', 'Restart clip']) {
  assert.match(debugSource, new RegExp(phrase, 'i'));
}

console.log('Meshy rig inventory, canonical GLBs, state mapping, and debug surface checks passed.');
