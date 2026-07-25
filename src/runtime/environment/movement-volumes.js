import { approach, clamp } from '../math.js';
import { PROVISIONAL_MOTION_TUNING as DEFAULTS } from '../motion/motion-tuning.js';

export const SURFACE_MATERIALS = Object.freeze({
  normal: Object.freeze({ acceleration: 1, braking: 1 }),
  ice: Object.freeze({ acceleration: 0.45, braking: 0.18 }),
  'low-slip': Object.freeze({ acceleration: 0.7, braking: 0.45 }),
  mud: Object.freeze({ acceleration: 0.55, braking: 1.4, speed: 0.65 }),
  sand: Object.freeze({ acceleration: 0.72, braking: 1.15, speed: 0.82 }),
  conveyor: Object.freeze({ acceleration: 1, braking: 1 })
});

export function surfaceVelocity(material = 'normal', conveyorSpeed = 0) {
  if (!SURFACE_MATERIALS[material]) throw new RangeError(`unknown surface material: ${material}`);
  return material === 'conveyor' ? conveyorSpeed : 0;
}

export function stepWater(motion, input, water, dt, tuning = DEFAULTS) {
  const horizontal = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const vertical = (input.downHeld ? 1 : 0) - (input.upHeld ? 1 : 0);
  motion.velocityX = approach(motion.velocityX, horizontal * tuning.swimMaximumSpeed + (water.currentX ?? 0), tuning.swimAcceleration, dt);
  motion.velocityY = approach(motion.velocityY, vertical * tuning.swimMaximumSpeed + (water.currentY ?? 0), tuning.swimAcceleration + (water.buoyancy ?? tuning.buoyancyAcceleration), dt);
  motion.velocityX *= Math.max(0, 1 - (water.drag ?? tuning.swimDrag) * dt);
  motion.velocityY *= Math.max(0, 1 - (water.drag ?? tuning.swimDrag) * dt);
  if (input.jumpPressed && motion.footY <= water.surfaceY + 0.2) {
    motion.velocityY = -tuning.baseJumpSpeed * 0.72;
    return { type: 'surface-breach' };
  }
  return null;
}

export function attachClimb(action, kind, anchorId) {
  if (!['fence', 'vine', 'ladder'].includes(kind)) throw new RangeError(`unsupported climbable: ${kind}`);
  action.climbing = { kind, anchorId };
}

export function stepClimb(motion, action, input, dt, tuning = DEFAULTS) {
  if (!action.climbing) return null;
  if (input.jumpPressed) {
    action.climbing = null; motion.velocityY = -tuning.baseJumpSpeed * 0.78;
    return { type: 'climb-detach' };
  }
  motion.velocityX = ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * tuning.climbSpeed;
  motion.velocityY = ((input.downHeld ? 1 : 0) - (input.upHeld ? 1 : 0)) * tuning.climbSpeed;
  motion.footX += motion.velocityX * dt; motion.footY += motion.velocityY * dt;
  return null;
}

export function createRopeState({ anchorX, anchorY, length, angle = 0 }) {
  return { anchorX, anchorY, length, angle, angularVelocity: 0, climbOffset: 0 };
}

export function stepRope(motion, action, input, dt, tuning = DEFAULTS) {
  const rope = action.rope;
  if (!rope) return null;
  rope.angularVelocity += (-9.81 / rope.length * Math.sin(rope.angle)
    + ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * tuning.ropePumpAcceleration / rope.length) * dt;
  rope.angularVelocity *= 0.997;
  rope.angle += rope.angularVelocity * dt;
  rope.climbOffset = clamp(rope.climbOffset + ((input.upHeld ? 1 : 0) - (input.downHeld ? 1 : 0)) * tuning.climbSpeed * dt, 0, rope.length * 0.7);
  const effectiveLength = rope.length - rope.climbOffset;
  motion.footX = rope.anchorX + Math.sin(rope.angle) * effectiveLength;
  motion.footY = rope.anchorY + Math.cos(rope.angle) * effectiveLength;
  if (input.jumpPressed) {
    motion.velocityX = Math.cos(rope.angle) * rope.angularVelocity * effectiveLength;
    motion.velocityY = -Math.sin(rope.angle) * rope.angularVelocity * effectiveLength;
    action.rope = null;
    return { type: 'rope-release' };
  }
  return null;
}
