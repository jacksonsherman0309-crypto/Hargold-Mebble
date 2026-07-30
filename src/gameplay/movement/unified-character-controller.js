import { bodyAtFoot } from '../../runtime/collision/aabb.js';
import { approach, clamp } from '../../runtime/math.js';
import { HERO_PROFILES, heroProfile } from './hero-profiles.js';
import { updateMovementTelemetry } from './movement-debug.js';
import { beginMovementStep, emitMovementEvent, movementEvents } from './movement-events.js';
import {
  executeMovementState,
  initializeMovementStateLifecycle,
  MOVEMENT_STATES,
  transitionMovementState
} from './movement-state-machine.js';
import {
  selectHorizontalResponse,
  terrainResponseFor
} from './movement-parameters.js';
import {
  buildMovementContactSnapshot,
  deriveMovementContacts
} from './movement-sensors.js';
import { MOVEMENT_TUNING } from './movement-tuning.js';

const HERO_NAMES = Object.freeze(['Hargold', 'Mebble']);

function transition(state, nextState) {
  transitionMovementState(
    state,
    nextState,
    (type, detail) => emitMovementEvent(state, type, detail)
  );
}

function resetAirActions(state) {
  state.airTwirlUsed = false;
  state.airTwirlSeconds = 0;
  state.doubleJumpUsed = false;
  state.doubleJumpSeconds = 0;
  state.fastFalling = false;
  state.glide = 'closed';
  state.glideSeconds = 0;
  state.glideExhausted = false;
}

export function createUnifiedCharacterState({
  hero = 'Hargold',
  footX = 0,
  footY = 0,
  grounded = true,
  doubleJumpUnlocked = false,
  profiles = HERO_PROFILES,
  tuning = MOVEMENT_TUNING
} = {}) {
  heroProfile(hero, profiles);
  const movementState = grounded ? MOVEMENT_STATES.IDLE : MOVEMENT_STATES.FALL;
  const state = {
    hero,
    footX,
    footY,
    velocityX: 0,
    velocityY: 0,
    accelerationX: 0,
    accelerationY: 0,
    grounded,
    facing: 1,
    movementState,
    previousMovementState: movementState,
    locomotion: movementState,
    stateSeconds: 0,
    airborneSeconds: grounded ? 0 : tuning.coyoteSeconds,
    coyoteSeconds: grounded ? tuning.coyoteSeconds : 0,
    jumpBufferSeconds: 0,
    jumpCutAllowed: false,
    landingSpeed: 0,
    landingRecoverySeconds: 0,
    stance: 'standing',
    glide: 'closed',
    glideOpeningSeconds: 0,
    glideSeconds: 0,
    glideExhausted: false,
    airTwirlUsed: false,
    airTwirlSeconds: 0,
    doubleJumpUnlocked: Boolean(doubleJumpUnlocked),
    doubleJumpUsed: false,
    doubleJumpSeconds: 0,
    fastFalling: false,
    groundSlamming: false,
    groundSlamPhase: 'none',
    groundSlamBufferSeconds: 0,
    groundSlamPrepareSeconds: 0,
    groundSlamImpactSeconds: 0,
    groundSlamRecoverySeconds: 0,
    hurtLockSeconds: 0,
    invulnerabilitySeconds: 0,
    forcedState: null,
    supportPlatformId: null,
    supportVelocityX: 0,
    supportVelocityY: 0,
    dropThroughPlatformId: null,
    dropThroughSeconds: 0,
    surfaceNormal: Object.freeze({ x: 0, y: -1 }),
    surfaceAngle: 0,
    surfaceMaterial: 'normal',
    wallContactSide: null,
    horizontalResponseCase: 'from-rest',
    terrainResponseId: 'normal',
    animationReferenceSpeed: tuning.walkSpeed,
    animationSelection: movementState,
    animationPlaybackRate: 1,
    movementBranch: grounded ? 'grounded' : 'airborne',
    inputPermissions: null,
    collisionPolicy: null,
    soundHooks: Object.freeze([]),
    effectHooks: Object.freeze([]),
    sensors: null,
    contacts: null,
    blockBreakStrength: 0,
    events: [],
    telemetry: null
  };
  return initializeMovementStateLifecycle(state);
}

export function movementBody(
  state,
  profiles = HERO_PROFILES,
  tuning = MOVEMENT_TUNING
) {
  const profile = heroProfile(state.hero, profiles);
  const height = state.stance === 'standing'
    ? profile.height
    : profile.height * tuning.crouchHeightMultiplier;
  return bodyAtFoot({ width: profile.width, height }, state.footX, state.footY);
}

