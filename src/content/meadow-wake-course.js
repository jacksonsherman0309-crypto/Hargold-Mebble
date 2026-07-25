/*
 * Authored World 1-1 course data.
 *
 * This module describes Meadow Wake only. Its helpers resolve explicitly
 * authored points into runtime objects; they are not a course generator and
 * must not be used to flatten other worlds into this layout.
 */

export const MEADOW_WAKE_WORLD_END = 124;

export const MEADOW_WAKE_TERRAIN_POINTS = Object.freeze([
  Object.freeze([0, 7.9]),
  Object.freeze([6, 7.8]),
  Object.freeze([10, 7.35]),
  Object.freeze([14, 7.65]),
  Object.freeze([20, 7.45]),
  Object.freeze([24, 7.9]),
  Object.freeze([28, 7.15]),
  Object.freeze([32, 7.75]),
  Object.freeze([36, 7.2]),
  Object.freeze([40, 7.85]),
  Object.freeze([45, 7.35]),
  Object.freeze([50, 7.95]),
  Object.freeze([55, 7.2]),
  Object.freeze([60, 7.75]),
  Object.freeze([64, 7.4]),
  Object.freeze([70, 7.8]),
  Object.freeze([74, 7.2]),
  Object.freeze([78, 7.75]),
  Object.freeze([84, 7.25]),
  Object.freeze([90, 7.9]),
  Object.freeze([96, 7.15]),
  Object.freeze([100, 7.7]),
  Object.freeze([106, 7.0]),
  Object.freeze([109, 7.7]),
  Object.freeze([112, 7.2]),
  Object.freeze([116, 7.85]),
  Object.freeze([119, 7.25]),
  Object.freeze([124, 7.65])
]);

export const MEADOW_WAKE_PITS = Object.freeze([
  Object.freeze({ id: 'log-launch-hollow', from: 16, to: 17.5 }),
  Object.freeze({ id: 'first-moving-step', from: 33.2, to: 35 }),
  Object.freeze({ id: 'concealed-creek-shelf', from: 61, to: 63.2 }),
  Object.freeze({ id: 'rope-bridge-ravine', from: 65, to: 69 }),
  Object.freeze({ id: 'upper-lower-route-creek', from: 81, to: 83.2 }),
  Object.freeze({ id: 'ruin-descent', from: 101, to: 103 }),
  Object.freeze({ id: 'final-gap-one', from: 109.4, to: 110.6 }),
  Object.freeze({ id: 'final-gap-two', from: 114, to: 115.7 }),
  Object.freeze({ id: 'final-gap-three', from: 119.2, to: 121.6 })
]);

export const MEADOW_WAKE_SECTIONS = Object.freeze([
  Object.freeze({
    id: 'meadow-trail',
    beat: 1,
    range: Object.freeze([0, 15.9]),
    environment: 'camp meadow and rolling tutorial hills',
    movementDecision: 'ground route, stump steps, and low coin guidance'
  }),
  Object.freeze({
    id: 'fallen-log-lesson',
    beat: 2,
    range: Object.freeze([15.9, 24]),
    environment: 'fallen-log hollow and layered grassy banks',
    movementDecision: 'seesaw log launch or lower recovery ledge'
  }),
  Object.freeze({
    id: 'shellback-ruins',
    beat: 3,
    range: Object.freeze([24, 40]),
    environment: 'low woodland ruins and breakable masonry',
    movementDecision: 'shell-opened upper route or grounded block lane'
  }),
  Object.freeze({
    id: 'camp-clearing',
    beat: 4,
    range: Object.freeze([40, 65]),
    environment: 'scaffold camp, lift, hidden creek shelf, and bramble clue',
    movementDecision: 'elevated camp decks or interrupted low coin trail'
  }),
  Object.freeze({
    id: 'rope-bridge-checkpoint',
    beat: 5,
    range: Object.freeze([65, 72]),
    environment: 'rope ravine and checkpoint overlook',
    movementDecision: 'bridge rhythm and short post-crossing recovery'
  }),
  Object.freeze({
    id: 'creek-and-ruins',
    beat: 6,
    range: Object.freeze([72, 103]),
    environment: 'visible upper ruins above a lower creek route',
    movementDecision: 'lift, seesaw, rotating ruin stones, and Hargold block group'
  }),
  Object.freeze({
    id: 'three-gap-panorama',
    beat: 7,
    range: Object.freeze([103, 124]),
    environment: 'rolling flower hill and three graduated panorama gaps',
    movementDecision: 'speed control, falling step, and clean goal approach'
  })
]);

