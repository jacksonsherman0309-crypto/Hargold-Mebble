# Meadow Wake emergency terrain restoration report

Date: 2026-08-02  
Branch: `environment/meadow-wake-blender-vertical-slice`  
Restored visible-terrain source: `55cd085` — `Correct Meadow Wake terrain presentation`

## Git finding

`55cd085` is the last approved-looking deployed Meadow Wake terrain commit.
`7ac219d` contains later character-rig work and does not replace the approved
browser terrain. `3b3a840` adds the Blender/Unity handoff, but its primitive
blockout preview is not accepted as visible production terrain.

No whole commit was reverted. The rejected foreground/environment work was
uncommitted, so the live terrain-facing files below were restored directly from
`55cd085`. Commit `7ac219d` and all unrelated current rig work were preserved.

## Files restored exactly to `55cd085`

- `index.html`
- `styles.css`
- `src/game.js`
- `src/character-renderer.js`
- `src/content/meadow-wake-course.js`
- `src/content/meadow-wake-level-data.js`
- `src/content/meadow-wake-scenery.js`
- `src/environment/meadow-wake-environment.js`
- `src/environment/meadow-wake-foreground.js`
- `src/environment/verdant-vale-terrain-kit.js`
- `tools/blender/build_verdant_vale_terrain_kit.py`
- `tests/meadow-wake-art-pipeline.test.mjs`
- `tests/meadow-wake-terrain-correction.test.mjs`

Git comparison confirms all thirteen files exactly match `55cd085`.

## Rejected terrain artifacts removed

Tracked and Git-recoverable:

- `assets/previews/terrain-validation/blender-vertical-slice/blockout-block-phrase.png`
- `assets/previews/terrain-validation/blender-vertical-slice/blockout-enemy-encounter.png`
- `assets/previews/terrain-validation/blender-vertical-slice/blockout-first-terrain-transition.png`
- `assets/previews/terrain-validation/blender-vertical-slice/blockout-slice-exit.png`
- `assets/previews/terrain-validation/blender-vertical-slice/blockout-spawn.png`
- `assets/previews/terrain-validation/blender-vertical-slice/collision-debug-block-phrase.png`
- `assets/previews/terrain-validation/blender-vertical-slice/collision-debug-enemy-encounter.png`
- `assets/previews/terrain-validation/blender-vertical-slice/collision-debug-first-terrain-transition.png`
- `assets/previews/terrain-validation/blender-vertical-slice/collision-debug-slice-exit.png`
- `assets/previews/terrain-validation/blender-vertical-slice/collision-debug-spawn.png`
- `unity/HargoldMebble/Assets/Game/Worlds/World01_MeadowWake/Art/Source/MW_Opening_BlockoutGuide.fbx`

Untracked and therefore not Git-recoverable:

- `assets/previews/terrain-validation/final-environment-polish/`
- `assets/previews/terrain-validation/foreground-polish/`
- `unity/HargoldMebble/Assets/Game/Worlds/World01_MeadowWake/Art/Source/Terrain_Visible_Master_SCULPT_REQUIRED.fbx`

## Collision/DCC handoff retained and corrected

- `Terrain_Collision_Master` remains the frozen gameplay authority with
  fingerprint
  `8009a945126c4c7ab361ead414414be97cec7cd25ef5f643732402128270fb0e`.
- Collision authoring/export collections are hidden from normal Blender renders.
- Unity disables every renderer below the collision asset.
- Collision visualization requires an explicit debug script/query and is not
  retained as visual approval evidence.
- `Terrain_Visible_Master` is an empty human-DCC authoring target.
- `90_EXPORT_VISIBLE` is empty and no visible-terrain FBX exists.
- Primitive visible terrain, camp, tree, root, rock, ruin, and foliage proxies
  are no longer generated.
- The protected gameplay fingerprint remains
  `a00bf81913452518d3ed7cbc0e8e2a60c3fc7e2b34e5f9762322fcb23acf58d9`.

## Newer non-terrain work preserved

The complete committed rig refinement at `7ac219d` was retained. Its exact file
list is available with `git show --name-status 7ac219d` and includes:

- `assets/blender/production/README.md`
- Hargold/Mebble production rig `.blend`, deformation/diagnostic/island JSON
  inventories under `assets/blender/production/`
- Hargold/Mebble Stage 3 frames, refinement-2 frames, and deformation-stress
  images under `assets/previews/rig-stage-3/`
- `data/production-character-rig-stage-3.json`
- `docs/character-rig-stage-3-report.md`
- `tests/character-rig-stage-3.test.mjs`
- `tools/blender/finalize_production_rig_stage_3.py`
- `tools/blender/validate_production_rig_stage_3.py`

Current uncommitted rig work was also preserved without modification:

- Hargold/Mebble production rig blends and deformation inventories
- all `assets/previews/rig-stage-3/frames/refinement-2/*.png` changes
- rig diagnostic directories for Hargold arm/shoulder/source-bind and Mebble
  cape/island/source-bind/spatial-repaint work
- Hargold and Mebble repair, diagnostic, composition, and render scripts under
  `tools/blender/`
- `tools/blender/finalize_production_rig_stage_2.py`
- `tools/blender/finalize_production_rig_stage_3.py`
- `tests/animation-production-system.test.mjs`
- the existing untracked `pnpm-lock.yaml`

## Visual evidence

- Before regression: `assets/previews/terrain-validation/correction-pass/opening-after.png`
- Restored runtime: `assets/previews/terrain-validation/emergency-restoration/restored-opening-55cd085.png`
- Runtime validation: `assets/previews/terrain-validation/emergency-restoration/restored-opening-validation.json`

Both captures use the same 1536×864 opening view. The restored capture confirms
textured soil, grass crowns, camp, trees, rocks/roots, blocks, layered
background, fullscreen presentation, compact HUD/touch controls, and no normal
collision/debug mode.

## Validation

- Blender DCC handoff: 23/23 checks passed.
- Status: `PASS_DCC_HANDOFF_ONLY_VISIBLE_REPLACEMENT_NOT_AUTHORED`.
- Meadow Wake terrain/layout focused suites: passed.
- Full `pnpm test`: passed, including canonical, rig, movement, physics,
  world-specific runtime, platform/block, Meadow Wake, and movement suites.
- Browser capture: 1536×864, body overflow hidden, six touch controls present,
  `debugTerrain` absent.

This work does not claim final Blender terrain, a Unity-tested terrain scene, or
a new deployment. The browser-visible terrain is frozen at `55cd085` until a
genuine DCC environment-art replacement passes all production gates.
