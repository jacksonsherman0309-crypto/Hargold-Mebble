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
  Object.freeze([6, 7.9]),
  Object.freeze([10, 7.72]),
  Object.freeze([14, 7.45]),
  Object.freeze([17, 7.65]),
  Object.freeze([21, 7.4]),
  Object.freeze([25, 7.7]),
  Object.freeze([29, 7.65]),
  Object.freeze([33, 7.15]),
  Object.freeze([37, 6.75]),
  Object.freeze([41, 7.05]),
  Object.freeze([45, 6.65]),
  Object.freeze([49, 6.2]),
  Object.freeze([53, 6.45]),
  Object.freeze([57, 6.8]),
  Object.freeze([60, 7.1]),
  Object.freeze([64, 7.45]),
  Object.freeze([69, 7.4]),
  Object.freeze([73, 7.1]),
  Object.freeze([78, 7.45]),
  Object.freeze([83, 7.05]),
  Object.freeze([87, 6.6]),
  Object.freeze([91, 6.15]),
  Object.freeze([95, 6.55]),
  Object.freeze([99, 7]),
  Object.freeze([103, 7.45]),
  Object.freeze([107, 6.95]),
  Object.freeze([110, 6.7]),
  Object.freeze([113, 7.1]),
  Object.freeze([116, 6.85]),
  Object.freeze([119, 7.25]),
  Object.freeze([123, 7]),
  Object.freeze([124, 7])
]);

export const MEADOW_WAKE_PITS = Object.freeze([
  Object.freeze({ id: 'concealed-creek-pocket', from: 60.35, to: 63.15, recoveryShelf: true }),
  Object.freeze({ id: 'rope-bridge-ravine', from: 65.1, to: 68.9, bridged: true }),
  Object.freeze({ id: 'final-gap-one', from: 110.8, to: 111.9 }),
  Object.freeze({ id: 'final-gap-two', from: 115.4, to: 116.75 }),
  Object.freeze({ id: 'final-gap-three', from: 120.1, to: 121.75 })
]);

export const MEADOW_WAKE_ROUTE_PHASES = Object.freeze([
  Object.freeze({ id: 'camp-departure', range: Object.freeze([0, 14]), purpose: 'safe grounded opening and first low block trio' }),
  Object.freeze({ id: 'first-natural-obstacle', range: Object.freeze([14, 25]), purpose: 'single fallen-log jump with a readable reward arc' }),
  Object.freeze({ id: 'first-gameplay-encounter', range: Object.freeze([25, 40]), purpose: 'wide ground corridor and shell-opened ruin formation' }),
  Object.freeze({ id: 'gentle-elevation-lesson', range: Object.freeze([40, 55]), purpose: 'walkable bank with one optional camp shelf' }),
  Object.freeze({ id: 'first-controlled-gap', range: Object.freeze([55, 70]), purpose: 'concealed creek pocket followed by one framed rope ravine' }),
  Object.freeze({ id: 'open-running-meadow', range: Object.freeze([70, 84]), purpose: 'rolling connected ground and sparse environmental obstacles' }),
  Object.freeze({ id: 'compact-platform-challenge', range: Object.freeze([84, 99]), purpose: 'contained lift and ruin sequence returning to ground' }),
  Object.freeze({ id: 'combination-challenge', range: Object.freeze([99, 111]), purpose: 'reinforced gate, blocks, slope and one environmental step' }),
  Object.freeze({ id: 'exit-approach', range: Object.freeze([111, 124]), purpose: 'graduated panorama gaps and a stable goal overlook' })
]);

const terrainModule = (id, from, to, variant, extra = {}) => Object.freeze({
  id,
  from,
  to,
  variant,
  ...extra
});

