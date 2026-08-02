# Meadow Wake opening — Blender-to-Unity vertical-slice handoff

Status: **structural handoff complete; visible art and Unity validation blocked**
Branch: `environment/meadow-wake-blender-vertical-slice`

## Outcome and authority

The current browser remains runnable and unchanged by this vertical-slice work.
It is authoritative for the opening's layout, spacing, collision profile,
movement behavior, blocks, collectibles, enemies, and camera intent. It is no
longer the final visible-terrain pipeline.

The canonical environment source is
`assets/blender/environments/world-1/meadow-wake-opening.blend`. Blender owns
future visible terrain and environment art; Unity under `unity/HargoldMebble`
is the mobile production-assembly target. The historical imported geometry
scaffold is coordinate-free and was not used as a coordinate authority.

`docs/CURRENT_GAME_CANON.md` was requested by the direction prompt but does not
exist in this repository. The complete authority chain in `AGENTS.md`, including
the canonical design bible and newer campaign-count override, was used instead.

## Frozen scope

- Playable X bounds: 0–30 m.
- Visual buffer: -2–34 m.
- Gameplay plane: Blender Y=0 / Unity Z=0, with 0.8 m collision depth.
- Scale: 1 gameplay m = 1 Blender m = 1 Unity unit.
- Hargold guide: 1.82 m tall; Mebble guide: 2.2932 m; standard block: 0.74 m.
- No pits occur in this opening slice.
- Five separate authored platform anchors, five blocks, 30 trail coins, one
  Compass Coin, and five enemy/patrol anchors are preserved.
- The block lesson retains three standard breakable blocks, one coin block, and
  one power-up block.
- Four safe-landing ranges were added only as art-clearance metadata and are
  verified not to overlap any current enemy patrol.

## What automation produced

The Blender build script creates all 18 required collections, metric scene
units, fixed cameras, reference/background integration, guide mannequins,
platform/block/coin/enemy/prop anchors, separate deterministic collision, a GLB
guide, a Unity FBX collision guide, and fixed-view blockout renders.

Coarse terrain, camp, tree, root, rock, ruin, and foliage masses are sculpt
targets only. They carry explicit `SCULPT_REQUIRED`, `RETOPO_REQUIRED`,
`UV_REQUIRED`, and `ART_REVIEW_REQUIRED` properties. They are not in `90_EXPORT`
and are not approved production art. No raw Meshy asset was introduced.

## Exact manual-art handoff

1. Open `meadow-wake-opening.blend`; keep `01_GAMEPLAY_GUIDES`,
   `02_CAMERA_GUIDES`, and `12_TERRAIN_COLLISION` intact.
2. Duplicate `MW_TerrainHigh_SculptVolume_SCULPT_REQUIRED` to a versioned working
   object in `10_TERRAIN_HIGH`. Hand-sculpt the seven intended landforms: camp
   foundation bank, spawn meadow, shallow dip, root-supported rise, block-test
   shelf, optional outcrop, and exit transition bank. Preserve the guide's top
   silhouette and vary lower depth deliberately; remove every straight visible
   seam and uniform downward extrusion.
3. Resolve the camp masses into a finished lodge with grounded stone/timber
   footings, proper beams and joinery, roof thickness, tensioned cloth, ropes,
   lantern brackets, openings, steps, and terrain contact. The current cubes are
   scale envelopes, not editable final panels.
4. Replace the benchmark tree cylinders/blobs with a tapered trunk, root flare,
   major and secondary branch hierarchy, asymmetric leaf-cluster silhouettes,
   terrain-integrated roots, and reviewed LODs.
5. Resolve root/rock/ruin masses into 2–3 root systems, 3–5 deliberate rock
   clusters, and the minimum timber/ruin kit required by this slice. Keep
   gameplay clearances around blocks, patrols, and safe landing zones.
6. Retopologize approved high meshes into `11_TERRAIN_GAME`. Name production
   objects with `MW_TERRAIN_*_LOD0`, `MW_CAMP_*_LOD0`, `MW_TREE_*_LOD0`, etc.
   Apply transforms and verify pivots.
7. UV unwrap, create shared Verdant Vale masks/materials, bake appropriate high
   detail, and author LOD1/LOD2 only after LOD0 passes the five fixed cameras.
8. Keep collision simple and independent. Do not derive collision from grass,
   roots, stones, flowers, or sculpt relief.
9. Move only approved game meshes and collision into `90_EXPORT`; the validator
   rejects sculpt-required objects in that collection.

## Unity handoff

The minimal Unity 6 project is configured for mobile URP and contains the
required world folder structure, scene scaffold, import tool, and explicitly
temporary strict-plane traversal/camera proxies. The canonical JSON is not
duplicated in `Assets`.

Unity Hub is installed, but the requested 6000.3.18f1 editor is not installed;
its Hub download metadata is paused. Therefore the `.unity` file is an
unvalidated source scaffold, not a verified playable scene. Once the editor is
installed:

1. Open `unity/HargoldMebble` in Unity 6000.3.18f1.
2. Let Package Manager resolve URP.
3. Run **Hargold & Mebble > Meadow Wake > Rebuild Opening Slice**.
4. Confirm the FBX imports at scale 1 with X/Y/Z converted to Unity X/Z/Y as
   expected and no negative scale.
5. Test walk, run, all jump forms, skid/reversal, crouch/slide, slam, stomp,
   Hargold double jump, Mebble glide, swap, blocks, and enemy contact using the
   real controller only after that controller is genuinely ported.
6. Capture the five fixed viewpoints, collision debug, Unity Profiler CPU/GPU,
   draw calls, memory, load time, and iPhone 14 Pro Max-class device results.

## Rebuild and validation commands

```powershell
node tools/level-art/export-meadow-wake-opening-layout.mjs
node tools/level-art/validate-meadow-wake-opening-layout.mjs
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python-exit-code 1 --python tools/blender/build_meadow_wake_opening_vertical_slice.py
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets/blender/environments/world-1/meadow-wake-opening.blend --python-exit-code 1 --python tools/blender/validate_meadow_wake_opening_vertical_slice.py
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets/blender/environments/world-1/meadow-wake-opening.blend --python-exit-code 1 --python tools/blender/render_meadow_wake_opening_collision_debug.py
npm test
```

## Approval gate

This slice is **not ready for visual approval**. Its layout transfer, scene
organization, guide/collision export, validation automation, Unity source
structure, and manual-art handoff are reviewable. Production-quality visible
terrain, camp, tree, asset kit, materials, bakes, LODs, Unity editor traversal,
and device performance remain required before expansion beyond X=30 m.
