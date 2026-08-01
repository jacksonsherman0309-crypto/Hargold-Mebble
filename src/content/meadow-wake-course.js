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
  Object.freeze([4, 7.9]),
  Object.freeze([8, 7.72]),
  Object.freeze([10.5, 7.58]),
  Object.freeze([12.5, 7.28]),
  Object.freeze([14.5, 7.08]),
  Object.freeze([16.5, 7.42]),
  Object.freeze([18.5, 7.2]),
  Object.freeze([20.5, 7.02]),
  Object.freeze([22.5, 7.28]),
  Object.freeze([24.5, 7.04]),
  Object.freeze([27, 6.62]),
  Object.freeze([29.5, 6.43]),
  Object.freeze([32, 6.78]),
  Object.freeze([34.5, 6.4]),
  Object.freeze([37, 6.2]),
  Object.freeze([39.5, 6.55]),
  Object.freeze([41, 6.82]),
  Object.freeze([43.5, 6.7]),
  Object.freeze([46, 6.34]),
  Object.freeze([48.5, 6.18]),
  Object.freeze([51.5, 6.47]),
  Object.freeze([54, 6.82]),
  Object.freeze([56.5, 7.12]),
  Object.freeze([58.5, 7.42]),
  Object.freeze([60.35, 7.58]),
  Object.freeze([63.15, 7.5]),
  Object.freeze([65.1, 7.24]),
  Object.freeze([68.9, 7.12]),
  Object.freeze([72.5, 6.88]),
  Object.freeze([75, 7]),
  Object.freeze([78, 7.34]),
  Object.freeze([81, 7.08]),
  Object.freeze([83.5, 6.92]),
  Object.freeze([86, 6.62]),
  Object.freeze([88.5, 6.3]),
  Object.freeze([91, 6.18]),
  Object.freeze([93.5, 6.55]),
  Object.freeze([96, 6.3]),
  Object.freeze([98.5, 6.1]),
  Object.freeze([101, 6.52]),
  Object.freeze([103.5, 6.84]),
  Object.freeze([106, 7.02]),
  Object.freeze([108.5, 6.62]),
  Object.freeze([110.8, 6.48]),
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
  Object.freeze({ id: 'camp-departure', range: Object.freeze([0, 14]), purpose: 'safe grounded trailhead camp and staggered block lesson' }),
  Object.freeze({ id: 'first-natural-obstacle', range: Object.freeze([14, 25]), purpose: 'elder-root arch, fallen-log jump, and readable reward arc' }),
  Object.freeze({ id: 'first-gameplay-encounter', range: Object.freeze([25, 40]), purpose: 'mason shelf, ruin tower, and shell-opened fieldstone phrase' }),
  Object.freeze({ id: 'gentle-elevation-lesson', range: Object.freeze([40, 55]), purpose: 'timberyard terrace with a climbable stack, scaffold deck, and lift' }),
  Object.freeze({ id: 'first-controlled-gap', range: Object.freeze([55, 70]), purpose: 'stump-root creek pocket followed by one framed lantern bridge' }),
  Object.freeze({ id: 'open-running-meadow', range: Object.freeze([70, 84]), purpose: 'checkpoint recovery, working watermill, and optional paddle transfer' }),
  Object.freeze({ id: 'compact-platform-challenge', range: Object.freeze([84, 99]), purpose: 'root terrace and lookout-ruin sequence returning to ground' }),
  Object.freeze({ id: 'combination-challenge', range: Object.freeze([99, 111]), purpose: 'reinforced lookout gate, flowering hill phrase, and environmental steps' }),
  Object.freeze({ id: 'exit-approach', range: Object.freeze([111, 124]), purpose: 'graduated panorama gaps and a stable goal overlook' })
]);