function startGroundJump(state, profile, tuning) {
  const runRatio = clamp(Math.abs(state.velocityX) / tuning.sprintSpeed, 0, 1);
  const terrain = terrainResponseFor(state.surfaceMaterial);
  state.velocityY = -(
    tuning.baseJumpSpeed
    + profile.jumpSpeedAddition
    + tuning.runningJumpBonus * runRatio
  ) * terrain.jumpMultiplier;
  state.velocityX += state.supportVelocityX * tuning.movingPlatformVelocityInheritance;
  state.velocityY += state.supportVelocityY * tuning.movingPlatformVelocityInheritance;
  state.grounded = false;
  state.supportPlatformId = null;
  state.supportVelocityX = 0;
  state.supportVelocityY = 0;
  state.airborneSeconds = 0;
  state.coyoteSeconds = 0;
  state.jumpBufferSeconds = 0;
  state.jumpCutAllowed = true;
  state.stance = 'standing';
  state.glide = 'closed';
  transition(state, MOVEMENT_STATES.JUMP_STARTUP);
  emitMovementEvent(state, 'jump-takeoff', {
    runningRatio: runRatio,
    verticalSpeed: state.velocityY
  });
}

function startTwirl(state, tuning) {
  state.airTwirlUsed = true;
  state.airTwirlSeconds = tuning.airTwirlSeconds;
  state.glide = 'closed';
  if (state.velocityY > tuning.airTwirlMaximumFallSpeed) {
    state.velocityY = tuning.airTwirlMaximumFallSpeed;
  }
  transition(state, MOVEMENT_STATES.TWIRL);
  emitMovementEvent(state, 'twirl-started', { durationSeconds: tuning.airTwirlSeconds });
}

function startDoubleJump(state, tuning) {
  state.doubleJumpUsed = true;
  state.airTwirlUsed = true;
  state.doubleJumpSeconds = tuning.airTwirlSeconds;
  state.airTwirlSeconds = 0;
  state.jumpBufferSeconds = 0;
  state.jumpCutAllowed = true;
  state.glide = 'closed';
  state.velocityY = -tuning.doubleJumpSpeed;
  transition(state, MOVEMENT_STATES.DOUBLE_JUMP);
  emitMovementEvent(state, 'double-jump-started', { verticalSpeed: state.velocityY });
}

function startGroundSlam(state, tuning) {
  state.groundSlamming = true;
  state.groundSlamPhase = 'startup';
  state.groundSlamBufferSeconds = 0;
  state.groundSlamPrepareSeconds = tuning.groundSlamPrepareSeconds;
  state.airTwirlUsed = true;
  state.airTwirlSeconds = 0;
  state.doubleJumpUsed = true;
  state.doubleJumpSeconds = 0;
  state.fastFalling = false;
  state.glide = 'closed';
  state.velocityY = 0;
  state.jumpCutAllowed = false;
  state.jumpBufferSeconds = 0;
  transition(state, MOVEMENT_STATES.GROUND_SLAM_STARTUP);
  emitMovementEvent(state, 'ground-slam-started');
}

function beginGroundSlamImpact(state, tuning, surface = {}) {
  state.groundSlamming = false;
  state.groundSlamPhase = 'impact';
  state.groundSlamImpactSeconds = tuning.groundSlamImpactSeconds;
  state.groundSlamRecoverySeconds = tuning.groundSlamRecoverySeconds;
  state.velocityY = 0;
  state.velocityX = approach(
    state.velocityX,
    0,
    tuning.highSpeedSkidDeceleration,
    tuning.groundSlamImpactSeconds
  );
  transition(state, MOVEMENT_STATES.GROUND_SLAM_IMPACT);
  emitMovementEvent(state, 'ground-slam-impact', {
    hero: state.hero,
    footX: state.footX,
    footY: state.footY,
    landingSpeed: state.landingSpeed,
    surfaceMaterial: surface.material ?? state.surfaceMaterial,
    strength: heroProfile(state.hero ?? 'Hargold').groundSlamStrength
  });
}

