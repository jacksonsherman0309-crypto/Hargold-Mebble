const FATAL_TYPES = Object.freeze(['pit', 'lava', 'poison', 'compression', 'crushing']);

export function fatalHazardEvent(type, sourceId = null) {
  if (!FATAL_TYPES.includes(type)) throw new RangeError(`unknown fatal hazard: ${type}`);
  return Object.freeze({
    type: 'fatal-hazard', hazardType: type, sourceId,
    bypasses: Object.freeze(['hearts', 'invulnerability', 'activePowerUp'])
  });
}

export function createCourseFatalGate() {
  let ended = false;
  return Object.freeze({
    accept(event) {
      if (ended || event?.type !== 'fatal-hazard') return false;
      ended = true; return true;
    },
    get ended() { return ended; }
  });
}
