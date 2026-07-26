import {
  createUnifiedCharacterState,
  stepUnifiedCharacterController
} from '../../src/gameplay/movement/unified-character-controller.js';
import { MOVEMENT_TUNING } from '../../src/gameplay/movement/movement-tuning.js';

export const dt = 1 / MOVEMENT_TUNING.simulationHz;
export const noInput = Object.freeze({
  left: false,
  right: false,
  run: false,
  sprint: false,
  jumpPressed: false,
  jumpReleased: false,
  jumpHeld: false,
  downPressed: false,
  downHeld: false,
  groundSlamPressed: false,
  fastFallHeld: false,
  actionPressed: false,
  swapPressed: false
});
export const flatWorld = Object.freeze({
  groundHeightAt: () => 0,
  hasGroundAt: () => true,
  surfaceAt: () => ({ angle: 0, normal: { x: 0, y: -1 }, material: 'normal' })
});

export function step(state, input = noInput, options = flatWorld) {
  return stepUnifiedCharacterController(state, { ...noInput, ...input }, dt, options);
}

export function simulate(state, seconds, inputAt = () => noInput, options = flatWorld) {
  const steps = Math.ceil(seconds / dt);
  for (let index = 0; index < steps; index += 1) {
    step(state, inputAt(index, index * dt), options);
  }
  return state;
}

export function makeState(options = {}) {
  return createUnifiedCharacterState(options);
}

export function jumpMetrics({ hero = 'Hargold', holdSeconds = 0.5, velocityX = 0 } = {}) {
  const state = makeState({ hero });
  state.velocityX = velocityX;
  const startX = state.footX;
  let minimumY = state.footY;
  for (let index = 0; index < 600; index += 1) {
    const elapsed = index * dt;
    step(state, {
      right: velocityX > 0,
      run: velocityX > 0,
      jumpPressed: index === 0,
      jumpHeld: elapsed < holdSeconds
    });
    minimumY = Math.min(minimumY, state.footY);
    if (index > 1 && state.grounded) {
      return { height: -minimumY, distance: state.footX - startX, state };
    }
  }
  throw new Error('jump did not land');
}
