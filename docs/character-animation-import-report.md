# Meshy Character Animation Import Report

Date: 2026-07-28
Status: locked Meshy body-animation refinement active

## Scope and authority

The five user-supplied Meshy archives were preserved and inventoried without changing the approved Hargold or Mebble visual designs. The imported characters are user-supplied production inputs. This report records the technical contents; it does not make an independent ownership or licensing determination.

The source packages contain only usable walk and run takes for each hero. The
runtime now supplements those takes with project-authored local-space body
clips built against the exact locked Meshy bind transforms. These runtime clips
are not additional supplied Meshy takes and are not embedded into the source
GLBs.

## Source package inventory

| Package | SHA-256 | Contents |
| --- | --- | --- |
| `Meshy_AI_Hargold_Rig_biped.zip` | `ECE0971ACF6745644F8F438B5CBD02782987BF99AC417AD2507BA2774518606D` | running GLB, walking GLB, zero-duration character GLB |
| `Meshy_AI_Hargold_Rig_biped (1).zip` | `518822CCBA5CEE7D86D277B9FFA3F7320F82C51CBDA81DF9E8C0187CCBE1AB7B` | walking FBX, base-color texture, metallic texture, roughness texture |
| `Meshy_AI_Mebble_Rig_biped.zip` | `2058806788EFE1238106BBBB4F4B90467B12EAEF81BDCA96F4F5591456459406` | walking FBX, zero-duration character FBX, base-color texture, metallic texture, roughness texture |
| `Meshy_AI_Mebble_Rig_biped (1).zip` | `2B177969B6873E3B9E3CF25EA8153927FCBA804AD80C9898B1B6DC8F36C1D2D6` | running GLB, walking GLB |
| `Meshy_AI_Mebble_Rig_biped (1) (1).zip` | `2B177969B6873E3B9E3CF25EA8153927FCBA804AD80C9898B1B6DC8F36C1D2D6` | byte-identical duplicate of the preceding Mebble archive |

The authoritative machine-readable inventory is `data/character-animation-inventory.json`. It contains the archive entry list, source hashes, Blender import results, GLB metadata, material/image data, mesh statistics, action curves, root-motion measurements, complete bind transforms, and bone hierarchy for all eight unique 3D files. No source file failed inspection.

## Rig and bind-pose findings

Every usable source uses the same 24-bone biped naming and hierarchy:

`Hips`; left and right `UpLeg > Leg > Foot > ToeBase`; `Hips > Spine02 > Spine01 > Spine`; left and right `Shoulder > Arm > ForeArm > Hand`; and `Spine > neck > Head > head_end/headfront`.

The canonical GLB sources have exact node-name, parent-hierarchy, and bind-transform compatibility between their walk and run takes. No live retargeting is required. The repository nevertheless records the verified identity mapping in `data/animation-retarget-map.json`.

The GLB coordinate contract is right-handed, +Y up, +Z forward, in metres. Both live assets use one skinned visible mesh, one skin, one material, one embedded 4096×4096 image, and 24 deform bones. The source FBX packages also include separate metallic and roughness images; the chosen GLBs do not expose dedicated normal, AO, opacity, or emissive maps.

## Discovered animation takes

| Hero | Source take | Canonical clip | Timing | Runtime policy |
| --- | --- | --- | --- | --- |
| Hargold | `running` | `hargold_run` | 0.633333 s; 20 sampled keys | looping, direct playback |
| Hargold | `walking_man` | `hargold_walk` | 1.033333 s; 32 sampled keys | looping, direct playback |
| Mebble | `running` | `mebble_run` | 0.633333 s; 20 sampled keys | looping, direct playback |
| Mebble | `walking_man` | `mebble_walk` | 1.033333 s; 32 sampled keys | looping, direct playback |

The source samples are spaced at approximately 1/30 second. Blender imports the actions into a 24 FPS scene, while GLB playback remains time-based and preserves source duration. Looping was enabled because the takes are named cyclic actions and have negligible endpoint root delta; visual loop quality remains a production review item.

The `clip0` takes in the character-output files have zero duration and are bind/rest poses, not usable animations. The FBX walking takes are alternate container exports of the same motion class and are inventoried but not duplicated in the live runtime.

No armature-object translation and no meaningful locomotor root displacement were detected. Maximum hips endpoint delta was below 0.000012 source units. The imported gait motion is therefore treated as in-place; the fixed-step gameplay controller remains the sole authority for world position, collision, momentum, jumping, combat, hero swapping, and camera tracking.

