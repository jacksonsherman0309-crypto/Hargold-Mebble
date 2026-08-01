# Locked Meshy animation production

Last verified: August 1, 2026

> Rig-first override: the runtime behavior below is retained as interim
> controller, timing, migration, and rollback evidence. It is not the final
> animation-authoring path. Stage 0, Stage 1 and the unskinned Stage 2 control
> architecture pass; final polish remains blocked until Stages 3–7 in
> `docs/rig-first-character-production-gate-2026-07-31.md` pass.

## Runtime authority

| Purpose | Authoritative file |
| --- | --- |
| Hargold locked visible mesh and matching skin/rig | `assets/exports/meshy/hargold_canonical_gameplay_rig.glb` |
| Mebble locked visible mesh and matching skin/rig | `assets/exports/meshy/mebble_canonical_gameplay_rig.glb` |
| Approved numeric motion contract | `data/character-animation-numeric-spec.json` |
| Live semantic pose evaluation and rig-axis map | `src/animation/character-animation-numeric-runtime.js` |
| Fixed body clips for isolated debug inspection | `src/animation/locked-meshy-animation-library.js` |
| Debug clip selection and metadata | `src/animation/character-animation-config.js` |
| Live pose application, foot locking, and telemetry | `src/character-renderer.js` |
| Controller movement states and physics | `src/gameplay/movement/unified-character-controller.js` |
| Machine-readable clip map | `data/animation-state-mapping.json` |
| Verified rig limits | `data/locked-meshy-animation-capabilities.json` |
| Live validation stations | `src/content/animation-validation-course.js` |

The controller owns world translation and collision. Root motion is disabled.
Live gameplay evaluates the approved numeric contract into named semantic
joint rotations, converts degrees to radians through one locked-rig axis/sign
table, and applies the result additively to each rig's exact bind transforms.
No third-party animation asset is inspected or pose-matched by this system.

The supplied walk/run clips and the fixed project-authored clip library remain
available in the animation debug panel for isolated rig inspection. They are
not selected by controller-driven live gameplay.

## Live pose catalog

Live semantic pose IDs use the existing catalog names so telemetry, validation,
and effects remain easy to trace. Both heroes provide:

- `idle`, `idle_secondary`;
- `walk_start`, `walk_refined`, `walk_run_accel`, `run_refined`,
  `sprint_refined`, `run_decelerate`;
- `turnaround`, `skid`, `crouch`, `crawl`, `slide`;
- `jump_anticipation`, `jump_takeoff`, `jump_rise`, `jump_apex`, `jump_fall`,
  `running_jump`, `air_adjust`, `air_spin`;
- `stomp_bounce`, `land_soft`, `land_heavy`;
- `ground_slam_start`, `ground_slam_fall`, `ground_slam_impact`,
  `ground_slam_recover`;
- `block_hit`, `hurt`, `knockback`, `defeat`, `ledge_stop`;
- `powerup_collect`, `power_transform`, `victory`, `swap_out`, `swap_in`.

Hargold additionally provides `double_jump`. Mebble additionally provides
`glide_open`, `glide_sustain`, and `glide_close`.

These IDs do not imply embedded animation takes. Live poses are evaluated from
controller state, velocity, persistent locomotion phase, action time, and
predicted ground contact. The GLBs continue to contain only their supplied
walk and run animations.

## Controller rules

Holding a direction begins with the controller's lower speed tier and
automatically accelerates through walk and run to maximum speed. There is no
manual run or sprint button or buffered action. Releasing input decelerates;
reversing at speed enters a planted turn/skid presentation. Gait phase advances
by actual controller distance divided by the approved gait-cycle distance.
Walk, run, and full-speed phases remain continuous across speed-tier changes,
and full speed has its own stride and body mechanics.

Jump, twirl, Hargold double jump, Mebble glide, stomp, approved universal
ground slam, landings, damage, defeat, power reactions, victory, and swap
states are selected from actual controller state or explicit gameplay events.
Gameplay state changes interrupt presentation clips when control must remain
responsive.

An airborne Down/S/SLAM press has a short deterministic intent buffer so a
press immediately after takeoff is not lost before minimum clearance is
reached. The authoritative production pose sequence is the nine-frame air
brake, tuck, forward-somersault, orientation, and committed descent in
`docs/animation-motion-override-2026-07-31.md`. Interim 24-bone presentation
remains diagnostic evidence only. Live impact events drive dust/ring effects,
camera response, and nearby mob contact through each mob's existing
world-specific stomp behavior. An invalid low descending press remains an
ordinary fast fall.

