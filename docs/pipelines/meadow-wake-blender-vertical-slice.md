# Meadow Wake opening — Blender-to-Unity DCC handoff

Status: **browser visual frozen at `55cd085`; collision frozen; DCC visible art not authored**

## Authority and outcome

Commit `55cd085` (`Correct Meadow Wake terrain presentation`) is the last
approved-looking deployed Meadow Wake terrain. The live browser files at that
commit remain the sole visible-terrain authority until real DCC art is approved.
The newer rig and gameplay work remains valid and is not part of this freeze.

The Blender scene is an honest environment-art handoff. It contains exact
metric setup, gameplay/scale/anchor/camera guides, an external quality-reference
image, and frozen collision. It does **not** contain or claim a production
visible terrain mesh.

## Frozen scope

- Playable X bounds: 0–30 m; visual buffer: -2–34 m.
- Gameplay plane: Blender Y=0 / Unity Z=0, with 0.8 m collision depth.
- Scale: 1 gameplay m = 1 Blender m = 1 Unity unit.
- Hargold guide: 1.82 m; Mebble guide: 2.2932 m; block: 0.74 m.
- Five authored platform anchors, five blocks, 30 coins, one Compass Coin, and
  five enemy/patrol anchors remain unchanged.
- The three-breakable-block opening lesson remains unchanged.
- Protected gameplay fingerprint:
  `a00bf81913452518d3ed7cbc0e8e2a60c3fc7e2b34e5f9762322fcb23acf58d9`.
- Frozen collision fingerprint:
  `8009a945126c4c7ab361ead414414be97cec7cd25ef5f643732402128270fb0e`.

## What automation may create

`tools/blender/build_meadow_wake_opening_vertical_slice.py` may create:

- the required authoring collections;
- exact gameplay, scale, platform, block, coin, enemy, prop, and camera guides;
- `Terrain_Collision_Master` in `12_TERRAIN_COLLISION` and
  `90_EXPORT_COLLISION`;
- an empty `Terrain_Visible_Master` authoring target;
- empty targets for camp, trees, roots, rocks, ruins/timber, foliage, decals,
  and midground work;
- a neutral GLB guide and the collision-only Unity FBX.

It may not create a visible terrain shell, cube camp, cylinder tree, blob rock,
root proxy, visible FBX, or production/approval screenshot. `90_EXPORT_VISIBLE`
must remain empty. Collision collections are hidden from normal renders, and
Unity disables every renderer below the collision asset.

## Human DCC work required

1. Open `assets/blender/environments/world-1/meadow-wake-opening.blend` and keep
   gameplay guides and `Terrain_Collision_Master` unchanged.
2. Replace the empty `Terrain_Visible_Master` target only with a genuine
   human-authored terrain sculpt. Preserve route silhouette and clearance while
   building grass lips, root transitions, soil/stone layers, erosion,
   undercuts, cavities, and non-repeating landforms.
3. Author camp, tree/root, rock, ruin/timber, foliage, decal, and midground assets
   in their named collections. Do not use primitives as visible substitutes.
4. Retopologize into `11_TERRAIN_GAME`, UV unwrap, author materials and bakes,
   build deliberate LODs, and pass the five fixed review cameras.
5. Export visible art only after approval, through `90_EXPORT_VISIBLE` into
   `Art/Source`; update the manifest and Unity importer in the same change.

## Unity handoff

The Unity source imports only
`Collision/Source/Terrain_Collision_Master.fbx`. It creates the empty target
`Art/Terrain_Visible_Master__AUTHORED_DCC_ASSET_REQUIRED`. Terrain validation
passes only when collision renderers are disabled, collision mesh colliders are
present, and the visible target has no renderer, mesh filter, or collider.

The Unity editor has not been run for this repository state, so the scene
remains an unvalidated source scaffold rather than a verified playable Unity
build.

## Rebuild and validation

```powershell
node tools/level-art/export-meadow-wake-opening-layout.mjs
node tools/level-art/validate-meadow-wake-opening-layout.mjs
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python-exit-code 1 --python tools/blender/build_meadow_wake_opening_vertical_slice.py
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets/blender/environments/world-1/meadow-wake-opening.blend --python-exit-code 1 --python tools/blender/validate_meadow_wake_opening_vertical_slice.py
npm test
```

`render_meadow_wake_opening_collision_debug.py` is an explicit developer-only
diagnostic. Its output is not retained as visual approval evidence and must
never appear in normal deployment.

## Approval gate

The DCC visible environment is **not authored and not production-ready**.
Until it is, the deployed browser terrain at `55cd085` remains unchanged.
