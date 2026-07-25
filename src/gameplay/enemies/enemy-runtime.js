const BEHAVIOR_STATES = Object.freeze({
  walker: ['idle', 'walk', 'turn', 'hurt', 'defeated'],
  burrower: ['hidden', 'telegraph', 'emerge', 'active', 'retreat', 'defeated'],
  shellback: ['walk', 'turn', 'shell-idle', 'shell-wake', 'shell-roll', 'emerge', 'defeated'],
  roller: ['idle', 'telegraph', 'roll', 'rebound', 'defeated'],
  thrower: ['idle', 'aim', 'throw', 'recover', 'defeated'],
  hopper: ['idle', 'crouch', 'jump', 'land', 'defeated'],
  flyer: ['idle', 'patrol', 'dive', 'recover', 'defeated'],
  zigzag: ['idle', 'patrol', 'turn', 'defeated'],
  drifter: ['idle', 'drift', 'gust-recover', 'defeated'],
  dropper: ['patrol', 'telegraph', 'drop', 'recover', 'defeated'],
  plant: ['hidden', 'telegraph', 'attack', 'recover', 'defeated'],
  exploder: ['idle', 'armed', 'telegraph', 'explode', 'defeated'],
  swimmer: ['idle', 'swim', 'turn', 'lunge', 'recover', 'defeated'],
  sentry: ['idle', 'track', 'telegraph', 'fire', 'recover', 'defeated'],
  mimic: ['disguised', 'wake', 'chase', 'attack', 'recover', 'defeated'],
  chipper: ['patrol', 'acquire', 'chip', 'throw-chips', 'recover', 'defeated'],
  follower: ['idle', 'follow', 'attack', 'recover', 'defeated']
});

const DEFAULT_TIMINGS = Object.freeze({
  turn: 0.19,
  telegraph: 0.5,
  recover: 0.55,
  'shell-idle': 4.85,
  'shell-wake': 1.15,
  emerge: 0.34,
  aim: 0.6,
  crouch: 0.35,
  wake: 0.45,
  acquire: 0.5,
  attack: 0.35
});

function initialState(behavior) {
  return ({
    burrower: 'hidden',
    shellback: 'walk',
    mimic: 'disguised',
    plant: 'hidden',
    sentry: 'idle',
    chipper: 'patrol'
  })[behavior] ?? (BEHAVIOR_STATES[behavior]?.includes('patrol') ? 'patrol' : 'idle');
}

export function buildEnemyDefinitions(enemyCatalog) {
  return Object.freeze(Object.fromEntries(Object.entries(enemyCatalog?.enemies ?? {}).map(([id, source]) => {
    const behavior = source.behavior;
    if (!BEHAVIOR_STATES[behavior]) throw new Error(`${id} uses unsupported behavior family ${behavior}`);
    return [id, Object.freeze({
      ...structuredClone(source),
      id,
      oneHit: id === 'camp_chipper' ? true : Boolean(source.oneHit),
      states: Object.freeze([...BEHAVIOR_STATES[behavior]])
    })];
  })));
}

