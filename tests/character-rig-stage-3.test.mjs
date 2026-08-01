import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relative => JSON.parse(readFileSync(path.join(ROOT, relative), 'utf8'));
const stage = readJson('data/production-character-rig-stage-3.json');

async function sha256(relative) {
  const digest = createHash('sha256');
  const stream = createReadStream(path.join(ROOT, relative));
  for await (const chunk of stream) digest.update(chunk);
  return digest.digest('hex').toUpperCase();
}

test('Stage 3 sources are versioned but remain explicitly unapproved and offline', async () => {
  assert.equal(stage.status, 'stage-3-in-progress-visual-deformation-gate-failed');
  assert.equal(stage.gateResult.stage3StructuralImplementation, 'pass');
  assert.equal(stage.gateResult.stage3VisualDeformationQuality, 'fail');
  assert.equal(stage.gateResult.stage3Overall, 'in-progress');
  assert.equal(stage.gateResult.runtimeSwitchAuthorized, false);
  assert.equal(stage.gateResult.finalAnimationAllowed, false);
  for (const record of Object.values(stage.heroes)) {
    assert.ok(existsSync(path.join(ROOT, record.source)));
    assert.equal(await sha256(record.source), record.sha256);
    assert.equal(statSync(path.join(ROOT, record.source)).size, record.bytes);
  }
});

test('Stage 3 inventories preserve identity and contain bounded normalized skinning', () => {
  for (const record of Object.values(stage.heroes)) {
    const inventory = readJson(record.inventory);
    assert.equal(inventory.status, 'stage-3-in-progress-visual-deformation-gate-failed');
    assert.equal(inventory.stage3Pass, false);
    assert.equal(inventory.lockedIdentity.changed, false);
    assert.equal(inventory.lockedIdentity.basePositionsTopologyMaterialsUvsPreserved, true);
    assert.equal(inventory.skinning.maximumInfluences <= 4, true);
    assert.equal(inventory.skinning.maximumWeightSumError < 1e-5, true);
    assert.equal(inventory.correctives.length, 13);
    assert.equal(inventory.stressPoseReview.poseCount, 14);
    assert.equal(inventory.actions, 0);
    assert.equal(inventory.candidateExportAllowed, false);
    assert.equal(inventory.runtimeSwitchAuthorized, false);
    assert.equal(inventory.finalAnimationAllowed, false);
    assert.ok(inventory.unresolvedStage3Issues.length >= 2);
  }
});

test('machine checks pass while the visual deformation gate remains failed', () => {
  for (const record of Object.values(stage.heroes)) {
    const validation = readJson(record.validation);
    assert.equal(validation.structuralChecksPass, true);
    assert.equal(validation.stage3GatePass, false);
    assert.equal(validation.summary.checks, 18);
    assert.equal(validation.summary.failed, 0);
    assert.deepEqual(validation.errors, []);
    assert.ok(validation.blockedReasons.length >= 2);
  }
});

test('actual-mesh stress evidence is substantial and cannot be mistaken for Stage 5 approval', () => {
  for (const record of Object.values(stage.heroes)) {
    assert.ok(existsSync(path.join(ROOT, record.stressSheet)));
    assert.ok(statSync(path.join(ROOT, record.stressSheet)).size > 1_000_000);
    const inventory = readJson(record.inventory);
    assert.equal(inventory.stressPoseReview.actualProductionMesh, true);
    assert.equal(inventory.stressPoseReview.actualProductionRig, true);
    assert.equal(inventory.stressPoseReview.stage5ApprovalImplied, false);
  }
});
