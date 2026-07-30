# Locked Meshy animation production

Last verified: July 30, 2026

## Runtime authority

| Purpose | Authoritative file |
| --- | --- |
| Hargold locked visible mesh and matching skin/rig | `assets/exports/meshy/hargold_canonical_gameplay_rig.glb` |
| Mebble locked visible mesh and matching skin/rig | `assets/exports/meshy/mebble_canonical_gameplay_rig.glb` |
| Body clip definitions | `src/animation/locked-meshy-animation-library.js` |
| State-to-clip selection and blends | `src/animation/character-animation-config.js` |
| Runtime mixing, phase sync, contact correction | `src/character-renderer.js` |
| Controller movement states and physics | `src/gameplay/movement/unified-character-controller.js` |
| Machine-readable clip map | `data/animation-state-mapping.json` |
| Verified rig limits | `data/locked-meshy-animation-capabilities.json` |
| Live validation stations | `src/content/animation-validation-course.js` |

The controller owns world translation. Root motion is disabled. The supplied
walk/run clips remain embedded source references and are available in the
animation debug panel, but live locomotion does not select them. Refined walk,
run, and full-speed sprint cycles and all other body clips are additive
local-space tracks authored against the exact local bind transforms of the
locked 24-bone rigs.

## Clip catalog

Both heroes provide:

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

These are runtime presentation clips, not new embedded takes inside the GLBs.
The GLBs continue to contain only the supplied walk and run animations.

## Controller rules

Holding a direction begins with the controller's lower speed tier and
automatically accelerates through walk and run to maximum speed. There is no
manual run or sprint button or buffered action. Releasing input decelerates;
reversing at speed enters turn/skid presentation. Refined gait playback rates
are calculated from actual horizontal velocity, walk/run/sprint phases are
preserved across clip changes, and the full-speed tier has its own stride and
body mechanics instead of accelerating the same run take.

Jump, twirl, Hargold double jump, Mebble glide, stomp, approved universal
ground slam, landings, damage, defeat, power reactions, victory, and swap
states are selected from actual controller state or explicit gameplay events.
Gameplay state changes interrupt presentation clips when control must remain
responsive.

An airborne Down/S/SLAM press has a short deterministic intent buffer so a
press immediately after takeoff is not lost before minimum clearance is
reached. A valid slam runs startup, committed descent, terrain impact, and a
separate recovery clip. Live impact events drive dust/ring effects, camera
response, and nearby mob contact through each mob's existing world-specific
stomp behavior. An invalid low descending press remains an ordinary fast fall.

## Validation

Run the live validation course:

`http://127.0.0.1:4173/?animationValidation=1&debugAnimation=1`

For uninterrupted live-course input testing with every currently implemented
hero ability available, use:

`http://127.0.0.1:4173/?fullyUnlocked=1`

The fully unlocked profile is query-scoped and non-persistent. It enables
Hargold's learned double jump and starts the test session at the canonical
three health layers and 99-life caps. Mebble's glide, shared air twirl, ground
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

Use `?debugMovement=1` for state/velocity telemetry and
`?debugAnimation=1` for clip selection, pause, scrub, speed, loop, facing, and
restart.

## Source-rig boundary

Both locked rigs have zero morph targets and no facial, finger, cape, scarf,
hat, feather, glasses, belt, backpack, or corrective control bones. Therefore:

- face, eyelid, eyebrow, jaw, cheek, and mouth animation are not functional;
- hands move as whole deform groups, not articulated fingers;
- Mebble's body can enter a glide pose, but the cape cannot independently open;
- accessory stability can be inherited from the body, but independent secondary
  physics cannot be authored safely from the existing controls;
- pose-space deformation correction remains unavailable.

Adding those features requires an artist-reviewed extension of the locked rigs
and skin weights without replacing or redesigning the visible meshes. Until
that source work exists, the runtime must not fabricate capability claims.

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
