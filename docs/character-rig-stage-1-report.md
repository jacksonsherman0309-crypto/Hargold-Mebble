# Character rig production — Stage 1 completion report

Date: July 31, 2026

Status: **Stage 1 passes; ready for Stage 2. No skinning or final animation is approved.**

## Stage 0 evidence reused

The live browser continues to use the unchanged interim Meshy GLBs. The
byte-identical rollback copies remain available and were not overwritten.

| Hero | Live and rollback SHA-256 | Runtime GLB | Rollback GLB |
| --- | --- | --- | --- |
| Hargold | `A045E299A3F63EC45765C36D436EEF8C53AFDEE4BB7BDC98FD0A23537ABBEBEC` | `assets/exports/meshy/hargold_canonical_gameplay_rig.glb` | `assets/exports/rollback/2026-07-31/hargold_interim_24bone.glb` |
| Mebble | `392D8F9C12AD140AFA738AB118D3C3A63F9A40DA41DD8A061FE8A37F91DE3A3B` | `assets/exports/meshy/mebble_canonical_gameplay_rig.glb` | `assets/exports/rollback/2026-07-31/mebble_interim_24bone.glb` |

No renderer, controller, collision, animation-library, or runtime asset path
was changed during Stage 1.

## Authoritative Blender sources

Blender `5.2.0 LTS` created and validated:

| Hero | Blender source | SHA-256 | Canonical height | Scale / floor / facing |
| --- | --- | --- | ---: | --- |
| Hargold | `assets/blender/production/hargold_production_rig.blend` | `1023FC83B1E11BAD3B9BF80215BDB377722B499EC6A02F9B78DEDDDB21747B05` | 1.82 m | `1,1,1` / Z=0 / native `-Y` |
| Mebble | `assets/blender/production/mebble_production_rig.blend` | `BA16271883A92529E74FF4B1D7C70881911F75BAB91BF3177F407FC8D55D557E` | 2.2932 m | `1,1,1` / Z=0 / native `-Y` |

The true-side validation camera looks along native `+X` toward the origin.
World up is `+Z`. Bone local `Y` is longitudinal, local `X` is the intended
side-view bend axis, and local `Y` remains the twist axis. Negative-scale
mirroring is forbidden.

The visible-mesh vertex, topology, UV, and material fingerprints were captured
before and after Stage 1. They are identical. Both sources open without missing
dependencies and contain zero animation actions.

## Source organization

Both `.blend` files use the following explicit top-level collections:

- `CHARACTER_MESH`
- `DEFORM_RIG`
- `CONTROL_RIG`
- `HELPER_CONTROLS`
- `ACCESSORY_RIG`
- `FACIAL_SYSTEM`
- `SOCKETS`
- `VALIDATION_POSES`
- `EXPORT`
- `REFERENCE_ONLY`

The single export-oriented armature uses matching Blender bone collections.
Only body and accessory deform bones have `use_deform=true`. Control and helper
bones cannot enter a deform-only export. `REFERENCE_ONLY` and
`VALIDATION_POSES` are explicitly excluded from the future candidate export.

## Scaffold inventories

| Hero | Body deform | Accessory deform | Controls | Helpers | Sockets |
| --- | ---: | ---: | ---: | ---: | ---: |
| Hargold | 24 | 10 | 25 | 6 | 12 |
| Mebble | 26 | 12 | 25 | 6 | 12 |

The shared central chain is `DEF_pelvis → DEF_spine_lower → DEF_spine_mid →
DEF_spine_upper → DEF_chest`. Hargold continues through one compact neck region;
Mebble continues through `DEF_neck_base → DEF_neck_mid → DEF_neck_upper`.
Both then use separate head and jaw regions.

Each side contains clavicle, upper arm, forearm, hand, thigh, shin, foot, and
toe regions. Upper-arm, forearm, and thigh helper regions reserve deliberate
twist distribution without being export-deforming bones. IK targets, pole
targets, foot-roll, toe-roll, pelvis, chest, head, gaze, face, and hand-pose
interfaces are classified separately from deform bones.

Hargold includes hat, two feather regions, scarf root and tails, backpack,
belt, pouch, and facial-hair scaffolds plus hat, feather, scarf, and backpack
interfaces. Mebble includes hat, glasses, Adam's apple, seven cape regions,
belt, and pouch scaffolds plus hat, glasses, cape, and neck-shape interfaces.

Every bone, parent, rest position, local axis, roll reference, classification,
and mirrored-pair error is listed in:

- `assets/blender/production/hargold_stage-1-rig-inventory.json`
- `assets/blender/production/mebble_stage-1-rig-inventory.json`

Both hierarchy audits pass. Both deliberate bone-roll audits pass. All mirrored
rest-pose errors are within the validator tolerance.

## Semantic sockets

Each source contains 12 Stage 1 semantic sockets:

- character root;
- gameplay center;
- head;
- hat;
- left and right hands;
- left and right feet;
- back or backpack;
- effect origin;
- ground-slam impact reference;
- Hargold scarf origin or Mebble cape origin.

The binding bone is recorded for every socket. Actual binding constraints are
properly deferred to Stage 2.

## Static scaffold-pose review

These are validation-only rigid envelopes, not animation clips and not
deformation approval. Each source contains and renders ten true-side tests:

1. deep crouch;
2. crouch-walk contact;
3. slide;
4. run extension;
5. planted skid;
6. jump anticipation;
7. heavy landing;
8. ground-slam maximum tuck;
9. ground-slam committed descent;
10. Hargold twirl midpoint or Mebble glide sustain.

All requested joints exist, all requested rotations are mechanically
achievable, grounded previews align to their floor line, Mebble retains three
neck regions and the complete cape chain, and Hargold's compact scaffold can
form the required tuck and twirl poses.

Review sheets:

- `assets/previews/rig-stage-1/hargold-scaffold-pose-review.png`
- `assets/previews/rig-stage-1/mebble-scaffold-pose-review.png`

## Export metadata

The stored future export contract is glTF 2.0, deform bones only, no animations,
no normal-gameplay root motion, and explicit reference/validation exclusion.
Candidate export remains disabled because Stage 6 has not begun.

## Result and remaining work

Stage 1 has no unresolved scaffold failures and passes its source-integrity,
coordinate, hierarchy, roll, system-separation, socket, and static-pose gates.

This does **not** establish the production rigs. The following remain pending:

- Stage 2 constraints, IK/FK switching, and final purposeful control architecture;
- Stage 3 skinning, topology corrections, and corrective deformation;
- Stage 4 hand, face, and production accessory systems;
- Stage 5 locked-surface deformation pose gate;
- Stage 6 candidate GLB export and semantic integration;
- Stage 7 runtime parity;
- Stage 8 final animation production.

Final animation work remains blocked.
