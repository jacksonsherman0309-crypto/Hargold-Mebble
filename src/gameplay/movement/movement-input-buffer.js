const DIGITAL_ACTIONS = Object.freeze([
  'left', 'right', 'run', 'sprint', 'jump', 'down', 'action', 'swap', 'pause'
]);

export function createMovementInputBuffer() {
  const previous = Object.fromEntries(DIGITAL_ACTIONS.map(action => [action, false]));
  const heldSeconds = Object.fromEntries(DIGITAL_ACTIONS.map(action => [action, 0]));
  const sinceReleaseSeconds = Object.fromEntries(DIGITAL_ACTIONS.map(action => [action, Infinity]));
  const pressed = Object.fromEntries(DIGITAL_ACTIONS.map(action => [action, false]));
  const released = Object.fromEntries(DIGITAL_ACTIONS.map(action => [action, false]));

  return {
    sample(rawInput = {}, elapsedSeconds = 0) {
      for (const action of DIGITAL_ACTIONS) {
        const held = Boolean(rawInput[action]);
        if (held && !previous[action]) pressed[action] = true;
        if (!held && previous[action]) released[action] = true;
        heldSeconds[action] = held ? heldSeconds[action] + elapsedSeconds : 0;
        sinceReleaseSeconds[action] = held ? Infinity : sinceReleaseSeconds[action] + elapsedSeconds;
        if (!held && previous[action]) sinceReleaseSeconds[action] = 0;
        previous[action] = held;
      }
    },

    consumeStep() {
      const step = {
        left: previous.left,
        right: previous.right,
        run: previous.run,
        sprint: previous.sprint,
        jumpPressed: pressed.jump,
        jumpReleased: released.jump,
        jumpHeld: previous.jump,
        jumpHeldSeconds: heldSeconds.jump,
        jumpReleaseSeconds: sinceReleaseSeconds.jump,
        downPressed: pressed.down,
        downReleased: released.down,
        downHeld: previous.down,
        groundSlamPressed: pressed.down,
        fastFallHeld: previous.down,
        actionPressed: pressed.action,
        actionHeld: previous.action,
        swapPressed: pressed.swap,
        pausePressed: pressed.pause
      };
      for (const action of DIGITAL_ACTIONS) {
        pressed[action] = false;
        released[action] = false;
      }
      return Object.freeze(step);
    },

    reset() {
      for (const action of DIGITAL_ACTIONS) {
        previous[action] = false;
        heldSeconds[action] = 0;
        sinceReleaseSeconds[action] = Infinity;
        pressed[action] = false;
        released[action] = false;
      }
    },

    debugSnapshot() {
      return Object.freeze({
        held: Object.freeze({ ...previous }),
        heldSeconds: Object.freeze({ ...heldSeconds }),
        sinceReleaseSeconds: Object.freeze({ ...sinceReleaseSeconds }),
        pressed: Object.freeze({ ...pressed }),
        released: Object.freeze({ ...released })
      });
    }
  };
}
