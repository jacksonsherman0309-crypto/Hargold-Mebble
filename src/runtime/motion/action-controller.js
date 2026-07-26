/*
 * Non-authoritative presentation/traversal compatibility state.
 *
 * Locomotion, airborne actions, damage, bounce, and landing physics are owned
 * exclusively by gameplay/movement/unified-character-controller.js.
 */
import { clamp } from '../math.js';
import { PROVISIONAL_MOTION_TUNING as DEFAULTS } from './motion-tuning.js';

export function createActionState() {
  return {
    crouched: false,
    sliding: false,
    crawling: false,
    rolling: false,
    wallReacting: false,
    ledgeStopping: false,
    lookingUp: false,
    ducking: false,
    landingRecoverySeconds: 0,
    victory: false,
    climbing: null,
    rope: null,
    carried: null
  };
}

export function updateStanceActions(
  motion,
  action,
  input,
  { canStand = () => true, slope = 0, tuning = DEFAULTS } = {}
) {
  const hasHorizontalInput = Boolean(input.left || input.right);
  if (input.downHeld && motion.grounded) {
    action.crouched = true;
    action.sliding = Math.abs(motion.velocityX) >= tuning.slideMinimumSpeed ||
      Math.abs(slope) > 0.25;
    action.crawling = hasHorizontalInput && !action.sliding;
  } else if (action.crouched && canStand()) {
    action.crouched = false;
    action.sliding = false;
    action.crawling = false;
  }
  action.ducking = action.crouched && !action.sliding && !action.crawling;
  action.lookingUp = Boolean(
    input.upHeld && motion.grounded && Math.abs(motion.velocityX) < 0.1
  );
  action.rolling = Boolean(
    input.rollHeld && motion.grounded && Math.abs(motion.velocityX) >= tuning.walkSpeed
  );
}

export function updateTraversalPresentation(action, {
  wallCollision = false,
  nearLedge = false,
  movementInput = 0
} = {}) {
  action.wallReacting = Boolean(wallCollision);
  action.ledgeStopping = Boolean(nearLedge && movementInput === 0);
}

export function setVictory(action, active = true) {
  action.victory = Boolean(active);
}

export function animationIntent(motion, action, surface = {}) {
  return Object.freeze({
    hero: motion.hero,
    locomotion: motion.locomotion,
    normalizedHorizontalSpeed: clamp(
      Math.abs(motion.velocityX) / DEFAULTS.sprintSpeed,
      0,
      1
    ),
    verticalSpeed: motion.velocityY,
    grounded: motion.grounded,
    footOrigin: Object.freeze({ x: motion.footX, y: motion.footY }),
    facing: motion.facing,
    surfaceMaterial: surface.material ?? 'normal',
    slope: surface.slope ?? 0,
    crouched: action.crouched,
    sliding: action.sliding,
    wallSide: motion.wallSide ?? 0,
    spin: motion.airTwirlSeconds > 0 ? 'air' : 'none',
    glide: motion.glide,
    climbing: action.climbing,
    rope: action.rope,
    carried: action.carried,
    groundSlamming: motion.groundSlamming,
    hardLanding: motion.movementState === 'hard-land',
    hurt: motion.hurtLockSeconds > 0,
    crawling: action.crawling,
    rolling: action.rolling,
    wallReacting: action.wallReacting,
    ledgeStopping: action.ledgeStopping,
    lookingUp: action.lookingUp,
    ducking: action.ducking,
    landingRecovery: motion.landingRecoverySeconds > 0,
    victory: action.victory || motion.movementState === 'victory'
  });
}
