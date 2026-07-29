# Locked Meshy animation production

Last verified: July 28, 2026

## Runtime authority

| Purpose | Authoritative file |
| --- | --- |
| Hargold visible mesh, skin, supplied walk/run | `assets/exports/meshy/hargold_canonical_gameplay_rig.glb` |
| Mebble visible mesh, skin, supplied walk/run | `assets/exports/meshy/mebble_canonical_gameplay_rig.glb` |
| Body clip definitions | `src/animation/locked-meshy-animation-library.js` |
| State-to-clip selection and blends | `src/animation/character-animation-config.js` |
| Runtime mixing, phase sync, contact correction | `src/character-renderer.js` |
| Controller movement states and physics | `src/gameplay/movement/unified-character-controller.js` |
| Machine-readable clip map | `data/animation-state-mapping.json` |
| Verified rig limits | `data/locked-meshy-animation-capabilities.json` |
| Live validation stations | `src/content/animation-validation-course.js` |

The controller owns world translation. Root motion is disabled. The supplied
walk/run clips are retained unchanged as sustained gait sources; all additional
body clips are additive local-space tracks authored against the exact local
bind transforms of the locked 24-bone rigs.

## Clip catalog

Both heroes provide:

- `idle`, `idle_secondary`;
- `walk_start`, supplied `walk`, `walk_run_accel`, supplied `run`,
  `run_decelerate`;
- `turnaround`, `skid`, `crouch`, `crawl`, `slide`;
- `jump_anticipation`, `jump_takeoff`, `jump_rise`, `jump_apex`, `jump_fall`,
  `running_jump`, `air_adjust`, `air_spin`;
- `stomp_bounce`, `land_soft`, `land_heavy`;
- `ground_slam_start`, `ground_slam_fall`, `ground_slam_impact`;
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
reversing at speed enters turn/skid presentation. Supplied gait playback rates
are calculated from actual horizontal velocity, and walk/run phase is
preserved across a clip change to reduce contact discontinuities.

Jump, twirl, Hargold double jump, Mebble glide, stomp, approved universal
ground slam, landings, damage, defeat, power reactions, victory, and swap
states are selected from actual controller state or explicit gameplay events.
Gameplay state changes interrupt presentation clips when control must remain
responsive.

## Validation

Run the live validation course:

`http://127.0.0.1:4173/?animationValidation=1&debugAnimation=1`

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
