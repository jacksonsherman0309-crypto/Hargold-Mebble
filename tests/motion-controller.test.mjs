import assert from 'node:assert/strict';
import { FixedStepLoop } from '../src/runtime/fixed-step.js';
import { createLinearGround } from '../src/runtime/terrain/linear-ground.js';
import {
  createMotionState,
  motionBody,
  stepMotion,
  trySwapHero
} from '../src/runtime/motion/motion-controller.js';
import {
  PROVISIONAL_HERO_PROFILES,
  PROVISIONAL_MOTION_TUNING as TUNING
} from '../src/runtime/motion/motion-tuning.js';

const fixedStep = 1 / 120;
const flatGround = () => 0;
const noInput = Object.freeze({
  left: false,
  right: false,
  run: false,
  sprint: false,
  jumpPressed: false,
  jumpHeld: false,
  glideHeld: false
});

function simulate(state, seconds, inputForStep) {
  const steps = Math.round(seconds / fixedStep);
  for (let index = 0; index < steps; index += 1) {
    stepMotion(
      state,
      { ...noInput, ...inputForStep(index) },
      fixedStep,
      { groundHeightAt: flatGround }
    );
  }
  return state;
}

const runState = createMotionState();
simulate(runState, 1, () => ({ right: true, run: true }));
assert.ok(Math.abs(runState.velocityX - TUNING.runSpeed) < 1e-9);
assert.equal(runState.locomotion, 'run');

const sprintState = createMotionState();
simulate(sprintState, 1, () => ({ right: true, run: true, sprint: true }));
assert.ok(Math.abs(sprintState.velocityX - TUNING.sprintSpeed) < 1e-9);
assert.equal(sprintState.locomotion, 'sprint');

simulate(runState, 1, () => ({}));
assert.equal(runState.velocityX, 0);
assert.equal(runState.locomotion, 'idle');

const skidState = createMotionState();
skidState.velocityX = TUNING.runSpeed;
stepMotion(
  skidState,
  { ...noInput, left: true, run: true },
  fixedStep,
  { groundHeightAt: flatGround }
);
assert.equal(skidState.locomotion, 'skid');
assert.ok(skidState.velocityX < TUNING.runSpeed);

function jumpApex({ hero = 'Hargold', hold = true, run = false } = {}) {
  const state = createMotionState({ hero });
  if (run) state.velocityX = TUNING.runSpeed;
  let minimumFootY = 0;
  simulate(state, 1.5, index => ({
    right: run,
    run,
    jumpPressed: index === 0,
    jumpHeld: hold || index < 4,
    glideHeld: false
  }));
  minimumFootY = Math.min(minimumFootY, state.footY);

  const measured = createMotionState({ hero });
  if (run) measured.velocityX = TUNING.runSpeed;
  for (let index = 0; index < 180; index += 1) {
    stepMotion(
      measured,
      {
        ...noInput,
        right: run,
        run,
        jumpPressed: index === 0,
        jumpHeld: hold || index < 4
      },
      fixedStep,
      { groundHeightAt: flatGround }
    );
    minimumFootY = Math.min(minimumFootY, measured.footY);
  }
  return minimumFootY;
}

assert.ok(jumpApex({ hold: true }) < jumpApex({ hold: false }));
assert.ok(jumpApex({ run: true }) < jumpApex());
assert.ok(jumpApex({ hero: 'Mebble' }) < jumpApex({ hero: 'Hargold' }));

const coyoteState = createMotionState({ grounded: false, footY: -0.01 });
coyoteState.coyoteSeconds = TUNING.coyoteSeconds;
stepMotion(
  coyoteState,
  { ...noInput, jumpPressed: true, jumpHeld: true },
  fixedStep,
  { groundHeightAt: flatGround }
);
assert.ok(coyoteState.velocityY < 0, 'coyote jump should launch');

const bufferedState = createMotionState({ grounded: false, footY: -0.1 });
bufferedState.velocityY = 2;
stepMotion(
  bufferedState,
  { ...noInput, jumpPressed: true, jumpHeld: true },
  fixedStep,
  { groundHeightAt: flatGround }
);
for (let index = 0; index < 12 && !bufferedState.grounded; index += 1) {
  stepMotion(
    bufferedState,
    { ...noInput, jumpHeld: true },
    fixedStep,
    { groundHeightAt: flatGround }
  );
}
stepMotion(
  bufferedState,
  { ...noInput, jumpHeld: true },
  fixedStep,
  { groundHeightAt: flatGround }
);
assert.ok(bufferedState.velocityY < 0, 'buffered jump should launch after landing');

const glideState = createMotionState({
  hero: 'Mebble',
  grounded: false,
  footY: -5
});
glideState.velocityY = 4;
simulate(glideState, 0.5, () => ({ glideHeld: true, jumpHeld: true }));
assert.ok(glideState.velocityY <= TUNING.glideMaximumFallSpeed + fixedStep * TUNING.glideGravity);
assert.equal(glideState.glide, 'sustained');

const swapState = createMotionState({ footX: 4, footY: 7 });
const oldBody = motionBody(swapState);
const acceptedSwap = trySwapHero(swapState);
assert.equal(acceptedSwap.accepted, true);
assert.equal(swapState.hero, 'Mebble');
assert.equal(swapState.footX, 4);
assert.equal(swapState.footY, 7);
assert.ok(acceptedSwap.body.y < oldBody.y, 'taller swap grows upward from the feet');

const blockedState = createMotionState({ footX: 4, footY: 7 });
const blockedSwap = trySwapHero(blockedState, {
  canOccupy: candidate => candidate.height <= PROVISIONAL_HERO_PROFILES.Hargold.height
});
assert.equal(blockedSwap.accepted, false);
assert.equal(blockedState.hero, 'Hargold');
assert.equal(blockedState.footX, 4);
assert.equal(blockedState.footY, 7);

const slope = createLinearGround([[0, 0], [5, 1], [10, 0]]);
assert.equal(slope.heightAt(2.5), 0.5);
assert.ok(slope.angleAt(2.5) > 0);
assert.ok(slope.angleAt(7.5) < 0);

function deterministicReplay() {
  const loop = new FixedStepLoop({ hz: 120 });
  const state = createMotionState();
  for (const frameSeconds of [0.016, 0.018, 0.012, 0.024, 0.02, 0.01]) {
    loop.advance(frameSeconds, (deltaSeconds, stepIndex) => {
      stepMotion(
        state,
        {
          ...noInput,
          right: true,
          run: stepIndex > 2,
          jumpPressed: stepIndex === 3,
          jumpHeld: stepIndex < 14
        },
        deltaSeconds,
        { groundHeightAt: flatGround }
      );
    });
  }
  return state;
}

assert.deepEqual(deterministicReplay(), deterministicReplay());

assert.equal(PROVISIONAL_HERO_PROFILES.Hargold.status, 'proxy-collider-pending-production-mesh');
assert.equal(
  PROVISIONAL_HERO_PROFILES.Hargold.airControlMultiplier,
  PROVISIONAL_HERO_PROFILES.Mebble.airControlMultiplier,
  'both heroes use identical shared horizontal air-control tuning'
);
assert.equal(TUNING.status, 'provisional-engineering-tuning');

console.log('Modular motion extraction checks passed.');
