# Codex Instructions for Hargold & Mebble

Codex must load the current canon, the world-specific archive policy, the exact authored course material relevant to the task, and the current implementation before planning, editing, reviewing, or testing this repository.

## Required reading order

1. `docs/canonical-design-bible.md` — highest-level current design source of truth.
2. `docs/character-dimension-animation-spec.md` — approved fully 3D construction, three-quarter presentation, rig, animation, camera-readability, and validation contract.
3. `docs/world-specific-archive-policy.md` — mandatory rule against flattening authored worlds and levels into a universal template.
4. `docs/level-production-plan.md` — current campaign and level-construction requirements.
5. `docs/game-mechanics.md` — detailed gameplay mechanics.
6. `docs/movement-and-collision-spec.md` — complete universal movement, collision, terrain, water, climbing, carrying, and deterministic-simulation contract.
7. `src/canonical-data.js` — machine-readable rules, campaign accounting, World 1 plans, and locked hero data.
8. `archive/physics/build-017-movement-spec.md` and `archive/physics/physics_completion_matrix.json` — archived full Build 017 physics contract.
9. `archive/full-motion/hargold_mebble_full_motion_build_009_qa.json` — archived QA evidence for the earlier playable motion build.
10. `docs/historical-build-handoff.md` — Build 025–030 handoff and production boundaries.
11. `docs/archived-source-inventory.md` — earlier standalone artifacts and their transfer status.
12. If `IMPORT_STATUS.txt` exists, read it, then inspect the complete package under the listed `archive/imported-packages/...` root.
13. Read every exact world plan, course plan, encounter manifest, enemy definition, runtime file, and boss contract relevant to the requested task.
14. Inspect the current implementation files relevant to the task.

## Authority and conflict rules

- A newer explicit user instruction overrides an older rule.
- Reflect newly approved rules in the relevant canonical documents and `src/canonical-data.js` in the same change when applicable.
- Current canonical documents override conflicting historical names, world assignments, boss identities, and numerical values.
- Preserve reusable historical code, course mechanics, enemy functionality, encounter scheduling, and boss logic when realigning old labels to current canon.
- Existing placeholder prototype behavior is not authoritative when it conflicts with current canon or authored archived content.
- Do not silently simplify, omit, reinterpret, replace, or universalize locked mechanics and authored course designs.
- Clearly mark unresolved design items and temporary implementations as provisional.
- Do not claim an archived file has been imported unless it actually exists in this repository or is listed by `IMPORT_STATUS.txt`.

## World-specific implementation rule

- Every world and every level is an individually authored design.
- Shared schemas, loaders, validators, simulation, pooling, and editor tools are support infrastructure only.
- A generic schema must store each course's authored content; it must never generate a replacement course or erase world-specific behavior.
- Before implementing a course, read its exact construction plan and preserve its identity, primary and secondary mechanics, authored beat flow, enemy counts and purposes, encounter waves, recovery gaps, checkpoint, power-up support, three Compass Coin solutions, hero-specific requirements, route connections, difficulty variants, and final signature.
- Before implementing a boss level, also read the exact boss contract and preserve its approach, arena, attacks, telegraphs, five earned damage events, mutations, retry rules, and playable escape where specified.
- Do not substitute an enemy archetype for a named mob when the archive defines that mob's distinct behavior or purpose.
- Do not replace authored enemy placements with generalized density rules.

## Imported-package workflow

- The user can place downloaded files, folders, or ZIP packages in `DROP_FILES_HERE` and run `IMPORT_FILES.bat`.
- The importer preserves the original structure under a timestamped `archive/imported-packages` directory and expands ZIP packages without deleting the originals.
- When `IMPORT_STATUS.txt` appears, inspect the entire imported package, not merely README or QA summaries.
- Build a source inventory before implementation: world plans, course plans, enemy catalogs, interaction matrices, encounter budgets, encounter zones, boss plans, runtime modules, tests, editor files, and playable HTML builds.
- Extract reusable systems into modular production source with tests rather than making a monolithic archived HTML file the permanent entry point.
- Character-reference images are locked visual references, not editable rigged 3D models.

## Implementation expectations

- Preserve the strict linear side-scrolling gameplay plane and mobile-first landscape design.
- Preserve the fully rendered 3D “2.75D” production target without adding free depth-lane movement.
- Keep hearts/current health separate from lives.
- Preserve the complete shared movement baseline: walking/running, skids, variable/running/triple jumps, coyote time, buffering, wall slides/jumps, crouch and slides, spin actions, fast fall, ground slam, stomp bounce, one-way platforms, swimming/diving, climbing, ropes, carrying/throwing, moving-platform transport, and safe hero swapping.
- Preserve universal wall jumps, approved hero additions, hero-gating rules, checkpoint/death behavior, 100-coin life rule, four-block roster, power-up rules, enemy rules, five-damage-event bosses, 10-world/90-slot campaign accounting, 270 Compass Coin slots, and authored teaching sequences.
- Preserve the locked Hargold and Mebble appearance requirements.
- Do not copy Nintendo code, art, characters, enemies, levels, maps, music, names, vocal performances, or protected identifiers.
- Add or update tests for every mechanic, data contract, save rule, progression rule, enemy behavior, boss counter, encounter rule, or level-plan invariant changed.
- When code conflicts with current canon, fix or adapt the code rather than weakening the specification unless the user explicitly changes the design.

## Code and data requirements

- Put shared approved constants and campaign facts in `src/canonical-data.js` rather than duplicating incompatible values.
- Use deterministic fixed-step simulation for production movement systems; `src/runtime/fixed-step.js` is the current reusable foundation.
- Keep implemented geometry, authored course data, and design-only coordinate-free scaffolds clearly distinguished.
- Do not invent coordinates for historical coordinate-free level scaffolds and then present them as approved geometry.
- Do not claim a level, model, animation, audio asset, Unity scene, enemy, boss, or system is complete unless the actual implementation is committed and verified.
- Planning documents, schemas, manifests, contracts, and passing structural tests are not substitutes for production assets or playable implementation.
- Keep the runnable browser prototype functional while larger systems are developed.

## Validation

Run at minimum:

```bash
npm test
```

Also run task-specific checks for gameplay, enemy behavior, boss counters, encounter schedules, rendering, level data, save migration, and mobile layout.

## Before completing any game-development task

1. Read the required canonical documents and world-specific archive policy.
2. Read `IMPORT_STATUS.txt` when present and inventory the complete imported package.
3. Read the exact world, course, enemy, encounter, and boss sources for the task.
4. Inspect current code and data for conflicts.
5. Distinguish current canon, reusable archived implementation, planning contracts, coordinate-free scaffolds, and genuinely playable code.
6. Implement the requested behavior without breaking other locked or authored content.
7. Update canonical docs/data when the user has approved a new rule.
8. Add or update tests.
9. Run the most relevant checks.
10. Report what is actually implemented, what was adapted from archives, what remains provisional, and which source/assets are still missing.
