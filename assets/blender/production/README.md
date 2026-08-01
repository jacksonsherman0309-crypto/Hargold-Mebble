# Production character rig sources

These files follow the rig-first production path approved on July 31, 2026:

- `hargold_production_rig.blend`
- `mebble_production_rig.blend`

Each Blender source contains the exact locked Meshy bind surface baked to the
canonical metre height at object scale `1,1,1`, an immutable hidden copy of the
interim 24-bone source, a separate original Stage 1 production-rig scaffold,
12 semantic socket interfaces, reference guides, static scaffold-pose evidence,
and export/version metadata.

Stage 1 passes its source-integrity, coordinate, hierarchy, bone-roll,
classification, socket, and static rigid-envelope pose checks. The scaffolds
are intentionally **not skinned and not runtime assets**. They are not approved
production rigs yet. Stages 2-7—purposeful skeleton controls, constraints,
skinning, correctives, face/hands/accessories, deforming pose review, candidate
export, semantic integration, and runtime parity—must pass before the live GLBs
may change or final animation production may resume.

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
