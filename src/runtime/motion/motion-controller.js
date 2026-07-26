/*
 * Compatibility facade.
 *
 * The authoritative implementation lives in gameplay/movement. Existing
 * imports keep working while the browser, tests, and traversal adapters move
 * through the same unified controller.
 */
import {
  createUnifiedCharacterState,
  movementBody,
  stepUnifiedCharacterController,
  trySwapUnifiedHero
} from '../../gameplay/movement/unified-character-controller.js';

export function createMotionState(options = {}) {
  return createUnifiedCharacterState(options);
}

export function motionBody(state, profiles) {
  return movementBody(state, profiles);
}

export function stepMotion(state, input, deltaSeconds, options = {}) {
  stepUnifiedCharacterController(state, input, deltaSeconds, options);
  return state;
}

export function trySwapHero(state, options = {}) {
  return trySwapUnifiedHero(state, options);
}