function enterGroundedLocomotion(state, input, dt, tuning, canStand) {
  const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const speed = Math.abs(state.velocityX);
  const terrain = terrainResponseFor(state.surfaceMaterial);
  state.terrainResponseId = terrain.id;

  if (input.downHeld || state.stance !== 'standing') {
    if (!input.downHeld && canStand()) {
      state.stance = 'standing';
    } else {
      state.stance = 'crouched';
      if (speed >= tuning.slideMinimumSpeed) {
        state.velocityX = approach(state.velocityX, 0, tuning.slideFriction, dt);
        transition(state, MOVEMENT_STATES.DUCK_SLIDE);
      } else if (direction !== 0) {
        state.facing = direction;
        state.velocityX = approach(
          state.velocityX,
          direction * tuning.crawlSpeed,
          tuning.lowSpeedTurnAcceleration,
          dt
        );
        transition(state, MOVEMENT_STATES.CRAWL);
      } else {
        state.velocityX = approach(state.velocityX, 0, tuning.crouchDeceleration, dt);
        transition(state, MOVEMENT_STATES.CROUCH);
      }
      return;
    }
  }

  const reversing = state.velocityX !== 0 &&
    direction !== 0 &&
    Math.sign(state.velocityX) !== direction;
  // Directional hold owns the complete speed ramp. There is no separate
  // manual sprint gate in the live controller: acceleration naturally carries
  // the hero from the readable walk tier through run to full-speed locomotion.
  const baseTargetSpeed = tuning.sprintSpeed;
  const targetSpeed = baseTargetSpeed * terrain.maximumSpeedMultiplier;
  const response = selectHorizontalResponse({
    velocityX: state.velocityX,
    direction,
    targetSpeed,
    tuning,
    terrain
  });
  state.horizontalResponseCase = response.case;
  state.animationReferenceSpeed = Math.max(0.01, baseTargetSpeed);

  if (direction === 0) {
    state.velocityX = approach(state.velocityX, terrain.conveyorVelocity, response.acceleration, dt);
    if (Math.abs(state.velocityX) < 1e-6) state.velocityX = 0;
    if (state.velocityX === 0) transition(state, MOVEMENT_STATES.IDLE);
    else if (speed >= tuning.sprintEntrySpeed) transition(state, MOVEMENT_STATES.BRAKE);
    else transition(state, speed > tuning.walkSpeed * 0.92 ? MOVEMENT_STATES.RUN : MOVEMENT_STATES.WALK);
    return;
  }

  if (reversing && speed >= tuning.skidThreshold) {
    state.velocityX = approach(state.velocityX, 0, response.acceleration, dt);
    transition(state, MOVEMENT_STATES.SKID);
    if (Math.abs(state.velocityX) <= tuning.skidExitSpeed) {
      state.facing = direction;
      transition(state, MOVEMENT_STATES.TURN);
    }
    return;
  }

  state.facing = direction;
  const signedSlopeTravel = Math.sin(state.surfaceAngle ?? 0) * direction;
  const slopeMultiplier = signedSlopeTravel >= 0
    ? 1 + signedSlopeTravel * tuning.downhillSpeedBoost
    : 1 + signedSlopeTravel * tuning.uphillSpeedPenalty;
  state.velocityX = approach(
    state.velocityX,
    direction * targetSpeed * slopeMultiplier + terrain.conveyorVelocity,
    response.acceleration,
    dt
  );
  const updatedSpeed = Math.abs(state.velocityX);
  transition(state,
    updatedSpeed >= tuning.sprintEntrySpeed
      ? MOVEMENT_STATES.SPRINT
      : updatedSpeed >= tuning.walkSpeed * 0.92
        ? MOVEMENT_STATES.RUN
        : MOVEMENT_STATES.WALK
  );
}

function updateAirSteering(state, input, dt, profile, tuning) {
  const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (direction === 0) {
    if (state.airborneSeconds > 0.05) {
      state.velocityX = approach(state.velocityX, 0, tuning.airBraking, dt);
    }
    return;
  }
  const reversing = state.velocityX !== 0 && Math.sign(state.velocityX) !== direction;
  const speed = Math.abs(state.velocityX);
  const maximum = speed >= tuning.sprintEntrySpeed
    ? tuning.airMaximumSprintSpeed
    : speed >= tuning.walkSpeed * 0.92
      ? tuning.airMaximumRunSpeed
      : tuning.airMaximumWalkSpeed;
  const sameDirectionAboveCap = !reversing &&
    Math.sign(state.velocityX) === direction &&
    Math.abs(state.velocityX) > maximum;
  if (!sameDirectionAboveCap) {
    state.velocityX = approach(
      state.velocityX,
      direction * maximum,
      (reversing ? tuning.airReverseAcceleration : tuning.airAcceleration) *
        profile.airControlMultiplier,
      dt
    );
  }
  state.facing = direction;
}

