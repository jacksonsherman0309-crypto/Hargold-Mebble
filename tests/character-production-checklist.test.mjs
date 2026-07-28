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
const milestones = new Map(
  checklist.milestones.map((milestone) => [milestone.id, milestone])
);

assert.equal(checklist.schemaVersion, 1);
assert.deepEqual(
  GAME_RULES.characterPresentation.modelApprovalGate.approvedMilestones,
  ['silhouette', 'proportions', 'skeleton', 'connected-body']
);
for (const milestone of
  GAME_RULES.characterPresentation.modelApprovalGate.approvedMilestones) {
  assert.equal(milestones.get(milestone)?.status, 'approved');
}

assert.equal(
  GAME_RULES.characterPresentation.modelApprovalGate.activeMilestone,
  'joint-deformation'
);
assert.equal(milestones.get('joint-deformation')?.status, 'in-progress');
assert.equal(
  milestones.get('joint-deformation')?.automatedStructuralGate,
  'pass'
);
assert.equal(
  milestones.get('joint-deformation')?.visualStressGate,
  'pending'
);
assert.equal(
  milestones.get('final-animation-polish')?.status,
  'blocked-by-mesh-gates'
);
assert.match(checklist.animationPolishPolicy, /frozen/);

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
