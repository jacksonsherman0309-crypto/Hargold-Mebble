import { PROVISIONAL_MOTION_TUNING as DEFAULTS } from '../motion/motion-tuning.js';

export function carryModifiers(weight, tuning = DEFAULTS) {
  if (weight === 'light') return { speed: tuning.carryLightSpeedMultiplier, jump: tuning.carryLightJumpMultiplier };
  if (weight === 'heavy') return { speed: tuning.carryHeavySpeedMultiplier, jump: tuning.carryHeavyJumpMultiplier };
  throw new RangeError(`unsupported carry weight: ${weight}`);
}

export function pickUp(action, object) {
  if (!object || !['light', 'heavy'].includes(object.weight)) return false;
  action.carried = { id: object.id, weight: object.weight };
  return true;
}

export function releaseCarried(motion, action, { throwObject = false, tuning = DEFAULTS } = {}) {
  if (!action.carried) return null;
  const result = {
    ...action.carried,
    velocityX: motion.velocityX * tuning.throwHeroVelocityInheritance
      + (throwObject ? motion.facing * tuning.throwSpeed : 0),
    velocityY: throwObject ? -tuning.throwSpeed * 0.3 : 0
  };
  action.carried = null;
  return Object.freeze(result);
}
