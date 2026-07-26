export const MOVEMENT_BRANCHES = Object.freeze({
  GROUNDED: 'grounded',
  AIRBORNE: 'airborne',
  SPECIAL: 'special'
});

/*
 * Compatibility names are retained while the hierarchy exposes the approved
 * Grounded / Airborne / Special contract. Aliases intentionally resolve to the
 * same leaf state so existing renderer and gameplay integrations do not fork
 * into a second controller.
 */
export const MOVEMENT_STATES = Object.freeze({
  IDLE: 'idle',
  WALK: 'walk',
  RUN: 'run',
  SPRINT: 'sprint',
  BRAKE: 'brake',
  SKID: 'skid',
  TURN: 'turn',
  CROUCH: 'crouch',
  CRAWL: 'crawl',
  SLIDE: 'duck-slide',
  DUCK_SLIDE: 'duck-slide',
  LANDING: 'landing',
  SOFT_LAND: 'soft-land',
  HARD_LAND: 'hard-land',
  GROUND_ACTION: 'ground-action',

  JUMP_TAKEOFF: 'jump-startup',
  JUMP_STARTUP: 'jump-startup',
  JUMP_RISE: 'rise',
  RISE: 'rise',
  JUMP_APEX: 'apex',
  APEX: 'apex',
  FALL: 'fall',
  TWIRL: 'twirl',
  HARGOLD_DOUBLE_JUMP: 'double-jump',
  DOUBLE_JUMP: 'double-jump',
  MEBBLE_CAPE_GLIDE: 'glide',
  GLIDE_OPENING: 'glide-opening',
  GLIDE: 'glide',
  GLIDE_CLOSING: 'glide-closing',
  FAST_FALL: 'fast-fall',
  GROUND_POUND: 'ground-slam-fall',
  GROUND_SLAM_STARTUP: 'ground-slam-startup',
  GROUND_SLAM_FALL: 'ground-slam-fall',
  GROUND_SLAM_IMPACT: 'ground-slam-impact',
  GROUND_SLAM_RECOVERY: 'ground-slam-recovery',
  STOMP: 'stomp',
  BOUNCE: 'stomp-bounce',
  STOMP_BOUNCE: 'stomp-bounce',
  SPRING_BOUNCE: 'spring-bounce',

  LEDGE_GRAB: 'ledge-grab',
  WALL_CONTACT: 'wall-contact',
  SWIM: 'swim',
  MOVING_PLATFORM: 'moving-platform',
  DAMAGE: 'damage',
  KNOCKBACK: 'knockback',
  TRANSITION: 'transition',
  PIPE_DOOR_TRANSITION: 'transition',
  SCRIPTED_MOVEMENT: 'scripted',
  SCRIPTED: 'scripted',
  DEAD: 'dead',
  RESPAWNING: 'respawning',
  SWAP_OUT: 'swap-out',
  SWAP_IN: 'swap-in',
  VICTORY: 'victory'
});

const ALL_INPUTS = Object.freeze({
  move: true,
  jump: true,
  down: true,
  action: true,
  swap: true,
  pause: true
});

const AIR_INPUTS = Object.freeze({
  ...ALL_INPUTS,
  swap: false
});

const PRESENTATION_LOCK = Object.freeze({
  move: false,
  jump: false,
  down: false,
  action: false,
  swap: false,
  pause: true
});

const NO_INPUT = Object.freeze({
  ...PRESENTATION_LOCK,
  pause: false
});

const GROUNDED_LEAVES = Object.freeze([
  MOVEMENT_STATES.IDLE,
  MOVEMENT_STATES.WALK,
  MOVEMENT_STATES.RUN,
  MOVEMENT_STATES.SPRINT,
  MOVEMENT_STATES.BRAKE,
  MOVEMENT_STATES.SKID,
  MOVEMENT_STATES.TURN,
  MOVEMENT_STATES.CROUCH,
  MOVEMENT_STATES.CRAWL,
  MOVEMENT_STATES.DUCK_SLIDE,
  MOVEMENT_STATES.LANDING,
  MOVEMENT_STATES.SOFT_LAND,
  MOVEMENT_STATES.HARD_LAND,
  MOVEMENT_STATES.GROUND_ACTION,
  MOVEMENT_STATES.GROUND_SLAM_IMPACT,
  MOVEMENT_STATES.GROUND_SLAM_RECOVERY
]);

