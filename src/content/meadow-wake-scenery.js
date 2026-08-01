/*
 * Authored visual dressing for World 1-1, Meadow Wake.
 *
 * These placements are part of this course's composition. They are not a
 * scatter generator and must not be reused as a universal world template.
 */

import {
  MEADOW_WAKE_BLOCK_DEFINITIONS,
  MEADOW_WAKE_GAMEPLAY_ROOMS,
  MEADOW_WAKE_PLATFORMS
} from './meadow-wake-course.js?v=terrain-correction-1';

const prop = (id, type, x, scale = 1, extra = {}) => Object.freeze({
  id,
  type,
  x,
  scale,
  layer: 'playfield-back',
  assetStatus: 'authored-original-runtime-mesh',
  temporaryProxy: false,
  anchorRequired: true,
  ...extra
});

export const MEADOW_WAKE_SCENERY_BEATS = Object.freeze([
  Object.freeze({
    id: 'meadow-trail-camp',
    range: Object.freeze([0, 15.9]),
    palette: 'warm-camp-clearing',
    props: Object.freeze([
      prop('opening-lodge', 'camp-lodge', -0.15, 0.98, { depth: -34, heroLandmark: true }),
      prop('opening-wayfinder', 'trail-sign', 0.35, 0.68, { facing: 1, depth: 34 }),
      prop('opening-lantern', 'lantern-post', 3.8, 0.78, { depth: 28 }),
      prop('opening-crates', 'crate-stack', 5.15, 0.62, { depth: 18 }),
      prop('opening-woodpile', 'woodpile', 10.05, 0.72, { depth: -12 }),
      prop('opening-flower-bank', 'flower-bank', 11.35, 1.05, { depth: 38 }),
      prop('opening-trail-fence', 'trail-fence', 12.75, 0.88, { depth: -20 }),
      prop('opening-oak', 'canopy-tree', 14.2, 1.12, { depth: -96 })
    ])
  }),
  Object.freeze({
    id: 'fallen-log-hollow',
    range: Object.freeze([15.9, 24]),
    palette: 'root-hollow',
    props: Object.freeze([
      prop('elder-root-arch', 'root-arch-tree', 15.15, 1.24, { depth: 18, heroLandmark: true }),
      prop('log-hollow-root-fan', 'root-fan', 16.08, 1.1, { depth: -4 }),
      prop('log-hollow-ferns', 'fern-bank', 18.65, 1.08, { depth: 42 }),
      prop('log-hollow-fence', 'trail-fence', 20.05, 0.72, { depth: -28 }),
      prop('log-hollow-mushrooms', 'mushroom-stump', 21.25, 0.86, { depth: 24 }),
      prop('log-hollow-birch', 'canopy-tree', 23.55, 0.94, { depth: -108 })
    ])
  }),
  Object.freeze({
    id: 'shellback-ruins',
    range: Object.freeze([24, 40]),
    palette: 'mossy-fieldstone',
    props: Object.freeze([
      prop('mason-shelf-pine', 'cliff-pine', 26.2, 1.18, { depth: -28, heroLandmark: true }),
      prop('shellback-low-wall', 'ruin-wall', 25.0, 0.92, { depth: -18 }),
      prop('shellback-ruin-tower', 'ruin-tower', 34.2, 1.42, { depth: -12, heroLandmark: true }),
      prop('shellback-lantern-hook', 'lantern-post', 33.0, 0.82, { depth: 30 }),
      prop('shellback-broken-arch', 'broken-arch', 36.8, 0.96, { depth: -20 }),
      prop('shellback-ruin-fence', 'trail-fence', 38.25, 0.8, { depth: -26 }),
      prop('shellback-flower-bank', 'flower-bank', 39.15, 0.92, { depth: 38 })
    ])
  }),
  Object.freeze({
    id: 'camp-clearing',
    range: Object.freeze([40, 65]),
    palette: 'working-camp',
    props: Object.freeze([
      prop('clearing-supply-tent', 'camp-tent', 41.55, 0.94, { depth: -72 }),
      prop('clearing-timber-frame', 'camp-scaffold', 48.2, 1.32, { depth: 6, heroLandmark: true }),
      prop('clearing-hoist', 'timber-hoist', 48.55, 1.0, { depth: -18 }),
      prop('clearing-barrels', 'barrel-stack', 50.35, 0.82, { depth: 22 }),
      prop('clearing-mushroom-stump', 'mushroom-stump', 52.1, 0.95, { depth: 30 }),
      prop('clearing-trail-fence', 'trail-fence', 54.95, 0.92, { depth: -24 }),
      prop('clearing-ruin-arch', 'broken-arch', 57.35, 1.0, { depth: -34 }),
      prop('creek-giant-stump', 'giant-root-stump', 56.2, 1.28, { depth: 14, heroLandmark: true }),
      prop('clearing-bramble-clue', 'bramble-gate', 59.65, 0.92, { depth: 24 }),
      prop('hidden-creek-reeds', 'creek-reeds', 62.05, 1.08, { depth: 44, lowRoute: true }),
      prop('clearing-oak', 'canopy-tree', 64.2, 1.12, { depth: -118 })
    ])
  }),
  Object.freeze({
    id: 'rope-bridge-checkpoint',
    range: Object.freeze([65, 72]),
    palette: 'ravine-overlook',
    props: Object.freeze([
      prop('bridge-west-anchor', 'bridge-anchor', 64.9, 1.0, { depth: 12 }),
      prop('bridge-signal-frame', 'bridge-signal-frame', 67, 1.16, { depth: -16, heroLandmark: true }),
      prop('bridge-east-anchor', 'bridge-anchor', 69.15, 1.0, { depth: 12, facing: -1 }),
      prop('checkpoint-shelter', 'checkpoint-shelter', 70.15, 1.0, { depth: -42 }),
      prop('checkpoint-lantern', 'lantern-post', 71.65, 0.9, { depth: 30 })
    ])
  }),
  Object.freeze({
    id: 'creek-and-ruins',
    range: Object.freeze([72, 103]),
    palette: 'water-and-ruins',
    props: Object.freeze([
      prop('creek-cascade-a', 'creek-cascade', 73.15, 0.92, { depth: -76 }),
      prop('creek-route-ferns', 'fern-bank', 75.3, 1.05, { depth: 42 }),
      prop('creek-trail-fence', 'trail-fence', 76.35, 0.8, { depth: -24 }),
      prop('creek-watermill', 'watermill', 79.45, 1.22, { depth: -4, heroLandmark: true }),
      prop('creek-reeds-a', 'creek-reeds', 82.45, 1.0, { depth: 40, lowRoute: true }),
      prop('root-terrace-oak', 'canopy-tree', 88.2, 1.32, { depth: -48, heroLandmark: true, facing: -1 }),
      prop('upper-ruin-tower', 'ruin-tower', 87.75, 1.12, { depth: -30 }),
      prop('upper-ruin-wall', 'ruin-wall', 90.4, 1.0, { depth: -20 }),
      prop('hargold-gate-frame', 'reinforced-gate', 94.7, 1.0, { depth: -24 }),
      prop('watch-deck-tower', 'camp-watchtower', 97.45, 1.34, { depth: -12, heroLandmark: true }),
      prop('watch-deck-crates', 'crate-stack', 99.15, 0.86, { depth: 22 }),
      prop('ruin-descent-cascade', 'creek-cascade', 101.9, 0.86, { depth: -78 })
    ])
  }),
  Object.freeze({
    id: 'three-gap-panorama',
    range: Object.freeze([103, 124]),
    palette: 'golden-goal-meadow',
    props: Object.freeze([
      prop('panorama-flower-bank-a', 'flower-bank', 104.4, 1.08, { depth: 40 }),
      prop('panorama-stump', 'mushroom-stump', 106.85, 1.05, { depth: 22 }),
      prop('panorama-vista-oak', 'canopy-tree', 108.6, 1.34, { depth: -54, heroLandmark: true }),
      prop('panorama-ferns', 'fern-bank', 113.2, 0.96, { depth: 42 }),
      prop('panorama-lantern', 'lantern-post', 117.25, 0.9, { depth: 28 }),
      prop('panorama-trail-fence', 'trail-fence', 118.1, 0.84, { depth: -24 }),
      prop('goal-wayfinder', 'trail-sign', 121.05, 0.95, { facing: -1, depth: 28 }),
      prop('goal-stone-gate', 'goal-gate', 122.55, 1.28, { depth: -8, heroLandmark: true })
    ])
  })
]);

