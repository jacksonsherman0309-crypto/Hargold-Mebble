import { bodyAtFoot } from '../collision/aabb.js';
import { approach, clamp } from '../math.js';
import {
  PROVISIONAL_HERO_PROFILES,
  PROVISIONAL_MOTION_TUNING
} from './motion-tuning.js';

const HERO_NAMES = Object.freeze(['Hargold', 'Mebble']);

function profileFor(hero, profiles) {
  const profile = profiles[hero];
  if (!profile) throw new RangeError(`unknown hero: ${hero}`);
  return profile;
}

export function createMotionState({
  hero = 'Hargold',
  footX = 0,
  footY = 0,
  grounded = true,
  profiles = PROVISIONAL_HERO_PROFILES,
  tuning = PROVISIONAL_MOTION_TUNING
} = {}) {
  profileFor(hero, profiles);
  return {
    hero,
    footX,
    footY,
    velocityX: 0,
    velocityY: 0,
    grounded,
    facing: 1,
    locomotion: grounded ? 'idle' : 'fall',
    stateSeconds: 0,
    coyoteSeconds: grounded ? tuning.coyoteSeconds : 0,
    jumpBufferSeconds: 0,
    glide: 'closed',
    landingSpeed: 0
  };
}

export function motionBody(state, profiles = PROVISIONAL_HERO_PROFILES) {
  return bodyAtFoot(profileFor(state.hero, profiles), state.footX, state.footY);
}

export function trySwapHero(
  state,
  {
    profiles = PROVISIONAL_HERO_PROFILES,
    canOccupy = () => true
  } = {}
) {
  const nextHero = state.hero === HERO_NAMES[0] ? HERO_NAMES[1] : HERO_NAMES[0];
  const nextProfile = profileFor(nextHero, profiles);
  const candidate = bodyAtFoot(nextProfile, state.footX, state.footY);

  if (!canOccupy(candidate, nextHero)) {
    return Object.freeze({
      accepted: false,
      reason: 'unsafe-collider-fit',
      hero: state.hero,
      body: motionBody(state, profiles)
    });
  }

  state.hero = nextHero;
  return Object.freeze({
    accepted: true,
    reason: null,
    hero: nextHero,
    body: candidate
  });
}

function startJump(state, profile, tuning) {
  const runRatio = clamp(
    Math.abs(state.velocityX) / tuning.runSpeed,
    0,
    1
  );
  state.velocityY = -(
    tuning.baseJumpSpeed
    + profile.jumpSpeedAddition
    + tuning.runningJumpBonus * runRatio
  );
  state.grounded = false;
  state.coyoteSeconds = 0;
  state.jumpBufferSeconds = 0;
  state.locomotion = 'takeoff';
  state.stateSeconds = 0;
  state.glide = 'closed';
}

function updateGroundedHorizontal(state, input, deltaSeconds, tuning) {
  const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const speed = Math.abs(state.velocityX);
  const maximum = input.run ? tuning.runSpeed : tuning.walkSpeed;
  const reversing = (
    state.velocityX !== 0
    && direction !== 0
    && Math.sign(state.velocityX) !== direction
  );

  if (direction === 0) {
    state.velocityX = approach(
      state.velocityX,
      0,
      tuning.releaseDeceleration,
      deltaSeconds
    );
    if (Math.abs(state.velocityX) < 1e-6) state.velocityX = 0;
    state.locomotion = state.velocityX === 0
      ? 'idle'
      : speed > tuning.walkSpeed * 0.92 ? 'run' : 'walk';
    return;
  }

  if (reversing && speed >= tuning.skidThreshold) {
    if (state.locomotion !== 'skid') state.stateSeconds = 0;
    state.locomotion = 'skid';
    state.velocityX = approach(
      state.velocityX,
      0,
      tuning.highSpeedSkidDeceleration,
      deltaSeconds
    );
    if (Math.abs(state.velocityX) <= tuning.skidExitSpeed) {
      state.facing = direction;
      state.locomotion = 'turn';
      state.stateSeconds = 0;
    }
    return;
  }

  state.facing = direction;
  state.velocityX = approach(
    state.velocityX,
    direction * maximum,
    reversing
      ? tuning.lowSpeedTurnAcceleration
      : input.run ? tuning.groundAccelerationRun : tuning.groundAccelerationWalk,
    deltaSeconds
  );
  state.locomotion = Math.abs(state.velocityX) > tuning.walkSpeed * 0.94
    ? 'run'
    : 'walk';
}

