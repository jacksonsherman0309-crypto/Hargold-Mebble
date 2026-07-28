# Character production checklist

Last updated: July 26, 2026

This is the binding completion order for both Hargold and Mebble. The
machine-readable authority is
`assets/blender/character-production-checklist.json`.

The silhouette, proportions, skeleton, and connected-body gates are approved.
That approval does not mark either character as a final production asset.
Animation polish remains frozen until joint deformation, facial topology, hand
topology, clothing integration, and surface refinement are complete.

## Current gate: joint deformation

Status: **in progress**.

The first structural pass uses preserve-volume armature deformation,
multi-segment B-Bone limb chains, and localized corrective-smooth masks on the
connected body, sleeve garments, trousers, and boot ankles. It covers:

- clavicle and shoulder bending, deltoid volume, and upper-arm twist;
- elbow bend volume and sleeve preservation;
- pelvis/hip rotation and upper-thigh volume;
- knee bending and pant silhouette;
- ankle-to-boot transition.

Structural implementation is not enough to close the gate. Both heroes must
pass the generated stress-pose sheet and senior visual review without joint
collapse, candy-wrapper twist, garment volume loss, or silhouette breaks.

The automated structural sub-gate passes for both active Blender sources and
runtime GLBs. Visual approval remains pending. The fixed-camera evidence is:

- `assets/previews/joint-deformation/hargold-joint-deformation-stress.png`
- `assets/previews/joint-deformation/mebble-joint-deformation-stress.png`

## Locked milestone order

- [x] Silhouette approved
- [x] Proportions approved
- [x] Skeleton approved
- [x] Connected body approved
- [ ] Joint deformation complete — structural pass; visual review pending
- [ ] Facial topology complete
- [ ] Hand topology complete
- [ ] Clothing integration complete
- [ ] Surface refinement complete
- [ ] Production UVs
- [ ] Final textures
- [ ] Final animation polish
- [ ] Gameplay validation
- [ ] LOD generation
- [ ] Export-ready production asset

No unchecked item may be reported as complete without the corresponding source
asset, automated validation where applicable, and visual evidence.
