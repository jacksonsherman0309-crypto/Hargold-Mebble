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
  DUCK_SLIDE: 'duck-slide',
  JUMP_STARTUP: 'jump-startup',
  RISE: 'rise',
  APEX: 'apex',
  FALL: 'fall',
  TWIRL: 'twirl',
  DOUBLE_JUMP: 'double-jump',
  GLIDE_OPENING: 'glide-opening',
  GLIDE: 'glide',
  GLIDE_CLOSING: 'glide-closing',
  FAST_FALL: 'fast-fall',
  GROUND_SLAM_STARTUP: 'ground-slam-startup',
  GROUND_SLAM_FALL: 'ground-slam-fall',
  GROUND_SLAM_IMPACT: 'ground-slam-impact',
  GROUND_SLAM_RECOVERY: 'ground-slam-recovery',
  SOFT_LAND: 'soft-land',
  HARD_LAND: 'hard-land',
  STOMP: 'stomp',
  STOMP_BOUNCE: 'stomp-bounce',
  SPRING_BOUNCE: 'spring-bounce',
  DAMAGE: 'damage',
  KNOCKBACK: 'knockback',
  DEAD: 'dead',
  RESPAWNING: 'respawning',
  SWAP_OUT: 'swap-out',
  SWAP_IN: 'swap-in',
  VICTORY: 'victory',
  SCRIPTED: 'scripted'
});

export const STATE_PRIORITY = Object.freeze({
  [MOVEMENT_STATES.DEAD]: 100,
  [MOVEMENT_STATES.RESPAWNING]: 98,
  [MOVEMENT_STATES.SCRIPTED]: 95,
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

const ANIMATION_ALIASES = Object.freeze({
  [MOVEMENT_STATES.BRAKE]: 'stop',
  [MOVEMENT_STATES.TURN]: 'turn-low',
  [MOVEMENT_STATES.CROUCH]: 'duck',
  [MOVEMENT_STATES.DUCK_SLIDE]: 'sprint-slide',
  [MOVEMENT_STATES.JUMP_STARTUP]: 'takeoff',
  [MOVEMENT_STATES.TWIRL]: 'air-spin',
  [MOVEMENT_STATES.GLIDE_OPENING]: 'fall',
  [MOVEMENT_STATES.GLIDE]: 'fall',
  [MOVEMENT_STATES.GLIDE_CLOSING]: 'fall',
  [MOVEMENT_STATES.GROUND_SLAM_STARTUP]: 'ground-slam',
  [MOVEMENT_STATES.GROUND_SLAM_FALL]: 'ground-slam',
  [MOVEMENT_STATES.GROUND_SLAM_IMPACT]: 'land-hard',
  [MOVEMENT_STATES.GROUND_SLAM_RECOVERY]: 'land-hard',
  [MOVEMENT_STATES.SOFT_LAND]: 'land-soft',
  [MOVEMENT_STATES.HARD_LAND]: 'land-hard',
  [MOVEMENT_STATES.DAMAGE]: 'hurt',
  [MOVEMENT_STATES.KNOCKBACK]: 'hurt',
  [MOVEMENT_STATES.STOMP_BOUNCE]: 'stomp-bounce',
  [MOVEMENT_STATES.SPRING_BOUNCE]: 'jump'
});

export function animationStateFor(movementState) {
  return ANIMATION_ALIASES[movementState] ?? movementState;
}

export function transitionMovementState(state, nextState, emit = () => {}) {
  if (state.movementState === nextState) return false;
  const previousState = state.movementState;
  state.previousMovementState = previousState;
  state.movementState = nextState;
  state.locomotion = animationStateFor(nextState);
  state.stateSeconds = 0;
  emit('state-changed', { previousState, nextState });
  return true;
}
