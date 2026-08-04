# Verdant Vale terrain production standard

Status: current production contract for World 1-1 terrain and reusable World 1
terrain craft. It does not authorize generated courses or replacement layouts.

## Quality reference and originality boundary

The canonical minimum visual-quality reference is the exact user-supplied
finished-product composition preserved at
`assets/references/terrain/meadow-wake-production-quality-target.jpeg`. Treat
it as a locked visual benchmark for Meadow Wake presentation, not as a source
texture or an asset that may be copied into the rendered scene.

`assets/references/terrain/meadow-wake-terrain-quality-reference.jpeg` remains
only as a legacy external dependency of the frozen pre-gate Blender handoff. It
is not a second canonical target and must not be used for new review work.

It is a benchmark for:

- thick, readable 3D playable terrain;
- bright dimensional materials with visible grass, earth, roots, and stone;
- foreground, midground, and far-background depth;
- warm daylight, atmospheric separation, and side-view composition;
- integrated terrain storytelling and platforming readability.

It is not a source asset. Geometry, UVs, textures, props, arrangements, symbols,
blocks, collectibles, layouts, names, code, and audio must remain original to
Hargold & Mebble.

## Emergency Meadow Wake visible-terrain freeze

The last approved-looking Meadow Wake deployment is commit `55cd085` (`Correct
Meadow Wake terrain presentation`). Its browser-authored terrain, camp, trees,
roots, rocks, dressing, background, fullscreen composition, compact HUD, and
touch controls remain the visible runtime authority. Do not modify or replace
that visible layer until genuine human-authored DCC terrain has completed
sculpt, retopology, UV, authored materials, LOD, engine integration,
performance, and art review.

Generated terrain shells, primitive camp/tree/root/rock approximations,
collision-derived visual meshes, and automatic blockout renders are forbidden.
The freeze is machine-readable in
`data/level-art/world-1/meadow-wake-terrain-architecture.json`.

The opening vertical slice keeps two distinct terrain responsibilities:

- `Terrain_Collision_Master` is the frozen low-poly gameplay authority. It
  owns character/enemy support, raycasts, physics, jump validation, and terrain
  spacing. Its fingerprint is recorded in
  `data/level-art/world-1/meadow-wake-terrain-architecture.json`. It remains
  hidden in normal Blender renders and every Unity renderer below it is
  disabled. Only a verified gameplay defect may authorize changing it.
- `Terrain_Visible_Master` is currently an **empty DCC authoring target**. No
  Blender production mesh or visible-terrain FBX exists. A future human-authored
  mesh will own the visible landform and environment materials, but it must
  never supply gameplay collision.

The collision mesh and empty visible target are different Blender objects and
different Unity hierarchies. `90_EXPORT_VISIBLE` remains empty until approved
DCC art exists. They cannot be joined or regenerated from one another. Trees,
embedded rocks, roots, grass, cavities, erosion, and overhangs belong only to
future authored visible art.

Across the full course, Meadow Wake has three independent terrain
responsibilities:

1. `MEADOW_WAKE_TERRAIN_POINTS`, pits, semisolids, rails, and block actors are
   deterministic gameplay data.
2. `verdant-vale-terrain-kit.js` supplies the currently approved deployed
   visible relief at commit `55cd085`; it does not participate in collision and
   is frozen against further procedural-terrain replacement.
3. `verdant_vale_terrain_kit.glb` supplies original Blender-authored room
   finishes bound to explicit room profiles in `meadow-wake-scenery.js`.

Fatal pit volumes remain separate from visible cliff art. Interactive blocks,
moving platforms, falling platforms, lifts, seesaws, coins, Compass Coins,
checkpoint objects, and the goal remain independent gameplay actors attached
through authored anchors. Visual meshes cannot silently change collision.
The protected opening gameplay fingerprint covers its collision profile,
platforms, blocks, enemies, spawn/exit, safe zones, gameplay plane, and camera;
visible-only revisions must leave that fingerprint unchanged.

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
embedded stone, ruin stone, moss, and worn path. Each Meadow Wake module now
also carries an explicit sampled lower-contour profile, edge-inset contract,
and regional texture scale. The detailed face tapers into a recessed irregular
subsoil mass; the latter fills the lower view without making every detailed
bank one full-height texture curtain. Terrain uses modeled relief, vertex color
variation, per-region UV offsets, and a separate turf overhang.
The active original albedo is
`assets/textures/world-1/meadow-wake/meadow-soil-stone-albedo-v3.png`; it was
generated specifically for this project as a neutral, tileable stylized
material, then combined with runtime lighting and modeled relief rather than
used as a flat playable card.