export const MEADOW_WAKE_TERRAIN_MODULES = Object.freeze([
  terrainModule('camp-loam-a', 0, 5, 'meadow-loam', { seed: 3, faceDepth: 470 }),
  terrainModule('camp-root-bank', 5, 10, 'root-bound', { seed: 11, faceDepth: 450 }),
  terrainModule('camp-stone-seam', 10, 15, 'stone-seam', { seed: 19, faceDepth: 430 }),
  terrainModule('log-hollow-bank', 15, 22, 'root-hollow', { seed: 29, faceDepth: 455 }),
  terrainModule('log-landing-bank', 22, 28, 'meadow-loam', { seed: 37, faceDepth: 440 }),
  terrainModule('ruin-low-foundation', 28, 33, 'ruin-foundation', { seed: 43, faceDepth: 470 }),
  terrainModule('ruin-rising-foundation', 33, 38, 'ruin-foundation', { seed: 53, faceDepth: 495 }),
  terrainModule('ruin-exit-meadow', 38, 44, 'meadow-loam', { seed: 61, faceDepth: 455 }),
  terrainModule('camp-rising-bank', 44, 50, 'compacted-clay', { seed: 71, faceDepth: 485 }),
  terrainModule('camp-high-bank', 50, 56, 'root-bound', { seed: 79, faceDepth: 505 }),
  terrainModule('creek-approach', 56, 60.35, 'eroded-bank', { seed: 89, faceDepth: 525, cliffRight: true }),
  terrainModule('creek-pocket-exit', 63.15, 65.1, 'eroded-bank', { seed: 97, faceDepth: 515, cliffLeft: true, cliffRight: true }),
  terrainModule('bridge-overlook', 68.9, 73.5, 'stone-seam', { seed: 103, faceDepth: 475, cliffLeft: true }),
  terrainModule('running-meadow-a', 73.5, 79, 'meadow-loam', { seed: 113, faceDepth: 445 }),
  terrainModule('running-meadow-b', 79, 84, 'root-bound', { seed: 127, faceDepth: 455 }),
  terrainModule('creek-challenge-bank', 84, 89, 'eroded-bank', { seed: 137, faceDepth: 480 }),
  terrainModule('upper-ruin-bank', 89, 94, 'ruin-foundation', { seed: 149, faceDepth: 515 }),
  terrainModule('gate-foundation', 94, 100, 'ruin-foundation', { seed: 157, faceDepth: 500 }),
  terrainModule('combination-meadow', 100, 106, 'compacted-clay', { seed: 167, faceDepth: 465 }),
  terrainModule('panorama-runup', 106, 110.8, 'flowered-bank', { seed: 179, faceDepth: 445, cliffRight: true }),
  terrainModule('panorama-island-a', 111.9, 115.4, 'flowered-bank', { seed: 191, faceDepth: 465, cliffLeft: true, cliffRight: true }),
  terrainModule('panorama-island-b', 116.75, 120.1, 'stone-seam', { seed: 199, faceDepth: 485, cliffLeft: true, cliffRight: true }),
  terrainModule('goal-overlook', 121.75, 124, 'flowered-bank', { seed: 211, faceDepth: 470, cliffLeft: true })
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
  Object.freeze({ id: 'camp-awning-deck', x: 4.9, y: 6.62, width: 2.2, height: 0.28, oneWay: true, visual: 'camp-deck', purpose: 'optional opening overlook' }),
  Object.freeze({ id: 'opening-stump-step', x: 11.1, y: 6.82, width: 1.05, height: 0.4, oneWay: true, visual: 'stump', purpose: 'single low natural step' }),
  Object.freeze({
    id: 'fallen-log-launch',
    x: 18.2,
    y: 6.55,
    width: 3,
    height: 0.3,
    oneWay: true,
    visual: 'fallen-log',
    purpose: 'first obvious jump and Compass Coin launch',
    motion: Object.freeze({ kind: 'seesaw', maximumAngle: 0.1, response: 2.8 })
  }),
  Object.freeze({ id: 'fallen-log-landing', x: 22.1, y: 6.48, width: 1.65, height: 0.3, oneWay: true, visual: 'turf-ledge', purpose: 'framed landing and upper reward' }),
  Object.freeze({ id: 'shellback-low-ledge', x: 30.4, y: 6.58, width: 2.15, height: 0.32, oneWay: true, visual: 'ruin-ledge', purpose: 'shell tutorial staging' }),
  Object.freeze({ id: 'shellback-upper-route-a', x: 34.15, y: 5.7, width: 1.75, height: 0.32, oneWay: true, visual: 'ruin-ledge', purpose: 'Compass Coin route step one' }),
  Object.freeze({ id: 'shellback-upper-route-b', x: 37.05, y: 5.02, width: 1.5, height: 0.32, oneWay: true, visual: 'ruin-ledge', purpose: 'Compass Coin route landing' }),
  Object.freeze({ id: 'elevation-optional-shelf', x: 45.65, y: 5.42, width: 1.75, height: 0.3, oneWay: true, visual: 'turf-ledge', purpose: 'optional reward above walkable slope' }),
  Object.freeze({ id: 'camp-scaffold-deck', x: 49.05, y: 4.92, width: 2.6, height: 0.3, oneWay: true, visual: 'camp-deck', purpose: 'camp structure integrated into upper route' }),
  Object.freeze({
    id: 'camp-clearing-lift',
    x: 52.5,
    y: 6.22,
    width: 1.35,
    height: 0.3,
    oneWay: true,
    visual: 'timber-lift',
    purpose: 'forgiving lift to the camp shelf',
    motion: Object.freeze({ kind: 'vertical', range: 1.35, speed: 0.66, phase: 0.4 })
  }),
  Object.freeze({ id: 'clearing-high-ledge', x: 54.55, y: 5.35, width: 1.7, height: 0.3, oneWay: true, visual: 'turf-ledge', purpose: 'lift reward and return to ground' }),
  Object.freeze({ id: 'bramble-clue-step', x: 59.35, y: 6.42, width: 1.05, height: 0.28, oneWay: true, visual: 'stump', purpose: 'secret creek clue' }),
  Object.freeze({ id: 'concealed-creek-shelf', x: 61.75, y: 8.22, width: 2.25, height: 0.28, oneWay: true, visual: 'creek-stone', secret: true, purpose: 'hidden Compass Coin recovery shelf' }),
  Object.freeze({
    id: 'concealed-creek-lift',
    x: 63.35,
    y: 7.45,
    width: 0.95,
    height: 0.26,
    oneWay: true,
    visual: 'timber-lift',
    secret: true,
    purpose: 'return path from concealed creek shelf',
    motion: Object.freeze({ kind: 'vertical', range: 0.75, speed: 0.58, phase: 0.7 })
  }),
  Object.freeze({ id: 'rope-bridge-main', x: 67, y: 7.18, width: 4.2, height: 0.26, oneWay: true, visual: 'rope-bridge', purpose: 'single clearly framed required ravine crossing' }),
  Object.freeze({ id: 'checkpoint-rest-deck', x: 70.55, y: 6.66, width: 1.65, height: 0.3, oneWay: true, visual: 'camp-deck', purpose: 'post-gap checkpoint recovery' }),
  Object.freeze({ id: 'running-meadow-log', x: 78.65, y: 6.78, width: 2.35, height: 0.3, oneWay: true, visual: 'fallen-log', purpose: 'optional speed-preserving hop' }),
  Object.freeze({ id: 'compact-creek-log', x: 85.15, y: 6.72, width: 2.3, height: 0.3, oneWay: true, visual: 'fallen-log', purpose: 'compact challenge entrance' }),
  Object.freeze({
    id: 'compact-ruin-lift',
    x: 88.25,
    y: 6.35,
    width: 1.3,
    height: 0.28,
    oneWay: true,
    visual: 'timber-lift',
    purpose: 'contained platform challenge lift',
    motion: Object.freeze({ kind: 'vertical', range: 1.45, speed: 0.72, phase: 0.05 })
  }),
  Object.freeze({ id: 'compact-ruin-shelf', x: 91.05, y: 5.25, width: 1.65, height: 0.3, oneWay: true, visual: 'ruin-ledge', purpose: 'lift landing and upper route' }),
  Object.freeze({
    id: 'rotating-ruin-step',
    x: 94,
    y: 5.85,
    width: 1.2,
    height: 0.3,
    oneWay: true,
    visual: 'ruin-ledge',
    purpose: 'single readable rotating transfer',
    motion: Object.freeze({ kind: 'orbit', rangeX: 0.85, rangeY: 0.62, speed: 0.56, phase: 0.2 })
  }),
  Object.freeze({
    id: 'compact-falling-step',
    x: 97,
    y: 6.35,
    width: 1.15,
    height: 0.28,
    oneWay: true,
    visual: 'ruin-ledge',
    purpose: 'telegraphed return from upper ruins',
    motion: Object.freeze({ kind: 'falling', triggerDelay: 0.62, resetDelay: 3, gravity: 8.2 })
  }),
  Object.freeze({ id: 'gate-low-step', x: 100.25, y: 6.45, width: 1.25, height: 0.3, oneWay: true, visual: 'ruin-ledge', purpose: 'reinforced gate approach' }),
  Object.freeze({ id: 'final-hill-stump', x: 107.4, y: 5.88, width: 1.05, height: 0.4, oneWay: true, visual: 'stump', purpose: 'final run-up landmark' }),
  Object.freeze({
    id: 'final-falling-step',
    x: 111.35,
    y: 6.48,
    width: 0.9,
    height: 0.26,
    oneWay: true,
    visual: 'timber-slat',
    purpose: 'first forgiving panorama gap recovery',
    motion: Object.freeze({ kind: 'falling', triggerDelay: 0.42, resetDelay: 2.6, gravity: 9.2 })
  }),
  Object.freeze({ id: 'final-gap-two-ledge', x: 116.05, y: 6.55, width: 0.76, height: 0.26, oneWay: true, visual: 'creek-stone', purpose: 'second panorama gap visual landing cue' }),
  Object.freeze({
    id: 'final-gap-three-log',
    x: 120.9,
    y: 6.58,
    width: 1.25,
    height: 0.28,
    oneWay: true,
    visual: 'fallen-log',
    purpose: 'final gap recovery and goal reveal',
    motion: Object.freeze({ kind: 'seesaw', maximumAngle: 0.08, response: 3 })
  })
]);

