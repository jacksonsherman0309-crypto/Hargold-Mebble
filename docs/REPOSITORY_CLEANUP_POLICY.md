# Repository Cleanup and Storage Policy

Last updated: July 29, 2026

## Goal

Keep the Git repository focused on current source, canonical data, tests, and only the runtime assets needed to build or validate the game. Large raw archives and duplicate source exports should live outside ordinary Git history.

## Keep in Git

- Active source code, tests, configuration, and current documentation.
- Small machine-readable manifests and validation reports.
- Current runtime-ready assets that are directly loaded by the game.
- Approved reference images that are needed for identity or validation.
- Reproducible asset-processing scripts.

## Keep out of ordinary Git

- Raw Meshy ZIP downloads and expanded duplicates.
- Duplicate FBX/GLB exports that are not active runtime targets.
- Blender autosaves, caches, rendered frame dumps, temporary previews, and local validation output.
- Old standalone HTML builds when equivalent source is already represented in the active runtime.
- Rejected procedural character exports and superseded generated meshes.
- Imported packages that are retained only as an archive and are not needed to run tests or build current assets.

## Large-file handling

- Do not commit a second copy of an active large binary merely to preserve history; Git already preserves prior commits.
- Store editable source packages and raw third-party/tool exports in external project storage or a release artifact, not in the main source tree.
- Use Git LFS for large binaries that must remain versioned and actively shared.
- Prefer optimized runtime GLB files with compressed textures and generated LODs over full-resolution working exports.
- Keep one authoritative runtime asset per hero/object and retain its checksum in a small manifest.

## Active character assets

The active live character files are:

- `assets/exports/meshy/hargold_canonical_gameplay_rig.glb`
- `assets/exports/meshy/mebble_canonical_gameplay_rig.glb`

Older procedural exports, duplicate animation-package meshes, and raw expanded Meshy packages are not active runtime authority. They may be removed from the current tree after references and build scripts are verified.

## Archive rules

- Historical design information that still has reference value should be compressed into concise Markdown or JSON summaries.
- Large archived binaries should not remain in the main branch solely because they appeared in an old build.
- Deletion from the current tree does not remove the file from Git history. A true repository-size reduction requires a separate, explicitly approved history rewrite using `git filter-repo` or BFG, followed by a coordinated force-push.
- Never perform a history rewrite automatically.

## Cleanup procedure

1. Inventory files by size and checksum.
2. Identify active runtime references.
3. Classify each large file as active, replaceable, duplicate, historical, or local-only.
4. Remove only verified duplicate/rejected/local-only files from the current branch.
5. Update manifests and references.
6. Run the full test suite and asset-loading checks.
7. Merge through a reviewable pull request.
8. Consider a separately approved history rewrite only after all collaborators have backed up or recloned.
