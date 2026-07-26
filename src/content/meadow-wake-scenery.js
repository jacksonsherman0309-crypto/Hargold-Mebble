/*
 * Authored visual dressing for World 1-1, Meadow Wake.
 *
 * These placements are part of this course's composition. They are not a
 * scatter generator and must not be reused as a universal world template.
 */

const prop = (id, type, x, scale = 1, extra = {}) => Object.freeze({
  id,
  type,
  x,
  scale,
  layer: 'playfield-back',
  ...extra
});

export const MEADOW_WAKE_SCENERY_BEATS = Object.freeze([
  Object.freeze({
    id: 'meadow-trail-camp',
    range: Object.freeze([0, 15.9]),
    palette: 'warm-camp-clearing',
    props: Object.freeze([
      prop('opening-lodge', 'camp-lodge', -0.15, 1.12, { depth: -32 }),
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
      prop('shellback-low-wall', 'ruin-wall', 25.0, 0.92, { depth: -18 }),
      prop('shellback-ruin-tower', 'ruin-tower', 30.7, 1.05, { depth: -24 }),
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
      prop('clearing-timber-frame', 'camp-scaffold', 44.55, 1.08, { depth: -12 }),
      prop('clearing-hoist', 'timber-hoist', 48.55, 1.0, { depth: -18 }),
      prop('clearing-barrels', 'barrel-stack', 50.35, 0.82, { depth: 22 }),
      prop('clearing-mushroom-stump', 'mushroom-stump', 52.1, 0.95, { depth: 30 }),
      prop('clearing-trail-fence', 'trail-fence', 54.95, 0.92, { depth: -24 }),
      prop('clearing-ruin-arch', 'broken-arch', 57.35, 1.0, { depth: -34 }),
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
      prop('creek-waterwheel', 'waterwheel', 79.45, 0.9, { depth: -36 }),
      prop('creek-reeds-a', 'creek-reeds', 82.45, 1.0, { depth: 40, lowRoute: true }),
      prop('upper-ruin-tower', 'ruin-tower', 87.75, 1.12, { depth: -30 }),
      prop('upper-ruin-wall', 'ruin-wall', 90.4, 1.0, { depth: -20 }),
      prop('hargold-gate-frame', 'reinforced-gate', 94.7, 1.0, { depth: -24 }),
      prop('watch-deck-tower', 'camp-watchtower', 97.45, 1.02, { depth: -38 }),
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
      prop('panorama-vista-oak', 'canopy-tree', 109.0, 1.02, { depth: -112 }),
      prop('panorama-ferns', 'fern-bank', 113.2, 0.96, { depth: 42 }),
      prop('panorama-lantern', 'lantern-post', 117.25, 0.9, { depth: 28 }),
      prop('panorama-trail-fence', 'trail-fence', 118.1, 0.84, { depth: -24 }),
      prop('goal-wayfinder', 'trail-sign', 121.05, 0.95, { facing: -1, depth: 28 }),
      prop('goal-stone-gate', 'goal-gate', 122.55, 1.08, { depth: -30 })
    ])
  })
]);

export const MEADOW_WAKE_SCENERY_PROPS = Object.freeze(
  MEADOW_WAKE_SCENERY_BEATS.flatMap(beat => beat.props)
);

export const MEADOW_WAKE_MIDGROUND_LANDMARKS = Object.freeze([
  Object.freeze({ id: 'camp-smoke-column', type: 'smoke', x: 2.4, parallax: 0.38, scale: 1.05 }),
  Object.freeze({ id: 'log-hollow-tree-line', type: 'tree-line', x: 18.5, parallax: 0.42, scale: 1 }),
  Object.freeze({ id: 'shellback-ruin-silhouette', type: 'ruin-silhouette', x: 31, parallax: 0.48, scale: 1.02 }),
  Object.freeze({ id: 'clearing-tent-line', type: 'camp-line', x: 47, parallax: 0.44, scale: 1 }),
  Object.freeze({ id: 'bridge-waterfall', type: 'waterfall', x: 67, parallax: 0.5, scale: 1.1 }),
  Object.freeze({ id: 'creek-ruin-ridge', type: 'ruin-silhouette', x: 88, parallax: 0.46, scale: 1.12 }),
  Object.freeze({ id: 'goal-waterfall', type: 'waterfall', x: 113, parallax: 0.52, scale: 0.92 })
]);

export function meadowWakeSceneryCoverage() {
  return MEADOW_WAKE_SCENERY_BEATS.map(beat => ({
    id: beat.id,
    range: beat.range,
    propCount: beat.props.length
  }));
}
