/*
 * Clean-room project-scale tuning.
 *
 * Values are authored for Hargold & Mebble's meter-scale collision bodies and
 * Meadow Wake geometry. They are provisional engineering values, not values
 * copied from another game or binary.
 */
export const MOVEMENT_TUNING = Object.freeze({
  status: 'approved-original-numeric-animation-contract-aligned',
  simulationHz: 120,
  walkSpeed: 3.2,
  runSpeed: 5.7,
  sprintSpeed: 7.15,
  sprintEntrySpeed: 4.65,
  accelerationFromRest: 18,
  accelerationWhileMoving: 22,
  noInputDeceleration: 16,
  oppositeInputBraking: 30,
  activeTurnAcceleration: 25,
  verySlowAcceleration: 14,
  slowAcceleration: 18,
  runToSlowAcceleration: 20,
  mediumAcceleration: 22,
  fastAcceleration: 25,
  groundTraction: 1,
  airBraking: 0.8,
  groundAccelerationWalk: 18,
  groundAccelerationRun: 22,
  groundAccelerationSprint: 25,
  releaseDeceleration: 16,
  crouchDeceleration: 20,
  lowSpeedTurnAcceleration: 25,
  highSpeedSkidDeceleration: 30,
  skidThreshold: 3,
  skidExitSpeed: 1.1,
  crawlSpeed: 1.35,
  slideMinimumSpeed: 3,
  slideExitSpeed: 1.1,
  slideFriction: 5,
  crouchHeightMultiplier: 0.58,
  uphillSpeedPenalty: 0.24,
  downhillSpeedBoost: 0.16,
  maximumWalkableSlopeRadians: 0.78,
  airAcceleration: 11,
  airReverseAcceleration: 14,
  airMaximumWalkSpeed: 3.6,
  airMaximumRunSpeed: 5.9,
  airMaximumSprintSpeed: 7.2,
  baseJumpSpeed: 10.4,
  runningJumpBonus: 1.55,
  heldJumpGravity: 22.6,
  releasedJumpGravity: 39.2,
  fallGravity: 36.8,
  apexGravity: 16,
  apexVelocityWindow: 0.84,
  maximumFallSpeed: 15.8,
  minimumJumpCutVelocity: -4.7,
  jumpBufferSeconds: 5 / 60,
  coyoteSeconds: 4 / 60,
  airTwirlSeconds: 0.32,
  airTwirlGravityMultiplier: 0.32,
  airTwirlMaximumFallSpeed: 1.4,
  doubleJumpSpeed: 9.45,
  glideOpeningSeconds: 7 / 60,
  maximumGlideSeconds: 2.4,
  glideGravity: 5.6,
  glideMaximumFallSpeed: 2.9,
  fastFallAcceleration: 28,
  fastFallMinimumSpeed: 7,
  fastFallMaximumSpeed: 18,
  groundSlamInputBufferSeconds: 0.14,
  minimumGroundSlamAirSeconds: 0.08,
  minimumGroundSlamClearance: 0.65,
  groundSlamPrepareSeconds: 0.1,
  groundSlamAcceleration: 90,
  groundSlamSpeed: 18,
  groundSlamMaximumSpeed: 23,
  groundSlamHorizontalBrake: 16,
  groundSlamImpactSeconds: 0.075,
  groundSlamRecoverySeconds: 0.16,
  hardLandingSpeed: 13.2,
  softLandingRecoverySeconds: 4 / 60,
  hardLandingRecoverySeconds: 6 / 60,
  stompBounceSpeed: 8,
  strongStompBounceSpeed: 11,
  wallSlideMaximumSpeed: 3.4,
  wallCoyoteSeconds: 5 / 60,
  sameWallRegrabSeconds: 10 / 60,
  dropThroughSeconds: 0.16,
  swimAcceleration: 8,
  swimMaximumSpeed: 4,
  swimDrag: 3.5,
  buoyancyAcceleration: 8,
  climbSpeed: 2.8,
  ropePumpAcceleration: 3.5,
  carryLightSpeedMultiplier: 0.86,
  carryHeavySpeedMultiplier: 0.62,
  carryLightJumpMultiplier: 0.9,
  carryHeavyJumpMultiplier: 0.68,
  throwSpeed: 8,
  throwHeroVelocityInheritance: 0.5,
    movingPlatformVelocityInheritance: 1,
  hurtHorizontalSpeed: 4.7,
  hurtVerticalSpeed: 6.2,
  hurtLockSeconds: 0.28,
  invulnerabilitySeconds: 1.05
});

function humanize(name) {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

function unitFor(name) {
  if (name === 'simulationHz') return 'fixed steps per second';
  if (/Seconds$/.test(name)) return 'seconds';
  if (/Gravity|Acceleration|Deceleration|Brake|Friction/.test(name)) return 'meters per second squared';
  if (/Speed|Velocity/.test(name)) return 'meters per second';
  if (/Multiplier/.test(name)) return 'ratio';
  if (/Height|Clearance/.test(name)) return 'meters or ratio as named';
  return 'project-scale scalar';
}

function stateFor(name) {
  if (/groundSlam/i.test(name)) return 'ground-slam startup, descent, impact, or recovery';
  if (/glide/i.test(name)) return 'Mebble glide';
  if (/Twirl|doubleJump/i.test(name)) return 'airborne utility action';
  if (/Jump|Coyote|apex/i.test(name)) return 'jump request and airborne arc';
  if (/air|Fall/i.test(name)) return 'airborne locomotion';
  if (/stomp/i.test(name)) return 'stomp rebound';
  if (/hurt|invulnerability/i.test(name)) return 'damage and knockback';
  if (/swim|buoyancy/i.test(name)) return 'water traversal';
  if (/climb|rope/i.test(name)) return 'climb or rope traversal';
  if (/carry|throw/i.test(name)) return 'carrying and throwing';
  if (/platform/i.test(name)) return 'moving-platform transport';
  return 'grounded locomotion';
}

export const MOVEMENT_PARAMETER_DOCUMENTATION = Object.freeze(
  Object.fromEntries(
    Object.entries(MOVEMENT_TUNING)
      .filter(([name, value]) => name !== 'status' && typeof value === 'number')
      .map(([name]) => [name, Object.freeze({
        unit: unitFor(name),
        purpose: `Controls ${humanize(name)} in the unified controller.`,
        state: stateFor(name),
        increasedEffect: `Raises the ${humanize(name)} contribution.`,
        decreasedEffect: `Lowers the ${humanize(name)} contribution.`,
        heroOverridePolicy: /glide/i.test(name)
          ? 'Mebble-only where the state is hero-specific'
          : 'shared unless an explicit hero profile field says otherwise'
      })])
  )
);
