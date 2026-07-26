import assert from 'node:assert/strict';
import {
  createMotionState,
  stepMotion
} from '../src/runtime/motion/motion-controller.js';
import {
  PROVISIONAL_MOTION_TUNING as TUNING
} from '../src/runtime/motion/motion-tuning.js';

const dt = 1 / 120;
const groundHeightAt = () => 0;
const baseInput = Object.freeze({
  left: false,
  right: false,
  run: false,
  sprint: false,
  jumpPressed: false,
  jumpHeld: false,
  glideHeld: false,
  fastFallHeld: false,
  downHeld: false,
  downPressed: false,
  groundSlamPressed: false
});

function step(state, input = {}) {
  return stepMotion(state, { ...baseInput, ...input }, dt, { groundHeightAt });
}

const spinState = createMotionState({ grounded: false, footY: -3 });
spinState.velocityY = 6;
step(spinState, { jumpPressed: true, jumpHeld: true });
assert.equal(spinState.locomotion, 'air-spin');
assert.equal(spinState.spinUsed, true);
assert.ok(spinState.spinSeconds > 0);
assert.ok(spinState.velocityY <= TUNING.airSpinMaximumDownwardSpeed + dt * TUNING.fallGravity);

const firstSpinDuration = spinState.spinSeconds;
step(spinState, { jumpPressed: true, jumpHeld: true });
assert.ok(spinState.spinSeconds < firstSpinDuration, 'second mid-air jump press must not restart the twirl');

const slamState = createMotionState({ grounded: false, footY: -2 });
slamState.velocityX = TUNING.runSpeed;
slamState.velocityY = 2;
step(slamState, { downPressed: true, fastFallHeld: true });
assert.equal(slamState.groundSlamming, true);
assert.equal(slamState.locomotion, 'ground-slam');
assert.ok(slamState.velocityY >= TUNING.groundSlamSpeed);
assert.ok(Math.abs(slamState.velocityX) < TUNING.runSpeed);

for (let index = 0; index < 120 && !slamState.grounded; index += 1) step(slamState);
assert.equal(slamState.grounded, true);
assert.equal(slamState.groundSlamming, false);
assert.equal(slamState.groundSlamImpact, true);
assert.equal(slamState.locomotion, 'land-hard');

step(slamState);
assert.equal(slamState.groundSlamImpact, false, 'impact flag is a one-step event');

const resetSpinState = createMotionState();
step(resetSpinState, { jumpPressed: true, jumpHeld: true });
for (let index = 0; index < 20; index += 1) step(resetSpinState, { jumpHeld: true });
step(resetSpinState, { jumpPressed: true, jumpHeld: true });
assert.equal(resetSpinState.spinUsed, true);
for (let index = 0; index < 240 && !resetSpinState.grounded; index += 1) step(resetSpinState);
assert.equal(resetSpinState.spinUsed, false, 'landing restores one twirl for the next jump');

console.log('Unified mid-air twirl and ground-slam checks passed.');