Lighting must preserve readable values. Soil may be rich and shaded, but
required landing edges, route silhouettes, pit lips, blocks, and mechanisms
cannot disappear into crushed blacks.

## Verdant Vale living-surface contract

The upper `0.30 m` of visible Verdant Vale terrain is a biological system, not
a grass material applied over a soil material. Surface-only art revisions may
change the existing top-face material assignment and add non-colliding detail,
but they may not change gameplay, collision, terrain thickness, the authored
course layout, background, lighting, or camera.

The surface must communicate four overlapping ecological depths without clean
horizontal bands:

1. varied long, medium, short, and broken grass with flowers, weeds, moss, and
   leaf litter;
2. a dense local root mat, dark organic soil, and decomposing matter;
3. fine branching roots, compacted earth, moisture variation, and partially
   buried stone clusters;
4. tree-sourced structural roots, clay, buried rock, and compact subsoil.

The mobile implementation uses three complementary scales. Modeled colony
meshes own the gameplay-distance silhouette. Sparse alpha cards from the
original Verdant Vale atlas supply medium botanical detail. Procedural material
detail supplies the smallest color and roughness variation. Thousands of
individual blade objects, evenly repeated clumps, a continuous turf ribbon, and
texture-only grass-to-soil transitions are prohibited.

Roots must have an authored source and hierarchy: major roots start in tree
zones, divide into secondary roots, and finish in fine roots that mostly recede
behind the organic mat. Stones occur in geological pockets as embedded forms,
partially buried clusters, and fragments. Fully exposed isolated rocks are the
exception. Ground cover is clustered and keeps the playable silhouette clear.

The current original medium-detail source is
`assets/textures/world-1/meadow-wake/verdant-vale-living-surface-atlas-v1.png`.
It is an alpha atlas for sparse cards, not a baked replacement terrain image.
Clay and wireframe reviews omit alpha-card quads so they show the modeled
surface structure honestly; the material and gameplay-camera views show all
three systems together.

The user approved this living-surface review gate for runtime integration on
August 4, 2026. The live browser implementation is confined to the visible
foreground in `src/environment/meadow-wake-foreground.js`: modeled transition
geometry supplies the silhouette, cropped atlas cards provide clustered
medium detail, and the existing turf/soil maps provide fine material detail.
The deterministic terrain profile, collision, pits, layout, background,
lighting, and camera remain unchanged.

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

Normal play fills the browser viewport. The development header, status strip,
and keyboard footer are available only through debug presentation queries.
At the 1536×864 validation viewport, the old 1400×788 framed playfield became a
1536×864 playfield. Primary movement controls changed from 82 pixels to 64
pixels, Jump from 98 pixels to 80 pixels, and Restart moved from the primary
72×62 cluster into the deliberate course menu. Safe-area padding remains part
of the touch layout.

## Current implementation status

All twelve rooms use the independent relief system and an explicit
Blender-authored finish profile. The playable course, mechanics, routes, block
phrases, collectibles, checkpoint, and goal are preserved.

The terrain architecture, authored lower silhouettes, all-room first finish,
production viewport, compact HUD, and corrected touch hierarchy are
implemented. The opening lodge now includes a modeled draped canopy, visible
foundations, joinery, ropes, fasteners, entry steps, and depth-bearing openings.

The current original runtime-modeled scenery is the frozen deployed fallback,
not a claim of final DCC-authored asset quality. The Blender handoff contains
no visible replacement mesh and no primitive visual approximation.
Target-device lighting approval, mesh LODs, compressed textures, final UV
review, several purpose-built landmark mesh replacements, and a final visual
review at the start, middle, and goal remain production work. The course is not
terrain-complete yet.