## Canonical playable assets

| Hero | Playable GLB | SHA-256 | Raw GLB contents |
| --- | --- | --- | --- |
| Hargold | `assets/exports/meshy/hargold_canonical_gameplay_rig.glb` | `A045E299A3F63EC45765C36D436EEF8C53AFDEE4BB7BDC98FD0A23537ABBEBEC` | one visible mesh, one skin, `hargold_walk`, `hargold_run` |
| Mebble | `assets/exports/meshy/mebble_canonical_gameplay_rig.glb` | `392D8F9C12AD140AFA738AB118D3C3A63F9A40DA41DD8A061FE8A37F91DE3A3B` | one visible mesh, one skin, `mebble_walk`, `mebble_run` |

The deterministic builder in `tools/animation/build-meshy-gameplay-rigs.mjs` retains one chosen visible character mesh per hero and merges only the verified animation accessors/channels. It rejects mismatched skeletons. Animation-package meshes are not layered or rendered as duplicate characters.

The processed assets were re-imported in Blender and recorded in `data/processed-character-rig-validation.json`. Raw-GLB tests additionally verify that each playable file contains exactly one visible mesh and one skin.

## Live state mapping

`data/animation-state-mapping.json` is the authoritative mapping table.

- Grounded locomotion selects the supplied walk or run from actual controller
  velocity. Dedicated project-authored locked-rig clips cover start,
  acceleration, deceleration, turn, and skid.
- Directional input accelerates through walk, run, and sprint speed tiers. There is no manual sprint button.
- Body presentation clips now cover idle, jump phases, fall, landing, crouch,
  crawl, slide, skid, twirl, stomp, damage, defeat, respawn, Hargold double
  jump, approved ground slam, Mebble glide body poses, block/power reactions,
  swapping, and victory. They are labeled `project-authored-locked-rig`, not
  supplied Meshy animation.
- Playback uses responsive per-transition crossfades, changes supplied gait
  playback rate with actual speed, synchronizes locomotion phase, applies
  grounded foot-height correction and bounded slope adaptation, and turns the
  character with positive uniform scale plus Y-axis rotation. Negative-scale
  mirroring is not used.
- Safe Hargold/Mebble swapping, hero-specific abilities, combat, mob behavior, and world-specific rosters remain controller/runtime responsibilities.

The developer panel is available with `?debugAnimation=1`. It supports hero/clip selection, pause, scrub, speed, loop, facing, restart, and a return to controller-driven gameplay. `?debugMovement=1` exposes controller telemetry. `debugDrive=left|right` is a developer-only deterministic capture aid and does not alter normal input.

## Validation evidence

Browser captures are listed with hashes and scenarios in `data/animation-validation-capture-manifest.json`.

- `hargold-walk-debug.png`: direct Hargold walk playback in the live level.
- `mebble-run-debug.png`: direct Mebble run playback in the live level.
- `hargold-live-full-speed.png`: controller-driven Hargold sprint state at 6.905 m/s.
- `mebble-live-full-speed.png`: controller-driven Mebble sprint state at 6.905 m/s.

The full automated suite covers GLB structure, skeleton mapping, clip availability, state mapping, input changes, deterministic motion, hero abilities, combat, world-specific mob rosters, level data, and the existing presentation contracts.

## Performance and remaining production work

The imported source appearance is preserved, but these are currently LOD0-heavy test assets:

- Hargold: approximately 293,456 triangles and 223,139 Blender-import vertices.
- Mebble: approximately 289,628 triangles and 183,537 Blender-import vertices.
- Each uses one material and one 4096×4096 embedded image, which limits draw calls but is too expensive as the only mobile LOD.

Recommended optimization order: retain the present files as visual LOD0; author reviewed LOD1 around 90–120k triangles and LOD2 around 35–55k; generate 2K mobile texture variants; validate skin weights after reduction; then add distance-based LOD selection without changing the locked silhouette.

The following work is still genuinely missing:

- facial, eyelid, eyebrow, cheek, jaw, and mouth controls and animation;
- individual finger bones and finger poses;
- independent cloth, cape, scarf, hat, feather, glasses, belt, and backpack
  controls;
- joint corrective shapes or corrective bones and final deformation review;
- platform LODs, mobile texture variants, compression tuning, and target-device
  profiling;
- clip-by-clip human visual approval from the full gameplay camera suite.

The source rigs have 24 bones and zero morph targets, so the first four items
cannot be truthfully implemented as runtime animation without reviewed source
rig and weight extensions. The active body package does not claim otherwise.
