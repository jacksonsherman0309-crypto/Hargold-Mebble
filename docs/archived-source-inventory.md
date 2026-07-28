# Hargold & Mebble — Archived Source Artifact Inventory

Last reviewed: July 25, 2026

This inventory identifies actual earlier standalone code artifacts found in the user’s File Library. It prevents Codex from confusing those artifacts with files currently committed to GitHub.

## Transfer limitation

The connected GitHub repository and the user’s ChatGPT File Library are separate sources. The available tooling can search and read portions of File Library files but cannot reliably transfer the complete bytes of very large standalone HTML files into GitHub. Therefore, files marked **File Library only** are not currently present in this repository.

Codex must not claim they are imported or use their absence as permission to forget the documented mechanics.

## Actual archived playable/editor artifacts

### `hargold_mebble_full_motion_build_009.html`

Status: **Imported unchanged at `archive/full-motion/hargold_mebble_full_motion_build_009.html`**.

Type: large standalone landscape HTML/Canvas playable build with embedded image assets.

Known contents:

- 1536 × 864 internal canvas.
- Landscape rotation requirement.
- Mobile touch hit areas for left, right, run, jump, attack, swap, and pause.
- Hargold and Mebble movement profiles.
- Distinct collider and movement values.
- Variable jump behavior.
- Mebble glide values.
- Terrain and platform definitions.
- Embedded rendered character/background assets.
- Play-state and QA companion file.

Companion artifact:

- `hargold_mebble_full_motion_build_009_qa.json`
- Reported checks for asset loading, play state, acceleration/grounding, takeoff, landing, and hero swapping.

Use:

- Historical implementation reference only.
- Do not overwrite current canon with any obsolete values or art contained in the standalone file.
- Prefer rebuilding current systems as modular tested source rather than continuing one extremely large embedded HTML file.

### `hargold_mebble_level_editor.html`

Status: **Imported unchanged at `archive/level-editor/hargold_mebble_level_editor.html`**.

Type: standalone visual browser level editor.

Known contents:

- Landscape editor interface.
- Tool and asset sidebars.
- Grid workspace.
- Object placement and selection.
- Layer handling.
- Platforms, hazards, enemies, blocks, pickups, checkpoint, secret exit, and goal objects.
- Undo/redo.
- Local save and JSON import/export.
- Simplified playable preview.
- A long Meadow Wake-style sample layout containing rope bridge, Camp Sentry, checkpoint, moving platforms, Compass Coins, Spike Beetles, reinforced blocks, Stonefist, secret exit, Camp Chipper, Camp Critter, Shellback, and goal.

Use:

- Interface and workflow reference.
- Not a production Unity editor.
- Its simplified preview physics are not authoritative over the current movement specification.

## Earlier standalone Meadow Wake builds

These are **File Library only** and represent iterative prototypes rather than current canonical code:

- `meadow_wake_play.html`
- `play_meadow_wake.html`
- `hargold_mebble_meadow_wake_landscape.html`
- `hargold_mebble_meadow_wake_landscape_v2.html`
- `hargold_mebble_meadow_wake_motion_build_002.html`
- `hargold_mebble_meadow_wake_mob_motion_build_003.html`
- `hargold_mebble_full_motion_high_res_build_005.html`

Known historical systems across these builds include:

- canvas platforming;
- mobile controls;
- character swapping;
- checkpoints;
- health/shield prototypes;
- particles and generated tones;
- moving platforms;
- enemies and projectiles;
- basic blocks and pickups;
- goal/level completion;
- large self-contained embedded assets.

These builds contain obsolete or provisional health values, character behavior, layouts, and visual decisions. They are references, not current canon.

## Archived model-independent specification/data artifacts

These File Library artifacts contain detailed contracts and QA information:

- `movement_spec.md` — Build 017 universal movement/collision specification.
- `physics_completion_matrix.json` — universal and hero-specific movement feature matrix.
- `qa_report.json` — measured movement test output.
- `level_geometry_scaffolds.json` — coordinate-free scaffolds for 90 completion slots.
- `encounter_zone_manifest.json` — seven-zone encounter budgets and spawn-safety contracts.
- `world_10_construction_plan.md` and other world construction plans — historical level concepts.
- `music_text_and_vocalization_canon.md` — music/text/nonverbal-audio contracts.
- Build verification and QA summaries for Builds 018–030.

The current GitHub documents preserve the approved portions of these artifacts and clearly identify conflicts.

## Current GitHub replacements/foundations

The repository currently uses modular files instead of relying on the archived monolithic HTML files:

- `index.html`, `styles.css`, `src/game.js` — current lightweight browser prototype.
- `src/canonical-data.js` — machine-readable current canon.
- `src/runtime/fixed-step.js` — deterministic fixed-step foundation.
- `tests/` — current contract tests.
- `docs/canonical-design-bible.md` — current design authority.
- `docs/level-production-plan.md` — current level authority.
- `docs/movement-and-collision-spec.md` — reconciled comprehensive movement contract.
- `docs/historical-build-handoff.md` — historical production summary.

## Recommended future import procedure

When full File Library bytes can be supplied directly to the repository workspace:

1. Commit the untouched archived artifacts under `archive/standalone-builds/`.
2. Do not make them the production entry point.
3. Extract reusable systems into modular `src/runtime/`, `src/gameplay/`, `src/levels/`, and `src/editor/` files.
4. Replace embedded provisional values with imports from canonical data.
5. Add regression tests before deleting or superseding old implementations.
6. Preserve the original archive files for traceability.
7. Mark obsolete behavior clearly rather than silently carrying it forward.

## 2026-07-27 Meshy character animation packages

Five user-supplied Meshy archives were preserved under `archive/imported-packages/20260727-meshy-animation`. Two Mebble ZIP files are byte-identical, leaving eight unique FBX/GLB files to inspect.

The complete source-file, archive-entry, mesh, material, texture, skeleton, bind-pose, action, timing, root-motion, coordinate-system, and hash inventory is in `data/character-animation-inventory.json`. The exact-selection and live-integration report is `docs/character-animation-import-report.md`.

Reusable content found:

- one Hargold walking take and one Hargold running take;
- one Mebble walking take and one Mebble running take;
- exact 24-bone skeleton compatibility within each hero's selected GLB set;
- user-supplied visible meshes and embedded base-color texture data.

The zero-duration `clip0` actions are bind/rest takes, not gameplay animation clips. Alternate FBX walking exports and duplicate animation-package meshes are retained for traceability but are not layered into the live scene.