const AIRBORNE_LEAVES = Object.freeze([
  MOVEMENT_STATES.JUMP_STARTUP,
  MOVEMENT_STATES.RISE,
  MOVEMENT_STATES.APEX,
  MOVEMENT_STATES.FALL,
  MOVEMENT_STATES.TWIRL,
  MOVEMENT_STATES.DOUBLE_JUMP,
  MOVEMENT_STATES.GLIDE_OPENING,
  MOVEMENT_STATES.GLIDE,
  MOVEMENT_STATES.GLIDE_CLOSING,
  MOVEMENT_STATES.FAST_FALL,
  MOVEMENT_STATES.GROUND_SLAM_STARTUP,
  MOVEMENT_STATES.GROUND_SLAM_FALL,
  MOVEMENT_STATES.STOMP,
  MOVEMENT_STATES.STOMP_BOUNCE,
  MOVEMENT_STATES.SPRING_BOUNCE
]);

const SPECIAL_LEAVES = Object.freeze([
  MOVEMENT_STATES.LEDGE_GRAB,
  MOVEMENT_STATES.WALL_CONTACT,
  MOVEMENT_STATES.SWIM,
  MOVEMENT_STATES.MOVING_PLATFORM,
  MOVEMENT_STATES.DAMAGE,
  MOVEMENT_STATES.KNOCKBACK,
  MOVEMENT_STATES.TRANSITION,
  MOVEMENT_STATES.SCRIPTED,
  MOVEMENT_STATES.DEAD,
  MOVEMENT_STATES.RESPAWNING,
  MOVEMENT_STATES.SWAP_OUT,
  MOVEMENT_STATES.SWAP_IN,
  MOVEMENT_STATES.VICTORY
]);

const UNIQUE_STATES = Object.freeze([
  ...new Set([...GROUNDED_LEAVES, ...AIRBORNE_LEAVES, ...SPECIAL_LEAVES])
]);

const ANIMATION_ALIASES = Object.freeze({
  [MOVEMENT_STATES.BRAKE]: 'stop',
  [MOVEMENT_STATES.TURN]: 'turn-low',
  [MOVEMENT_STATES.CROUCH]: 'duck',
  [MOVEMENT_STATES.DUCK_SLIDE]: 'sprint-slide',
  [MOVEMENT_STATES.LANDING]: 'land-soft',
  [MOVEMENT_STATES.JUMP_STARTUP]: 'takeoff',
  [MOVEMENT_STATES.TWIRL]: 'air-spin',
  [MOVEMENT_STATES.GLIDE_OPENING]: 'glide-open',
  [MOVEMENT_STATES.GLIDE]: 'glide-sustain',
  [MOVEMENT_STATES.GLIDE_CLOSING]: 'glide-close',
  [MOVEMENT_STATES.GROUND_SLAM_STARTUP]: 'ground-slam',
  [MOVEMENT_STATES.GROUND_SLAM_FALL]: 'ground-slam',
  [MOVEMENT_STATES.GROUND_SLAM_IMPACT]: 'land-hard',
  [MOVEMENT_STATES.GROUND_SLAM_RECOVERY]: 'land-hard',
  [MOVEMENT_STATES.SOFT_LAND]: 'land-soft',
  [MOVEMENT_STATES.HARD_LAND]: 'land-hard',
  [MOVEMENT_STATES.WALL_CONTACT]: 'wall-push',
  [MOVEMENT_STATES.MOVING_PLATFORM]: 'idle',
  [MOVEMENT_STATES.DAMAGE]: 'hurt',
  [MOVEMENT_STATES.KNOCKBACK]: 'hurt',
  [MOVEMENT_STATES.STOMP_BOUNCE]: 'stomp-bounce',
  [MOVEMENT_STATES.SPRING_BOUNCE]: 'jump',
  [MOVEMENT_STATES.TRANSITION]: 'transition',
  [MOVEMENT_STATES.SCRIPTED]: 'scripted'
});

const DEFAULT_COLLISION = Object.freeze({
  feet: 'resolve-support',
  walls: 'stop-horizontal-and-emit-contact',
  head: 'stop-rise-and-emit-head-hit',
  semisolids: 'land-from-above-only',
  hazards: 'delegate-authoritative-hazard-event'
});

function playbackRateFor(state, speedMode) {
  const horizontalSpeed = Math.abs(state.velocityX ?? 0);
  if (speedMode === 'locomotion') {
    const reference = Math.max(0.01, state.animationReferenceSpeed ?? 3.2);
    return Math.max(0.35, horizontalSpeed / reference);
  }
  if (speedMode === 'vertical') {
    return Math.max(0.7, Math.min(1.35, Math.abs(state.velocityY ?? 0) / 8));
  }
  return 1;
}

