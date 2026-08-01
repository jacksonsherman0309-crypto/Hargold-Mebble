import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relative => JSON.parse(readFileSync(path.join(ROOT, relative), 'utf8'));
const stage = readJson('data/production-character-rig-stage-2.json');
const semantic = readJson('data/production-character-rig-semantic-map.json');

async function sha256(relative) {
  const digest = createHash('sha256');
  const stream = createReadStream(path.join(ROOT, relative));
  for await (const chunk of stream) digest.update(chunk);
  return digest.digest('hex').toUpperCase();
}

test('Stage 2 sources are versioned, hashed, unskinned, and remain offline', async () => {
  assert.equal(stage.status, 'stage-2-pass-unskinned-stage-3-not-authorized-final-animation-blocked');
  assert.equal(stage.gateResult.stage2FinalDeformHierarchy, 'pass');
  assert.equal(stage.gateResult.stage2AnimatorControls, 'pass');
  assert.equal(stage.gateResult.stage2IkFkAndSnapping, 'pass');
  assert.equal(stage.gateResult.stage3SkinningTopologyCorrectives, 'not-started-not-authorized');
  assert.equal(stage.gateResult.runtimeSwitchAuthorized, false);
  assert.equal(stage.gateResult.finalAnimationAllowed, false);
  for (const [hero, record] of Object.entries(stage.heroes)) {
    assert.ok(existsSync(path.join(ROOT, record.source)), `${hero} Blender source missing`);
    assert.equal(await sha256(record.source), record.sha256);
    assert.equal(statSync(path.join(ROOT, record.source)).size, record.bytes);
    assert.equal(record.unskinned, true);
    assert.equal(record.actions, 0);
    assert.equal(record.stage2Pass, true);
    assert.equal(record.validationSummary.failed, 0);
  }
});

test('inventories separate export deforms, controls, helpers, and sockets', () => {
  const expected = {
    Hargold: { bodyDeform: 44, accessoryDeform: 10, animatorControls: 76, helpers: 24, sockets: 17, controlTestPoses: 34 },
    Mebble: { bodyDeform: 46, accessoryDeform: 16, animatorControls: 78, helpers: 24, sockets: 17, controlTestPoses: 35 }
  };
  for (const [hero, record] of Object.entries(stage.heroes)) {
    const inventory = readJson(record.inventory);
    const validation = readJson(record.validation);
    assert.deepEqual(record.counts, expected[hero]);
    assert.equal(inventory.stage2Pass, true);
    assert.equal(inventory.stage3Started, false);
    assert.equal(inventory.stage3Authorized, false);
    assert.equal(inventory.finalAnimationAllowed, false);
    assert.equal(inventory.lockedBaseline.visibleIdentityChanged, false);
    assert.equal(inventory.lockedBaseline.meshMaterialTopologyOrUvFingerprintChanged, false);
    assert.equal(inventory.exportConfiguration.candidateExportAllowed, false);
    assert.equal(inventory.exportConfiguration.animations, false);
    assert.equal(inventory.exportConfiguration.animatorControlsExported, false);
    assert.equal(inventory.exportConfiguration.helpersExported, false);
    assert.equal(inventory.poseReview.allControlsOnly, true);
    assert.equal(inventory.poseReview.allMechanicallyReachable, true);
    assert.equal(inventory.poseReview.allSolverFlipChecksPassed, true);
    assert.equal(validation.pass, true);
    assert.equal(validation.summary.failed, 0);
    assert.deepEqual(validation.errors, []);
    assert.equal(new Set([...inventory.deformBones, ...inventory.accessoryDeformBones, ...inventory.animatorControls, ...inventory.helpers]).size,
      inventory.deformBones.length + inventory.accessoryDeformBones.length + inventory.animatorControls.length + inventory.helpers.length);
  }
});

test('all four limbs expose non-stretching IK/FK, poles, and snapping', () => {
  for (const record of Object.values(stage.heroes)) {
    const inventory = readJson(record.inventory);
    for (const side of ['L', 'R']) {
      const arm = inventory.ikFk.arms[side];
      const leg = inventory.ikFk.legs[side];
      assert.deepEqual(arm.range, [0, 1]);
      assert.deepEqual(leg.range, [0, 1]);
      assert.equal(arm.stretch, false);
      assert.equal(leg.stretch, false);
      assert.match(arm.pole, /elbow_pole/);
      assert.match(leg.pole, /knee_pole/);
      assert.equal(inventory.footControls[side].properties.includes('groundSlamContact'), true);
      assert.equal(inventory.handControls[side].blendable, true);
      assert.deepEqual(inventory.handControls[side].poses, ['relaxedOpen','runningCup','fist','landingBrace','skidBrace','strike','grab','carry','victory']);
    }
  }
});

test('semantic map version 2 completely resolves each production rig without becoming live', () => {
  assert.equal(semantic.schemaVersion, 2);
  assert.equal(semantic.runtimeUsesThisMap, false);
  assert.equal(semantic.rawExportNamesAllowedInGameplayLogic, false);
  assert.equal(semantic.controllerOwnsWorldTranslation, true);
  assert.equal(semantic.normalGameplayRootMotion, false);
  for (const [hero, record] of Object.entries(stage.heroes)) {
    const inventory = readJson(record.inventory);
    const mapped = semantic.heroes[hero];
    assert.deepEqual(new Set(mapped.allExportDeforms), new Set([...inventory.deformBones, ...inventory.accessoryDeformBones]));
    assert.deepEqual(new Set(mapped.allAnimatorControls), new Set(inventory.animatorControls));
    assert.deepEqual(new Set(mapped.allHelpers), new Set(inventory.helpers));
    assert.equal(Object.keys(mapped.sockets).length, 17);
  }
  assert.equal(semantic.heroes.Hargold.actions.hargoldTwirl, 'CTRL_twirl_presentation');
  assert.equal('hargoldTwirl' in semantic.heroes.Mebble.actions, false);
  assert.equal('mebbleGlide' in semantic.heroes.Hargold.actions, false);
  assert.equal(semantic.heroes.Mebble.actions.mebbleGlide.control, 'CTRL_cape');
  assert.equal(semantic.rollback.runtimeSwitchAuthorized, false);
});

test('control pose sheets are substantial evidence, not animation actions', () => {
  for (const record of Object.values(stage.heroes)) {
    const image = path.join(ROOT, record.poseSheet);
    assert.ok(existsSync(image));
    assert.ok(statSync(image).size > 25_000);
  }
});
