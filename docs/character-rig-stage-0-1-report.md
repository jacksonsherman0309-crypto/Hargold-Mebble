# Character rig production — Stage 0 and Stage 1 report

Date: July 31, 2026
Status: Stage 0 complete; Stage 1 authoring sources created; production rigs not established

## Outcome

The live 24-bone Meshy GLBs remain unchanged and continue to be the browser
runtime. Byte-identical rollback paths now preserve those assets. No candidate
GLB was exported, no renderer path was changed, and no final animation work was
performed.

Editable Blender 5.2 sources now exist at:

- `assets/blender/production/hargold_production_rig.blend`
- `assets/blender/production/mebble_production_rig.blend`

Each source contains the locked visible bind surface at canonical metres and
object scale `1,1,1`, the interim rig as a hidden migration/rollback reference,
an original unskinned production-rig scaffold, Stage 1 socket interfaces, and
reference/export metadata. Imported Meshy actions are not retained in these
authoring sources.

## Baseline and locked surface

| Hero | Live/rollback SHA-256 | Source bind height | Canonical source height | Mesh | Skin/material |
| --- | --- | ---: | ---: | --- | --- |
| Hargold | `A045E299A3F63EC45765C36D436EEF8C53AFDEE4BB7BDC98FD0A23537ABBEBEC` | 1.699999752 m | 1.82 m | `Hargold_Approved_Mesh` | `Hargold_Canonical_Skin` / `Material_1` |
| Mebble | `392D8F9C12AD140AFA738AB118D3C3A63F9A40DA41DD8A061FE8A37F91DE3A3B` | 1.700000434 m | 2.2932 m | `Mebble_Approved_Mesh` | `Mebble_Canonical_Skin` / `Material_1` |

Both source GLBs have 24 deform bones, no morph targets, and no named gameplay
sockets. Their packed 4096² material images remain available through the
preserved imported material data.

## Stage 1 rig scaffolds

| Hero | Body deform | Accessory deform | Controls | Helpers | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Hargold | 23 | 10 | 17 | 4 | 54 |
| Mebble | 25 | 12 | 17 | 4 | 58 |

The shared scaffold includes world, motion/COM, pelvis, three torso regions,
clavicles, arms, hands, legs, feet, toes, IK targets, pole targets, head/gaze,
face anchor, hand-pose interfaces, and twist-helper placeholders. Hargold adds
hat, feather, scarf, backpack, belt, pouch, and facial-hair chains. Mebble adds
three neck regions, Adam's apple, hat, glasses, a seven-region cape chain,
belt, and pouch.

Counts are descriptive, not approval criteria. Constraints, IK/FK switching,
skin weights, correctives, facial deformation, hand deformation, accessory
dynamics, and pose performance have not yet been approved.

## Gate result

- Stage 0 baseline preservation: pass.
- Editable Blender sources: pass.
- Canonical static locked surfaces: pass.
- Production topology approval: pending.
- Production armature approval: pending; current objects are unskinned Stage 1 scaffolds.
- Stages 2–7: not run.
- Final animation production: blocked.

Machine-readable detail is in
`data/production-character-rig-stage-0-1.json` and
`data/production-character-rig-semantic-map.json`. Per-hero source and Blender
validation reports are stored beside the `.blend` files.
