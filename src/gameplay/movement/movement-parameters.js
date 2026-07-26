import { MOVEMENT_TUNING } from './movement-tuning.js';

function terrainProfile(id, values = {}) {
  return Object.freeze({
    id,
    accelerationMultiplier: 1,
    brakingMultiplier: 1,
    traction: 1,
    maximumSpeedMultiplier: 1,
    slopeSlideThreshold: 0.78,
    footstepSet: id,
    landingEffect: `${id}-landing`,
    particleEffect: `${id}-movement`,
    jumpMultiplier: 1,
    conveyorVelocity: 0,
    sinkRate: 0,
    ...values
  });
}

/*
 * Clean-room project profiles. They describe gameplay response independently
 * of a mesh material or visible texture and remain provisional until course
 * calibration on target hardware.
 */
export const TERRAIN_RESPONSE_PROFILES = Object.freeze({
  normal: terrainProfile('normal'),
  dirt: terrainProfile('dirt', {
    accelerationMultiplier: 0.96,
    brakingMultiplier: 0.94,
    traction: 0.95,
    particleEffect: 'dirt-dust'
  }),
  sand: terrainProfile('sand', {
    accelerationMultiplier: 0.78,
    brakingMultiplier: 0.84,
    traction: 0.76,
    maximumSpeedMultiplier: 0.88,
    slopeSlideThreshold: 0.58,
    jumpMultiplier: 0.94,
    sinkRate: 0.03
  }),
  snow: terrainProfile('snow', {
    accelerationMultiplier: 0.82,
    brakingMultiplier: 0.76,
    traction: 0.72,
    maximumSpeedMultiplier: 0.92,
    particleEffect: 'snow-puff'
  }),
  ice: terrainProfile('ice', {
    accelerationMultiplier: 0.52,
    brakingMultiplier: 0.28,
    traction: 0.3,
    slopeSlideThreshold: 0.34,
    landingEffect: 'ice-skid'
  }),
  'low-slip': terrainProfile('low-slip', {
    accelerationMultiplier: 0.36,
    brakingMultiplier: 0.16,
    traction: 0.18,
    slopeSlideThreshold: 0.24,
    landingEffect: 'low-slip-skid'
  }),
  wood: terrainProfile('wood', {
    accelerationMultiplier: 1.02,
    brakingMultiplier: 1.04,
    traction: 1.04,
    footstepSet: 'wood-hollow'
  }),
  conveyor: terrainProfile('conveyor', {
    conveyorVelocity: 1.4,
    footstepSet: 'mechanism'
  }),
  'shallow-water': terrainProfile('shallow-water', {
    accelerationMultiplier: 0.62,
    brakingMultiplier: 0.72,
    traction: 0.68,
    maximumSpeedMultiplier: 0.68,
    jumpMultiplier: 0.82,
    particleEffect: 'water-splash'
  }),
  'sinking-terrain': terrainProfile('sinking-terrain', {
    accelerationMultiplier: 0.48,
    brakingMultiplier: 0.58,
    traction: 0.5,
    maximumSpeedMultiplier: 0.62,
    jumpMultiplier: 0.78,
    sinkRate: 0.18
  }),
  mud: terrainProfile('mud', {
    accelerationMultiplier: 0.58,
    brakingMultiplier: 0.7,
    traction: 0.64,
    maximumSpeedMultiplier: 0.72,
    jumpMultiplier: 0.86,
    sinkRate: 0.08
  }),
  leaf: terrainProfile('leaf', {
    accelerationMultiplier: 0.9,
    brakingMultiplier: 0.82,
    traction: 0.8,
    particleEffect: 'leaf-scatter'
  }),
  cloud: terrainProfile('cloud', {
    accelerationMultiplier: 0.88,
    brakingMultiplier: 0.86,
    traction: 0.82,
    jumpMultiplier: 1.04
  }),
  beach: terrainProfile('beach', {
    accelerationMultiplier: 0.74,
    brakingMultiplier: 0.82,
    traction: 0.72,
    maximumSpeedMultiplier: 0.86,
    jumpMultiplier: 0.92
  }),
  carpet: terrainProfile('carpet', {
    accelerationMultiplier: 0.9,
    brakingMultiplier: 1.08,
    traction: 1.08,
    footstepSet: 'cloth'
  })
});

const TERRAIN_ALIASES = Object.freeze({
  default: 'normal',
  'low-slip-ice': 'low-slip',
  water: 'shallow-water',
  'sinking-sand': 'sinking-terrain'
});

export const HORIZONTAL_RESPONSE_CASES = Object.freeze({
  FROM_REST: 'from-rest',
  ALREADY_MOVING: 'already-moving',
  NO_INPUT: 'no-input',
  OPPOSITE_INPUT_BRAKE: 'opposite-input-brake',
  ACTIVE_TURN: 'active-turn',
  VERY_SLOW: 'very-slow',
  SLOW: 'slow',
  RUN_TO_SLOW: 'run-to-slow',
  MEDIUM: 'medium',
  FAST: 'fast'
});