export function createEnemyRuntime(definition, {
  seed = 1,
  facing = 1,
  environment = 'ground'
} = {}) {
  if (!definition?.states) throw new TypeError('A modular enemy definition is required');
  let state = initialState(definition.behavior);
  let stateSeconds = 0;
  let direction = facing < 0 ? -1 : 1;
  let alive = true;
  let randomState = seed >>> 0 || 1;
  const queuedEvents = [];

  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 0x100000000;
  };
  const transition = (next, event = null) => {
    if (!definition.states.includes(next)) throw new Error(`${definition.id} cannot enter ${next}`);
    state = next;
    stateSeconds = 0;
    if (event) queuedEvents.push(Object.freeze({ enemyId: definition.id, ...event }));
  };

  function command(type, detail = {}) {
    if (!alive) return;
    if (type === 'defeat') {
      alive = false;
      transition('defeated', { type: 'defeated', damaging: false });
      return;
    }
    if (definition.behavior === 'shellback') {
      if (type === 'stomp' && ['walk', 'turn', 'emerge'].includes(state)) transition('shell-idle', { type: 'retracted' });
      else if (type === 'stomp' && state === 'shell-roll') transition('shell-idle', { type: 'shell-stopped' });
      else if (['kick', 'strike'].includes(type) && ['shell-idle', 'shell-wake'].includes(state)) {
        direction = detail.direction < 0 ? -1 : 1;
        transition('shell-roll', { type: 'shell-launched', direction });
      }
      return;
    }
    if (type === 'edge' && ['walk', 'patrol', 'swim'].includes(state)) {
      direction *= -1;
      if (definition.states.includes('turn')) transition('turn', { type: 'turned', direction });
      return;
    }
    if (type === 'target-visible') {
      const next = ({
        burrower: 'telegraph', thrower: 'aim', hopper: 'crouch', flyer: 'dive',
        dropper: 'telegraph', plant: 'telegraph', exploder: 'armed',
        swimmer: 'lunge', sentry: 'telegraph', mimic: 'wake',
        chipper: 'acquire', follower: 'attack', roller: 'telegraph'
      })[definition.behavior];
      if (next && definition.states.includes(next)) transition(next, { type: 'target-acquired' });
    }
  }

  function tick(deltaSeconds) {
    if (!(deltaSeconds > 0)) return drainEvents();
    stateSeconds += deltaSeconds;
    const elapsed = seconds => stateSeconds >= seconds;
    if (definition.behavior === 'shellback') {
      if (state === 'turn' && elapsed(DEFAULT_TIMINGS.turn)) {
        direction *= -1;
        transition('walk');
      } else if (state === 'shell-idle' && elapsed(DEFAULT_TIMINGS['shell-idle'])) transition('shell-wake', { type: 'wake-warning' });
      else if (state === 'shell-wake' && elapsed(DEFAULT_TIMINGS['shell-wake'])) transition('emerge');
      else if (state === 'emerge' && elapsed(DEFAULT_TIMINGS.emerge)) transition('walk');
    } else if (state === 'turn' && elapsed(DEFAULT_TIMINGS.turn)) {
      transition(definition.behavior === 'swimmer' ? 'swim' : definition.states.includes('patrol') ? 'patrol' : 'walk');
    } else if (['telegraph', 'aim', 'crouch', 'wake', 'acquire', 'armed'].includes(state) &&
      elapsed(DEFAULT_TIMINGS[state] ?? DEFAULT_TIMINGS.telegraph)) {
      const next = ({
        burrower: 'emerge', thrower: 'throw', hopper: 'jump', flyer: 'dive',
        dropper: 'drop', plant: 'attack', exploder: 'telegraph',
        swimmer: 'lunge', sentry: 'fire', mimic: 'chase',
        chipper: 'chip', follower: 'attack', roller: 'roll'
      })[definition.behavior];
      transition(next, { type: next, direction, deterministicVariant: Math.floor(random() * 3) });
    } else if (['fire', 'throw', 'drop', 'attack', 'chip', 'throw-chips', 'lunge'].includes(state) &&
      elapsed(DEFAULT_TIMINGS.attack)) {
      transition(definition.states.includes('recover') ? 'recover' : initialState(definition.behavior));
    } else if (state === 'recover' && elapsed(DEFAULT_TIMINGS.recover)) {
      transition(initialState(definition.behavior));
    }
    if (definition.behavior === 'swimmer' && environment !== 'water') {
      queuedEvents.push(Object.freeze({ enemyId: definition.id, type: 'invalid-environment', required: 'water' }));
    }
    return drainEvents();
  }

  function drainEvents() {
    const events = queuedEvents.splice(0);
    return Object.freeze(events);
  }

  return Object.freeze({
    get snapshot() {
      return Object.freeze({ id: definition.id, state, stateSeconds, direction, alive, environment });
    },
    command,
    tick,
    drainEvents
  });
}

export { BEHAVIOR_STATES };
