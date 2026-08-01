# Character Rig Stage 3 Report

Date: August 1, 2026  
Blender: 5.2.0 LTS  
Status: **in progress; visual deformation gate failed**

Stage 3 was started on the locked Hargold and Mebble surfaces after the Stage 2 control-architecture pass. No candidate GLB was exported, no runtime asset was switched, and no final animation was authored.

## Implemented

- Preserved the locked base vertex positions, polygon topology, material assignments, and UV fingerprint.
- Added six purposeful twist deformers per hero: left/right upper arm, forearm, and thigh.
- Added a production armature modifier with preserve-volume skinning and corrective smoothing.
- Added thirteen driven joint correctives per hero covering shoulders, elbows, wrists, hips, knees, ankles, plus Hargold limb clearance or Mebble neck volume.
- Limited the diagnostic skin to two normalized influences per vertex.
- Generated fourteen true-side actual-mesh stress renders per hero.
- Kept all Blender action collections empty.
- Kept Stage 4, Stage 5, candidate export, runtime switching, and final animation blocked.

## Structural defect discovered and corrected

The first actual-mesh stress render exposed a genuine Stage 1/2 scaffold error. The estimated production shoulder and hip pivots did not line up with the working pivots in the preserved locked bind. Hargold's left shoulder, for example, was approximately 0.32 metres above the proven bind pivot.

The Stage 3 tooling now measures the preserved rollback bind, applies the canonical normalization factor, and aligns the core production deform and FK-control pivots to that evidence. This is a documented technical correction under the repository's joint-change rule; it does not alter either hero's visible identity.

## Why Stage 3 does not pass

The locked Meshy surfaces are not continuous production meshes. Hargold contains 13,791 disconnected surface islands and Mebble contains 5,290. Many layered garment islands also carry coarse cross-body source weights. Automatic remapping can keep the neutral pose intact, but actual shoulder, hip, crouch, slide, and slam poses expose holes or separate clothing layers.

The evidence sheets deliberately retain these failures. They are diagnostic artifacts, not approval sheets:

- `assets/previews/rig-stage-3/hargold-deformation-stress.png`
- `assets/previews/rig-stage-3/mebble-deformation-stress.png`

The structural validators pass 18 of 18 machine-checkable conditions for each hero: locked identity fingerprint, production modifiers, normalized weights, influence limit, twist bones, corrective drivers, evidence completeness, no actions, and later-gate blocking. The visual deformation gate remains failed because structural checks cannot substitute for a correct posed surface.

## Required manual completion pass

Stage 3 remains on the following work:

1. Manually weight-paint shoulders, armpits, torso, hips, knees, ankles, and wrists in Blender.
2. Consolidate or locally retopologize disconnected layered islands that open during articulation.
3. Separate Hargold's rear garment/backpack regions from arm weights.
4. Separate Mebble's vest/cape attachment from arm and torso holes.
5. Re-sculpt the corrective shapes after final weights, then rerun and approve every actual-mesh stress pose.

Stage 4 must not begin until these failures are resolved and Stage 3 is explicitly marked passed.

## Validation commands

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets/blender/production/hargold_production_rig.blend --python tools/blender/validate_production_rig_stage_3.py -- --hero Hargold
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets/blender/production/mebble_production_rig.blend --python tools/blender/validate_production_rig_stage_3.py -- --hero Mebble
node tests/character-rig-stage-3.test.mjs
```

Both Blender validators report `structuralChecksPass: true` and `stage3GatePass: false`. That is the intended honest result until the manual deformation pass is complete.