function updateAirborne(state, input, dt, profile, tuning) {
  if (state.groundSlamming) {
    state.velocityX = approach(state.velocityX, 0, tuning.groundSlamHorizontalBrake, dt);
    if (state.groundSlamPrepareSeconds > 0) {
      state.velocityY = 0;
      state.groundSlamPhase = 'startup';
      transition(state, MOVEMENT_STATES.GROUND_SLAM_STARTUP);
    } else {
      state.groundSlamPhase = 'descent';
      state.velocityY = Math.min(
        tuning.groundSlamMaximumSpeed,
        state.velocityY + tuning.groundSlamAcceleration * dt
      );
      state.velocityY = Math.max(state.velocityY, tuning.groundSlamSpeed * 0.35);
      transition(state, MOVEMENT_STATES.GROUND_SLAM_FALL);
    }
    return;
  }

  updateAirSteering(state, input, dt, profile, tuning);
  const absoluteVerticalSpeed = Math.abs(state.velocityY);
  let gravity = absoluteVerticalSpeed <= tuning.apexVelocityWindow
    ? tuning.apexGravity
    : state.velocityY < 0
      ? input.jumpHeld ? tuning.heldJumpGravity : tuning.releasedJumpGravity
      : tuning.fallGravity;

  const canGlide = profile.canGlide &&
    input.jumpHeld &&
    !state.glideExhausted &&
    state.airTwirlSeconds <= 0 &&
    state.velocityY > tuning.apexVelocityWindow;
  if (canGlide) {
    state.glideSeconds += dt;
    if (state.glideSeconds >= tuning.maximumGlideSeconds) {
      state.glideExhausted = true;
      emitMovementEvent(state, 'glide-exhausted');
    }
    if (state.glide === 'closed' || state.glide === 'closing') {
      state.glide = 'opening';
      state.glideOpeningSeconds = tuning.glideOpeningSeconds;
      emitMovementEvent(state, 'glide-opening');
    }
    if (state.glideOpeningSeconds > 0) {
      transition(state, MOVEMENT_STATES.GLIDE_OPENING);
      state.velocityY = approach(
        state.velocityY,
        tuning.glideMaximumFallSpeed,
        tuning.fallGravity,
        dt
      );
    } else {
      state.glide = 'sustained';
      transition(state, MOVEMENT_STATES.GLIDE);
      state.velocityY = approach(
        state.velocityY,
        tuning.glideMaximumFallSpeed,
        tuning.glideGravity,
        dt
      );
    }
  } else {
    if (state.glide === 'opening' || state.glide === 'sustained') {
      state.glide = 'closing';
      emitMovementEvent(state, 'glide-closing');
    } else if (state.glide === 'closing') {
      state.glide = 'closed';
    }

    if (state.airTwirlSeconds > 0) gravity *= tuning.airTwirlGravityMultiplier;
    if (state.fastFalling) gravity += tuning.fastFallAcceleration;
    state.velocityY = Math.min(
      state.fastFalling ? tuning.fastFallMaximumSpeed : tuning.maximumFallSpeed,
      state.velocityY + gravity * dt
    );
    if (state.airTwirlSeconds > 0 && state.velocityY > tuning.airTwirlMaximumFallSpeed) {
      state.velocityY = tuning.airTwirlMaximumFallSpeed;
    }
    if (state.fastFalling && state.velocityY < tuning.fastFallMinimumSpeed) {
      state.velocityY = tuning.fastFallMinimumSpeed;
    }
  }

  if (
    state.jumpCutAllowed &&
    !input.jumpHeld &&
    state.velocityY < tuning.minimumJumpCutVelocity
  ) {
    state.velocityY = tuning.minimumJumpCutVelocity;
  }
  if (state.velocityY >= 0) state.jumpCutAllowed = false;

  if (state.doubleJumpSeconds > 0) transition(state, MOVEMENT_STATES.DOUBLE_JUMP);
  else if (state.airTwirlSeconds > 0) transition(state, MOVEMENT_STATES.TWIRL);
  else if (state.glide === 'opening') transition(state, MOVEMENT_STATES.GLIDE_OPENING);
  else if (state.glide === 'sustained') transition(state, MOVEMENT_STATES.GLIDE);
  else if (state.fastFalling) transition(state, MOVEMENT_STATES.FAST_FALL);
  else if (state.velocityY < -tuning.apexVelocityWindow) transition(state, MOVEMENT_STATES.RISE);
  else if (state.velocityY <= tuning.apexVelocityWindow) transition(state, MOVEMENT_STATES.APEX);
  else transition(state, MOVEMENT_STATES.FALL);
}