export const MEADOW_WAKE_PLATFORMS = Object.freeze([
  Object.freeze({ id: 'camp-awning-deck', x: 4.9, y: 6.55, width: 2.3, height: 0.28, oneWay: true, visual: 'camp-deck' }),
  Object.freeze({ id: 'opening-stump-step', x: 9.15, y: 6.78, width: 1.05, height: 0.4, oneWay: true, visual: 'stump' }),
  Object.freeze({ id: 'meadow-step-a', x: 12.45, y: 6.25, width: 2.15, height: 0.34, oneWay: true, visual: 'turf-ledge' }),
  Object.freeze({
    id: 'fallen-log-launch',
    x: 16.75,
    y: 6.32,
    width: 3.15,
    height: 0.3,
    oneWay: true,
    visual: 'fallen-log',
    motion: Object.freeze({ kind: 'seesaw', maximumAngle: 0.1, response: 2.8 })
  }),
  Object.freeze({ id: 'fallen-log-landing', x: 19.45, y: 6.42, width: 1.55, height: 0.3, oneWay: true, visual: 'turf-ledge' }),
  Object.freeze({ id: 'first-foe-high-step', x: 23.15, y: 6.38, width: 1.65, height: 0.3, oneWay: true, visual: 'stump' }),
  Object.freeze({ id: 'shellback-low-ledge', x: 26.2, y: 6.45, width: 2.2, height: 0.32, oneWay: true, visual: 'turf-ledge' }),
  Object.freeze({ id: 'shellback-upper-route-a', x: 29.35, y: 5.65, width: 1.75, height: 0.32, oneWay: true, visual: 'ruin-ledge' }),
  Object.freeze({ id: 'shellback-upper-route-b', x: 31.95, y: 4.95, width: 1.45, height: 0.32, oneWay: true, visual: 'ruin-ledge' }),
  Object.freeze({
    id: 'first-moving-step',
    x: 34.1,
    y: 6.15,
    width: 1.2,
    height: 0.28,
    oneWay: true,
    visual: 'ruin-ledge',
    motion: Object.freeze({ kind: 'horizontal', range: 0.72, speed: 0.82, phase: 0.15 })
  }),
  Object.freeze({ id: 'ruin-exit-step', x: 37.1, y: 6.25, width: 1.3, height: 0.3, oneWay: true, visual: 'ruin-ledge' }),
  Object.freeze({ id: 'clearing-stump-a', x: 40.4, y: 6.62, width: 1.1, height: 0.42, oneWay: true, visual: 'stump' }),
  Object.freeze({ id: 'camp-scaffold-deck-a', x: 43.5, y: 5.9, width: 2.65, height: 0.3, oneWay: true, visual: 'camp-deck' }),
  Object.freeze({ id: 'camp-scaffold-deck-b', x: 46.1, y: 4.95, width: 1.55, height: 0.28, oneWay: true, visual: 'camp-deck' }),
  Object.freeze({
    id: 'camp-clearing-lift',
    x: 48.65,
    y: 6.25,
    width: 1.35,
    height: 0.3,
    oneWay: true,
    visual: 'timber-lift',
    motion: Object.freeze({ kind: 'vertical', range: 1.35, speed: 0.66, phase: 0.4 })
  }),
  Object.freeze({ id: 'clearing-high-ledge', x: 51.1, y: 5.25, width: 1.65, height: 0.3, oneWay: true, visual: 'turf-ledge' }),
  Object.freeze({
    id: 'clearing-falling-ledge',
    x: 54.05,
    y: 5.82,
    width: 1.25,
    height: 0.28,
    oneWay: true,
    visual: 'timber-slat',
    motion: Object.freeze({ kind: 'falling', triggerDelay: 0.48, resetDelay: 2.8, gravity: 8.8 })
  }),
  Object.freeze({ id: 'stone-arch-shelf', x: 57.1, y: 5.15, width: 1.7, height: 0.32, oneWay: true, visual: 'ruin-ledge' }),
  Object.freeze({ id: 'bramble-clue-step', x: 59.45, y: 6.35, width: 1.1, height: 0.28, oneWay: true, visual: 'stump' }),
  Object.freeze({ id: 'concealed-creek-shelf', x: 62.05, y: 8.22, width: 1.7, height: 0.28, oneWay: true, visual: 'creek-stone', secret: true }),
  Object.freeze({
    id: 'concealed-creek-lift',
    x: 63.55,
    y: 7.45,
    width: 0.95,
    height: 0.26,
    oneWay: true,
    visual: 'timber-lift',
    secret: true,
    motion: Object.freeze({ kind: 'vertical', range: 0.75, speed: 0.58, phase: 0.7 })
  }),
  Object.freeze({ id: 'rope-bridge-main', x: 67, y: 6.62, width: 4.2, height: 0.26, oneWay: true, visual: 'rope-bridge' }),
  Object.freeze({ id: 'checkpoint-rest-deck', x: 70.5, y: 6.35, width: 1.55, height: 0.3, oneWay: true, visual: 'camp-deck' }),
  Object.freeze({ id: 'lower-creek-log-a', x: 74.15, y: 7.28, width: 2.05, height: 0.3, oneWay: true, visual: 'fallen-log' }),
  Object.freeze({ id: 'upper-route-post-checkpoint-a', x: 74.35, y: 5.45, width: 1.75, height: 0.3, oneWay: true, visual: 'turf-ledge' }),
  Object.freeze({
    id: 'post-checkpoint-lift',
    x: 78.1,
    y: 6.35,
    width: 1.3,
    height: 0.28,
    oneWay: true,
    visual: 'timber-lift',
    motion: Object.freeze({ kind: 'vertical', range: 1.45, speed: 0.72, phase: 0.05 })
  }),
  Object.freeze({
    id: 'creek-seesaw',
    x: 82.1,
    y: 6.25,
    width: 3.2,
    height: 0.28,
    oneWay: true,
    visual: 'seesaw',
    motion: Object.freeze({ kind: 'seesaw', maximumAngle: 0.13, response: 2.4 })
  }),
  Object.freeze({
    id: 'rotating-ruin-step',
    x: 85.5,
    y: 5.42,
    width: 1.2,
    height: 0.3,
    oneWay: true,
    visual: 'ruin-ledge',
    motion: Object.freeze({ kind: 'orbit', rangeX: 0.85, rangeY: 0.62, speed: 0.56, phase: 0.2 })
  }),
  Object.freeze({ id: 'lower-creek-stone-a', x: 86.2, y: 7.35, width: 1.5, height: 0.3, oneWay: true, visual: 'creek-stone' }),
  Object.freeze({ id: 'upper-ruin-route-b', x: 88.3, y: 4.88, width: 1.5, height: 0.3, oneWay: true, visual: 'ruin-ledge' }),
  Object.freeze({
    id: 'ruin-falling-step-a',
    x: 90.85,
    y: 5.72,
    width: 1.05,
    height: 0.28,
    oneWay: true,
    visual: 'ruin-ledge',
    motion: Object.freeze({ kind: 'falling', triggerDelay: 0.56, resetDelay: 3, gravity: 8.2 })
  }),
  Object.freeze({
    id: 'ruin-falling-step-b',
    x: 92.45,
    y: 6.35,
    width: 1.05,
    height: 0.28,
    oneWay: true,
    visual: 'ruin-ledge',
    motion: Object.freeze({ kind: 'falling', triggerDelay: 0.62, resetDelay: 3, gravity: 8.2 })
  }),
  Object.freeze({ id: 'hargold-gate-low-step', x: 95, y: 6.5, width: 1.3, height: 0.3, oneWay: true, visual: 'ruin-ledge' }),
  Object.freeze({ id: 'camp-watch-deck', x: 97.65, y: 5.55, width: 2.25, height: 0.3, oneWay: true, visual: 'camp-deck' }),
  Object.freeze({
    id: 'ruin-descent-lift',
    x: 102,
    y: 6.25,
    width: 1.2,
    height: 0.28,
    oneWay: true,
    visual: 'timber-lift',
    motion: Object.freeze({ kind: 'horizontal', range: 0.72, speed: 0.76, phase: 0.6 })
  }),
  Object.freeze({ id: 'final-hill-stump', x: 106.6, y: 5.82, width: 1.05, height: 0.4, oneWay: true, visual: 'stump' }),
  Object.freeze({
    id: 'final-falling-step',
    x: 110,
    y: 6.18,
    width: 0.9,
    height: 0.26,
    oneWay: true,
    visual: 'timber-slat',
    motion: Object.freeze({ kind: 'falling', triggerDelay: 0.42, resetDelay: 2.6, gravity: 9.2 })
  }),
  Object.freeze({ id: 'final-gap-two-ledge', x: 114.85, y: 6.72, width: 0.72, height: 0.26, oneWay: true, visual: 'creek-stone' }),
  Object.freeze({
    id: 'final-gap-three-log',
    x: 120.35,
    y: 6.22,
    width: 1.25,
    height: 0.28,
    oneWay: true,
    visual: 'fallen-log',
    motion: Object.freeze({ kind: 'seesaw', maximumAngle: 0.08, response: 3 })
  })
]);

