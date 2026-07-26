import assert from 'node:assert/strict';
import { FixedStepLoop } from '../../src/runtime/fixed-step.js';
import { createMovementInputBuffer } from '../../src/gameplay/movement/movement-input-buffer.js';
import {
  createUnifiedCharacterState,
  stepUnifiedCharacterController
} from '../../src/gameplay/movement/unified-character-controller.js';

function simulate(renderHz) {
  const state = createUnifiedCharacterState();
  const loop = new FixedStepLoop({ hz: 120 });
  const buffer = createMovementInputBuffer();
  const renderDt = 1 / renderHz;
  let elapsed = 0;
  while (elapsed < 2 - 1e-9) {
    const frameDt = Math.min(renderDt, 2 - elapsed);
    const raw = {
      right: elapsed < 1.5,
      run: elapsed < 1.5,
      sprint: elapsed < 1.5
    };
    buffer.sample(raw, frameDt);
    loop.advance(frameDt, dt => {
      stepUnifiedCharacterController(state, buffer.consumeStep(), dt, {
        groundHeightAt: () => 0,
        hasGroundAt: () => true
      });
    });
    elapsed += frameDt;
  }
  return state;
}

for (const renderHz of [30, 60, 144]) {
  const state = simulate(renderHz);
  const reference = simulate(120);
  assert.ok(Math.abs(state.footX - reference.footX) < 0.08);
  assert.ok(Math.abs(state.velocityX - reference.velocityX) < 0.08);
  assert.equal(state.grounded, reference.grounded);
}

console.log('Unified fixed-step render-rate stability checks passed.');
