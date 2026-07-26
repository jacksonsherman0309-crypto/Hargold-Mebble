import assert from 'node:assert/strict';
import { MOVEMENT_STATES } from '../../src/gameplay/movement/movement-state-machine.js';
import { MOVEMENT_TUNING } from '../../src/gameplay/movement/movement-tuning.js';
import { dt, flatWorld, makeState, noInput, simulate, step } from './test-helpers.mjs';

const twirl = makeState({ grounded: false, footY: -4 });
twirl.velocityY = 3;
step(twirl, { jumpPressed: true, jumpHeld: true });
assert.equal(twirl.airTwirlUsed, true);
const remaining = twirl.airTwirlSeconds;
step(twirl, { jumpPressed: true, jumpHeld: true });
assert.ok(twirl.airTwirlSeconds < remaining);
simulate(twirl, 2, () => noInput);
assert.equal(twirl.airTwirlUsed, false);

const locked = makeState({ grounded: false, footY: -4, doubleJumpUnlocked: false });
locked.velocityY = 2;
step(locked, { jumpPressed: true, jumpHeld: true });
assert.equal(locked.doubleJumpUsed, false);
assert.equal(locked.movementState, MOVEMENT_STATES.TWIRL);

const unlocked = makeState({ grounded: false, footY: -4, doubleJumpUnlocked: true });
unlocked.velocityY = 2;
step(unlocked, { jumpPressed: true, jumpHeld: true });
assert.equal(unlocked.doubleJumpUsed, true);
const doubleSpeed = unlocked.velocityY;
step(unlocked, { jumpPressed: true, jumpHeld: true });
assert.ok(unlocked.velocityY > doubleSpeed, 'second press must not restart the double jump');

const groundedMebble = makeState({ hero: 'Mebble' });
step(groundedMebble, { jumpHeld: true });
assert.equal(groundedMebble.glide, 'closed');
const risingMebble = makeState({ hero: 'Mebble', grounded: false, footY: -4 });
risingMebble.velocityY = -3;
step(risingMebble, { jumpHeld: true });
assert.equal(risingMebble.glide, 'closed');
const gliding = makeState({ hero: 'Mebble', grounded: false, footY: -20 });
gliding.velocityY = 8;
simulate(gliding, 0.8, () => ({ ...noInput, jumpHeld: true }), {
  ...flatWorld,
  groundHeightAt: () => 100
});
assert.equal(gliding.glide, 'sustained');
assert.ok(gliding.velocityY <= MOVEMENT_TUNING.glideMaximumFallSpeed + 0.1);
simulate(gliding, MOVEMENT_TUNING.maximumGlideSeconds + 0.2, () => ({
  ...noInput,
  jumpHeld: true
}), {
  ...flatWorld,
  groundHeightAt: () => 100
});
assert.equal(gliding.glideExhausted, true);

const fastFall = makeState({ grounded: false, footY: -0.3 });
fastFall.airborneSeconds = 1;
fastFall.velocityY = 2;
step(fastFall, {
  downPressed: true,
  downHeld: true,
  groundSlamPressed: true,
  fastFallHeld: true
});
assert.equal(fastFall.groundSlamming, false);
assert.equal(fastFall.fastFalling, true);

const slam = makeState({ grounded: false, footY: -4 });
slam.airborneSeconds = MOVEMENT_TUNING.minimumGroundSlamAirSeconds;
slam.glide = 'sustained';
step(slam, { downPressed: true, downHeld: true, groundSlamPressed: true });
assert.equal(slam.groundSlamPhase, 'startup');
assert.equal(slam.glide, 'closed');
simulate(slam, MOVEMENT_TUNING.groundSlamPrepareSeconds + dt, () => noInput);
assert.equal(slam.groundSlamPhase, 'descent');
for (let index = 0; index < 240 && !slam.grounded; index += 1) step(slam);
assert.equal(slam.movementState, MOVEMENT_STATES.GROUND_SLAM_IMPACT);

const groundedSlam = makeState();
step(groundedSlam, { downPressed: true, downHeld: true, groundSlamPressed: true });
assert.equal(groundedSlam.groundSlamming, false);

console.log('Unified twirl, double-jump, glide, fast-fall, and slam checks passed.');
