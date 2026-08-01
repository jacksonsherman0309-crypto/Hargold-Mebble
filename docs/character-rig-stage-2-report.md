# Character production rig Stage 2 report

Date: August 1, 2026
Status: **PASS — unskinned control architecture; Stage 3 remains blocked pending explicit authorization**

## Scope and authority

This pass upgrades the audited Stage 1 Blender scaffolds into purposeful,
original production skeleton and animator-control architectures. It does not
change either locked visible Meshy surface. It does not add an armature
modifier, weights, skinning, topology edits, corrective sculpture, actions,
candidate GLBs, or a runtime switch.

The active browser runtime therefore remains on the original 24-bone Meshy
rollback GLBs. These Stage 2 sources are authoring assets only.

Blender version: **5.2.0 LTS** (`fbe6228777e7`).

## Authoritative sources and counts

| Hero | Blender source | SHA-256 | Body deform | Accessory deform | Total export deform | Animator controls | Helpers | Sockets |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Hargold | `assets/blender/production/hargold_production_rig.blend` | `B79765AF02E00AF9FCC4CE2DF541A05B2D4F794EC2FC1E5F445EF77E5EFFEE0C` | 44 | 10 | 54 | 76 | 24 | 17 |
| Mebble | `assets/blender/production/mebble_production_rig.blend` | `B4C277F19FBA17BAFDB73E00397EE3AB9FFBA39265F143245ED085D142092BB0` | 46 | 16 | 62 | 78 | 24 | 17 |

All control and helper bones have `use_deform=false`. Only the 54 Hargold and
62 Mebble export-deform bones may become mesh influencers during Stage 3.

## Root, body and presentation architecture

The controller-owned root chain is separated from visual presentation:

`CTRL_world → CTRL_motion → CTRL_presentation → action presentation → CTRL_com → CTRL_pelvis`

Normal gameplay world translation remains controller-owned. Compression,
lean, twist, ground-slam somersault presentation, Hargold's twirl, and
Hargold's double-jump asymmetry occur below `CTRL_motion`; they cannot rotate
or translate the collision/world root.

Both rigs include pelvis, lower/middle/upper spine, chest, clavicle and head
controls. Hargold has the compact one-segment neck control. Mebble has separate
base, middle and upper neck controls plus head, neck-shape and Adam's-apple
interfaces.

## IK/FK inventory

Each side has an independent `0..1` animator-visible switch:

- Arms: `arm_ik_fk_L`, `arm_ik_fk_R`
  - FK: upper arm, forearm, hand controls
  - IK: non-stretch two-bone mechanism, hand target and elbow pole
- Legs: `leg_ik_fk_L`, `leg_ik_fk_R`
  - FK: thigh, shin, foot and toe controls
  - IK: non-stretch two-bone mechanism, foot target and knee pole
  - Foot mechanism: heel, bank, ball, toe and foot-target helpers

`tools/blender/production_rig_stage_2_snap.py` provides pose-preserving arm and
leg IK/FK snapping. Neutral round-trip validation passed at the required
`0.0001 m` end-effector tolerance for all eight switch operations per hero.

Each foot exposes world placement, foot roll, heel lift, ball roll, toe roll,
bank, dorsiflexion, plantarflexion, skid orientation, crouch placement, slide
placement, landing compression and ground-slam contact properties. The
heel/ball/toe drivers were evaluated in Blender, not inferred from metadata.

## Hands and face

Each hand has a blendable selector and compact thumb/main-finger/outer-finger
controls. The nine readable shapes are relaxed open, running cup, fist,
landing brace, skid brace, strike, grab, carry and victory. Driver evaluation
confirmed a nonzero blended control result. Mesh deformation remains a Stage 3
gate.

`CTRL_face` defines eye aim horizontal/vertical, blink, brow raise/compression,
neutral/open mouth, effort/grit, hurt, surprise, victory, cheek correction,
jaw correction and head stabilization. Separate eye, upper/lower lid, brow,
mouth-corner, upper/lower lip, cheek and jaw control/deform interfaces are
present. Final facial shape sculpting and deformation are intentionally not
claimed.

## Accessory architecture

Every major visible accessory records parent space, follow default, lag
interface, animator override, reset pose, export policy and future clipping
responsibility in the per-hero inventory.

- Hargold: hat, two-bone feather chain, scarf root and independent tails,
  backpack, belt, pouch and facial-hair/jaw follow.
- Mebble: top hat, glasses/head stabilization, Adam's-apple/middle-neck follow,
  cape root, lateral yokes and wings, belt and pouch.

Mebble's cape interface includes closed rest, locomotion trail, jump lift,
glide opening, fully open, sustained curvature, directional roll, glide close
and landing settle. The controls are animator-overridable; uncontrolled physics
is not the sole solution.

## Sockets and semantic map

Each rig has 17 bone-bound sockets: gameplay root, center of mass, head, hat,
both hands, both feet, back/backpack, carry, held item left/right, power-up,
interaction, effect origin, ground-slam impact, and the hero's scarf/cape
origin.

The versioned map is `data/production-character-rig-semantic-map.json`, schema
version **2**. It lists every export deform, animator control and helper,
complete IK/FK and foot/hand/face/accessory interfaces, all sockets,
hero-specific action controls, the interim 24-bone migration map, deprecated
paths and live rollback paths. The runtime does not consume it yet.

## Control-test pose evidence

- Hargold: 34 true-side control tests at
  `assets/previews/rig-stage-2/hargold-control-pose-review.png`
- Mebble: 35 true-side control tests at
  `assets/previews/rig-stage-2/mebble-control-pose-review.png`

Together the sheets cover all 37 required pose names, with hero-exclusive
tests only on the correct rig: Hargold double jump and twirl; Mebble glide
opening, fully open and sustain. Every recorded result uses animator controls,
reports no direct deform-bone editing, and reports stable hierarchy/no solver
flip. These are rigid control-solved skeleton tests, not final animation or
mesh-deformation approval.

## Exact validation results

Commands:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\production\hargold_production_rig.blend --python tools\blender\validate_production_rig_stage_2.py -- --hero Hargold
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets\blender\production\mebble_production_rig.blend --python tools\blender\validate_production_rig_stage_2.py -- --hero Mebble
node tests/character-rig-stage-2.test.mjs
npm test
```

Blender results:

- Hargold: **44/44 checks passed, 0 failed**
- Mebble: **45/45 checks passed, 0 failed**

Repository results:

- Stage 2 Node suite: **5/5 passed, 0 failed**
- retained Stage 1 evidence suite: **5/5 passed, 0 failed**
- production-checklist contract: **passed**
- complete package test script (run with the bundled `pnpm test` launcher
  because this desktop runtime does not expose an `npm` executable): **exit 0;
  all canonical, character, animation, movement, physics, world, level, terrain
  and art-pipeline groups passed**

## Gate decision

Unresolved Stage 2 issues: **none**.

Stage 2 passes. Stage 3 has not started and is not authorized by this pass.
Production skinning, weight painting, topology correction, corrective shapes,
final hand/face/cape deformation, candidate export, runtime switching and final
animation production all remain blocked behind their later explicit gates.
