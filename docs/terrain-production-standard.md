# Verdant Vale terrain production standard

Status: current production contract for World 1-1 terrain and reusable World 1
terrain craft. It does not authorize generated courses or replacement layouts.

## Quality reference and originality boundary

The minimum visual-quality reference is stored once at
`assets/references/terrain/meadow-wake-terrain-quality-reference.jpeg`.

It is a benchmark for:

- thick, readable 3D playable terrain;
- bright dimensional materials with visible grass, earth, roots, and stone;
- foreground, midground, and far-background depth;
- warm daylight, atmospheric separation, and side-view composition;
- integrated terrain storytelling and platforming readability.

It is not a source asset. Geometry, UVs, textures, props, arrangements, symbols,
blocks, collectibles, layouts, names, code, and audio must remain original to
Hargold & Mebble.

## Runtime separation

Meadow Wake has three independent terrain responsibilities:

1. `MEADOW_WAKE_TERRAIN_POINTS`, pits, semisolids, rails, and block actors are
   deterministic gameplay data.
2. `verdant-vale-terrain-kit.js` builds visible relief bodies and turf crowns
   that do not participate in collision.
3. `verdant_vale_terrain_kit.glb` supplies original Blender-authored room
   finishes bound to explicit room profiles in `meadow-wake-scenery.js`.

Fatal pit volumes remain separate from visible cliff art. Interactive blocks,
moving platforms, falling platforms, lifts, seesaws, coins, Compass Coins,
checkpoint objects, and the goal remain independent gameplay actors attached
through authored anchors. Visual meshes cannot silently change collision.

## Meadow Wake room finish matrix

| Room | Terrain language | Blender finish family | Traversal landmark |
|---|---|---|---|
| trailhead-camp | compacted trail embankment | compacted edge | raised canvas lodge |
| elder-root-walk | root-bound hollow | root bank | elder root arch |
| mason-shelf | boulder shelf | compacted edge | shelf pine |
| shellback-quarry | fieldstone quarry | ruin foundation | broken watch ruin |
| timberyard-clearing | retained camp terrace | camp foundation | timber scaffold |
| stump-creek-hollow | eroded root bank | root bank | hollow stump |
| lantern-bridge | ravine abutments | bridge abutment | signal frame |
| mill-meadow | damp mill-race bank | mill race | working watermill |
| root-terrace | stepped root shelf | root bank | terraced oak |
| lookout-ruins | broken masonry shelf | ruin foundation | lookout tower |
| flowering-run | flowered boulder bench | overlook edge | flowering oak |
| three-gap-vista | fractured overlook islands | overlook edge | mossed goal gate |

These are explicit course placements. Shared mesh families reduce memory and
draw overhead; they never generate the room sequence.

Meadow Wake now uses an 80/15/5 ground-dominant composition target: 80% of
ordinary progression stays on the readable connected landform, 15% uses short
optional elevated routes, and 5% is reserved for dedicated platform
sequences. The runtime keeps the named platforms and mechanisms, but visually
roots every static structure into its room's earth, stone, timber, or exposed
root language. Worn trail bands are authored per room and stop at pits,
secrets, and landmark foundations instead of forming a generated overlay.

## Material classes

The required material classes are grass, exposed dirt, compact loam, damp soil,
embedded stone, ruin stone, moss, and worn path. Terrain uses continuous
world-space UV progression across room modules, modeled relief, vertex color
variation, and a separate turf overhang to avoid a stretched slab appearance.
The active original albedo is
`assets/textures/world-1/meadow-wake/meadow-soil-stone-albedo-v3.png`; it was
generated specifically for this project as a neutral, tileable stylized
material, then combined with runtime lighting and modeled relief rather than
used as a flat playable card.

Lighting must preserve readable values. Soil may be rich and shaded, but
required landing edges, route silhouettes, pit lips, blocks, and mechanisms
cannot disappear into crushed blacks.

## Debug and validation

The `debugTerrain` query accepts:

- `visible` — production visible terrain;
- `collision` — simplified deterministic collision and fatal pit edges;
- `overlay` — production terrain with collision and anchors;
- `anchors` — production terrain with only anchor markers.

The runtime publishes `window.__HM_TERRAIN_METRICS__`. Full-scene figures report
frame timing, WebGL draw calls, triangles, materials, resident geometries,
textures, and estimated uncompressed visible texture bytes. Terrain-specific
figures are explicitly resident-course counts rather than camera-visible
counts. Browser measurements are comparative development evidence, not
target-device certification.

Small terrain dressing is instanced in room-sized batches. Terrain modules,
room dressing, landmark props, and Blender finish pieces use the authored room
ranges for camera culling with a narrow anticipation margin. Wind response is
shader-driven on shared foliage materials, and existing water, wheel, mist,
and cascade motion remains lightweight and collision-independent.

## Current implementation status

All twelve rooms use the independent relief system and an explicit
Blender-authored finish profile. The playable course, mechanics, routes, block
phrases, collectibles, checkpoint, and goal are preserved.

The terrain architecture and all-room first finish are implemented. Final
target-device lighting approval, mesh LODs, compressed textures, final UV
review, and replacement of remaining scenery runtime proxies are still
production work. The course must not be labeled terrain-complete until those
items and visual review at the start, middle, and goal are approved.
