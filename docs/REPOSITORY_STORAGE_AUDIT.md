# Repository Storage Audit

Audit date: July 29, 2026

## Confirmed findings

- Repository metadata reports an approximate current size of 257,821 KB.
- The two active canonical Meshy gameplay rigs are approximately 37.4 MB and 37.9 MB respectively, accounting for roughly 75 MB together.
- Raw Meshy ZIP packages and expanded source folders are already intended to remain local and ignored rather than committed.
- The repository contains historical/rejected character pipelines, older campaign scaffolds, archived build material, and generated validation assets that require classification before deletion.

## Immediate cleanup safeguards added

- Added `docs/CURRENT_GAME_CANON.md` as the concise current-game summary.
- Added `docs/REPOSITORY_CLEANUP_POLICY.md` to prevent new raw archives and duplicate binaries from entering ordinary Git.
- Added `tools/repository-storage-audit.mjs` to generate a deterministic file-size and SHA-256 duplicate report from a local checkout.

## Required local audit command

Run from the repository root:

```bash
node tools/repository-storage-audit.mjs > repository-storage-audit.json
```

This produces:

- complete working-tree file count;
- total non-Git working-tree size;
- files at or above 5 MB;
- byte-identical duplicate groups based on SHA-256.

The threshold can be changed, for example:

```bash
LARGE_FILE_BYTES=1048576 node tools/repository-storage-audit.mjs
```

## Deletion gate

No large binary should be deleted solely from its name. Before removal, verify that it is not referenced by runtime code, build scripts, tests, manifests, documentation, or asset-validation tooling.

The following categories are expected cleanup candidates after the generated audit is reviewed:

- superseded procedural character GLBs and Blender sources;
- duplicate preview sheets and regenerated validation captures;
- old standalone builds duplicated by active source;
- archive packages already represented by concise inventories/manifests;
- repeated source and animation exports when one canonical processed runtime GLB is sufficient.

## Important Git-size limitation

Removing files in a normal commit reduces the checked-out main-branch tree but does not erase their bytes from prior Git history. A major reduction in clone size requires a separately approved history rewrite. That operation is intentionally excluded from this branch because it is disruptive and requires every collaborator to reclone or carefully reset.
