# Verdant Vale living-surface quality gate

Status: **visual approval pending**. This is an isolated Blender hero-asset review, not a production integration or deployment.

## Required comparison

| Sole quality target | Current Blender terrain-bank gate |
| --- | --- |
| ![Sole Meadow Wake quality target](../../../assets/references/terrain/meadow-wake-production-quality-target.jpeg) | ![Current Blender living surface](surface-gameplay-camera.png) |

The surface-layer approval set is:

- [Before/after close-up](surface-before-after.png)
- [Frozen previous-surface close-up](surface-before.png)
- [Material render](surface-material.png)
- [Gameplay-camera render](surface-gameplay-camera.png)
- [Wireframe](surface-wireframe.png)
- [Clay render](surface-clay.png)

The earlier whole-bank sheets remain available for historical comparison, but they are not evidence that the surface pass was deployed.

## What is actually authored

- The original 112-vertex, 110-face soil bank remains the frozen base. Its dimensions, silhouette, thickness, and bevel are unchanged.
- Only the bank's existing top polygons receive the mottled living-meadow material and surface-only smooth shading. No vertices, collision, or terrain thickness changed.
- The legacy continuous turf ribbon stays removed. A vertex-painted transition and five localized overhang/collapse zones bridge grass, humus, and exposed soil.
- Nineteen modeled colony meshes own the gameplay-distance silhouette. They replace the old field of individually spaced blade objects.
- Eighty-four single-quad alpha cards supply sparse medium botanical detail across authored front and depth clusters. The cards use the original transparent atlas at `assets/textures/world-1/meadow-wake/verdant-vale-living-surface-atlas-v1.png`.
- Nine tapered humus/root-mat pockets and 36 modeled moss lobes interrupt the seam without forming another continuous strip.
- Two hidden tree-zone crowns drive six structural/secondary roots and 12 fine branches. Fine roots recede behind the organic mat instead of floating decoratively.
- Eight partially buried fieldstones and six buried fragments stay grouped into three geological pockets, each with modeled soil cover.
- Leaves, twigs, exposed-soil pockets, moss, weeds, ferns, tiny flowers, and hanging turf tongues remain ecologically clustered and keep the playable line readable.
- Fine material noise, the sparse card layer, and modeled silhouette geometry are the three explicit levels of detail; no thousands-of-blades scatter exists.

## Frozen boundaries

- The approved Verdant Vale background image is reused unchanged as a static camera-aligned layer. No mountains, cliffs, forests, waterfalls, clouds, or sky were modeled or replaced.
- Gameplay layout and collision retain fingerprint `a00bf81913452518d3ed7cbc0e8e2a60c3fc7e2b34e5f9762322fcb23acf58d9`.
- The approved background retains SHA-256 `4aa8ef74e96fd27acd06b08d027d06c26e8b0a11d78ebbf136a8178d72c89670`.
- Deployed visible terrain remains frozen at commit `55cd085`; this bank has not replaced it.
- Heroes, enemies, blocks, collectibles, UI, camera behavior, movement, checkpoints, and authored course geometry were not touched.
- Tree family, separate rock/root hero formation, export, integration, and deployment remain explicitly blocked until the terrain bank receives visual approval.

## Reproduction and validation

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python tools\blender\environment\build_verdant_vale_terrain_bank_quality_gate.py
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\environments\world-1\verdant-vale-terrain-bank-quality-gate.blend --python tools\blender\environment\validate_verdant_vale_terrain_bank_quality_gate.py
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\environments\world-1\verdant-vale-terrain-bank-quality-gate.blend --python tools\blender\environment\render_verdant_vale_surface_review.py
& 'C:\Users\jacks\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' tools\blender\environment\compose_verdant_vale_surface_review.py
```

The structural validator passes. Alpha cards are hidden only in clay and wireframe diagnostics so those views honestly show modeled structure. Visual approval remains a human art-direction decision and is intentionally not inferred from structural checks.
