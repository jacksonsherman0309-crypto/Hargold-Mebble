# Character Scale and Orientation Study

Status: locked clean-room production target
Applies to: Hargold and Mebble Blender sources, runtime GLBs, animation review, gameplay camera review

July 28 runtime authority: apply this study to the locked original Meshy
meshes/rigs. Historical procedural character sources are rejected and may not
become live or supply retargeted actions.

## Boundary

Nintendo footage and official screenshots are used only to study observable platform-character craft: silhouette readability, broad relative scale, camera-facing bias, action staging, overlap, and follow-through. No Nintendo mesh, rig, animation curve, proprietary dimension, code, or protected character proportion is a source asset for this project.

The exact Hargold and Mebble appearance remains controlled by:

- `assets/references/Hargold locked production character sheet.png`
- `assets/references/Mebble locked production character sheet.png`
- `assets/references/Hargold and Mebble approved production target.png`

## Observable benchmark principles

Official side-scrolling gameplay material keeps the playable character large enough to read facial direction and limb action while ordinary enemies remain below the character's torso. Blocks and terrain provide a stable visual ruler. Travel poses favor a strong side silhouette, but the torso and face retain enough camera reveal to avoid a flat cutout. Stops, skids, turns, reactions, and celebrations briefly open farther toward camera because expression and intent matter more than maximum travel silhouette in those actions.

The reusable principles are:

1. Use one consistent world-space scale for heroes, mobs, blocks, collisions, and cameras.
2. Keep ordinary enemies in the knee-to-waist band rather than scaling each encounter ad hoc.
3. Use action-dependent three-quarter orientation rather than one frozen yaw for every animation.
4. Reverse direction through a physical planted turn; never mirror a skinned model with negative scale.
5. Preserve the locked character's distinctive read at gameplay distance: Hargold's round low mass and Mebble's tall neck/cape line.

## Hargold & Mebble production scale

The project uses its own canonical collision and environment measurements:

| Item | Height |
| --- | ---: |
| Hargold | 1.82 m |
| Mebble | 2.2932 m |
| Standard block | 0.74 m |
| Common World 1 mobs | 0.62–0.76 m |

This produces:

- Mebble at 1.26 times Hargold's height.
- Hargold at 2.39–2.94 common-mob heights.
- Hargold at 2.459 standard blocks high.
- Mebble at 3.099 standard blocks high.

These are project-authored targets, not extracted Nintendo dimensions. Hats, hair, feathers, cape corners, and animation overshoot may extend past a collision proxy, but the feet, center of mass, and collision body remain on the declared metre scale.

The superseded procedural Blender sources were 3.42 and 4.16 Blender units tall. The active mannequin-fitted replacements are authored directly at 1.82 m and 2.2932 m with object scale `1,1,1`; runtime normalization remains 1.0.

## Gameplay orientation profile

Reveal is measured away from a true 90-degree side profile toward camera:

| Action family | Camera reveal |
| --- | ---: |
| Sprint | 3° |
| Run/default | 4–6° |
| Walk | 6° |
| Idle/start | 8° |
| Air spin | 8° |
| Mebble glide | 8° |
| Stop/victory | 10° |
| Hurt | 10° |
| Skid | 10° |
| Planted reversal | 12° |

Both directions use the same positive camera reveal. Direction changes rotate the actual rigged character toward camera through brake, compression, foot plant, torso twist, rotation, and acceleration. A left-facing character is not a negative-scale copy.

## Locked profile checks

Hargold must retain:

- very short, broad, round proportions and low center of mass;
- readable cheeks, nose, moustache, rounded chin beard, and cheerful brows;
- separation between torso, sleeves, hands, scarf, backpack, hat brim, and feather;
- a compact gait with clear foot plants and delayed backpack/scarf/feather overlap.

Mebble must retain:

- distinctly taller, thinner proportions;
- the long narrow neck and visible Adam's apple in every gameplay pose;
- crooked less-round glasses, bushy eyebrows, small top hat, and cape emblem;
- a narrow gait, readable boot separation, and a cape that opens without hiding the arm or neck silhouette.

## Approval gate

A `.blend` or `.glb` is not final merely because it contains a skin, bones, and clips. Final approval additionally requires:

- locked-sheet silhouette overlay review in front, rear, side, and three-quarter views;
- deformation captures for locomotion, jumps, landings, spin, slam, hurt, and hero abilities;
- functional motion evidence for the face, fingers, feet, neck, and secondary parts;
- gameplay-camera captures beside a standard block and a common mob;
- scale `1,1,1` at canonical metres;
- no clipping, collapsed joints, foot sliding, negative-scale turns, or hidden locked identifiers.