const block = (id, type, x, lift, extra = {}) => Object.freeze({
  id,
  type,
  x,
  lift,
  width: type === 'hargold-only' ? 0.82 : 0.74,
  height: type === 'hargold-only' ? 0.82 : 0.74,
  ...extra
});

export const MEADOW_WAKE_BLOCK_DEFINITIONS = Object.freeze([
  block('power-start', 'power-up', 6.15, 1.55, { reward: 'grow' }),
  block('coin-guide-a', 'coin', 7.05, 1.55, { reward: 5 }),
  block('breakable-opening-a', 'standard-breakable', 8, 1.55),
  block('breakable-opening-b', 'standard-breakable', 8.75, 1.55),
  block('coin-log-arc', 'coin', 14.25, 1.65, { reward: 5 }),
  block('breakable-shell-column-a', 'standard-breakable', 27.65, 1.2),
  block('breakable-shell-column-b', 'standard-breakable', 28.4, 1.2),
  block('breakable-shell-column-c', 'standard-breakable', 29.15, 1.2),
  block('breakable-shell-column-d', 'standard-breakable', 29.15, 1.95),
  block('coin-ruin-high', 'coin', 31.2, 2.25, { reward: 5 }),
  block('hidden-ruin-cache', 'coin', 37.6, 2.1, { reward: 10, hidden: true }),
  block('coin-camp-deck', 'coin', 42.6, 2.15, { reward: 5 }),
  block('breakable-camp-a', 'standard-breakable', 45.1, 1.25),
  block('breakable-camp-b', 'standard-breakable', 45.85, 1.25),
  block('coin-lift-reward', 'coin', 49.7, 2.15, { reward: 5 }),
  block('breakable-clearing-a', 'standard-breakable', 53.1, 1.35),
  block('power-pre-checkpoint', 'power-up', 58.1, 1.65, { reward: 'grow' }),
  block('coin-bridge-entry', 'coin', 64.2, 1.55, { reward: 5 }),
  block('coin-checkpoint-rest', 'coin', 71.25, 1.65, { reward: 5 }),
  block('breakable-upper-route-a', 'standard-breakable', 76.1, 2.05),
  block('breakable-upper-route-b', 'standard-breakable', 76.85, 2.05),
  block('hidden-creek-reward', 'coin', 80.15, 2.15, { reward: 10, hidden: true }),
  block('coin-rotating-ruin', 'coin', 87.2, 2.1, { reward: 5 }),
  block('hargold-gate-a', 'hargold-only', 93.6, 1.28),
  block('hargold-gate-b', 'hargold-only', 94.43, 1.28),
  block('hargold-gate-c', 'hargold-only', 95.26, 1.28),
  block('hargold-gate-d', 'hargold-only', 95.26, 2.11),
  block('power-final-recovery', 'power-up', 98.65, 2.2, { reward: 'grow' }),
  block('breakable-final-a', 'standard-breakable', 105.15, 1.4),
  block('coin-final-hill', 'coin', 107.55, 2.0, { reward: 5 }),
  block('hidden-final-cache', 'coin', 112.45, 2.15, { reward: 10, hidden: true }),
  block('breakable-goal-a', 'standard-breakable', 122.25, 1.25)
]);