function updateTimers(state, dt) {
  const timerNames = [
    'airTwirlSeconds',
    'doubleJumpSeconds',
    'glideOpeningSeconds',
    'landingRecoverySeconds',
    'hurtLockSeconds',
    'invulnerabilitySeconds',
    'dropThroughSeconds',
    'groundSlamBufferSeconds'
  ];
  for (const name of timerNames) state[name] = Math.max(0, state[name] - dt);
  if (state.dropThroughSeconds <= 0) state.dropThroughPlatformId = null;
  if (state.groundSlamPhase === 'startup') {
    state.groundSlamPrepareSeconds = Math.max(0, state.groundSlamPrepareSeconds - dt);
  } else if (state.groundSlamPhase === 'impact') {
    state.groundSlamImpactSeconds = Math.max(0, state.groundSlamImpactSeconds - dt);
  } else if (state.groundSlamPhase === 'recovery') {
    state.groundSlamRecoverySeconds = Math.max(0, state.groundSlamRecoverySeconds - dt);
  }
}

function updateForcedState(state, input, dt, tuning, groundHeightAt, minimumX, maximumX) {
  if (state.forcedState === MOVEMENT_STATES.DEAD) {
    state.velocityX = 0;
    state.velocityY = 0;
    transition(state, MOVEMENT_STATES.DEAD);
    return true;
  }
  if (state.forcedState === MOVEMENT_STATES.SCRIPTED) {
    transition(state, MOVEMENT_STATES.SCRIPTED);
    return true;
  }
  if (state.hurtLockSeconds > 0) {
    transition(state, MOVEMENT_STATES.KNOCKBACK);
    state.footX = clamp(state.footX + state.velocityX * dt, minimumX, maximumX);
    state.footY += state.velocityY * dt;
    state.velocityY = Math.min(tuning.maximumFallSpeed, state.velocityY + tuning.fallGravity * dt);
    const groundY = groundHeightAt(state.footX);
    if (state.velocityY >= 0 && state.footY >= groundY) {
      state.footY = groundY;
      state.velocityY = 0;
      state.grounded = true;
    }
    return true;
  }
  if (state.groundSlamPhase === 'impact' && state.groundSlamImpactSeconds > 0) {
    state.velocityX = approach(state.velocityX, 0, tuning.highSpeedSkidDeceleration, dt);
    transition(state, MOVEMENT_STATES.GROUND_SLAM_IMPACT);
    return true;
  }
  if (state.groundSlamPhase === 'impact' && state.groundSlamImpactSeconds <= 0) {
    state.groundSlamPhase = 'recovery';
    transition(state, MOVEMENT_STATES.GROUND_SLAM_RECOVERY);
  }
  if (state.groundSlamPhase === 'recovery' && state.groundSlamRecoverySeconds > 0) {
    state.velocityX = approach(state.velocityX, 0, tuning.releaseDeceleration, dt);
    transition(state, MOVEMENT_STATES.GROUND_SLAM_RECOVERY);
    return true;
  }
  if (state.groundSlamPhase === 'recovery') state.groundSlamPhase = 'none';
  if (state.landingRecoverySeconds > 0 && state.jumpBufferSeconds <= 0) {
    state.velocityX = approach(state.velocityX, 0, tuning.releaseDeceleration * 0.35, dt);
    return true;
  }
  return false;
}

function refreshMovementContacts(state, {
  tuning,
  profiles,
  groundHeightAt,
  hasGroundAt,
  surfaceAt,
  wallAt,
  headAt,
  ledgeAt,
  semisolidAt,
  movingPlatformAt,
  sampleSensors,
  previousFootY
}) {
  const snapshot = sampleSensors
    ? sampleSensors(state, { previousFootY })
    : buildMovementContactSnapshot(state, {
        tuning,
        profiles,
        groundHeightAt,
        hasGroundAt,
        surfaceAt,
        wallAt,
        headAt,
        ledgeAt,
        semisolidAt,
        movingPlatformAt,
        previousFootY
      });
  const sensors = snapshot.sensors ?? snapshot;
  const contacts = snapshot.contacts ?? deriveMovementContacts(sensors);
  state.sensors = sensors;
  state.contacts = contacts;
  return contacts;
}

