import assert from 'node:assert/strict';
import { MOVEMENT_TUNING } from '../../src/gameplay/movement/movement-tuning.js';
import { dt, jumpMetrics, makeState, noInput, simulate, step } from './test-helpers.mjs';

const tap = jumpMetrics({ holdSeconds: dt });
const held = jumpMetrics({ holdSeconds: 0.5 });
assert.ok(tap.height < held.height);

const buffered = makeState({ grounded: false, footY: -0.1 });
buffered.velocityY = 2;
step(buffered, { jumpPressed: true, jumpHeld: true });
for (let index = 0; index < 30 && buffered.velocityY >= 0; index += 1) {
  step(buffered, { jumpHeld: true });
}
assert.ok(buffered.velocityY < 0, 'landing buffer should relaunch without a new press');

const coyote = makeState({ grounded: false, footY: -0.1 });
coyote.coyoteSeconds = MOVEMENT_TUNING.coyoteSeconds;
step(coyote, { jumpPressed: true, jumpHeld: true });
assert.ok(coyote.velocityY < -MOVEMENT_TUNING.minimumJumpCutVelocity);

const expired = makeState({ grounded: false, footY: -3 });
expired.coyoteSeconds = MOVEMENT_TUNING.coyoteSeconds;
simulate(expired, MOVEMENT_TUNING.coyoteSeconds + dt, () => noInput, {
  groundHeightAt: () => 100,
  hasGroundAt: () => true
});
step(expired, { jumpPressed: true, jumpHeld: true }, {
  groundHeightAt: () => 100,
  hasGroundAt: () => true
});
assert.ok(!expired.events.some(event => event.type === 'jump-takeoff'));

const standing = jumpMetrics({ holdSeconds: 0.5 });
const running = jumpMetrics({ holdSeconds: 0.5, velocityX: MOVEMENT_TUNING.runSpeed });
assert.ok(running.distance > standing.distance + 2);

console.log('Unified variable jump, buffer, coyote, and momentum checks passed.');
