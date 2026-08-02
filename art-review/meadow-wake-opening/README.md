# Meadow Wake opening — Blender environment art gate

Status: `AWAITING USER VISUAL APPROVAL`

This folder is a visual-review package for the independent Meadow Wake opening Blender slice. It does not replace the browser terrain, does not contain final collision, and is not authorized for engine integration.

## Evidence-role lock

- Sole quality target: `assets/references/terrain/meadow-wake-production-quality-target.jpeg`
- Current gameplay comparison: `assets/references/terrain/meadow-wake-current-deployment.png`
- In `07_side-by-side-target-comparison.png`, the quality target is always on the left and the Blender render is always on the right.
- Both images exist in Blender only as hidden, non-rendering image empties. Neither is used by a material, world shader, compositor, projection, or rendered backdrop.

## Review files

1. `01_current-deployment.png` — byte-identical canonical current-gameplay comparison.
2. `02_blockout-composition.png` — locked-camera composition checkpoint with final detail hidden.
3. `03_clay-render.png` — full modeled geometry checkpoint in neutral clay.
4. `04_material-render.png` — procedural material checkpoint before final light balance.
5. `05_final-lighting-render.png` — revision-four color and lighting review.
6. `06_wireframe-render.png` — edge-derived geometry proof for camp, blocks, mannequin, trunk, branches, and roots.
7. `07_side-by-side-target-comparison.png` — uncropped 1536×864 target left and render right.
8. `08_four-up-review-sheet.png` — target, current gameplay, clay, and Blender color review.
9. `metrics.json` — counts, hashes, camera values, candid scores, failure findings, and revision history.

## Authored scope

The scene covers the opening camp, a 1.82 m Hargold scale reference, connected shallow meadow terrain, a dip and rise, a breakable/cache block teaching phrase, a compass-coin movement cue, a quiet encounter clearing, a root-supported rise, a primary broadleaf tree, foreground framing, midground forest, waterfall transition, distant mountain layers, and lighting.

The source contains 340 objects, 33,224 vertices, 25,038 polygons, 37 materials, and five lights. It uses 1 Blender metre per gameplay metre. The locked orthographic camera spans 14 m horizontally and 7.875 m vertically at 16:9; the walking surface sits at approximately 69% of frame height and the scale mannequin occupies approximately 23.1%.

## Comparison-driven revisions

- Revision 1 exposed an incorrect orthographic-width assumption and a conflicting active-WIP hero import. The camera was corrected and locked; the imported rig was replaced with a clearly tagged scale mannequin without modifying any character source.
- Revision 2 rebuilt the camp roof silhouette and increased tree-canopy density, then added a gradient sky, alpine facets, softened cloud geometry, and a denser midground forest band.
- Revision 3 cleared coincident background trunks from the block phrase and added camp props, geological variation, face moss, root veins, and collectible guidance.
- Revision 4 added readable clay/blockout evidence and an edge-derived wireframe proof while retaining the same camera.

## Honest gate result

The technical Blender scene contract passes validation, but the visual-quality gate does not pass Codex's own rubric. The supplied target remains substantially richer in sculpted terrain, camp joinery, foliage density, authored materials, atmospheric depth, contact lighting, and overall finish. The broad camp canvas, repetitive embedded stones, procedural leaf shapes, graphic mountains, and review-grade materials remain visible deficiencies. Nothing in this package should be described as approved or integrated.

Repository validation passed with `pnpm test`; the Blender scene/review validator also passed with no missing files, incorrect image dimensions, visible diagnostic collections, or reference-image rendering use.

## Rebuild and validation

Run from the repository root with Blender 5.2.0 LTS:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python 'tools\blender\environment\build_meadow_wake_opening_art_gate.py'
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background 'assets\blender\environments\world-1\meadow-wake-opening-art-gate.blend' --python 'tools\blender\environment\validate_meadow_wake_opening_art_gate.py' -- --report '.art-work\meadow-wake-opening\validation.json'
```

Render a checkpoint by passing `--mode blockout`, `clay`, `material`, `final`, or `wireframe` to `tools/blender/environment/render_meadow_wake_opening_art_gate.py`, along with `--output`.

`AWAITING USER VISUAL APPROVAL`
