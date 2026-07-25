import assert from 'node:assert/strict';
import { FixedStepLoop } from '../src/runtime/fixed-step.js';

const loop = new FixedStepLoop({ hz: 120 });
let calls = 0;
let accumulated = 0;

for (let frame = 0; frame < 60; frame += 1) {
  loop.advance(1 / 60, stepSeconds => {
    calls += 1;
    accumulated += stepSeconds;
  });
}

assert.equal(calls, 120, 'one rendered second at 60 Hz should produce 120 simulation steps');
assert.ok(Math.abs(accumulated - 1) < 1e-10);
assert.ok(Math.abs(loop.simulationTime - 1) < 1e-10);

const firstReplay = [];
const secondReplay = [];
const replayFrames = [0.016, 0.017, 0.012, 0.024, 0.01, 0.021];

for (const output of [firstReplay, secondReplay]) {
  const replayLoop = new FixedStepLoop({ hz: 120 });
  let state = 0;
  for (const elapsed of replayFrames) {
    replayLoop.advance(elapsed, (dt, stepIndex) => {
      state += (stepIndex % 3 === 0 ? 2 : -0.5) * dt;
      output.push(state);
    });
  }
}

assert.deepEqual(firstReplay, secondReplay, 'identical frame/input sequence must be deterministic');

const clamped = new FixedStepLoop({ hz: 120, maximumFrameSeconds: 0.1, maximumStepsPerFrame: 20 });
const result = clamped.advance(5, () => {});
assert.equal(result.frameWasClamped, true);
assert.ok(result.executedSteps <= 20);
assert.equal(clamped.clampedFrameCount, 1);

assert.throws(() => new FixedStepLoop({ hz: 0 }), /hz/);
assert.throws(() => loop.advance(-1, () => {}), /elapsedSeconds/);
assert.throws(() => loop.advance(0.1, null), /step/);

console.log('Fixed-step runtime checks passed.');