function makeLifecycle(stateName, branch, animation, speedMode) {
  return Object.freeze({
    enter(state, context = {}) {
      state.movementBranch = branch;
      state.animationSelection = animation;
      state.animationPlaybackRate = playbackRateFor(state, speedMode);
      context.emit?.('state-entered', { state: stateName, branch, animation });
    },
    update(state, context = {}) {
      state.movementBranch = branch;
      state.animationSelection = animation;
      state.animationPlaybackRate = playbackRateFor(state, speedMode);
      context.onExecute?.(stateName, state, context);
    },
    exit(state, context = {}) {
      context.emit?.('state-exited', { state: stateName, branch });
    }
  });
}

function defineState(name, {
  branch,
  role,
  inputs = ALL_INPUTS,
  collision = DEFAULT_COLLISION,
  animation = ANIMATION_ALIASES[name] ?? name,
  speedMode = 'fixed',
  sounds = [],
  effects = [],
  transitions = UNIQUE_STATES
}) {
  const lifecycle = makeLifecycle(name, branch, animation, speedMode);
  return Object.freeze({
    name,
    branch,
    role,
    inputs: Object.freeze({ ...inputs }),
    collision: Object.freeze({ ...collision }),
    animation: Object.freeze({ clip: animation, playback: speedMode }),
    soundHooks: Object.freeze([...sounds]),
    effectHooks: Object.freeze([...effects]),
    transitions: Object.freeze([...new Set(transitions)]),
    enter: lifecycle.enter,
    update: lifecycle.update,
    exit: lifecycle.exit
  });
}

const GROUNDED_COLLISION = DEFAULT_COLLISION;
const AIRBORNE_COLLISION = Object.freeze({
  feet: 'swept-landing-and-bounce-candidate',
  walls: 'stop-horizontal-preserve-air-actions',
  head: 'stop-rise-and-enter-fall',
  semisolids: 'land-from-above-only',
  hazards: 'delegate-authoritative-hazard-event'
});
const LOCKED_COLLISION = Object.freeze({
  feet: 'state-specific',
  walls: 'state-specific',
  head: 'state-specific',
  semisolids: 'state-specific',
  hazards: 'delegate-authoritative-hazard-event'
});

function branchFor(name) {
  if (GROUNDED_LEAVES.includes(name)) return MOVEMENT_BRANCHES.GROUNDED;
  if (AIRBORNE_LEAVES.includes(name)) return MOVEMENT_BRANCHES.AIRBORNE;
  return MOVEMENT_BRANCHES.SPECIAL;
}

const INTERRUPT_STATES = Object.freeze([
  MOVEMENT_STATES.DAMAGE,
  MOVEMENT_STATES.KNOCKBACK,
  MOVEMENT_STATES.DEAD,
  MOVEMENT_STATES.SCRIPTED,
  MOVEMENT_STATES.TRANSITION,
  MOVEMENT_STATES.VICTORY,
  MOVEMENT_STATES.SWAP_OUT,
  MOVEMENT_STATES.SWAP_IN
]);

function allowedTransitionsFor(name) {
  const branch = branchFor(name);
  if (name === MOVEMENT_STATES.DEAD) {
    return [MOVEMENT_STATES.RESPAWNING, MOVEMENT_STATES.SCRIPTED];
  }
  if (name === MOVEMENT_STATES.RESPAWNING) {
    return [MOVEMENT_STATES.IDLE, MOVEMENT_STATES.FALL, MOVEMENT_STATES.SCRIPTED];
  }
  if (name === MOVEMENT_STATES.VICTORY) {
    return [MOVEMENT_STATES.SCRIPTED, MOVEMENT_STATES.RESPAWNING, MOVEMENT_STATES.IDLE];
  }
  if (name === MOVEMENT_STATES.TRANSITION || name === MOVEMENT_STATES.SCRIPTED) {
    return [
      MOVEMENT_STATES.IDLE,
      MOVEMENT_STATES.FALL,
      MOVEMENT_STATES.SWIM,
      MOVEMENT_STATES.RESPAWNING,
      MOVEMENT_STATES.DEAD,
      MOVEMENT_STATES.VICTORY
    ];
  }
  if (branch === MOVEMENT_BRANCHES.GROUNDED) {
    return [
      ...GROUNDED_LEAVES,
      MOVEMENT_STATES.JUMP_STARTUP,
      MOVEMENT_STATES.FALL,
      MOVEMENT_STATES.SWIM,
      MOVEMENT_STATES.MOVING_PLATFORM,
      MOVEMENT_STATES.WALL_CONTACT,
      ...INTERRUPT_STATES
    ];
  }
  if (branch === MOVEMENT_BRANCHES.AIRBORNE) {
    return [
      ...AIRBORNE_LEAVES,
      MOVEMENT_STATES.LANDING,
      MOVEMENT_STATES.SOFT_LAND,
      MOVEMENT_STATES.HARD_LAND,
      MOVEMENT_STATES.GROUND_SLAM_IMPACT,
      MOVEMENT_STATES.GROUND_SLAM_RECOVERY,
      MOVEMENT_STATES.LEDGE_GRAB,
      MOVEMENT_STATES.WALL_CONTACT,
      MOVEMENT_STATES.SWIM,
      MOVEMENT_STATES.MOVING_PLATFORM,
      ...INTERRUPT_STATES
    ];
  }
  return UNIQUE_STATES;
}