export function stepUnifiedCharacterController(
  state,
  input,
  deltaSeconds,
  {
    tuning = MOVEMENT_TUNING,
    profiles = HERO_PROFILES,
    groundHeightAt = () => 0,
    hasGroundAt = () => true,
    surfaceAt = () => ({ angle: 0, normal: { x: 0, y: -1 }, material: 'normal' }),
    wallAt = () => null,
    headAt = () => null,
    ledgeAt = () => null,
    semisolidAt = () => null,
    movingPlatformAt = () => null,
    sampleSensors = null,
    canStand = () => true,
    minimumX = -Infinity,
    maximumX = Infinity,
    doubleJumpUnlocked = state.doubleJumpUnlocked
  } = {}
) {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    throw new TypeError('deltaSeconds must be a positive finite number');
  }
  const profile = heroProfile(state.hero, profiles);
  beginMovementStep(state);
  const previousVelocityX = state.velocityX;
  const previousVelocityY = state.velocityY;
  const previousFootY = state.footY;
  state.stateSeconds += deltaSeconds;
  state.doubleJumpUnlocked = Boolean(doubleJumpUnlocked);
  updateTimers(state, deltaSeconds);
  let contacts = refreshMovementContacts(state, {
    tuning,
    profiles,
    groundHeightAt,
    hasGroundAt,
    surfaceAt,
    wallAt,
    headAt,
    ledgeAt,
    semisolidAt,
    movingPlatformAt,
    sampleSensors,
    previousFootY
  });
  if (state.grounded && contacts?.grounded) {
    state.surfaceAngle = contacts.surfaceAngle;
    state.surfaceNormal = contacts.surfaceNormal;
    state.surfaceMaterial = contacts.terrainMaterial;
  }

  const wantsDropThrough = state.grounded &&
    Boolean(state.supportPlatformId) &&
    input.downHeld &&
    input.jumpPressed;
  if (wantsDropThrough) {
    state.dropThroughPlatformId = state.supportPlatformId;
    state.dropThroughSeconds = tuning.dropThroughSeconds;
    state.jumpBufferSeconds = 0;
    state.supportPlatformId = null;
    state.supportVelocityX = 0;
    state.supportVelocityY = 0;
    state.grounded = false;
    state.velocityY = Math.max(0.35, state.velocityY);
    state.coyoteSeconds = 0;
    transition(state, MOVEMENT_STATES.FALL);
    emitMovementEvent(state, 'one-way-drop-through-started', {
      platformId: state.dropThroughPlatformId
    });
  }

  state.jumpBufferSeconds = input.jumpPressed && !wantsDropThrough
    ? tuning.jumpBufferSeconds
    : Math.max(0, state.jumpBufferSeconds - deltaSeconds);
  if (state.grounded) {
    state.coyoteSeconds = tuning.coyoteSeconds;
    state.airborneSeconds = 0;
  } else {
    state.coyoteSeconds = Math.max(0, state.coyoteSeconds - deltaSeconds);
    state.airborneSeconds += deltaSeconds;
  }

  if (state.grounded && !contacts?.grounded) {
    state.grounded = false;
    state.supportPlatformId = null;
    state.supportVelocityX = 0;
    state.supportVelocityY = 0;
    state.airborneSeconds = 0;
    emitMovementEvent(state, 'support-lost');
  }

  if (updateForcedState(
    state,
    input,
    deltaSeconds,
    tuning,
    groundHeightAt,
    minimumX,
    maximumX
  )) {
    state.accelerationX = (state.velocityX - previousVelocityX) / deltaSeconds;
    state.accelerationY = (state.velocityY - previousVelocityY) / deltaSeconds;
    executeMovementState(state);
    updateMovementTelemetry(state, input, contacts);
    return Object.freeze({ state, events: movementEvents(state), telemetry: state.telemetry });
  }

  const canGroundJump = !wantsDropThrough && (state.grounded || state.coyoteSeconds > 0);
  if (state.jumpBufferSeconds > 0 && canGroundJump) {
    startGroundJump(state, profile, tuning);
  } else if (input.jumpPressed && !state.grounded) {
    if (
      state.hero === 'Hargold' &&
      state.doubleJumpUnlocked &&
      !state.doubleJumpUsed &&
      !state.groundSlamming
    ) {
      startDoubleJump(state, tuning);
    } else if (
      !state.airTwirlUsed &&
      !state.groundSlamming &&
      state.glide === 'closed'
    ) {
      startTwirl(state, tuning);
    }
  }

  const slamClearance = groundHeightAt(state.footX) - state.footY;
  const groundSlamPressed = Boolean(input.groundSlamPressed ?? input.downPressed);
  const slamCanBecomeValid = !state.grounded &&
    !state.groundSlamming &&
    (
      slamClearance >= tuning.minimumGroundSlamClearance ||
      state.velocityY < -tuning.apexVelocityWindow
    );
  if (groundSlamPressed && slamCanBecomeValid) {
    state.groundSlamBufferSeconds = tuning.groundSlamInputBufferSeconds;
  }
  const canGroundSlam = !state.grounded &&
    !state.groundSlamming &&
    state.airborneSeconds >= tuning.minimumGroundSlamAirSeconds &&
    slamClearance >= tuning.minimumGroundSlamClearance;
  if (state.groundSlamBufferSeconds > 0 && canGroundSlam) {
    startGroundSlam(state, tuning);
  }
  state.fastFalling = !state.grounded &&
    !state.groundSlamming &&
    state.groundSlamBufferSeconds <= 0 &&
    input.fastFallHeld &&
    state.velocityY > tuning.apexVelocityWindow;

  if (state.grounded) {
    enterGroundedLocomotion(state, input, deltaSeconds, tuning, canStand);
    state.footX = clamp(state.footX + state.velocityX * deltaSeconds, minimumX, maximumX);
    contacts = refreshMovementContacts(state, {
      tuning,
      profiles,
      groundHeightAt,
      hasGroundAt,
      surfaceAt,
      wallAt,
      headAt,
      ledgeAt,
      semisolidAt,
      movingPlatformAt,
      sampleSensors,
      previousFootY
    });
    if (contacts?.grounded) {
      state.surfaceAngle = contacts.surfaceAngle;
      state.surfaceNormal = contacts.surfaceNormal;
      state.surfaceMaterial = contacts.terrainMaterial;
      state.footY = contacts.safeLandingY ?? groundHeightAt(state.footX);
      state.velocityY = 0;
    } else {
      state.grounded = false;
      state.supportPlatformId = null;
      state.airborneSeconds = 0;
      transition(state, MOVEMENT_STATES.FALL);
      emitMovementEvent(state, 'ledge-left');
    }
  }

  if (!state.grounded) {
    updateAirborne(state, input, deltaSeconds, profile, tuning);
    state.footX = clamp(state.footX + state.velocityX * deltaSeconds, minimumX, maximumX);
    state.footY += state.velocityY * deltaSeconds;
    contacts = refreshMovementContacts(state, {
      tuning,
      profiles,
      groundHeightAt,
      hasGroundAt,
      surfaceAt,
      wallAt,
      headAt,
      ledgeAt,
      semisolidAt,
      movingPlatformAt,
      sampleSensors,
      previousFootY
    });
    const groundY = contacts?.safeLandingY ?? groundHeightAt(state.footX);
    if (
      contacts?.canLand &&
      state.velocityY >= 0 &&
      state.footY >= groundY &&
      previousFootY <= groundY
    ) {
      applyMovementLanding(state, {
        footY: groundY,
        landingSpeed: state.velocityY,
        surface: surfaceAt(state.footX),
        tuning
      });
    }
  }

  state.accelerationX = (state.velocityX - previousVelocityX) / deltaSeconds;
  state.accelerationY = (state.velocityY - previousVelocityY) / deltaSeconds;
  executeMovementState(state);
  updateMovementTelemetry(state, input, contacts);
  return Object.freeze({ state, events: movementEvents(state), telemetry: state.telemetry });
}