function line(start, end, count, lift, route = 'main') {
  return Array.from({ length: count }, (_, index) => ({
    x: start + (end - start) * (index / Math.max(1, count - 1)),
    lift,
    route
  }));
}

function arc(start, end, count, baseLift, arcLift, route = 'main') {
  return Array.from({ length: count }, (_, index) => {
    const ratio = index / Math.max(1, count - 1);
    return {
      x: start + (end - start) * ratio,
      lift: baseLift + Math.sin(ratio * Math.PI) * arcLift,
      route
    };
  });
}

function stack(x, lifts, route = 'optional') {
  return lifts.map(lift => ({ x, lift, route }));
}

const AUTHORED_COIN_ANCHORS = [
  ...line(2.2, 6.4, 9, 0.78),
  ...arc(11.4, 19.2, 11, 0.82, 1.65),
  ...line(23.4, 27.1, 7, 0.82),
  ...line(28.8, 33.2, 8, 2.55, 'upper-shell-route'),
  ...stack(39.8, [0.78, 1.28, 1.78, 2.28, 2.78]),
  ...arc(41.2, 49.2, 10, 0.9, 1.4, 'camp-decks'),
  ...line(51.2, 58.8, 10, 1.05),
  ...line(60.2, 63.45, 7, 0.62, 'hidden-creek'),
  ...arc(64.7, 70.4, 11, 0.82, 0.72, 'rope-bridge'),
  ...line(72.2, 79.4, 10, 2.05, 'upper-route'),
  ...line(72.6, 79.2, 9, 0.72, 'lower-creek'),
  ...arc(80.4, 89.3, 12, 0.9, 1.75, 'ruin-route'),
  ...stack(96.4, [0.8, 1.3, 1.8, 2.3, 2.8]),
  ...arc(103.5, 111.1, 11, 0.82, 1.55, 'final-hill'),
  ...arc(112.4, 117.2, 8, 0.82, 1.25, 'final-gap-two'),
  ...arc(118.2, 122.4, 8, 0.82, 1.6, 'final-gap-three')
];