function contractOverrides(name) {
  const locomotion = [
    MOVEMENT_STATES.WALK,
    MOVEMENT_STATES.RUN,
    MOVEMENT_STATES.SPRINT,
    MOVEMENT_STATES.BRAKE,
    MOVEMENT_STATES.SKID,
    MOVEMENT_STATES.TURN,
    MOVEMENT_STATES.CRAWL,
    MOVEMENT_STATES.DUCK_SLIDE
  ].includes(name);
  const airborne = branchFor(name) === MOVEMENT_BRANCHES.AIRBORNE;
  const locked = [
    MOVEMENT_STATES.DAMAGE,
    MOVEMENT_STATES.KNOCKBACK,
    MOVEMENT_STATES.TRANSITION,
    MOVEMENT_STATES.SCRIPTED,
    MOVEMENT_STATES.DEAD,
    MOVEMENT_STATES.RESPAWNING,
    MOVEMENT_STATES.VICTORY,
    MOVEMENT_STATES.GROUND_SLAM_IMPACT,
    MOVEMENT_STATES.GROUND_SLAM_RECOVERY
  ].includes(name);
  const specialCollision = branchFor(name) === MOVEMENT_BRANCHES.SPECIAL;

  return {
    role: name.replaceAll('-', ' '),
    inputs: locked ? (name === MOVEMENT_STATES.DEAD ? NO_INPUT : PRESENTATION_LOCK) :
      airborne ? AIR_INPUTS : ALL_INPUTS,
    collision: locked || specialCollision ? LOCKED_COLLISION :
      airborne ? AIRBORNE_COLLISION : GROUNDED_COLLISION,
    speedMode: locomotion ? 'locomotion' : airborne ? 'vertical' : 'fixed',
    sounds: [
      MOVEMENT_STATES.JUMP_STARTUP,
      MOVEMENT_STATES.DOUBLE_JUMP,
      MOVEMENT_STATES.GROUND_SLAM_IMPACT,
      MOVEMENT_STATES.SOFT_LAND,
      MOVEMENT_STATES.HARD_LAND,
      MOVEMENT_STATES.DAMAGE
    ].includes(name) ? [`${name}-sound`] : [],
    effects: [
      MOVEMENT_STATES.SKID,
      MOVEMENT_STATES.JUMP_STARTUP,
      MOVEMENT_STATES.TWIRL,
      MOVEMENT_STATES.DOUBLE_JUMP,
      MOVEMENT_STATES.GROUND_SLAM_IMPACT,
      MOVEMENT_STATES.STOMP_BOUNCE,
      MOVEMENT_STATES.DAMAGE
    ].includes(name) ? [`${name}-effect`] : [],
    transitions: allowedTransitionsFor(name)
  };
}

export const MOVEMENT_STATE_DEFINITIONS = Object.freeze(
  Object.fromEntries(UNIQUE_STATES.map(name => [
    name,
    defineState(name, {
      branch: branchFor(name),
      ...contractOverrides(name)
    })
  ]))
);

export const MOVEMENT_STATE_GRAPH = Object.freeze({
  [MOVEMENT_BRANCHES.GROUNDED]: GROUNDED_LEAVES,
  [MOVEMENT_BRANCHES.AIRBORNE]: AIRBORNE_LEAVES,
  [MOVEMENT_BRANCHES.SPECIAL]: SPECIAL_LEAVES
});

