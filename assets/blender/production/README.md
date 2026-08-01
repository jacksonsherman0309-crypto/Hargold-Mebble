# Production character rig sources

These files follow the rig-first production path approved on July 31, 2026:

- `hargold_production_rig.blend`
- `mebble_production_rig.blend`

Each Blender source contains the exact locked Meshy bind surface baked to the
canonical metre height at object scale `1,1,1`, an immutable hidden copy of the
interim 24-bone source, a separate original production authoring rig,
17 semantic socket interfaces, reference guides, control-pose evidence,
and export/version metadata.

Stage 1 and Stage 2 pass. The files now contain the final unskinned deform
hierarchies, animator controls, IK/FK mechanisms and switches, snapping,
heel/ball/toe foot systems, hand-pose controls, facial interfaces, explicit
accessory controls and machine-readable sockets. They remain intentionally
**not skinned and not runtime assets**. Stages 3-7—skinning, correctives,
deforming pose review, candidate export, semantic integration, and runtime
parity—must pass before the live GLBs may change or final animation production
may resume.

Rebuild the original Stage 0/1 source foundation with Blender 5.2 LTS:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python tools/blender/build_production_rig_sources.py -- --hero Hargold
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python tools/blender/build_production_rig_sources.py -- --hero Mebble
```

Complete and validate Stage 1 with:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets/blender/production/hargold_production_rig.blend --python tools/blender/finalize_production_rig_stage_1.py -- --hero Hargold
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets/blender/production/mebble_production_rig.blend --python tools/blender/finalize_production_rig_stage_1.py -- --hero Mebble
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets/blender/production/hargold_production_rig.blend --python tools/blender/validate_production_rig_stage_1.py -- --hero Hargold
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets/blender/production/mebble_production_rig.blend --python tools/blender/validate_production_rig_stage_1.py -- --hero Mebble
```

The complete Stage 1 evidence is summarized in
`data/production-character-rig-stage-1.json`. The per-hero inventories beside
the `.blend` files contain every bone, parent, rest transform, local axis, roll
convention, socket, and static pose result.

Stage 2 is summarized in `data/production-character-rig-stage-2.json` and
`docs/character-rig-stage-2-report.md`. Validate it with:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets/blender/production/hargold_production_rig.blend --python tools/blender/validate_production_rig_stage_2.py -- --hero Hargold
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets/blender/production/mebble_production_rig.blend --python tools/blender/validate_production_rig_stage_2.py -- --hero Mebble
node tests/character-rig-stage-2.test.mjs
```
