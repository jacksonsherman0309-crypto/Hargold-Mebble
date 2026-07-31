import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relative => JSON.parse(readFileSync(path.join(ROOT, relative), 'utf8'));
const stage = readJson('data/production-character-rig-stage-0-1.json');
const semantic = readJson('data/production-character-rig-semantic-map.json');
const interimMap = readJson('data/animation-retarget-map.json');

async function sha256(relative) {
  const digest = createHash('sha256');
  const stream = createReadStream(path.join(ROOT, relative));
  for await (const chunk of stream) digest.update(chunk);
  return digest.digest('hex').toUpperCase();
}

test('Stage 0 preserves byte-identical live and rollback GLBs', async () => {
  for (const [hero, record] of Object.entries(stage.heroes)) {
    const live = stage.runtime.currentRuntimeAssets[hero];
    assert.ok(existsSync(path.join(ROOT, live)), `${hero} live GLB is missing`);
    assert.ok(existsSync(path.join(ROOT, record.rollback)), `${hero} rollback GLB is missing`);
    assert.equal(await sha256(live), record.liveAndRollbackSha256);
    assert.equal(await sha256(record.rollback), record.liveAndRollbackSha256);
    assert.equal(statSync(path.join(ROOT, live)).size, record.liveBytes);
    assert.equal(statSync(path.join(ROOT, record.rollback)).size, record.liveBytes);
  }
});

test('Stage 1 Blender sources and validation reports are real and internally consistent', async () => {
  for (const [hero, record] of Object.entries(stage.heroes)) {
    assert.ok(existsSync(path.join(ROOT, record.blend)), `${hero} blend is missing`);
    assert.ok(statSync(path.join(ROOT, record.blend)).size > 1_000_000);
    assert.equal(await sha256(record.blend), record.blendSha256);
    const report = readJson(record.sourceReport);
    const validation = readJson(record.validation);
    assert.equal(validation.pass, true);
    assert.equal(validation.actionCount, 0);
    assert.equal(validation.runtimeSwitchAuthorized, false);
    assert.equal(validation.finalAnimationAllowed, false);
    assert.equal(report.sourceImport.importedAnimationsRetainedInProductionSource, false);
    assert.equal(report.productionSource.lockedSurfaceObjectScale.join(','), '1,1,1');
    assert.ok(Math.abs(validation.surface.heightMetres - record.canonicalHeightMetres) < 0.00001);
    assert.ok(Math.abs(validation.surface.boundsMinimum[2]) < 0.00001);
    assert.equal(record.productionScaffold.skinned, false);
    assert.equal(record.productionScaffold.approved, false);
  }
});

test('semantic migration interface covers every interim rig bone without becoming live prematurely', () => {
  const interimBones = Object.keys(interimMap.identityBoneMap).sort();
  const mappedBones = Object.keys(semantic.interim24BoneMigrationMap).sort();
  assert.deepEqual(mappedBones, interimBones);
  assert.equal(semantic.runtimeUsesThisMap, false);
  assert.equal(semantic.status, 'stage-1-interface-draft-not-active-in-runtime');
  assert.ok(semantic.heroSpecificSemanticControls.Mebble.neckChain.length >= 3);
  assert.ok(semantic.heroSpecificSemanticControls.Mebble.capeChain.length >= 7);
  assert.ok(semantic.heroSpecificSemanticControls.Hargold.featherChain.length >= 2);
});

test('renderer remains on the interim live assets and has no candidate production path', () => {
  const renderer = readFileSync(path.join(ROOT, 'src/character-renderer.js'), 'utf8');
  assert.match(renderer, /hargold_canonical_gameplay_rig\.glb/);
  assert.match(renderer, /mebble_canonical_gameplay_rig\.glb/);
  assert.doesNotMatch(renderer, /assets\/exports\/production\/.*production_rig/i);
  assert.equal(stage.runtime.defaultAssetsChanged, false);
  assert.equal(stage.runtime.candidateAssetsEnabled, false);
  assert.equal(stage.gateMatrix.stage8FinalAnimationProductionAllowed, false);
});