export function trySwapUnifiedHero(
  state,
  {
    profiles = HERO_PROFILES,
    canOccupy = () => true,
    canSwapState = () => ![
      MOVEMENT_STATES.DEAD,
      MOVEMENT_STATES.DAMAGE,
      MOVEMENT_STATES.KNOCKBACK,
      MOVEMENT_STATES.GROUND_SLAM_IMPACT,
      MOVEMENT_STATES.SCRIPTED
    ].includes(state.movementState)
  } = {}
) {
  if (!canSwapState()) {
    return Object.freeze({ accepted: false, reason: 'state-forbids-swap', hero: state.hero });
  }
  const nextHero = state.hero === HERO_NAMES[0] ? HERO_NAMES[1] : HERO_NAMES[0];
  const nextProfile = heroProfile(nextHero, profiles);
  const candidate = bodyAtFoot(nextProfile, state.footX, state.footY);
  if (!canOccupy(candidate, nextHero)) {
    return Object.freeze({
      accepted: false,
      reason: 'unsafe-collider-fit',
      hero: state.hero,
      body: movementBody(state, profiles)
    });
  }
  const previousHero = state.hero;
  state.hero = nextHero;
  state.stance = 'standing';
  state.glide = 'closed';
  state.groundSlamming = false;
  state.groundSlamPhase = 'none';
  state.groundSlamBufferSeconds = 0;
  state.airTwirlSeconds = 0;
  transition(state, MOVEMENT_STATES.SWAP_IN);
  emitMovementEvent(state, 'hero-swapped', { previousHero, nextHero });
  return Object.freeze({ accepted: true, reason: null, hero: nextHero, body: candidate });
}