function updateAirborne(state, input, deltaSeconds, profile, tuning) {
  const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (direction !== 0) {
    const reversing = (
      state.velocityX !== 0
      && Math.sign(state.velocityX) !== direction
    );
    const maximum = input.run
      ? tuning.airMaximumRunSpeed
      : tuning.airMaximumWalkSpeed;
    const acceleration = reversing
      ? tuning.airReverseAcceleration
      : tuning.airAcceleration;
    state.velocityX = approach(
      state.velocityX,
      maximum * direction,
      acceleration * profile.airControlMultiplier,
      deltaSeconds
    );
    state.facing = direction;
  }

  const absoluteVerticalSpeed = Math.abs(state.velocityY);
  let gravity = absoluteVerticalSpeed <= tuning.apexVelocityWindow
    ? tuning.apexGravity
    : state.velocityY < 0
      ? input.jumpHeld ? tuning.heldJumpGravity : tuning.releasedJumpGravity
      : tuning.fallGravity;

  const shouldGlide = (
    state.hero === 'Mebble'
    && input.glideHeld
    && state.velocityY > tuning.apexVelocityWindow
  );
  if (shouldGlide) {
    gravity = tuning.glideGravity;
    state.velocityY = Math.min(
      state.velocityY,
      tuning.glideMaximumFallSpeed
    );
    state.glide = state.glide === 'closed' ? 'opening' : 'sustained';
  } else {
    state.glide = state.glide === 'sustained' || state.glide === 'opening'
      ? 'closing'
      : 'closed';
  }

  state.velocityY = Math.min(
    tuning.maximumFallSpeed,
    state.velocityY + gravity * deltaSeconds
  );

  if (!input.jumpHeld && state.velocityY < tuning.minimumJumpCutVelocity) {
    state.velocityY = tuning.minimumJumpCutVelocity;
  }

  state.locomotion = state.velocityY < -tuning.apexVelocityWindow
    ? 'rise'
    : state.velocityY <= tuning.apexVelocityWindow ? 'apex' : 'fall';
}

export function stepMotion(
  state,
  input,
  deltaSeconds,
  {
    tuning = PROVISIONAL_MOTION_TUNING,
    profiles = PROVISIONAL_HERO_PROFILES,
    groundHeightAt = () => 0,
    minimumX = -Infinity,
    maximumX = Infinity
  } = {}
) {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    throw new TypeError('deltaSeconds must be a positive finite number');
  }

  const profile = profileFor(state.hero, profiles);
  const previousFootY = state.footY;
  state.stateSeconds += deltaSeconds;

  state.jumpBufferSeconds = input.jumpPressed
    ? tuning.jumpBufferSeconds
    : Math.max(0, state.jumpBufferSeconds - deltaSeconds);
  state.coyoteSeconds = state.grounded
    ? tuning.coyoteSeconds
    : Math.max(0, state.coyoteSeconds - deltaSeconds);

  if (
    state.jumpBufferSeconds > 0
    && (state.grounded || state.coyoteSeconds > 0)
  ) {
    startJump(state, profile, tuning);
  }

  if (state.grounded) {
    updateGroundedHorizontal(state, input, deltaSeconds, tuning);
    state.footX = clamp(
      state.footX + state.velocityX * deltaSeconds,
      minimumX,
      maximumX
    );
    state.footY = groundHeightAt(state.footX);
    state.velocityY = 0;
  } else {
    updateAirborne(state, input, deltaSeconds, profile, tuning);
    state.footX = clamp(
      state.footX + state.velocityX * deltaSeconds,
      minimumX,
      maximumX
    );
    state.footY += state.velocityY * deltaSeconds;

    const groundY = groundHeightAt(state.footX);
    if (
      state.velocityY >= 0
      && state.footY >= groundY
      && previousFootY <= groundY
    ) {
      state.landingSpeed = state.velocityY;
      state.footY = groundY;
      state.velocityY = 0;
      state.grounded = true;
      state.glide = 'closed';
      state.locomotion = state.landingSpeed >= tuning.hardLandingSpeed
        ? 'land-hard'
        : 'land-soft';
      state.stateSeconds = 0;
    }
  }

  return state;
}