export const MEADOW_WAKE_SCENERY_PROPS = Object.freeze(
  MEADOW_WAKE_SCENERY_BEATS.flatMap(beat => beat.props)
);

export const MEADOW_WAKE_GAMEPLAY_LANDMARKS = Object.freeze([
  Object.freeze({ roomId: 'trailhead-camp', propId: 'opening-lodge', silhouette: 'raised canvas lodge', traversal: 'camp awning is an optional overlook', linkedPlatformIds: Object.freeze(['camp-awning-deck']) }),
  Object.freeze({ roomId: 'elder-root-walk', propId: 'elder-root-arch', silhouette: 'walk-under elder root arch', traversal: 'root toe and fallen log form the jump lesson', linkedPlatformIds: Object.freeze(['opening-stump-step', 'fallen-log-launch']) }),
  Object.freeze({ roomId: 'mason-shelf', propId: 'mason-shelf-pine', silhouette: 'pine rooted into a boulder shelf', traversal: 'rock overlook sits above the grounded first encounter', linkedPlatformIds: Object.freeze(['mason-shelf-overlook']) }),
  Object.freeze({ roomId: 'shellback-quarry', propId: 'shellback-ruin-tower', silhouette: 'broken fieldstone watch ruin', traversal: 'ruin ledges and block column define the shell route', linkedPlatformIds: Object.freeze(['shellback-low-ledge', 'shellback-upper-route-a', 'shellback-upper-route-b']) }),
  Object.freeze({ roomId: 'timberyard-clearing', propId: 'clearing-timber-frame', silhouette: 'tall timber hoist and scaffold', traversal: 'stack, deck, and lift are parts of the working camp', linkedPlatformIds: Object.freeze(['timber-stack-climb', 'camp-scaffold-deck', 'camp-clearing-lift']) }),
  Object.freeze({ roomId: 'stump-creek-hollow', propId: 'creek-giant-stump', silhouette: 'giant hollow stump over an eroded bank', traversal: 'root toe points toward the concealed creek shelf', linkedPlatformIds: Object.freeze(['bramble-clue-step', 'concealed-creek-shelf']) }),
  Object.freeze({ roomId: 'lantern-bridge', propId: 'bridge-signal-frame', silhouette: 'lantern signal frame over the ravine', traversal: 'rope bridge hangs from visible stone-and-timber anchors', linkedPlatformIds: Object.freeze(['rope-bridge-main', 'checkpoint-rest-deck']) }),
  Object.freeze({ roomId: 'mill-meadow', propId: 'creek-watermill', silhouette: 'working creek watermill', traversal: 'one moving paddle carries an optional reward route', linkedPlatformIds: Object.freeze(['waterwheel-paddle-lift', 'mill-race-log']) }),
  Object.freeze({ roomId: 'root-terrace', propId: 'root-terrace-oak', silhouette: 'terraced oak with exposed supporting roots', traversal: 'lift and root shelf form one contained upper route', linkedPlatformIds: Object.freeze(['root-terrace-lift', 'root-terrace-ruin-shelf']) }),
  Object.freeze({ roomId: 'lookout-ruins', propId: 'watch-deck-tower', silhouette: 'canvas-roof lookout tower', traversal: 'rotating and falling stones climb through the foundation', linkedPlatformIds: Object.freeze(['rotating-ruin-step', 'compact-falling-step', 'gate-low-step']) }),
  Object.freeze({ roomId: 'flowering-run', propId: 'panorama-vista-oak', silhouette: 'giant flowering hill oak', traversal: 'stump and low-high-low block phrase prepare the final run', linkedPlatformIds: Object.freeze(['final-hill-stump']) }),
  Object.freeze({ roomId: 'three-gap-vista', propId: 'goal-stone-gate', silhouette: 'mossed stone goal gate', traversal: 'the final log resolves onto its stable overlook', linkedPlatformIds: Object.freeze(['final-gap-three-log']) })
]);

