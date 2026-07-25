# Codex Instructions for Hargold & Mebble

Codex must load the current design, mechanics, movement, level-planning, machine-readable contracts, source inventory, and any newly imported files before planning, editing, reviewing, or testing this repository.

## Required reading order

1. `docs/canonical-design-bible.md` — highest-level current design source of truth.
2. `docs/level-production-plan.md` — current campaign and level-construction requirements.
3. `docs/game-mechanics.md` — detailed gameplay mechanics.
4. `docs/movement-and-collision-spec.md` — complete universal movement, collision, terrain, water, climbing, carrying, and deterministic-simulation contract.
5. `src/canonical-data.js` — machine-readable rules, campaign accounting, World 1 plans, and locked hero data.
6. `archive/physics/build-017-movement-spec.md` and `archive/physics/physics_completion_matrix.json` — archived full Build 017 physics contract.
7. `archive/full-motion/hargold_mebble_full_motion_build_009_qa.json` — archived QA evidence for the earlier playable motion build.
8. `docs/historical-build-handoff.md` — older Build 025–030 plans and explicit production boundaries.
9. `docs/archived-source-inventory.md` — actual earlier standalone code artifacts and their transfer status.
10. If `IMPORT_STATUS.txt` exists, read it and inspect every imported file it lists.
11. The current implementation files relevant to the task.

## Authority and conflict rules

- A newer explicit user instruction overrides an older rule.
- Reflect newly approved rules in the relevant canonical documents and `src/canonical-data.js` in the same change when applicable.
- Current canonical documents override conflicting historical Build 025–030 material.
- Existing placeholder prototype behavior is not authoritative when it conflicts with current canon.
- Do not silently simplify, omit, reinterpret, or replace locked mechanics and designs.
- Clearly mark unresolved design items and temporary implementations as provisional.
- Do not adopt historical world names, themes, bosses, or level plans as current canon when they conflict with newer documents.
- Do not claim an archived file has been imported unless it actually exists in this repository or is listed by `IMPORT_STATUS.txt`.

## Imported-file workflow

- The user can place downloaded files in `DROP_FILES_HERE` and run `IMPORT_FILES.bat`.
- The importer copies known files into `archive/full-motion`, `archive/level-editor`, `archive/physics`, `assets/references`, `assets/blender`, or `assets/exports`.
- When `IMPORT_STATUS.txt` appears, inspect those files before giving a completeness assessment.
- Do not overwrite current canon with obsolete numerical values from an archived standalone build.
- Extract reusable systems into modular source with tests rather than making a monolithic archived HTML file the production entry point.
- Character-reference images are locked visual references, not editable rigged 3D models.

## Implementation expectations

- Preserve the strict linear side-scrolling gameplay plane and mobile-first landscape design.
- Preserve the fully rendered 3D “2.75D” production target without adding free depth-lane movement.
- Keep hearts/current health separate from lives.
- Preserve the complete shared movement baseline: walking/running, skids, variable/running/triple jumps, coyote time, buffering, wall slides/jumps, crouch and slides, spin actions, fast fall, ground slam, stomp bounce, one-way platforms, swimming/diving, climbing, ropes, carrying/throwing, moving-platform transport, and safe hero swapping.
- Preserve universal wall jumps, approved hero additions, hero-gating rules, checkpoint/death behavior, 100-coin life rule, four-block roster, power-up rules, enemy rules, five-damage-event bosses, 10-world/90-slot campaign accounting, 270 Compass Coin slots, and World 1 teaching sequence.
- Preserve the locked Hargold and Mebble appearance requirements.
- Do not copy Nintendo code, art, characters, enemies, levels, maps, music, names, vocal performances, or protected identifiers.
- Add or update tests for every mechanic, data contract, save rule, progression rule, or level-plan invariant changed.
- When code conflicts with the canonical documents, fix the code rather than weakening the specification unless the user explicitly changes the design.

## Code and data requirements

- Put shared approved constants and campaign facts in `src/canonical-data.js` rather than duplicating incompatible values.
- Use deterministic fixed-step simulation for production movement systems; `src/runtime/fixed-step.js` is the current reusable foundation.
- Keep level implementation data separate from design-only placeholders.
- Do not invent coordinates for historical coordinate-free level scaffolds and then present them as approved geometry.
- Do not claim a level, model, animation, audio asset, Unity scene, or system is complete unless the actual implementation is committed and verified.
- Planning documents, schemas, manifests, and contracts are not substitutes for production assets or playable implementation.
- Keep the runnable browser prototype functional while larger systems are developed.

## Validation

Run at minimum:

```bash
npm test
```

Also run any task-specific checks available for gameplay, rendering, level data, save migration, or mobile layout.

## Before completing any game-development task

1. Read the relevant canonical documents in the order above.
2. Read `IMPORT_STATUS.txt` when present and inspect its files.
3. Inspect current code and data for conflicts.
4. Distinguish current canon from historical reference material.
5. Implement the requested behavior without breaking other locked mechanics.
6. Update canonical docs/data when the user has approved a new rule.
7. Add or update tests.
8. Run the most relevant checks.
9. Report what is actually implemented, what remains provisional, which production assets/source files are missing, and any unresolved design decisions.