export const MEADOW_WAKE_COIN_DEFINITIONS = Object.freeze(
  AUTHORED_COIN_ANCHORS.map((entry, index) => Object.freeze({
    id: `meadow-coin-${String(index + 1).padStart(3, '0')}`,
    ...entry
  }))
);

export const MEADOW_WAKE_COMPASS_COIN_DEFINITIONS = Object.freeze([
  Object.freeze({ id: '1-1-C1', x: 17.05, y: 4.28, solution: 'fallen-log-upper-arc' }),
  Object.freeze({ id: '1-1-C2', x: 32.2, y: 3.82, solution: 'shellback-breakable-upper-route' }),
  Object.freeze({ id: '1-1-C3', x: 62.05, y: 7.32, solution: 'interrupted-low-trail-creek-shelf', hidden: true })
]);

export const MEADOW_WAKE_FOREGROUND_PROPS = Object.freeze([
  Object.freeze({ id: 'opening-fence', type: 'fence', x: 10.4, scale: 1 }),
  Object.freeze({ id: 'fallen-log-roots', type: 'root-cluster', x: 18.9, scale: 1.1 }),
  Object.freeze({ id: 'shellback-ruin', type: 'ruin-pillar', x: 30.7, scale: 1.05 }),
  Object.freeze({ id: 'ruin-exit-fence', type: 'fence', x: 37.9, scale: 0.9 }),
  Object.freeze({ id: 'camp-clearing-frame', type: 'camp-scaffold', x: 44.6, scale: 1.05 }),
  Object.freeze({ id: 'clearing-stump', type: 'stump', x: 52.2, scale: 0.9 }),
  Object.freeze({ id: 'creek-stone-arch', type: 'stone-arch', x: 58.2, scale: 0.92 }),
  Object.freeze({ id: 'checkpoint-camp-frame', type: 'camp-checkpoint', x: 70.2, scale: 1 }),
  Object.freeze({ id: 'lower-creek-fence', type: 'fence', x: 76.4, scale: 0.88 }),
  Object.freeze({ id: 'upper-ruin-pillars', type: 'ruin-pillar', x: 87.7, scale: 1.15 }),
  Object.freeze({ id: 'watch-deck-frame', type: 'camp-scaffold', x: 97.4, scale: 0.96 }),
  Object.freeze({ id: 'final-hill-stump-prop', type: 'stump', x: 106.9, scale: 1.15 }),
  Object.freeze({ id: 'goal-ruin', type: 'stone-arch', x: 122.2, scale: 1.05 })
]);