/*
 * Blender-authored visible-terrain finish pieces. These placements bind the
 * original Verdant Vale kit to Meadow Wake's existing rooms; they never
 * supply collision or generate course layout.
 */
export const MEADOW_WAKE_ROOM_FINISH_PROFILES = Object.freeze([
  Object.freeze({ roomId: 'trailhead-camp', component: 'TerrainKit_CompactedEdge', x: 3.75, scale: 1.02, depth: 116, facing: 1 }),
  Object.freeze({ roomId: 'elder-root-walk', component: 'TerrainKit_RootBank', x: 16.95, scale: 1.18, depth: 118, facing: 1 }),
  Object.freeze({ roomId: 'mason-shelf', component: 'TerrainKit_CompactedEdge', x: 26.3, scale: 1.12, depth: 114, facing: -1 }),
  Object.freeze({ roomId: 'shellback-quarry', component: 'TerrainKit_RuinFoundation', x: 34.15, scale: 1.06, depth: 115, facing: 1 }),
  Object.freeze({ roomId: 'timberyard-clearing', component: 'TerrainKit_CampFoundation', x: 46.75, scale: 1.14, depth: 116, facing: 1 }),
  Object.freeze({ roomId: 'stump-creek-hollow', component: 'TerrainKit_RootBank', x: 56.9, scale: 1.22, depth: 117, facing: -1 }),
  Object.freeze({ roomId: 'lantern-bridge', component: 'TerrainKit_BridgeAbutment', x: 64.9, scale: 1.04, depth: 116, facing: 1 }),
  Object.freeze({ roomId: 'mill-meadow', component: 'TerrainKit_MillRace', x: 79.55, scale: 1.15, depth: 116, facing: 1 }),
  Object.freeze({ roomId: 'root-terrace', component: 'TerrainKit_RootBank', x: 88.25, scale: 1.28, depth: 117, facing: 1 }),
  Object.freeze({ roomId: 'lookout-ruins', component: 'TerrainKit_RuinFoundation', x: 97.2, scale: 1.16, depth: 116, facing: -1 }),
  Object.freeze({ roomId: 'flowering-run', component: 'TerrainKit_OverlookEdge', x: 106.7, scale: 1.16, depth: 117, facing: 1 }),
  Object.freeze({ roomId: 'three-gap-vista', component: 'TerrainKit_OverlookEdge', x: 122.1, scale: 1.22, depth: 117, facing: -1 })
]);