export const MEADOW_WAKE_GAMEPLAY_ROOMS = Object.freeze([
  Object.freeze({ id: 'trailhead-camp', range: Object.freeze([0, 10.5]), landmark: 'opening-lodge', terrainLanguage: 'compacted trailhead embankment', gameplayPhrase: 'runway, staggered block lesson, awning overlook' }),
  Object.freeze({ id: 'elder-root-walk', range: Object.freeze([10.5, 20.5]), landmark: 'elder-root-arch', terrainLanguage: 'root-bound hollow and exposed tree toes', gameplayPhrase: 'duck-readable arch, stump step, fallen-log launch' }),
  Object.freeze({ id: 'mason-shelf', range: Object.freeze([20.5, 30]), landmark: 'mason-shelf-pine', terrainLanguage: 'boulder-supported rock shelf', gameplayPhrase: 'first grounded encounter beneath an optional shelf' }),
  Object.freeze({ id: 'shellback-quarry', range: Object.freeze([30, 41]), landmark: 'shellback-ruin-tower', terrainLanguage: 'broken fieldstone quarry and ruin foundation', gameplayPhrase: 'shell-driven block phrase opening the upper route' }),
  Object.freeze({ id: 'timberyard-clearing', range: Object.freeze([41, 51.5]), landmark: 'clearing-timber-frame', terrainLanguage: 'timber-retained camp terrace', gameplayPhrase: 'stacked timber climb into scaffold deck and lift' }),
  Object.freeze({ id: 'stump-creek-hollow', range: Object.freeze([51.5, 63.15]), landmark: 'creek-giant-stump', terrainLanguage: 'eroded root bank and concealed creek shelf', gameplayPhrase: 'bramble clue, interrupted low coins, hidden Compass Coin' }),
  Object.freeze({ id: 'lantern-bridge', range: Object.freeze([63.15, 72.5]), landmark: 'bridge-signal-frame', terrainLanguage: 'stone bridge abutments and waterfall ravine', gameplayPhrase: 'single rope crossing into checkpoint shelter' }),
  Object.freeze({ id: 'mill-meadow', range: Object.freeze([72.5, 83.5]), landmark: 'creek-watermill', terrainLanguage: 'mill-race stones and damp meadow bank', gameplayPhrase: 'ground run with optional moving paddle reward' }),
  Object.freeze({ id: 'root-terrace', range: Object.freeze([83.5, 93.5]), landmark: 'root-terrace-oak', terrainLanguage: 'stepped root shelf and fern ledges', gameplayPhrase: 'contained lift route with a safe grounded bypass' }),
  Object.freeze({ id: 'lookout-ruins', range: Object.freeze([93.5, 103.5]), landmark: 'watch-deck-tower', terrainLanguage: 'stone lookout foundation and broken cornice', gameplayPhrase: 'rotating transfer, falling return, Hargold gate' }),
  Object.freeze({ id: 'flowering-run', range: Object.freeze([103.5, 111]), landmark: 'panorama-vista-oak', terrainLanguage: 'flowered hill and boulder bench', gameplayPhrase: 'downhill reward phrase and final-gap setup' }),
  Object.freeze({ id: 'three-gap-vista', range: Object.freeze([111, 124]), landmark: 'goal-stone-gate', terrainLanguage: 'fractured overlook islands', gameplayPhrase: 'three graduated jumps framed by the goal ruin' })
]);

/*
 * Course-specific visible-landform profiles. Values are authored normalized
 * face depths sampled from left to right, not collision coordinates and not a
 * procedural terrain recipe. Their uneven lower contours let each Meadow Wake
 * room read as a bank, shelf, terrace, or overlook instead of a rectangular
 * strip while the deterministic ground profile above remains unchanged.
 */
