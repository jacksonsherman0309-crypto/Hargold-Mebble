export function beginMovementStep(state) {
  state.events = [];
}

export function emitMovementEvent(state, type, detail = {}) {
  if (!Array.isArray(state.events)) state.events = [];
  const event = Object.freeze({
    type,
    movementState: state.movementState,
    hero: state.hero,
    ...detail
  });
  state.events.push(event);
  return event;
}

export function movementEvents(state) {
  return Object.freeze([...(state.events ?? [])]);
}
