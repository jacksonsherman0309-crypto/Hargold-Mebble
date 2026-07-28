import assert from 'node:assert/strict';
import { MOVEMENT_STATES } from '../../src/gameplay/movement/movement-state-machine.js';
import { MOVEMENT_TUNING } from '../../src/gameplay/movement/movement-tuning.js';
import { makeState, noInput, simulate, step } from './test-helpers.mjs';

function terminal(input) {
  const state = makeState();
  simulate(state, 2, () => ({ ...noInput, right: true, ...input }));
  return state;
}

const automaticFullSpeed = terminal({});
const obsoleteButtonsIgnored = terminal({ run: true, sprint: true });
assert.ok(
  Math.abs(automaticFullSpeed.velocityX - MOVEMENT_TUNING.sprintSpeed) < 0.03,
  'directional hold must reach the existing full-speed tier without a sprint button'
);
assert.ok(
  Math.abs(obsoleteButtonsIgnored.velocityX - automaticFullSpeed.velocityX) < 1e-9,
  'legacy run/sprint flags may not change live target speed'
);

const coasting = terminal({});
const beforeRelease = coasting.velocityX;
step(coasting);
assert.ok(coasting.velocityX > 0 && coasting.velocityX < beforeRelease);

const lowReverse = makeState();
lowReverse.velocityX = MOVEMENT_TUNING.skidThreshold * 0.5;
step(lowReverse, { left: true, run: true });
assert.notEqual(lowReverse.movementState, MOVEMENT_STATES.SKID);

const highReverse = terminal({});
step(highReverse, { left: true });
assert.equal(highReverse.movementState, MOVEMENT_STATES.SKID);

const uphill = makeState();
const downhill = makeState();
const sloped = angle => ({
  groundHeightAt: () => 0,
  hasGroundAt: () => true,
  surfaceAt: () => ({ angle, normal: { x: Math.sin(angle), y: -Math.cos(angle) } })
});
simulate(uphill, 2, () => ({ ...noInput, right: true }), sloped(-0.3));
simulate(downhill, 2, () => ({ ...noInput, right: true }), sloped(0.3));
assert.ok(downhill.velocityX > uphill.velocityX);

console.log('Unified acceleration, coasting, skid, and slope checks passed.');