const block = (id, type, x, lift, formation, extra = {}) => Object.freeze({
  id,
  type,
  x,
  lift,
  formation,
  width: type === 'hargold-only' ? 0.82 : 0.74,
  height: type === 'hargold-only' ? 0.82 : 0.74,
  ...extra
});

export const MEADOW_WAKE_BLOCK_DEFINITIONS = Object.freeze([
  block('opening-breakable-a', 'standard-breakable', 7.65, 1.5, 'opening-trio'),
  block('opening-coin-centre', 'coin', 8.4, 1.5, 'opening-trio', { reward: 5 }),
  block('opening-breakable-b', 'standard-breakable', 9.15, 1.5, 'opening-trio'),
  block('power-before-first-encounter', 'power-up', 26.8, 1.55, 'first-encounter-support', { reward: 'grow' }),
  block('shell-ruin-a', 'standard-breakable', 31.35, 1.35, 'shellback-ruin-line'),
  block('shell-ruin-coin', 'coin', 32.1, 1.35, 'shellback-ruin-line', { reward: 5 }),
  block('shell-ruin-b', 'standard-breakable', 32.85, 1.35, 'shellback-ruin-line'),
  block('hidden-ruin-lookout', 'coin', 35.35, 2.35, 'shellback-upper-reward', { reward: 10, hidden: true }),
  block('shell-column-a', 'standard-breakable', 38.45, 1.28, 'shell-opened-column'),
  block('shell-column-b', 'standard-breakable', 39.2, 1.28, 'shell-opened-column'),
  block('shell-column-c', 'standard-breakable', 39.95, 1.28, 'shell-opened-column'),
  block('shell-column-cap', 'standard-breakable', 39.95, 2.03, 'shell-opened-column'),
  block('elevation-reward', 'coin', 45.9, 1.62, 'elevation-shelf', { reward: 5 }),
  block('camp-deck-breakable', 'standard-breakable', 48.7, 1.42, 'camp-deck-punctuation'),
  block('camp-deck-coin', 'coin', 49.45, 1.42, 'camp-deck-punctuation', { reward: 5 }),
  block('power-before-ravine', 'power-up', 58.15, 1.62, 'ravine-support', { reward: 'grow' }),
  block('bridge-entry-coin', 'coin', 64.1, 1.58, 'bridge-entry', { reward: 5 }),
  block('checkpoint-rest-coin', 'coin', 71.55, 1.58, 'checkpoint-recovery', { reward: 5 }),
  block('meadow-breakable-a', 'standard-breakable', 76.15, 1.58, 'running-meadow-trio'),
  block('meadow-coin-centre', 'coin', 76.9, 1.58, 'running-meadow-trio', { reward: 5 }),
  block('meadow-breakable-b', 'standard-breakable', 77.65, 1.58, 'running-meadow-trio'),
  block('compact-ruin-breakable', 'standard-breakable', 87.55, 1.48, 'compact-ruin-pair'),
  block('compact-ruin-coin', 'coin', 88.3, 1.48, 'compact-ruin-pair', { reward: 5 }),
  block('compact-upper-coin', 'coin', 91.05, 2.12, 'compact-upper-reward', { reward: 5 }),
  block('hargold-gate-a', 'hargold-only', 100.55, 1.28, 'hargold-gate'),
  block('hargold-gate-b', 'hargold-only', 101.38, 1.28, 'hargold-gate'),
  block('hargold-gate-c', 'hargold-only', 102.21, 1.28, 'hargold-gate'),
  block('hargold-gate-cap', 'hargold-only', 102.21, 2.11, 'hargold-gate'),
  block('power-final-recovery', 'power-up', 104.75, 1.7, 'final-recovery', { reward: 'grow' }),
  block('final-hill-breakable', 'standard-breakable', 107.15, 1.4, 'final-hill-pair'),
  block('final-hill-coin', 'coin', 107.9, 1.4, 'final-hill-pair', { reward: 5 }),
  block('hidden-final-cache', 'coin', 109.3, 2.2, 'final-hidden-reward', { reward: 10, hidden: true }),
  block('goal-breakable', 'standard-breakable', 123, 1.28, 'goal-punctuation')
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
  ...line(2.2, 6.2, 8, 0.78),
  ...arc(11.6, 20.4, 12, 0.82, 1.58),
  ...line(22.6, 27.4, 8, 0.82),
  ...arc(29.1, 38.1, 13, 0.88, 1.68, 'upper-shell-route'),
  ...line(40.7, 45.3, 8, 0.84),
  ...arc(46.1, 54.7, 12, 0.86, 1.45, 'camp-decks'),
  ...line(55.7, 59.7, 7, 0.8),
  ...line(60.55, 62.95, 7, 0.62, 'hidden-creek'),
  ...arc(64.75, 69.15, 10, 0.78, 0.78, 'rope-bridge'),
  ...line(70.2, 81.4, 16, 0.78, 'running-meadow'),
  ...arc(83.8, 98.2, 18, 0.86, 1.78, 'compact-ruin-route'),
  ...stack(99.4, [0.78, 1.28, 1.78, 2.28, 2.78]),
  ...arc(102.5, 111.7, 14, 0.82, 1.48, 'final-hill'),
  ...arc(112.4, 117.3, 9, 0.82, 1.18, 'final-gap-two'),
  ...arc(118.1, 123.1, 10, 0.82, 1.52, 'final-gap-three')
];

export const MEADOW_WAKE_COIN_DEFINITIONS = Object.freeze(
  AUTHORED_COIN_ANCHORS.map((entry, index) => Object.freeze({
    id: `meadow-coin-${String(index + 1).padStart(3, '0')}`,
    ...entry
  }))
);

export const MEADOW_WAKE_COMPASS_COIN_DEFINITIONS = Object.freeze([
  Object.freeze({ id: '1-1-C1', x: 18.2, y: 4.18, solution: 'fallen-log-upper-arc' }),
  Object.freeze({ id: '1-1-C2', x: 37.05, y: 4.05, solution: 'shellback-breakable-upper-route' }),
  Object.freeze({ id: '1-1-C3', x: 61.75, y: 7.3, solution: 'interrupted-low-trail-creek-shelf', hidden: true })
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
    bumpSeconds: 0,
    bumpDuration: 0,
    flashSeconds: 0,
    impactSerial: 0,
    impactKind: 'idle'
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

export function meadowWakeTerrainModuleCoverage() {
  return MEADOW_WAKE_TERRAIN_MODULES.reduce(
    (total, module) => total + module.to - module.from,
    0
  ) / MEADOW_WAKE_WORLD_END;
}
