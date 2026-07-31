import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GAME_RULES } from '../src/canonical-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const relativePath =
  GAME_RULES.characterPresentation.modelApprovalGate.productionChecklist;
const checklist = JSON.parse(
  fs.readFileSync(path.join(root, relativePath), 'utf8')
);
const rigGate = JSON.parse(
  fs.readFileSync(
    path.join(root, 'data/rig-first-character-production-gate-2026-07-31.json'),
    'utf8'
  )
);
const milestones = new Map(
  checklist.milestones.map((milestone) => [milestone.id, milestone])
);

assert.equal(checklist.schemaVersion, 3);
assert.equal(checklist.authority, 'rig-first-character-production-gate-2026-07-31');
assert.equal(rigGate.coreDecision.finalAnimationProductionBlockedUntilRigGatesPass, true);
assert.equal(checklist.productionRigStages.stage0BaselinePreservation, 'pass');
assert.match(checklist.productionRigStages.stage1EditableBlenderSources, /created/);
assert.equal(checklist.productionRigStages.stage8FinalAnimationProduction, 'blocked');
assert.equal(milestones.get('silhouette')?.status, 'approved');
assert.equal(milestones.get('proportions')?.status, 'approved');
assert.match(milestones.get('skeleton')?.status, /interim-24-bone-runtime/);
assert.match(milestones.get('connected-body')?.status, /production-deformation-topology-pending/);
assert.equal(milestones.get('joint-deformation')?.status, 'blocked-until-production-rig-skinning');
assert.equal(
  milestones.get('joint-deformation')?.automatedStructuralGate,
  'locked-rig-and-bind-inventory-pass'
);
assert.equal(
  milestones.get('joint-deformation')?.visualStressGate,
  'live-gameplay-review-required'
);
assert.equal(
  milestones.get('final-animation-polish')?.status,
  'blocked-by-rig-first-gate'
);
assert.match(checklist.animationPolishPolicy, /paused-as-final-production/);
assert.equal(
  milestones.get('facial-topology')?.status,
  'blocked-by-locked-source-rig'
);
assert.equal(
  milestones.get('hand-topology')?.status,
  'blocked-by-locked-source-rig'
);
assert.deepEqual(
  milestones.get('final-animation-polish')?.runtimePresentationClipCounts,
  { Hargold: 41, Mebble: 43 }
);

for (const milestone of
  GAME_RULES.characterPresentation.modelApprovalGate.incompleteMilestones) {
  assert.notEqual(milestones.get(milestone)?.status, 'approved');
}

assert.deepEqual(
  Object.keys(milestones.get('joint-deformation').regions),
  ['shoulders', 'elbows', 'hips', 'knees', 'ankles']
);
for (const evidencePath of Object.values(
  milestones.get('joint-deformation').evidence
)) {
  assert.ok(
    fs.statSync(path.join(root, evidencePath)).size > 200_000,
    `${evidencePath} should contain a rendered stress board`
  );
}
assert.deepEqual(
  milestones.get('facial-topology').requiredLoops,
  [
    'eyelids', 'eyebrows', 'cheeks', 'nostrils',
    'mouth corners', 'upper lip', 'lower lip', 'jaw'
  ]
);

console.log('character production checklist tests passed');
