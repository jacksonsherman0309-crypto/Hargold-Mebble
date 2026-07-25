# Codex Instructions for Hargold & Mebble

Codex must load the current design, mechanics, level-planning, and machine-readable contract files before planning, editing, reviewing, or testing this repository.

## Required reading order

1. `docs/canonical-design-bible.md` — highest-level current design source of truth.
2. `docs/level-production-plan.md` — current campaign and level-construction requirements.
3. `docs/game-mechanics.md` — detailed gameplay mechanics.
4. `src/canonical-data.js` — machine-readable rules, campaign accounting, World 1 plans, and locked hero data.
5. `docs/historical-build-handoff.md` — older Build 025–030 plans and explicit production boundaries.
6. The current implementation files relevant to the task.

## Authority and conflict rules

- A newer explicit user instruction overrides an older rule.
- Reflect newly approved rules in the relevant canonical documents and `src/canonical-data.js` in the same change when applicable.
- Current canonical documents override conflicting historical Build 025–030 material.
- Existing placeholder prototype behavior is not authoritative when it conflicts with current canon.
- Do not silently simplify, omit, reinterpret, or replace locked mechanics and designs.
- Clearly mark unresolved design items and temporary implementations as provisional.
- Do not adopt historical world names, themes, bosses, or level plans as current canon when they conflict with newer documents.

## Implementation expectations

- Preserve the strict linear side-scrolling gameplay plane and mobile-first landscape design.
- Preserve the fully rendered 3D “2.75D” production target without adding free depth-lane movement.
- Keep hearts/current health separate from lives.
- Preserve universal wall jumps, approved hero differences, hero-gating rules, checkpoint/death behavior, 100-coin life rule, four-block roster, power-up rules, enemy rules, five-damage-event bosses, 10-world/90-slot campaign accounting, 270 Compass Coin slots, and World 1 teaching sequence.
- Preserve the locked Hargold and Mebble appearance requirements.
- Do not copy Nintendo code, art, characters, enemies, levels, maps, music, names, vocal performances, or protected identifiers.
- Add or update tests for every mechanic, data contract, save rule, progression rule, or level-plan invariant changed.
- When code conflicts with the canonical documents, fix the code rather than weakening the specification unless the user explicitly changes the design.

## Code and data requirements

- Put shared approved constants and campaign facts in `src/canonical-data.js` rather than duplicating incompatible values.
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
2. Inspect current code and data for conflicts.
3. Distinguish current canon from historical reference material.
4. Implement the requested behavior without breaking other locked mechanics.
5. Update canonical docs/data when the user has approved a new rule.
6. Add or update tests.
7. Run the most relevant checks.
8. Report what is actually implemented, what remains provisional, which production assets are missing, and any unresolved design decisions.