export function applyMovementDamage(
  state,
  direction,
  {
    tuning = MOVEMENT_TUNING,
    horizontalSpeed = tuning.hurtHorizontalSpeed,
    verticalSpeed = tuning.hurtVerticalSpeed
  } = {}
) {
  if (state.invulnerabilitySeconds > 0 || state.forcedState === MOVEMENT_STATES.DEAD) return false;
  state.velocityX = Math.sign(direction || 1) * horizontalSpeed;
  state.velocityY = -verticalSpeed;
  state.grounded = false;
  state.supportPlatformId = null;
  state.supportVelocityX = 0;
  state.supportVelocityY = 0;
  state.hurtLockSeconds = tuning.hurtLockSeconds;
  state.invulnerabilitySeconds = tuning.invulnerabilitySeconds;
  state.glide = 'closed';
  state.groundSlamming = false;
  state.groundSlamPhase = 'none';
  state.groundSlamBufferSeconds = 0;
  state.airTwirlSeconds = 0;
  state.fastFalling = false;
  state.jumpCutAllowed = false;
  transition(state, MOVEMENT_STATES.DAMAGE);
  emitMovementEvent(state, 'damage-knockback', { direction: Math.sign(direction || 1) });
  return true;
}

export function applyMovementBounce(
  state,
  {
    kind = 'enemy',
    strong = false,
    jumpHeld = false,
    resetTwirl = true,
    resetDoubleJump = true,
    tuning = MOVEMENT_TUNING
  } = {}
) {
  const enhanced = strong || jumpHeld;
  state.velocityY = -(enhanced ? tuning.strongStompBounceSpeed : tuning.stompBounceSpeed);
  state.grounded = false;
  state.supportPlatformId = null;
  state.supportVelocityX = 0;
  state.supportVelocityY = 0;
  state.airborneSeconds = 0;
  state.groundSlamming = false;
  state.groundSlamPhase = 'none';
  state.groundSlamBufferSeconds = 0;
  state.fastFalling = false;
  state.jumpCutAllowed = false;
  state.glide = 'closed';
  if (resetTwirl) {
    state.airTwirlUsed = false;
    state.airTwirlSeconds = 0;
  }
  if (resetDoubleJump) state.doubleJumpUsed = false;
  transition(
    state,
    kind === 'spring' ? MOVEMENT_STATES.SPRING_BOUNCE : MOVEMENT_STATES.STOMP_BOUNCE
  );
  emitMovementEvent(state, 'bounce', { kind, enhanced, verticalSpeed: state.velocityY });
  return state;
}

export function applyMovementLanding(
  state,
  {
    footY,
    platformId = null,
    landingSpeed = state.velocityY,
    surface = {},
    tuning = MOVEMENT_TUNING
  } = {}
) {
  const slammed = state.groundSlamming;
  const glided = state.glide === 'opening' || state.glide === 'sustained';
  state.footY = footY;
  state.landingSpeed = landingSpeed;
  state.velocityY = 0;
  state.grounded = true;
  state.supportPlatformId = platformId;
  resetAirActions(state);
  if (slammed) {
    beginGroundSlamImpact(state, tuning, surface);
  } else {
    const hard = !glided && landingSpeed >= tuning.hardLandingSpeed;
    state.groundSlamming = false;
    state.groundSlamPhase = 'none';
    state.groundSlamBufferSeconds = 0;
    state.landingRecoverySeconds = hard
      ? tuning.hardLandingRecoverySeconds
      : tuning.softLandingRecoverySeconds;
    transition(state, hard ? MOVEMENT_STATES.HARD_LAND : MOVEMENT_STATES.SOFT_LAND);
    emitMovementEvent(state, hard ? 'hard-landed' : 'soft-landed', {
      landingSpeed,
      platformId
    });
  }
  return state;
}

export function setMovementForcedState(state, forcedState = null) {
  state.forcedState = forcedState;
  if (forcedState) transition(state, forcedState);
  return state;
}