export const STATE_PRIORITY = Object.freeze({
  [MOVEMENT_STATES.DEAD]: 100,
  [MOVEMENT_STATES.RESPAWNING]: 98,
  [MOVEMENT_STATES.SCRIPTED]: 95,
  [MOVEMENT_STATES.TRANSITION]: 94,
  [MOVEMENT_STATES.DAMAGE]: 90,
  [MOVEMENT_STATES.KNOCKBACK]: 89,
  [MOVEMENT_STATES.GROUND_SLAM_IMPACT]: 85,
  [MOVEMENT_STATES.GROUND_SLAM_RECOVERY]: 84,
  [MOVEMENT_STATES.GROUND_SLAM_FALL]: 82,
  [MOVEMENT_STATES.GROUND_SLAM_STARTUP]: 81,
  [MOVEMENT_STATES.SWAP_OUT]: 75,
  [MOVEMENT_STATES.SWAP_IN]: 74,
  [MOVEMENT_STATES.STOMP]: 70,
  [MOVEMENT_STATES.STOMP_BOUNCE]: 69,
  [MOVEMENT_STATES.SPRING_BOUNCE]: 68,
  [MOVEMENT_STATES.DOUBLE_JUMP]: 62,
  [MOVEMENT_STATES.TWIRL]: 61,
  [MOVEMENT_STATES.GLIDE_OPENING]: 60,
  [MOVEMENT_STATES.GLIDE]: 59,
  [MOVEMENT_STATES.GLIDE_CLOSING]: 58,
  [MOVEMENT_STATES.JUMP_STARTUP]: 57,
  [MOVEMENT_STATES.RISE]: 56,
  [MOVEMENT_STATES.APEX]: 55,
  [MOVEMENT_STATES.FALL]: 54,
  [MOVEMENT_STATES.FAST_FALL]: 53,
  [MOVEMENT_STATES.SKID]: 40,
  [MOVEMENT_STATES.DUCK_SLIDE]: 39
});

export function movementStateDefinition(movementState) {
  const definition = MOVEMENT_STATE_DEFINITIONS[movementState];
  if (!definition) throw new RangeError(`unknown movement state: ${movementState}`);
  return definition;
}

export function animationStateFor(movementState) {
  return movementStateDefinition(movementState).animation.clip;
}

export function canTransitionMovementState(fromState, nextState) {
  if (fromState === nextState) return true;
  return movementStateDefinition(fromState).transitions.includes(nextState);
}

export function initializeMovementStateLifecycle(state) {
  const definition = movementStateDefinition(state.movementState);
  state.movementBranch = definition.branch;
  state.animationSelection = definition.animation.clip;
  state.animationPlaybackRate = playbackRateFor(state, definition.animation.playback);
  state.inputPermissions = definition.inputs;
  state.collisionPolicy = definition.collision;
  state.soundHooks = definition.soundHooks;
  state.effectHooks = definition.effectHooks;
  state.locomotion = definition.animation.clip;
  return state;
}

export function executeMovementState(state, context = {}) {
  const definition = movementStateDefinition(state.movementState);
  definition.update(state, context);
  state.inputPermissions = definition.inputs;
  state.collisionPolicy = definition.collision;
  state.soundHooks = definition.soundHooks;
  state.effectHooks = definition.effectHooks;
  state.locomotion = definition.animation.clip;
  return definition;
}

export function transitionMovementState(state, nextState, emit = () => {}, context = {}) {
  if (!state.movementState) {
    state.movementState = state.grounded ? MOVEMENT_STATES.IDLE : MOVEMENT_STATES.FALL;
    state.previousMovementState = state.movementState;
    state.stateSeconds = state.stateSeconds ?? 0;
    initializeMovementStateLifecycle(state);
  }
  if (state.movementState === nextState) return false;
  const previousState = state.movementState;
  const previous = movementStateDefinition(previousState);
  const next = movementStateDefinition(nextState);
  if (!canTransitionMovementState(previousState, nextState)) {
    throw new Error(`movement transition is not permitted: ${previousState} -> ${nextState}`);
  }
  previous.exit(state, { ...context, emit });
  state.previousMovementState = previousState;
  state.movementState = nextState;
  state.locomotion = next.animation.clip;
  state.stateSeconds = 0;
  next.enter(state, { ...context, emit });
  state.inputPermissions = next.inputs;
  state.collisionPolicy = next.collision;
  state.soundHooks = next.soundHooks;
  state.effectHooks = next.effectHooks;
  emit('state-changed', {
    previousState,
    nextState,
    previousBranch: previous.branch,
    nextBranch: next.branch
  });
  return true;
}

export function movementInputPermissions(movementState) {
  return movementStateDefinition(movementState).inputs;
}
