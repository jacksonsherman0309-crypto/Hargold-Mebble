# Production character rig sources

These files begin the rig-first production path approved on July 31, 2026:

- `hargold_production_rig.blend`
- `mebble_production_rig.blend`

Each Blender source contains the exact locked Meshy bind surface baked to the
canonical metre height at object scale `1,1,1`, an immutable hidden copy of the
interim 24-bone source, a separate original Stage 1 production-rig scaffold,
Stage 1 socket interfaces, reference guides, and export/version metadata.

The new rig scaffolds are intentionally **not skinned and not runtime assets**.
They are not approved production rigs yet. Stages 2–7—joint placement,
constraints, skinning, correctives, face/hands/accessories, pose review,
candidate export, semantic integration, and runtime parity—must pass before
the live GLBs may change or final animation production may resume.

Rebuild both sources with Blender 5.2 LTS:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python tools/blender/build_production_rig_sources.py -- --hero Hargold
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python tools/blender/build_production_rig_sources.py -- --hero Mebble
```

Validate them with `tools/blender/validate_production_rig_stage_0_1.py`.
