# Hargold & Mebble Unity production assembly

This is the minimal Unity 6 mobile URP production-assembly target for the
Blender-authored Meadow Wake opening vertical slice.

Current status: **Unity editor validation required**. Unity Hub is installed,
but no editor executable was available when this project was created. The
requested 6000.3.18f1 editor download is present in Hub metadata but was paused.
No scene-import, traversal, render, or target-device claim is made yet.

The canonical layout stays at
`data/level-art/world-1/meadow-wake-opening-layout.json`; it is not duplicated
inside `Assets`. Run **Hargold & Mebble > Meadow Wake > Rebuild Opening Slice**
after opening the project. The editor tool reads the repository-level JSON,
imports the canonical guide FBX, reconstructs collision and anchors, and saves
`MW_Opening_VerticalSlice.unity`.

`MWOpeningTraversalProxy` and `MWOpeningSideCameraProxy` are clearly labeled
temporary validation components. They do not replace the deterministic browser
controller or either hero runtime.
