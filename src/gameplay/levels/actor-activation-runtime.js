const DEFAULT_ENVELOPES = Object.freeze({
  prewarmScreensAhead: 1.25,
  activeScreensAhead: 0.3,
  activeScreensBehind: 0.2,
  sleepScreensBehind: 0.5,
  despawnScreensBehind: 1.5
});

function placementX(placement) {
  return placement.position?.x ?? placement.x;
}

function validateCameraBounds(bounds) {
  if (!bounds || !Number.isFinite(bounds.minX) || !Number.isFinite(bounds.maxX) ||
      bounds.maxX <= bounds.minX) {
    throw new TypeError('cameraBounds must contain finite minX < maxX');
  }
}

function isPersistentComplete(placement, persistentState) {
  const id = placement.persistentStateId;
  if (!id) return false;
  const value = persistentState instanceof Map ? persistentState.get(id) : persistentState?.[id];
  return value === true || value === 'collected' || value === 'defeated' || value === 'complete';
}

export function createActorActivationRuntime(
  placements,
  {
    spawn = placement => ({ placement }),
    activate = () => {},
    sleep = () => {},
    despawn = () => {},
    envelopes = DEFAULT_ENVELOPES
  } = {}
) {
  if (!Array.isArray(placements)) throw new TypeError('placements must be an array');
  const records = new Map();
  for (const placement of placements) {
    if (!placement?.id) throw new TypeError('actor placement id is required');
    if (records.has(placement.id)) throw new Error(`duplicate actor placement ${placement.id}`);
    records.set(placement.id, {
      placement: structuredClone(placement),
      status: 'dormant',
      instance: null
    });
  }
  const events = [];

  function emit(type, record, detail = {}) {
    const event = Object.freeze({
      type,
      actorId: record.placement.id,
      status: record.status,
      ...detail
    });
    events.push(event);
    return event;
  }

  function update({
    cameraBounds,
    scrollDirection = 1,
    activeAreaIds = null,
    persistentState = {}
  }) {
    validateCameraBounds(cameraBounds);
    const width = cameraBounds.maxX - cameraBounds.minX;
    const direction = scrollDirection < 0 ? -1 : 1;
    const aheadEdge = direction > 0 ? cameraBounds.maxX : cameraBounds.minX;
    const behindEdge = direction > 0 ? cameraBounds.minX : cameraBounds.maxX;

    for (const record of records.values()) {
      const { placement } = record;
      const x = placementX(placement);
      const areaAllowed = !activeAreaIds ||
        activeAreaIds.includes(placement.areaId) ||
        placement.activationRules?.allowOutsideArea;
      if (isPersistentComplete(placement, persistentState)) {
        if (record.instance) despawn(record.instance, placement, { reason: 'persistent-complete' });
        record.instance = null;
        record.status = 'persistent-complete';
        continue;
      }
      if (!areaAllowed) continue;

      const forwardDistance = (x - aheadEdge) * direction;
      const behindDistance = (behindEdge - x) * direction;
      const inPrewarm = forwardDistance <= width * envelopes.prewarmScreensAhead &&
        behindDistance <= width * envelopes.despawnScreensBehind;
      const inActive = forwardDistance <= width * envelopes.activeScreensAhead &&
        behindDistance <= width * envelopes.activeScreensBehind;
      const shouldSleep = behindDistance > width * envelopes.sleepScreensBehind;
      const shouldDespawn = behindDistance > width * envelopes.despawnScreensBehind;

      if (record.status === 'dormant' && inPrewarm) {
        record.instance = spawn(placement, { phase: 'prewarm', cameraBounds });
        record.status = 'prewarmed';
        emit('actor-prewarmed', record);
      }
      if ((record.status === 'prewarmed' || record.status === 'sleeping') && inActive) {
        activate(record.instance, placement, { cameraBounds });
        record.status = 'active';
        emit('actor-activated', record);
      }
      if (record.status === 'active' && shouldSleep && !inActive) {
        sleep(record.instance, placement, { cameraBounds });
        record.status = 'sleeping';
        emit('actor-slept', record);
      }
      if (
        shouldDespawn &&
        ['prewarmed', 'sleeping'].includes(record.status) &&
        placement.activationRules?.keepLoaded !== true
      ) {
        despawn(record.instance, placement, { reason: 'outside-despawn-envelope' });
        record.instance = null;
        record.status = placement.activationRules?.respawn === false
          ? 'retired'
          : 'dormant';
        emit('actor-despawned', record);
      }
    }
    return drainEvents();
  }

  function drainEvents() {
    return Object.freeze(events.splice(0));
  }

  function reset({ preservePersistentComplete = true } = {}) {
    for (const record of records.values()) {
      if (record.instance) despawn(record.instance, record.placement, { reason: 'runtime-reset' });
      record.instance = null;
      if (!preservePersistentComplete || record.status !== 'persistent-complete') {
        record.status = 'dormant';
      }
    }
    events.length = 0;
  }

  return Object.freeze({
    update,
    reset,
    drainEvents,
    getInstance(actorId) {
      return records.get(actorId)?.instance ?? null;
    },
    get snapshot() {
      return Object.freeze([...records.values()].map(record => Object.freeze({
        actorId: record.placement.id,
        status: record.status,
        instantiated: Boolean(record.instance)
      })));
    }
  });
}

export { DEFAULT_ENVELOPES as ACTOR_ACTIVATION_ENVELOPES };