Hargold's double jump launches immediately at the approved speed and uses a
distinct tuck, extension, and counter-twist pose. Mebble's glide has numeric
open, sustained body-pose, and close timing; the current rig cannot open the
cape independently, so the runtime does not claim cape deformation.

## Contact and telemetry

Walk, run, and full-speed gaits use explicit left/right contact and toe-off
windows. Those contacts lock forward and vertical foot motion. Skid and slide
lock vertical motion only. Contact releases use a two-frame inertial blend,
and moving-platform velocity advances the stored anchor. The live debug panel
reports:

- movement state and presentation subphase;
- selected pose ID and persistent locomotion phase;
- left/right contact booleans;
- measured foot slip and vertical penetration as percentages of hero height;
- velocity, predicted time to ground, active blend duration, and facing-flip
  marker;
- controls that remain unavailable on the locked rigs.

Validation thresholds are 1.5% of hero height for planted-foot slip, 0.5% for
vertical penetration, 0.08 for phase error, and two render frames for visible
state settling.

## Controller-driven versus fixed timing

| Motion | Timing source |
| --- | --- |
| Walk, run, full speed, crawl | controller distance and persistent phase |
| Brake and skid hold | controller velocity; numeric entry/plant/exit poses |
| Slide sustain | controller speed and slope |
| Rise, apex, fall, landing preparation | vertical velocity and predicted ground contact |
| Ground-slam descent | controller velocity; startup, impact, and recovery use fixed numeric frames |
| Hargold double jump | fixed 19-frame pose sequence with controller launch on frame 0 |
| Mebble glide | fixed 7-frame open and 6-frame close; sustained body pose is controller-driven |
| Damage, power, victory, swap | short interruptible numeric one-shots |
| Supplied and project-authored fixed clips | animation debug panel only |

## Validation

Run the live validation course:

`http://127.0.0.1:4173/?animationValidation=1&debugAnimation=1`

For uninterrupted live-course input testing with every currently implemented
hero ability available, use:

`http://127.0.0.1:4173/?fullyUnlocked=1`

The fully unlocked profile is query-scoped and non-persistent. It enables
Hargold's learned double jump and starts the test session at the canonical
three health layers and 99-life caps. Mebble's glide, Hargold-only air twirl, ground
slam, combat, and hero swapping are already available through the live
controller. Planned elemental power-ups are not claimed or simulated by this
test profile.

The station selector teleports the active hero to real Meadow Wake terrain
rather than an editor-only mannequin scene. It covers:

1. acceleration, stop, reversal, and skid;
2. incline, decline, foot contact, and ledge stopping;
3. uneven stone, narrow platforms, and landing;
4. moving-platform contact and inherited support motion;
5. Hargold double jump, Mebble glide, twirl, and ground slam;
6. pit jumps, fall, glide landing, and horizontal momentum;
7. enemy stomp, bounce, damage, and knockback;
8. orbiting/falling platforms and heavy landing;
9. Hargold blocks, block-hit reaction, and power-up;
10. rapid gaps, air adjustment, landing-to-run, and defeat.

Each validation station now includes deliberate input instructions. Use
`?debugMovement=1` for controller telemetry and `?debugAnimation=1` for both
live numeric telemetry and optional fixed-clip selection, pause, scrub, speed,
loop, facing, and restart. When animation validation is enabled, the panel
starts in live gameplay mode instead of taking control with a fixed clip.

## Source-rig boundary

Both locked rigs have zero morph targets and no facial, finger, cape, scarf,
hat, feather, glasses, belt, backpack, or corrective control bones. Therefore:

- face, eyelid, eyebrow, jaw, cheek, and mouth animation are not functional;
- hands move as whole deform groups, not articulated fingers;
- Mebble's body can enter a glide pose, but the cape cannot independently open;
- accessory stability can be inherited from the body, but independent secondary
  physics cannot be authored safely from the existing controls;
- pose-space deformation correction remains unavailable.

Adding those features requires the reviewed Stage 2–4 production-rig,
skinning, and control work without replacing or redesigning the visible
meshes. Until those gates pass, the runtime must not fabricate capability
claims.

## Deprecated and quarantined inputs

| Path | Runtime policy |
| --- | --- |
| `assets/exports/hargold_character.glb` | rejected altered/procedural mesh and actions; never load or retarget |
| `assets/exports/mebble_character.glb` | rejected altered/procedural mesh and actions; never load or retarget |
| `assets/blender/hargold_character.blend` | historical rejected authoring source |
| `assets/blender/mebble_character.blend` | historical rejected authoring source |
| `assets/exports/mannequins/` | validation reference only; never playable |
| `assets/previews/character-*` and mannequin sheets | visual comparison evidence only |

The raw Meshy ZIPs remain local source archives and are not duplicated in the
repository.
