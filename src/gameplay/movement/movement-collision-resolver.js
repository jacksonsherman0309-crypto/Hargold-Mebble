import { transitionMovementState, MOVEMENT_STATES } from './movement-state-machine.js';
import { emitMovementEvent } from './movement-events.js';

export function landOnExternalSurface(state, {
  footY,
  platformId = null,
  landingSpeed = state.velocityY,
  hard = false,
  resetAirActions = true
} = {}) {
  state.footY = footY;
  state.landingSpeed = landingSpeed;
  state.velocityY = 0;
  state.grounded = true;
  state.supportPlatformId = platformId;
  state.glide = 'closed';
  if (resetAirActions) {
    state.airTwirlUsed = false;
    state.airTwirlSeconds = 0;
    state.doubleJumpUsed = false;
  }
  state.groundSlamming = false;
  state.groundSlamPhase = 'none';
  transitionMovementState(
    state,
    hard ? MOVEMENT_STATES.HARD_LAND : MOVEMENT_STATES.SOFT_LAND,
    (type, detail) => emitMovementEvent(state, type, detail)
  );
  emitMovementEvent(state, 'external-surface-landed', { platformId, landingSpeed, hard });
  return state;
}

export function leaveExternalSupport(state, {
  downwardSpeed = 0.2,
  reason = 'support-lost'
} = {}) {
  state.supportPlatformId = null;
  state.supportVelocityX = 0;
  state.supportVelocityY = 0;
  state.grounded = false;
  state.velocityY = Math.max(state.velocityY, downwardSpeed);
  transitionMovementState(
    state,
    MOVEMENT_STATES.FALL,
    (type, detail) => emitMovementEvent(state, type, detail)
  );
  emitMovementEvent(state, reason);
  return state;
}

export function resolveExternalHeadHit(state, {
  footY,
  reboundSpeed = 0.8,
  blockId = null
} = {}) {
  state.footY = footY;
  state.velocityY = Math.max(reboundSpeed, Math.abs(state.velocityY) * 0.08);
  state.grounded = false;
  state.supportPlatformId = null;
  state.supportVelocityX = 0;
  state.supportVelocityY = 0;
  transitionMovementState(
    state,
    MOVEMENT_STATES.FALL,
    (type, detail) => emitMovementEvent(state, type, detail)
  );
  emitMovementEvent(state, 'head-hit', { blockId });
  return state;
}

export function resolveExternalWallHit(state, {
  side,
  footX,
  obstacleId = null
} = {}) {
  state.footX = footX;
  state.velocityX = 0;
  state.wallContactSide = side;
  transitionMovementState(
    state,
    MOVEMENT_STATES.WALL_CONTACT,
    (type, detail) => emitMovementEvent(state, type, detail)
  );
  emitMovementEvent(state, 'wall-contact', { side, obstacleId });
  return state;
}

export function transportWithSupport(
  state,
  deltaX,
  footY,
  platformId,
  { velocityX = 0, velocityY = 0 } = {}
) {
  state.footX += deltaX;
  state.footY = footY;
  state.supportPlatformId = platformId;
  state.supportVelocityX = velocityX;
  state.supportVelocityY = velocityY;
  return state;
}