export const MEADOW_WAKE_AUTHORED_TERRAIN_SHAPES = Object.freeze({
  'trailhead-packed-loam': Object.freeze({ lowerProfile: Object.freeze([0.58, 0.66, 0.54, 0.72, 0.61, 0.56]), lowerInset: Object.freeze([0.18, 0.08]), textureScale: 7.4 }),
  'trailhead-root-edge': Object.freeze({ lowerProfile: Object.freeze([0.63, 0.82, 0.71, 0.92, 0.68, 0.57]), lowerInset: Object.freeze([0.08, 0.24]), textureScale: 6.7 }),
  'elder-root-rise': Object.freeze({ lowerProfile: Object.freeze([0.7, 0.9, 0.78, 0.64, 0.84, 0.73]), lowerInset: Object.freeze([0.2, 0.12]), textureScale: 7.9 }),
  'elder-root-hollow': Object.freeze({ lowerProfile: Object.freeze([0.74, 0.62, 0.88, 0.96, 0.69, 0.76]), lowerInset: Object.freeze([0.12, 0.28]), textureScale: 8.4 }),
  'mason-shelf-low': Object.freeze({ lowerProfile: Object.freeze([0.57, 0.74, 0.86, 0.66, 0.59, 0.72]), lowerInset: Object.freeze([0.26, 0.1]), textureScale: 6.9 }),
  'mason-shelf-rise': Object.freeze({ lowerProfile: Object.freeze([0.68, 0.92, 0.79, 0.96, 0.72, 0.64]), lowerInset: Object.freeze([0.08, 0.2]), textureScale: 7.7 }),
  'quarry-foundation-a': Object.freeze({ lowerProfile: Object.freeze([0.86, 0.72, 0.94, 0.81, 0.98, 0.76]), lowerInset: Object.freeze([0.12, 0.06]), textureScale: 8.1 }),
  'quarry-foundation-b': Object.freeze({ lowerProfile: Object.freeze([0.8, 0.97, 0.73, 0.9, 0.68, 0.75]), lowerInset: Object.freeze([0.06, 0.18]), textureScale: 7.3 }),
  'timberyard-retaining-a': Object.freeze({ lowerProfile: Object.freeze([0.62, 0.78, 0.69, 0.86, 0.73, 0.66]), lowerInset: Object.freeze([0.2, 0.08]), textureScale: 8.6 }),
  'timberyard-retaining-b': Object.freeze({ lowerProfile: Object.freeze([0.7, 0.88, 0.76, 0.94, 0.79, 0.61]), lowerInset: Object.freeze([0.08, 0.22]), textureScale: 7.6 }),
  'stump-hollow-bank': Object.freeze({ lowerProfile: Object.freeze([0.7, 0.58, 0.91, 0.8, 0.98, 0.72]), lowerInset: Object.freeze([0.2, 0.16]), textureScale: 8.2 }),
  'creek-eroded-approach': Object.freeze({ lowerProfile: Object.freeze([0.83, 0.96, 0.71, 0.88, 0.61, 0.49]), lowerInset: Object.freeze([0.1, 0.34]), textureScale: 6.5 }),
  'creek-pocket-exit': Object.freeze({ lowerProfile: Object.freeze([0.46, 0.7, 0.88, 0.62, 0.5]), lowerInset: Object.freeze([0.34, 0.3]), textureScale: 7.1 }),
  'bridge-overlook': Object.freeze({ lowerProfile: Object.freeze([0.5, 0.68, 0.84, 0.76, 0.62, 0.7]), lowerInset: Object.freeze([0.3, 0.14]), textureScale: 8.8 }),
  'mill-meadow-bank': Object.freeze({ lowerProfile: Object.freeze([0.56, 0.7, 0.62, 0.78, 0.66, 0.59]), lowerInset: Object.freeze([0.14, 0.08]), textureScale: 7.2 }),
  'mill-race-bank': Object.freeze({ lowerProfile: Object.freeze([0.64, 0.82, 0.95, 0.7, 0.88, 0.6]), lowerInset: Object.freeze([0.08, 0.22]), textureScale: 8.3 }),
  'root-terrace-low': Object.freeze({ lowerProfile: Object.freeze([0.62, 0.76, 0.9, 0.68, 0.82, 0.7]), lowerInset: Object.freeze([0.22, 0.08]), textureScale: 7.8 }),
  'root-terrace-high': Object.freeze({ lowerProfile: Object.freeze([0.72, 0.94, 0.8, 0.98, 0.74, 0.65]), lowerInset: Object.freeze([0.08, 0.2]), textureScale: 8.6 }),
  'lookout-foundation-a': Object.freeze({ lowerProfile: Object.freeze([0.82, 0.68, 0.94, 0.79, 0.9, 0.72]), lowerInset: Object.freeze([0.14, 0.08]), textureScale: 7.4 }),
  'lookout-foundation-b': Object.freeze({ lowerProfile: Object.freeze([0.74, 0.92, 0.7, 0.86, 0.64, 0.58]), lowerInset: Object.freeze([0.08, 0.26]), textureScale: 8.1 }),
  'flowering-run-bank-a': Object.freeze({ lowerProfile: Object.freeze([0.54, 0.68, 0.61, 0.76, 0.66, 0.57]), lowerInset: Object.freeze([0.2, 0.08]), textureScale: 6.8 }),
  'flowering-run-bank-b': Object.freeze({ lowerProfile: Object.freeze([0.6, 0.78, 0.7, 0.84, 0.58, 0.47]), lowerInset: Object.freeze([0.08, 0.32]), textureScale: 7.5 }),
  'panorama-island-a': Object.freeze({ lowerProfile: Object.freeze([0.48, 0.72, 0.88, 0.7, 0.52]), lowerInset: Object.freeze([0.32, 0.3]), textureScale: 8.9 }),
  'panorama-island-b': Object.freeze({ lowerProfile: Object.freeze([0.46, 0.68, 0.9, 0.74, 0.49]), lowerInset: Object.freeze([0.34, 0.32]), textureScale: 7.2 }),
  'goal-overlook': Object.freeze({ lowerProfile: Object.freeze([0.48, 0.7, 0.82, 0.66, 0.56]), lowerInset: Object.freeze([0.3, 0.16]), textureScale: 8.4 })
});

const terrainModule = (id, from, to, variant, extra = {}) => Object.freeze({
  id,
  from,
  to,
  variant,
  roomId: MEADOW_WAKE_GAMEPLAY_ROOMS.find(room => (
    (from + to) / 2 >= room.range[0] && (from + to) / 2 <= room.range[1]
  ))?.id,
  visibleRepresentation: 'verdant-vale-relief-mesh',
  collisionRepresentation: 'meadow-wake-ground-profile',
  ...MEADOW_WAKE_AUTHORED_TERRAIN_SHAPES[id],
  ...extra
});