export const MOVEMENT_PARAMETER_SCHEMA = Object.freeze({
  version: 1,
  authority: 'src/gameplay/movement/movement-tuning.js',
  units: Object.freeze({
    speed: 'metres-per-second',
    acceleration: 'metres-per-second-squared',
    time: 'seconds',
    angle: 'radians'
  }),
  speedTiers: Object.freeze(['walkSpeed', 'runSpeed', 'sprintSpeed']),
  horizontalResponse: Object.freeze([
    'accelerationFromRest',
    'accelerationWhileMoving',
    'noInputDeceleration',
    'oppositeInputBraking',
    'activeTurnAcceleration',
    'verySlowAcceleration',
    'slowAcceleration',
    'runToSlowAcceleration',
    'mediumAcceleration',
    'fastAcceleration',
    'groundTraction',
    'airAcceleration',
    'airBraking'
  ]),
  verticalResponse: Object.freeze([
    'baseJumpSpeed',
    'heldJumpGravity',
    'releasedJumpGravity',
    'apexGravity',
    'fallGravity',
    'maximumFallSpeed',
    'groundSlamMaximumSpeed'
  ]),
  terrainProfileFields: Object.freeze([
    'accelerationMultiplier',
    'brakingMultiplier',
    'traction',
    'maximumSpeedMultiplier',
    'slopeSlideThreshold',
    'footstepSet',
    'landingEffect',
    'particleEffect',
    'jumpMultiplier',
    'conveyorVelocity',
    'sinkRate'
  ])
});

export function terrainResponseFor(material = 'normal') {
  const id = TERRAIN_ALIASES[material] ?? material;
  return TERRAIN_RESPONSE_PROFILES[id] ?? TERRAIN_RESPONSE_PROFILES.normal;
}

export function selectHorizontalResponse({
  velocityX,
  direction,
  targetSpeed,
  tuning = MOVEMENT_TUNING,
  terrain = TERRAIN_RESPONSE_PROFILES.normal
}) {
  const speed = Math.abs(velocityX);
  const reversing = velocityX !== 0 &&
    direction !== 0 &&
    Math.sign(velocityX) !== direction;
  let responseCase;
  let acceleration;

  if (direction === 0) {
    responseCase = HORIZONTAL_RESPONSE_CASES.NO_INPUT;
    acceleration = tuning.noInputDeceleration;
  } else if (reversing && speed >= tuning.skidThreshold) {
    responseCase = HORIZONTAL_RESPONSE_CASES.OPPOSITE_INPUT_BRAKE;
    acceleration = tuning.oppositeInputBraking;
  } else if (reversing) {
    responseCase = HORIZONTAL_RESPONSE_CASES.ACTIVE_TURN;
    acceleration = tuning.activeTurnAcceleration;
  } else if (speed <= 0.08) {
    responseCase = HORIZONTAL_RESPONSE_CASES.FROM_REST;
    acceleration = tuning.accelerationFromRest;
  } else if (speed > targetSpeed * 1.08) {
    responseCase = HORIZONTAL_RESPONSE_CASES.RUN_TO_SLOW;
    acceleration = tuning.runToSlowAcceleration;
  } else if (speed < tuning.walkSpeed * 0.35) {
    responseCase = HORIZONTAL_RESPONSE_CASES.VERY_SLOW;
    acceleration = tuning.verySlowAcceleration;
  } else if (speed < tuning.walkSpeed * 0.9) {
    responseCase = HORIZONTAL_RESPONSE_CASES.SLOW;
    acceleration = tuning.slowAcceleration;
  } else if (speed < tuning.runSpeed * 0.94) {
    responseCase = HORIZONTAL_RESPONSE_CASES.MEDIUM;
    acceleration = tuning.mediumAcceleration;
  } else if (speed >= tuning.sprintEntrySpeed) {
    responseCase = HORIZONTAL_RESPONSE_CASES.FAST;
    acceleration = tuning.fastAcceleration;
  } else {
    responseCase = HORIZONTAL_RESPONSE_CASES.ALREADY_MOVING;
    acceleration = tuning.accelerationWhileMoving;
  }

  const multiplier = responseCase === HORIZONTAL_RESPONSE_CASES.NO_INPUT ||
    responseCase === HORIZONTAL_RESPONSE_CASES.OPPOSITE_INPUT_BRAKE
    ? terrain.brakingMultiplier
    : terrain.accelerationMultiplier;
  return Object.freeze({
    case: responseCase,
    acceleration: acceleration * multiplier * terrain.traction,
    reversing,
    terrainId: terrain.id
  });
}
