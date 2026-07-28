# Blender asset workflow

This workflow uses Blender's Python API for repeatable source creation,
validation, and gameplay export. Blender source files belong in
`assets/blender`; exported runtime models belong in `assets/exports`.

The verified local executable is:

```text
C:\Program Files\Blender Foundation\Blender 5.2\blender.exe
```

The PowerShell entry point accepts another executable through
`-BlenderExecutable`, so the repository is not dependent on one installation.

## Scene contract

- Metric units with one Blender unit equal to one meter.
- Gameplay travels on the X/Z plane; Y is controlled visual depth.
- `GAMEPLAY` contains meshes, armatures, and sockets intended for export.
- `COLLISION` contains authoring collision and is not exported by the default
  gameplay exporter.
- `SOCKETS` contains attachment/origin helpers.
- `REFERENCE` contains scale and modeling guides that are never gameplay
  exports.
- Gameplay mesh names start with `GEO_`, collision names with `COL_`, sockets
  with `SOCKET_`, reference helpers with `REF_`, and materials with `MAT_`.
- Set an object's custom `export_enabled` property to `false` to exclude it.

The approved Hargold and Mebble designs are locked. This template is a neutral
one-meter calibration asset and does not create or modify either character.
Character changes require explicit approval before editing.

`build_locked_characters.py` is the locked-sheet full-replacement builder. It
starts from a factory-empty scene, never reads the prior character sources, and
generates editable sources, GLBs, orthographic QA renders, and deformation-pose
renders. `validate_locked_character.py` verifies replacement provenance, UV and
packed PBR coverage, rig controls, facial properties, secondary rigs, every
required gameplay clip, runtime GLB skin, and Mebble's cape morph. Passing that
validator confirms technical completeness, not final art-director, topology,
deformation, or target-device approval.

## Commands

From the repository root:

```powershell
.\tools\blender\run-workflow.ps1 -Task CreateTemplate
.\tools\blender\run-workflow.ps1 -Task Validate
.\tools\blender\run-workflow.ps1 -Task Export
```

Validate or export another source file:

```powershell
.\tools\blender\run-workflow.ps1 -Task Validate -BlendFile assets\blender\prop.blend
.\tools\blender\run-workflow.ps1 -Task Export -BlendFile assets\blender\prop.blend -ExportPath assets\exports\prop.glb
```

The exporter validates first and stops on contract errors. It exports only
eligible objects in `GAMEPLAY` as a binary glTF (`.glb`), with transforms
applied for runtime use.
