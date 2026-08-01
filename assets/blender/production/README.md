# Production character rig sources

These files follow the rig-first production path approved on July 31, 2026:

- `hargold_production_rig.blend`
- `mebble_production_rig.blend`

Each Blender source contains the exact locked Meshy bind surface baked to the
canonical metre height at object scale `1,1,1`, an immutable hidden copy of the
interim 24-bone source, a separate original production authoring rig,
17 semantic socket interfaces, reference guides, control-pose evidence,
and export/version metadata.

Stage 1 and Stage 2 pass. Stage 3 has started and has a structurally valid
diagnostic skin, six additional twist deformers per hero, thirteen driven
correctives per hero, and actual-mesh stress evidence. It does **not** pass the
visual deformation gate: the locked Meshy surfaces contain thousands of
disconnected layered islands that still open around articulated shoulders,
torso, hips, and knees. The `.blend` files are Stage 3 work-in-progress assets,
not runtime assets. Manual production weight painting and local topology repair
must complete before Stage 4, Stage 5, candidate export, runtime switching, or
final animation may begin. See `docs/character-rig-stage-3-report.md`.

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

Stage 2 is preserved as historical baseline evidence in
`data/production-character-rig-stage-2.json` and
`docs/character-rig-stage-2-report.md`. Its unskinned validators apply to the
Stage 2 commit, not to these newer Stage 3 work-in-progress sources.

Stage 3 diagnostic validation is documented in
`data/production-character-rig-stage-3.json`. Run it with:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets/blender/production/hargold_production_rig.blend --python tools/blender/validate_production_rig_stage_3.py -- --hero Hargold
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background assets/blender/production/mebble_production_rig.blend --python tools/blender/validate_production_rig_stage_3.py -- --hero Mebble
node tests/character-rig-stage-3.test.mjs
```
