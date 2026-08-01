import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relative => JSON.parse(readFileSync(path.join(ROOT, relative), 'utf8'));
const stage = readJson('data/production-character-rig-stage-1.json');
const stage2 = readJson('data/production-character-rig-stage-2.json');
const semantic = readJson('data/production-character-rig-semantic-map.json');

async function sha256(relative) {
  const digest = createHash('sha256');
  const stream = createReadStream(path.join(ROOT, relative));
  for await (const chunk of stream) digest.update(chunk);
  return digest.digest('hex').toUpperCase();
}

test('Stage 1 evidence remains coherent after the authorized Stage 2 upgrade', async () => {
  assert.equal(stage.status, 'stage-1-pass-ready-for-stage-2-no-skinning');
  assert.equal(stage.gateResult.stage1SourceIntegrity, 'pass');
  assert.equal(stage.gateResult.stage2PurposefulSkeletonAndControlArchitecture, 'not-started');
  assert.equal(stage.gateResult.stage3SkinningTopologyAndCorrectives, 'not-started');
  assert.equal(stage.gateResult.runtimeSwitchAuthorized, false);
  assert.equal(stage.gateResult.finalAnimationAllowed, false);
  for (const [hero, record] of Object.entries(stage.heroes)) {
    const inventory = readJson(record.inventory);
    assert.equal(inventory.sourceFile.sha256, record.sha256);
    assert.equal(inventory.sourceFile.bytes, record.bytes);
    assert.ok(existsSync(path.join(ROOT, stage2.heroes[hero].source)), `${hero} Stage 2 Blender source is missing`);
    assert.equal(await sha256(stage2.heroes[hero].source), stage2.heroes[hero].sha256);
    assert.equal(record.objectScale.join(','), '1,1,1');
    assert.equal(record.floorZ, 0);
    assert.equal(record.stage1Pass, true);
    assert.deepEqual(record.unresolvedScaffoldIssues, []);
  }
});

test('Stage 1 inventories record complete hierarchy, roll, classification, and pose evidence', () => {
  for (const [hero, record] of Object.entries(stage.heroes)) {
    const inventory = readJson(record.inventory);
    const validation = readJson(record.validation);
    assert.equal(inventory.stage1Pass, true);
    assert.equal(inventory.stage2Started, false);
    assert.equal(inventory.stage3Started, false);
    assert.equal(inventory.finalAnimationAllowed, false);
    assert.equal(inventory.sourceFile.opensWithoutMissingDependencies, true);
    assert.deepEqual(inventory.sourceFile.missingDependencies, []);
    assert.equal(inventory.lockedBaseline.visibleIdentityChanged, false);
    assert.equal(inventory.lockedBaseline.meshMaterialTopologyOrUvFingerprintChanged, false);
    assert.equal(inventory.armature.boneRollAudit.pass, true);
    assert.equal(inventory.armature.hierarchyAudit.pass, true);
    assert.equal(inventory.poseReview.poseCount, 10);
    assert.equal(inventory.poseReview.allMechanicallyAchievable, true);
    assert.equal(inventory.armature.hierarchy.length,
      record.counts.bodyDeform + record.counts.accessoryDeform + record.counts.controls + record.counts.helpers);
    assert.equal(inventory.sockets.length, 12);
    assert.equal(validation.pass, true);
    assert.equal(validation.actionCount, 0);
    assert.equal(validation.boneRollAuditPass, true);
    assert.equal(validation.hierarchyAuditPass, true);
    assert.equal(validation.staticScaffoldPosePass, true);
    assert.deepEqual(validation.errors, []);
  }
});

test('Stage 1 uses the canonical organization and deliberate coordinate convention', () => {
  assert.deepEqual(stage.sourceOrganization, [
    'CHARACTER_MESH',
    'DEFORM_RIG',
    'CONTROL_RIG',
    'HELPER_CONTROLS',
    'ACCESSORY_RIG',
    'FACIAL_SYSTEM',
    'SOCKETS',
    'VALIDATION_POSES',
    'EXPORT',
    'REFERENCE_ONLY'
  ]);
  assert.equal(stage.coordinateConvention.units, 'metres');
  assert.equal(stage.coordinateConvention.worldUp, '+Z');
  assert.equal(stage.coordinateConvention.nativeForward, '-Y');
  assert.equal(stage.coordinateConvention.origin, 'between-feet-on-ground-z0');
  assert.equal(stage.coordinateConvention.boneLongitudinalAxis, 'LOCAL_Y');
  assert.equal(stage.coordinateConvention.sideViewBendAxis, 'LOCAL_X');
  assert.equal(stage.coordinateConvention.negativeScaleMirroring, false);
});

test('current semantic map supersedes the Stage 1 plan without becoming live', () => {
  assert.equal(semantic.schemaVersion, 2);
  assert.equal(semantic.status, 'stage-2-complete-not-active-in-runtime-stage-3-blocked');
  assert.equal(semantic.runtimeUsesThisMap, false);
  assert.equal(semantic.shared.upperSpine, 'CTRL_spine_upper');
  assert.equal(semantic.heroes.Hargold.feet.L.control, 'CTRL_foot_ik.L');
  assert.equal(semantic.heroes.Hargold.accessories.DEF_scarf_root.control, 'CTRL_scarf');
  assert.equal(semantic.heroes.Mebble.actions.mebbleGlide.control, 'CTRL_cape');
  assert.equal(semantic.heroes.Hargold.sockets.groundSlamImpact, 'SOCKET_ground_slam_impact');
  assert.equal(semantic.heroes.Hargold.sockets.scarfOrigin, 'SOCKET_scarf_origin');
  assert.equal(semantic.heroes.Mebble.sockets.capeOrigin, 'SOCKET_cape_origin');
});

test('static pose sheets are real validation artifacts, not animation actions', () => {
  for (const record of Object.values(stage.heroes)) {
    const image = path.join(ROOT, record.poseSheet);
    assert.ok(existsSync(image));
    assert.ok(statSync(image).size > 25_000);
  }
  assert.equal(stage.exportConfiguration.animations, false);
  assert.equal(stage.exportConfiguration.candidateExportAllowed, false);
  assert.equal(stage.exportConfiguration.normalGameplayRootMotion, false);
});
