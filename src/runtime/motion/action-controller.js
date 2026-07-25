import { clamp } from '../math.js';
import { PROVISIONAL_MOTION_TUNING as DEFAULTS } from './motion-tuning.js';

export function createActionState() {
  return {
    jumpChain: 0, jumpChainSeconds: 0, doubleJumpUsed: false,
    wallSide: 0, wallCoyoteSeconds: 0, wallSteeringLockSeconds: 0,
    sameWallRegrabSeconds: 0, crouched: false, sliding: false,
    spin: 'none', airSpinUsed: false, fastFalling: false,
    groundSlamming: false, hardLanding: false, dropThroughSeconds: 0,
    climbing: null, rope: null, carried: null, hurtLockSeconds: 0,
    invulnerabilitySeconds: 0
  };
}

export function landActions(action, landingSpeed, tuning = DEFAULTS) {
  action.doubleJumpUsed = false;
  action.airSpinUsed = false;
  action.fastFalling = false;
  action.groundSlamming = false;
  action.spin = 'none';
  action.hardLanding = landingSpeed >= tuning.hardLandingSpeed;
  return { type: action.hardLanding ? 'hard-land' : 'land', landingSpeed };
}

export function tryAirJump(motion, action, { doubleJumpUnlocked = false, tuning = DEFAULTS } = {}) {
  if (motion.hero !== 'Hargold' || !doubleJumpUnlocked || action.doubleJumpUsed || motion.grounded) return false;
  action.doubleJumpUsed = true;
  motion.velocityY = -tuning.baseJumpSpeed;
  motion.glide = 'closed';
  return true;
}

export function updateWallActions(motion, action, input, contacts, dt, tuning = DEFAULTS) {
  action.wallSteeringLockSeconds = Math.max(0, action.wallSteeringLockSeconds - dt);
  action.sameWallRegrabSeconds = Math.max(0, action.sameWallRegrabSeconds - dt);
  const touching = contacts.leftWall ? -1 : contacts.rightWall ? 1 : 0;
  if (touching && !motion.grounded && !(touching === action.wallSide && action.sameWallRegrabSeconds > 0)) {
    action.wallSide = touching;
    action.wallCoyoteSeconds = tuning.wallCoyoteSeconds;
    if (motion.velocityY > tuning.wallSlideMaximumSpeed) motion.velocityY = tuning.wallSlideMaximumSpeed;
    if (input.jumpPressed) {
      motion.velocityX = -touching * tuning.wallJumpHorizontalSpeed;
      motion.velocityY = -tuning.wallJumpVerticalSpeed;
      motion.facing = -touching;
      action.wallSteeringLockSeconds = tuning.wallSteeringLockSeconds;
      action.sameWallRegrabSeconds = tuning.sameWallRegrabSeconds;
      return { type: 'wall-jump', wallSide: touching };
    }
  } else action.wallCoyoteSeconds = Math.max(0, action.wallCoyoteSeconds - dt);
  return null;
}

export function updateStanceActions(motion, action, input, { canStand = () => true, slope = 0, tuning = DEFAULTS } = {}) {
  if (input.downHeld && motion.grounded) {
    action.crouched = true;
    action.sliding = Math.abs(motion.velocityX) >= tuning.slideMinimumSpeed || Math.abs(slope) > 0.25;
  } else if (action.crouched && canStand()) {
    action.crouched = false;
    action.sliding = false;
  }
  if (action.sliding) motion.velocityX -= Math.sign(motion.velocityX) * Math.min(Math.abs(motion.velocityX), tuning.slideFriction / 120);
}

export function updateAirActions(motion, action, input, dt, tuning = DEFAULTS) {
  if (!motion.grounded && input.spinPressed && !action.airSpinUsed) {
    action.airSpinUsed = true; action.spin = 'air';
  }
  if (action.spin === 'air' && motion.velocityY > 0) motion.velocityY = Math.max(0, motion.velocityY - tuning.airSpinFallBrake * dt);
  if (!motion.grounded && input.groundSlamPressed) {
    action.groundSlamming = true; motion.velocityY = Math.max(motion.velocityY, tuning.groundSlamSpeed);
  } else if (!motion.grounded && input.fastFallHeld && !action.groundSlamming) {
    action.fastFalling = true;
    motion.velocityY = Math.max(tuning.fastFallMinimumSpeed, motion.velocityY + tuning.fastFallAcceleration * dt);
  }
  if (input.dropThroughPressed && motion.grounded) {
    action.dropThroughSeconds = 0.16; motion.grounded = false; motion.footY += 0.03;
  }
  action.dropThroughSeconds = Math.max(0, action.dropThroughSeconds - dt);
}

export function stompBounce(motion, action, strong = false, tuning = DEFAULTS) {
  motion.velocityY = -(strong ? tuning.strongStompBounceSpeed : tuning.stompBounceSpeed);
  motion.grounded = false; action.groundSlamming = false;
  return { type: strong ? 'strong-stomp-bounce' : 'stomp-bounce' };
}

export function updateHurt(action, dt) {
  action.hurtLockSeconds = Math.max(0, action.hurtLockSeconds - dt);
  action.invulnerabilitySeconds = Math.max(0, action.invulnerabilitySeconds - dt);
}

export function applyHurt(motion, action, direction, tuning = DEFAULTS) {
  if (action.invulnerabilitySeconds > 0) return false;
  motion.velocityX = -Math.sign(direction || 1) * 4.7;
  motion.velocityY = -6.2; motion.grounded = false;
  action.hurtLockSeconds = tuning.hurtLockSeconds;
  action.invulnerabilitySeconds = tuning.invulnerabilitySeconds;
  return true;
}

export function animationIntent(motion, action, surface = {}) {
  return Object.freeze({
    hero: motion.hero, locomotion: motion.locomotion,
    normalizedHorizontalSpeed: clamp(Math.abs(motion.velocityX) / DEFAULTS.runSpeed, 0, 1),
    verticalSpeed: motion.velocityY, grounded: motion.grounded,
    footOrigin: Object.freeze({ x: motion.footX, y: motion.footY }),
    facing: motion.facing, surfaceMaterial: surface.material ?? 'normal',
    slope: surface.slope ?? 0, crouched: action.crouched, sliding: action.sliding,
    wallSide: action.wallSide, spin: action.spin, glide: motion.glide,
    climbing: action.climbing, rope: action.rope, carried: action.carried,
    groundSlamming: action.groundSlamming, hardLanding: action.hardLanding,
    hurt: action.hurtLockSeconds > 0
  });
}
