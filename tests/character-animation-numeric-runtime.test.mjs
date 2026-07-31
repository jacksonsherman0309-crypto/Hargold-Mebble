import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  CHARACTER_ANIMATION_NUMERIC_SPEC,
  LOCKED_RIG_BONES,
  LOCKED_RIG_SEMANTIC_AXIS_TABLE,
  airPoseWeights,
  createCharacterAnimationPresentationState,
  degreesToRadians,
  locomotionFootContacts,
  sampleDistanceDrivenGaitPose,
  sampleNumericCharacterPose,
  semanticPoseToLockedRigDeltas,
  updateCharacterAnimationPresentation
} from '../src/animation/character-animation-numeric-runtime.js';

const root = new URL('../', import.meta.url);
const runtimeSource = await readFile(
  new URL('src/animation/character-animation-numeric-runtime.js', root),
  'utf8'
);
const rendererSource = await readFile(
  new URL('src/character-renderer.js', root),
  'utf8'
);

assert.equal(new Set(Object.values(LOCKED_RIG_BONES)).size, 24);
assert.equal(LOCKED_RIG_SEMANTIC_AXIS_TABLE.leftKneeFlexionDeg.bone, 'LeftLeg');
assert.equal(LOCKED_RIG_SEMANTIC_AXIS_TABLE.rightKneeFlexionDeg.bone, 'RightLeg');
assert.equal(degreesToRadians(180), Math.PI);

const mapped = semanticPoseToLockedRigDeltas({
  torsoForwardLeanDeg: 18,
  leftKneeFlexionDeg: 90,
  rightElbowFlexionDeg: 45,
  torsoCompressionPercent: 10
}, { heroHeightUnits: 2 });
assert.equal(mapped.rotations.Spine02[0], degreesToRadians(18));
assert.equal(mapped.rotations.LeftLeg[0], degreesToRadians(90));
assert.equal(mapped.rotations.RightForeArm[0], degreesToRadians(-45));
assert.deepEqual(mapped.positions.Hips, [0, -0.2, 0]);

for (const hero of ['Hargold', 'Mebble']) {
  for (const gait of ['walk', 'run', 'fullSpeed']) {
    for (let step = 0; step <= 100; step += 1) {
      const pose = sampleDistanceDrivenGaitPose(hero, gait, step / 100);
      assert.ok((pose.leftKneeFlexionDeg ?? 0) <= 125);
      assert.ok((pose.rightKneeFlexionDeg ?? 0) <= 125);
      assert.ok((pose.leftElbowFlexionDeg ?? 0) <= 115);
      assert.ok((pose.rightElbowFlexionDeg ?? 0) <= 115);
    }
  }
}

assert.deepEqual(
  locomotionFootContacts('walk', 0.02),
  { left: true, right: false, axes: ['vertical', 'forward'] }
);
assert.deepEqual(
  locomotionFootContacts('run', 0.52),
  { left: false, right: true, axes: ['vertical', 'forward'] }
);
assert.deepEqual(
  locomotionFootContacts('fullSpeed', 0.3),
  { left: false, right: false, axes: ['vertical', 'forward'] }
);

function phaseAfterOneSecond(renderFps) {
  const state = {
    hero: 'Hargold',
    movementState: 'run',
    previousMovementState: 'run',
    stateSeconds: 1,
    velocityX: 4.8,
    velocityY: 0,
    footX: 0,
    footY: 0,
    grounded: true,
    animationPresentation: createCharacterAnimationPresentationState('Hargold')
  };
  const dt = 1 / renderFps;
  for (let frame = 0; frame < renderFps; frame += 1) {
    state.footX += state.velocityX * dt;
    updateCharacterAnimationPresentation(state, dt);
  }
  return state.animationPresentation.locomotionPhase;
}

const phase30 = phaseAfterOneSecond(30);
const phase60 = phaseAfterOneSecond(60);
const phase120 = phaseAfterOneSecond(120);
assert.ok(Math.abs(phase30 - phase60) < 1e-10);
assert.ok(Math.abs(phase60 - phase120) < 1e-10);

const requiredEvents = new Set();
const eventState = {
  hero: 'Mebble',
  movementState: 'walk',
  previousMovementState: 'walk',
  stateSeconds: 0,
  velocityX: 2.55,
  velocityY: 0,
  footX: 0,
  footY: 0,
  grounded: true,
  animationPresentation: createCharacterAnimationPresentationState('Mebble')
};
for (let frame = 0; frame < 50; frame += 1) {
  eventState.footX += eventState.velocityX / 60;
  updateCharacterAnimationPresentation(eventState, 1 / 60, {
    emit: type => requiredEvents.add(type)
  });
}
for (const marker of [
  'left-foot-contact',
  'left-toe-off',
  'right-foot-contact',
  'right-toe-off'
]) {
  assert.ok(requiredEvents.has(marker), `${marker} is emitted by phase crossing`);
}

const slideEvents = [];
const slideState = {
  ...eventState,
  movementState: 'duck-slide',
  previousMovementState: 'run',
  velocityX: 5.7,
  animationPresentation: createCharacterAnimationPresentationState('Mebble')
};
updateCharacterAnimationPresentation(slideState, 1 / 120, {
  emit: type => slideEvents.push(type)
});
assert.ok(slideEvents.includes('slide-enter'));

const air = airPoseWeights({
  verticalVelocity: 0,
  launchSpeed: 11.95,
  predictedGroundSeconds: 0.08
});
assert.equal(air.apex, 1);
assert.ok(air.landingPrep > 0);

const slam = sampleNumericCharacterPose({
  hero: 'Hargold',
  movementState: 'ground-slam-fall',
  stateSeconds: 0.2,
  verticalSpeed: 20
});
assert.ok((slam.semantic.leftKneeFlexionDeg ?? 0) > 0);
assert.ok((slam.semantic.rightKneeFlexionDeg ?? 0) > 0);
assert.ok((slam.semantic.leftAnklePlantarflexionDeg ?? 0) > 0);
assert.ok((slam.semantic.rightAnklePlantarflexionDeg ?? 0) > 0);

const doubleJump = sampleNumericCharacterPose({
  hero: 'Hargold',
  movementState: 'double-jump',
  stateSeconds: 6 / 60,
  verticalSpeed: -9.45
});
assert.equal(doubleJump.selectedPoseState, 'hargold_double_jump');
assert.ok((doubleJump.semantic.leftKneeFlexionDeg ?? 0) > 0);

const glide = sampleNumericCharacterPose({
  hero: 'Mebble',
  movementState: 'glide',
  stateSeconds: 0.4,
  verticalSpeed: 2.9
});
assert.equal(glide.selectedPoseState, 'mebble_glide_sustain');
assert.ok((glide.semantic.leftArmOutDeg ?? 0) > 0);
assert.ok((glide.semantic.rightArmOutDeg ?? 0) > 0);

assert.ok(
  CHARACTER_ANIMATION_NUMERIC_SPEC.timing.maximumResponsiveBlendSeconds <= 0.12
);
assert.match(rendererSource, /controller.*translation|WORLD TRANSLATION|root.position/i);
assert.match(rendererSource, /applyNumericPose/);
assert.doesNotMatch(runtimeSource, /\b(?:Mario|Luigi|Nintendo)\b/i);

console.log('Numeric semantic-pose runtime checks passed.');