export const MEADOW_WAKE_MIDGROUND_LANDMARKS = Object.freeze([
  Object.freeze({ id: 'camp-smoke-column', type: 'smoke', x: 2.4, parallax: 0.38, scale: 1.05 }),
  Object.freeze({ id: 'log-hollow-tree-line', type: 'tree-line', x: 18.5, parallax: 0.42, scale: 1 }),
  Object.freeze({ id: 'shellback-ruin-silhouette', type: 'ruin-silhouette', x: 31, parallax: 0.48, scale: 1.02 }),
  Object.freeze({ id: 'clearing-tent-line', type: 'camp-line', x: 47, parallax: 0.44, scale: 1 }),
  Object.freeze({ id: 'bridge-waterfall', type: 'waterfall', x: 67, parallax: 0.5, scale: 1.1 }),
  Object.freeze({ id: 'creek-ruin-ridge', type: 'ruin-silhouette', x: 88, parallax: 0.46, scale: 1.12 }),
  Object.freeze({ id: 'goal-waterfall', type: 'waterfall', x: 113, parallax: 0.52, scale: 0.92 })
]);

function roomIdAtX(x) {
  return MEADOW_WAKE_GAMEPLAY_ROOMS.find(room => (
    x >= room.range[0] && x <= room.range[1]
  ))?.id ?? MEADOW_WAKE_GAMEPLAY_ROOMS.at(-1).id;
}

const landmarkByProp = new Map(
  MEADOW_WAKE_GAMEPLAY_LANDMARKS.map(landmark => [landmark.propId, landmark])
);

export const MEADOW_WAKE_TERRAIN_ANCHORS = Object.freeze([
  ...MEADOW_WAKE_BLOCK_DEFINITIONS.map(definition => Object.freeze({
    id: `terrain-anchor:block:${definition.id}`,
    kind: 'interactive-block',
    targetId: definition.id,
    roomId: roomIdAtX(definition.x),
    x: definition.x,
    binding: 'collision-ground-relative',
    remainsSeparateEntity: true,
    temporaryProxy: false
  })),
  ...MEADOW_WAKE_PLATFORMS.map(definition => Object.freeze({
    id: `terrain-anchor:platform:${definition.id}`,
    kind: definition.motion ? 'moving-mechanism' : 'authored-platform',
    targetId: definition.id,
    roomId: definition.roomId,
    x: definition.x,
    binding: definition.motion ? 'independent-rail' : 'collision-ground-relative',
    remainsSeparateEntity: true,
    temporaryProxy: false
  })),
  ...MEADOW_WAKE_SCENERY_PROPS.map(definition => {
    const landmark = landmarkByProp.get(definition.id);
    return Object.freeze({
      id: `terrain-anchor:${landmark ? 'landmark' : 'prop'}:${definition.id}`,
      kind: landmark ? 'room-landmark' : 'environment-prop',
      targetId: definition.id,
      roomId: landmark?.roomId ?? roomIdAtX(definition.x),
      x: definition.x,
      binding: 'visible-terrain-surface',
      remainsSeparateEntity: true,
      temporaryProxy: definition.temporaryProxy,
      linkedPlatformIds: landmark ? [...landmark.linkedPlatformIds] : []
    });
  })
]);

export function meadowWakeSceneryCoverage() {
  return MEADOW_WAKE_SCENERY_BEATS.map(beat => ({
    id: beat.id,
    range: beat.range,
    propCount: beat.props.length
  }));
}