export const MEADOW_WAKE_TERRAIN_MODULES = Object.freeze([
  terrainModule('trailhead-packed-loam', 0, 5.4, 'compacted-clay', {
    seed: 3,
    faceDepth: 462,
    visualFrom: -1.7,
    purpose: 'non-collision visual apron grounds the opening lodge'
  }),
  terrainModule('trailhead-root-edge', 5.4, 10.5, 'root-bound', { seed: 11, faceDepth: 438, transitionRight: 'root' }),
  terrainModule('elder-root-rise', 10.5, 15, 'root-hollow', { seed: 19, faceDepth: 476, transitionLeft: 'root' }),
  terrainModule('elder-root-hollow', 15, 20.5, 'root-hollow', { seed: 29, faceDepth: 522, transitionRight: 'boulder' }),
  terrainModule('mason-shelf-low', 20.5, 25.5, 'stone-seam', { seed: 37, faceDepth: 448, transitionLeft: 'boulder' }),
  terrainModule('mason-shelf-rise', 25.5, 30, 'stone-seam', { seed: 43, faceDepth: 506, transitionRight: 'stone' }),
  terrainModule('quarry-foundation-a', 30, 35.5, 'ruin-foundation', { seed: 53, faceDepth: 532, transitionLeft: 'stone' }),
  terrainModule('quarry-foundation-b', 35.5, 41, 'ruin-foundation', { seed: 61, faceDepth: 486, transitionRight: 'timber' }),
  terrainModule('timberyard-retaining-a', 41, 46.5, 'compacted-clay', { seed: 71, faceDepth: 468, transitionLeft: 'timber' }),
  terrainModule('timberyard-retaining-b', 46.5, 51.5, 'compacted-clay', { seed: 79, faceDepth: 518, transitionRight: 'root' }),
  terrainModule('stump-hollow-bank', 51.5, 56.5, 'root-bound', { seed: 83, faceDepth: 496, transitionLeft: 'root' }),
  terrainModule('creek-eroded-approach', 56.5, 60.35, 'eroded-bank', { seed: 89, faceDepth: 536, cliffRight: true }),
  terrainModule('creek-pocket-exit', 63.15, 65.1, 'eroded-bank', { seed: 97, faceDepth: 522, cliffLeft: true, cliffRight: true }),
  terrainModule('bridge-overlook', 68.9, 72.5, 'stone-seam', { seed: 103, faceDepth: 488, cliffLeft: true, transitionRight: 'stone' }),
  terrainModule('mill-meadow-bank', 72.5, 78, 'meadow-loam', { seed: 113, faceDepth: 446, transitionLeft: 'stone' }),
  terrainModule('mill-race-bank', 78, 83.5, 'eroded-bank', { seed: 127, faceDepth: 494, transitionRight: 'root' }),
  terrainModule('root-terrace-low', 83.5, 88.5, 'root-bound', { seed: 137, faceDepth: 474, transitionLeft: 'root' }),
  terrainModule('root-terrace-high', 88.5, 93.5, 'root-hollow', { seed: 149, faceDepth: 528, transitionRight: 'stone' }),
  terrainModule('lookout-foundation-a', 93.5, 98.5, 'ruin-foundation', { seed: 157, faceDepth: 516, transitionLeft: 'stone' }),
  terrainModule('lookout-foundation-b', 98.5, 103.5, 'ruin-foundation', { seed: 163, faceDepth: 488, transitionRight: 'boulder' }),
  terrainModule('flowering-run-bank-a', 103.5, 107.5, 'flowered-bank', { seed: 167, faceDepth: 452, transitionLeft: 'boulder' }),
  terrainModule('flowering-run-bank-b', 107.5, 110.8, 'flowered-bank', { seed: 179, faceDepth: 474, cliffRight: true }),
  terrainModule('panorama-island-a', 111.9, 115.4, 'flowered-bank', { seed: 191, faceDepth: 465, cliffLeft: true, cliffRight: true }),
  terrainModule('panorama-island-b', 116.75, 120.1, 'stone-seam', { seed: 199, faceDepth: 485, cliffLeft: true, cliffRight: true }),
  terrainModule('goal-overlook', 121.75, 124, 'flowered-bank', {
    seed: 211,
    faceDepth: 470,
    cliffLeft: true,
    visualTo: 125.35,
    purpose: 'non-collision visual shoulder completes the stable goal overlook'
  })
]);

const landform = (id, type, roomId, x, width, extra = {}) => Object.freeze({
  id,
  type,
  roomId,
  x,
  width,
  ...extra
});