export function createMeadowWakePlatforms() {
  return MEADOW_WAKE_PLATFORMS.map(definition => {
    const authoredMotion = definition.motion;
    const motion = authoredMotion
      ? {
          ...authoredMotion,
          type: authoredMotion.kind,
          maxAngle: authoredMotion.maximumAngle,
          radiusX: authoredMotion.rangeX,
          radiusY: authoredMotion.rangeY
        }
      : null;
    return {
      ...definition,
      motion,
      baseX: definition.x,
      baseY: definition.y,
      previousX: definition.x,
      previousY: definition.y,
      velocityX: 0,
      velocityY: 0,
      elapsed: 0,
      angle: 0,
      fallState: 'idle',
      fallSeconds: 0
    };
  });
}

export function createMeadowWakeBlocks(heightAt) {
  return MEADOW_WAKE_BLOCK_DEFINITIONS.map(definition => ({
    ...definition,
    y: heightAt(definition.x) - definition.lift,
    broken: false,
    consumed: false,
    revealed: !definition.hidden,
    bumpSeconds: 0
  }));
}

export function createMeadowWakeCoins(heightAt) {
  return MEADOW_WAKE_COIN_DEFINITIONS.map(definition => ({
    ...definition,
    y: heightAt(definition.x) - definition.lift,
    taken: false
  }));
}

export function createMeadowWakeCompassCoins() {
  return MEADOW_WAKE_COMPASS_COIN_DEFINITIONS.map(definition => ({
    ...definition,
    taken: false
  }));
}

export function meadowWakePitRatio() {
  const pitSpan = MEADOW_WAKE_PITS.reduce((total, pit) => total + pit.to - pit.from, 0);
  return pitSpan / MEADOW_WAKE_WORLD_END;
}