export const MEADOW_WAKE_LANDFORM_FEATURES = Object.freeze([
  landform('trailhead-embankment', 'meadow-terrace', 'trailhead-camp', 6.4, 6.8, { drop: 1.55, linkedPlatforms: Object.freeze(['camp-awning-deck']) }),
  landform('elder-root-arch-bank', 'root-arch', 'elder-root-walk', 15.2, 7.4, { drop: 2.15, linkedPlatforms: Object.freeze(['opening-stump-step', 'fallen-log-launch']) }),
  landform('mason-boulder-shelf', 'rock-shelf', 'mason-shelf', 26.2, 7.2, { drop: 1.85, linkedPlatforms: Object.freeze(['mason-shelf-overlook']) }),
  landform('shellback-quarry-buttress', 'ruin-buttress', 'shellback-quarry', 35.1, 8.4, { drop: 2.3, linkedPlatforms: Object.freeze(['shellback-low-ledge', 'shellback-upper-route-a', 'shellback-upper-route-b']) }),
  landform('timberyard-retaining-wall', 'timber-retaining', 'timberyard-clearing', 47.1, 8, { drop: 2, linkedPlatforms: Object.freeze(['timber-stack-climb', 'camp-scaffold-deck', 'camp-clearing-lift']) }),
  landform('stump-creek-rootwall', 'root-fan-bank', 'stump-creek-hollow', 56.4, 7.8, { drop: 2.45, linkedPlatforms: Object.freeze(['bramble-clue-step', 'concealed-creek-shelf']) }),
  landform('lantern-bridge-abutments', 'bridge-abutment', 'lantern-bridge', 67, 7, { drop: 2.05, linkedPlatforms: Object.freeze(['rope-bridge-main', 'checkpoint-rest-deck']) }),
  landform('mill-race-stonework', 'mill-race', 'mill-meadow', 79.3, 7.2, { drop: 1.75, linkedPlatforms: Object.freeze(['waterwheel-paddle-lift', 'mill-race-log']) }),
  landform('root-terrace-stair', 'root-terrace', 'root-terrace', 88.3, 8, { drop: 2.2, linkedPlatforms: Object.freeze(['root-terrace-lift', 'root-terrace-ruin-shelf']) }),
  landform('lookout-ruin-foundation', 'ruin-buttress', 'lookout-ruins', 97.6, 8.2, { drop: 2.3, linkedPlatforms: Object.freeze(['rotating-ruin-step', 'compact-falling-step', 'gate-low-step']) }),
  landform('flowering-boulder-bench', 'boulder-bench', 'flowering-run', 106.9, 6.8, { drop: 1.65, linkedPlatforms: Object.freeze(['final-hill-stump']) }),
  landform('goal-overlook-cliff', 'overlook-cliff', 'three-gap-vista', 122.5, 3, { drop: 2.4, linkedPlatforms: Object.freeze(['final-gap-three-log']) })
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
  Object.freeze({ id: 'camp-awning-deck', x: 4.85, y: 6.62, width: 2.2, height: 0.28, oneWay: true, visual: 'camp-deck', supportStyle: 'timber', supportDrop: 0.82, roomId: 'trailhead-camp', purpose: 'optional lodge-awning overlook' }),
  Object.freeze({ id: 'opening-stump-step', x: 11.9, y: 6.56, width: 1.08, height: 0.4, oneWay: true, visual: 'stump', roomId: 'elder-root-walk', purpose: 'root-arch entry step and duck-height landmark' }),
  Object.freeze({
    id: 'fallen-log-launch',
    x: 17.95,
    y: 6.38,
    width: 3,
    height: 0.3,
    oneWay: true,
    visual: 'fallen-log',
    roomId: 'elder-root-walk',
    purpose: 'first obvious environmental jump and Compass Coin launch',
    motion: Object.freeze({ kind: 'seesaw', maximumAngle: 0.1, response: 2.8 })
  }),
  Object.freeze({ id: 'fallen-log-landing', x: 21.85, y: 6.58, width: 1.65, height: 0.3, oneWay: true, visual: 'turf-ledge', supportStyle: 'boulder', supportDrop: 0.78, roomId: 'mason-shelf', purpose: 'boulder-supported landing and upper reward' }),
  Object.freeze({ id: 'shellback-low-ledge', x: 30.7, y: 5.78, width: 2.15, height: 0.32, oneWay: true, visual: 'ruin-ledge', supportStyle: 'ruin', supportDrop: 1.2, roomId: 'shellback-quarry', purpose: 'quarry-floor shell tutorial staging' }),
  Object.freeze({ id: 'shellback-upper-route-a', x: 34.15, y: 4.95, width: 1.75, height: 0.32, oneWay: true, visual: 'ruin-ledge', supportStyle: 'ruin', supportDrop: 1.88, roomId: 'shellback-quarry', purpose: 'shell-opened quarry route step one' }),
  Object.freeze({ id: 'shellback-upper-route-b', x: 37.05, y: 4.28, width: 1.5, height: 0.32, oneWay: true, visual: 'ruin-ledge', supportStyle: 'ruin', supportDrop: 2.35, roomId: 'shellback-quarry', purpose: 'Compass Coin ruin-tower landing' }),
  Object.freeze({ id: 'mason-shelf-overlook', x: 26.55, y: 5.45, width: 1.78, height: 0.34, oneWay: true, visual: 'creek-stone', supportStyle: 'boulder', supportDrop: 1.45, roomId: 'mason-shelf', purpose: 'optional rock-shelf reward above the grounded first encounter' }),
  Object.freeze({ id: 'timber-stack-climb', x: 44.75, y: 5.72, width: 1.85, height: 0.34, oneWay: true, visual: 'timber-stack', roomId: 'timberyard-clearing', purpose: 'stacked timber becomes the first camp-made climb' }),
  Object.freeze({ id: 'camp-scaffold-deck', x: 48.25, y: 4.92, width: 2.6, height: 0.3, oneWay: true, visual: 'camp-deck', supportStyle: 'timber', supportDrop: 1.85, roomId: 'timberyard-clearing', purpose: 'scaffold architecture carries the optional upper route' }),
  Object.freeze({
    id: 'camp-clearing-lift',
    x: 51.2,
    y: 6.08,
    width: 1.35,
    height: 0.3,
    oneWay: true,
    visual: 'timber-lift',
    roomId: 'timberyard-clearing',
    purpose: 'forgiving hoist lift from timber stack to scaffold',
    motion: Object.freeze({ kind: 'vertical', range: 1.35, speed: 0.66, phase: 0.4 })
  }),
  Object.freeze({ id: 'clearing-high-ledge', x: 53.45, y: 5.28, width: 1.7, height: 0.3, oneWay: true, visual: 'turf-ledge', supportStyle: 'root', supportDrop: 1.35, roomId: 'stump-creek-hollow', purpose: 'hoist reward and root-bank return to ground' }),
  Object.freeze({ id: 'bramble-clue-step', x: 58.45, y: 6.48, width: 1.05, height: 0.28, oneWay: true, visual: 'stump', roomId: 'stump-creek-hollow', purpose: 'giant-stump toe points toward the secret creek clue' }),
  Object.freeze({ id: 'concealed-creek-shelf', x: 61.75, y: 8.22, width: 2.25, height: 0.28, oneWay: true, visual: 'creek-stone', roomId: 'stump-creek-hollow', secret: true, purpose: 'hidden Compass Coin recovery shelf under the eroded bank' }),
  Object.freeze({
    id: 'concealed-creek-lift',
    x: 63.35,
    y: 7.45,
    width: 0.95,
    height: 0.26,
    oneWay: true,
    visual: 'timber-lift',
    roomId: 'lantern-bridge',
    secret: true,
    purpose: 'return path from concealed creek shelf',
    motion: Object.freeze({ kind: 'vertical', range: 0.75, speed: 0.58, phase: 0.7 })
  }),
  Object.freeze({ id: 'rope-bridge-main', x: 67, y: 7.18, width: 4.2, height: 0.26, oneWay: true, visual: 'rope-bridge', roomId: 'lantern-bridge', purpose: 'single clearly framed required ravine crossing between stone abutments' }),
  Object.freeze({ id: 'checkpoint-rest-deck', x: 70.55, y: 6.42, width: 1.65, height: 0.3, oneWay: true, visual: 'camp-deck', supportStyle: 'timber', supportDrop: 0.92, roomId: 'lantern-bridge', purpose: 'checkpoint shelter floor and post-gap recovery' }),
  Object.freeze({
    id: 'waterwheel-paddle-lift',
    x: 79.35,
    y: 6.56,
    width: 1.5,
    height: 0.3,
    oneWay: true,
    visual: 'waterwheel-paddle',
    roomId: 'mill-meadow',
    purpose: 'working waterwheel becomes an optional moving reward route',
    motion: Object.freeze({ kind: 'orbit', rangeX: 0.58, rangeY: 0.82, speed: 0.42, phase: 0.16 })
  }),
  Object.freeze({ id: 'mill-race-log', x: 82.15, y: 6.38, width: 2.25, height: 0.3, oneWay: true, visual: 'fallen-log', roomId: 'mill-meadow', purpose: 'fallen mill log returns the paddle route to connected ground' }),
  Object.freeze({
    id: 'root-terrace-lift',
    x: 87.1,
    y: 6.2,
    width: 1.3,
    height: 0.28,
    oneWay: true,
    visual: 'timber-lift',
    roomId: 'root-terrace',
    purpose: 'contained lift beside the giant root stair',
    motion: Object.freeze({ kind: 'vertical', range: 1.45, speed: 0.72, phase: 0.05 })
  }),
  Object.freeze({ id: 'root-terrace-ruin-shelf', x: 91.05, y: 4.95, width: 1.65, height: 0.3, oneWay: true, visual: 'root-ledge', supportStyle: 'root', supportDrop: 1.65, roomId: 'root-terrace', purpose: 'root-supported lift landing and upper reward route' }),
  Object.freeze({
    id: 'rotating-ruin-step',
    x: 95,
    y: 5.22,
    width: 1.2,
    height: 0.3,
    oneWay: true,
    visual: 'ruin-ledge',
    roomId: 'lookout-ruins',
    purpose: 'single readable rotating transfer',
    motion: Object.freeze({ kind: 'orbit', rangeX: 0.85, rangeY: 0.62, speed: 0.56, phase: 0.2 })
  }),
  Object.freeze({
    id: 'compact-falling-step',
    x: 98,
    y: 5.92,
    width: 1.15,
    height: 0.28,
    oneWay: true,
    visual: 'ruin-ledge',
    roomId: 'lookout-ruins',
    purpose: 'telegraphed return from upper ruins',
    motion: Object.freeze({ kind: 'falling', triggerDelay: 0.62, resetDelay: 3, gravity: 8.2 })
  }),
  Object.freeze({ id: 'gate-low-step', x: 100.25, y: 5.88, width: 1.25, height: 0.3, oneWay: true, visual: 'ruin-ledge', supportStyle: 'ruin', supportDrop: 1.02, roomId: 'lookout-ruins', purpose: 'reinforced lookout-gate approach' }),
  Object.freeze({ id: 'final-hill-stump', x: 107.4, y: 5.72, width: 1.05, height: 0.4, oneWay: true, visual: 'stump', roomId: 'flowering-run', purpose: 'flowering hill landmark and final reward step' }),
  Object.freeze({
    id: 'final-falling-step',
    x: 111.35,
    y: 6.48,
    width: 0.9,
    height: 0.26,
    oneWay: true,
    visual: 'timber-slat',
    roomId: 'three-gap-vista',
    purpose: 'first forgiving panorama gap recovery',
    motion: Object.freeze({ kind: 'falling', triggerDelay: 0.42, resetDelay: 2.6, gravity: 9.2 })
  }),
  Object.freeze({ id: 'final-gap-two-ledge', x: 116.05, y: 6.55, width: 0.76, height: 0.26, oneWay: true, visual: 'creek-stone', roomId: 'three-gap-vista', purpose: 'second panorama gap visual landing cue' }),
  Object.freeze({
    id: 'final-gap-three-log',
    x: 120.9,
    y: 6.58,
    width: 1.25,
    height: 0.28,
    oneWay: true,
    visual: 'fallen-log',
    roomId: 'three-gap-vista',
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
  block('opening-single-breakable', 'standard-breakable', 5.85, 1.22, 'opening-staggered-lesson', { phraseStep: 1 }),
  block('opening-raised-coin', 'coin', 7.55, 1.72, 'opening-staggered-lesson', { reward: 5, phraseStep: 2 }),
  block('opening-pair-a', 'standard-breakable', 9.25, 1.24, 'opening-staggered-lesson', { phraseStep: 3 }),
  block('opening-pair-b', 'standard-breakable', 10, 1.24, 'opening-staggered-lesson', { phraseStep: 4 }),
  block('power-before-first-encounter', 'power-up', 24.75, 1.55, 'first-encounter-support', { reward: 'grow', phraseStep: 1 }),
  block('shell-ruin-a', 'standard-breakable', 30.8, 1.34, 'shellback-ruin-line', { phraseStep: 1 }),
  block('shell-ruin-coin', 'coin', 31.55, 1.72, 'shellback-ruin-line', { reward: 5, phraseStep: 2 }),
  block('shell-ruin-b', 'standard-breakable', 32.3, 1.34, 'shellback-ruin-line', { phraseStep: 3 }),
  block('hidden-ruin-lookout', 'coin', 35.55, 2.5, 'shellback-upper-reward', { reward: 10, hidden: true, phraseStep: 1 }),
  block('shell-column-a', 'standard-breakable', 38.3, 1.28, 'shell-opened-column', { phraseStep: 1 }),
  block('shell-column-b', 'standard-breakable', 39.05, 1.28, 'shell-opened-column', { phraseStep: 2 }),
  block('shell-column-c', 'standard-breakable', 39.8, 1.28, 'shell-opened-column', { phraseStep: 3 }),
  block('shell-column-cap', 'standard-breakable', 39.8, 2.03, 'shell-opened-column', { phraseStep: 4 }),
  block('timberyard-breakable', 'standard-breakable', 46.1, 1.38, 'timberyard-step-phrase', { phraseStep: 1 }),
  block('timberyard-raised-coin', 'coin', 47.1, 1.82, 'timberyard-step-phrase', { reward: 5, phraseStep: 2 }),
  block('timberyard-return-breakable', 'standard-breakable', 48.1, 1.38, 'timberyard-step-phrase', { phraseStep: 3 }),
  block('power-before-ravine', 'power-up', 58.15, 1.62, 'ravine-support', { reward: 'grow', phraseStep: 1 }),
  block('checkpoint-rest-breakable', 'standard-breakable', 71.25, 1.36, 'checkpoint-recovery', { phraseStep: 1 }),
  block('checkpoint-rest-coin', 'coin', 72, 1.72, 'checkpoint-recovery', { reward: 5, phraseStep: 2 }),
  block('mill-ground-breakable', 'standard-breakable', 76.5, 1.34, 'watermill-paddle-phrase', { phraseStep: 1 }),
  block('mill-paddle-coin', 'coin', 77.35, 1.82, 'watermill-paddle-phrase', { reward: 5, phraseStep: 2 }),
  block('mill-ground-return', 'standard-breakable', 78.2, 1.34, 'watermill-paddle-phrase', { phraseStep: 3 }),
  block('mill-hidden-upper-coin', 'coin', 79.35, 2.48, 'watermill-paddle-phrase', { reward: 10, hidden: true, phraseStep: 4 }),
  block('root-terrace-breakable', 'standard-breakable', 86.35, 1.42, 'root-terrace-lift-phrase', { phraseStep: 1 }),
  block('root-terrace-coin', 'coin', 87.1, 1.86, 'root-terrace-lift-phrase', { reward: 5, phraseStep: 2 }),
  block('root-terrace-upper-coin', 'coin', 91.05, 2.18, 'root-terrace-lift-phrase', { reward: 5, phraseStep: 3 }),
  block('hargold-gate-a', 'hargold-only', 99.7, 1.28, 'hargold-gate', { phraseStep: 1 }),
  block('hargold-gate-b', 'hargold-only', 100.53, 1.28, 'hargold-gate', { phraseStep: 2 }),
  block('hargold-gate-c', 'hargold-only', 101.36, 1.28, 'hargold-gate', { phraseStep: 3 }),
  block('hargold-gate-cap', 'hargold-only', 101.36, 2.11, 'hargold-gate', { phraseStep: 4 }),
  block('power-final-recovery', 'power-up', 103.85, 1.64, 'final-recovery', { reward: 'grow', phraseStep: 1 }),
  block('flower-hill-breakable', 'standard-breakable', 106.25, 1.34, 'flower-hill-reward-phrase', { phraseStep: 1 }),
  block('flower-hill-coin', 'coin', 107.1, 1.78, 'flower-hill-reward-phrase', { reward: 5, phraseStep: 2 }),
  block('flower-hill-return', 'standard-breakable', 107.95, 1.34, 'flower-hill-reward-phrase', { phraseStep: 3 }),
  block('hidden-final-cache', 'coin', 109.3, 2.2, 'final-hidden-reward', { reward: 10, hidden: true, phraseStep: 1 }),
  block('goal-breakable', 'standard-breakable', 123, 1.28, 'goal-punctuation', { phraseStep: 1 })
]);

export const MEADOW_WAKE_BLOCK_PHRASES = Object.freeze([
  Object.freeze({ id: 'opening-staggered-lesson', roomId: 'trailhead-camp', intent: 'teach hit height and optional follow-up', pattern: Object.freeze(['single-breakable', 'raised-coin', 'breakable-pair']) }),
  Object.freeze({ id: 'first-encounter-support', roomId: 'mason-shelf', intent: 'visible recovery before the first enemy observation space', pattern: Object.freeze(['power-up-support']) }),
  Object.freeze({ id: 'shellback-ruin-line', roomId: 'shellback-quarry', intent: 'show that a rolling shell can continue through a readable line', pattern: Object.freeze(['breakable', 'raised-coin', 'breakable']) }),
  Object.freeze({ id: 'shellback-upper-reward', roomId: 'shellback-quarry', intent: 'reward committing to the opened upper quarry route', pattern: Object.freeze(['hidden-high-coin']) }),
  Object.freeze({ id: 'shell-opened-column', roomId: 'shellback-quarry', intent: 'turn shell preservation into the Compass Coin route gate', pattern: Object.freeze(['three-wide-base', 'single-cap']) }),
  Object.freeze({ id: 'timberyard-step-phrase', roomId: 'timberyard-clearing', intent: 'teach a low-high-low rhythm before the camp lift', pattern: Object.freeze(['breakable', 'raised-coin', 'breakable']) }),
  Object.freeze({ id: 'ravine-support', roomId: 'stump-creek-hollow', intent: 'place recovery before the first authored true-gap cluster', pattern: Object.freeze(['power-up-support']) }),
  Object.freeze({ id: 'checkpoint-recovery', roomId: 'lantern-bridge', intent: 'give one safe hit and reward after the rope crossing', pattern: Object.freeze(['breakable', 'raised-coin']) }),
  Object.freeze({ id: 'watermill-paddle-phrase', roomId: 'mill-meadow', intent: 'signal ground route, moving paddle, and hidden upper reward', pattern: Object.freeze(['breakable', 'raised-coin', 'breakable', 'hidden-paddle-reward']) }),
  Object.freeze({ id: 'root-terrace-lift-phrase', roomId: 'root-terrace', intent: 'lead from ground to lift and resolve on the upper root shelf', pattern: Object.freeze(['breakable', 'lift-coin', 'upper-coin']) }),
  Object.freeze({ id: 'hargold-gate', roomId: 'lookout-ruins', intent: 'clearly group the authored Hargold-only interaction', pattern: Object.freeze(['reinforced-three-wide-base', 'reinforced-cap']) }),
  Object.freeze({ id: 'final-recovery', roomId: 'flowering-run', intent: 'support the player before the signature gap panorama', pattern: Object.freeze(['power-up-support']) }),
  Object.freeze({ id: 'flower-hill-reward-phrase', roomId: 'flowering-run', intent: 'repeat the opening low-high-low phrase at running speed', pattern: Object.freeze(['breakable', 'raised-coin', 'breakable']) }),
  Object.freeze({ id: 'final-hidden-reward', roomId: 'flowering-run', intent: 'reward reading the interrupted hill coin line', pattern: Object.freeze(['hidden-high-coin']) }),
  Object.freeze({ id: 'goal-punctuation', roomId: 'three-gap-vista', intent: 'single final breakable marks the stable goal island', pattern: Object.freeze(['single-breakable']) })
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
  Object.freeze({ id: '1-1-C1', x: 17.95, y: 4.02, solution: 'fallen-log-upper-arc' }),
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

export function meadowWakeRoomCoverage() {
  return MEADOW_WAKE_GAMEPLAY_ROOMS.reduce(
    (total, room) => total + room.range[1] - room.range[0],
    0
  ) / MEADOW_WAKE_WORLD_END;
}

export function meadowWakeBlockPhraseCoverage() {
  const phraseIds = new Set(MEADOW_WAKE_BLOCK_PHRASES.map(phrase => phrase.id));
  return MEADOW_WAKE_BLOCK_DEFINITIONS.filter(blockDefinition =>
    phraseIds.has(blockDefinition.formation)
  ).length / MEADOW_WAKE_BLOCK_DEFINITIONS.length;
}
