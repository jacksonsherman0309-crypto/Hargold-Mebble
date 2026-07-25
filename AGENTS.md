# Codex Instructions for Hargold & Mebble

Codex must read and follow `docs/game-mechanics.md` before planning, editing, reviewing, or testing gameplay code in this repository.

## Source of truth

- `docs/game-mechanics.md` is the canonical gameplay specification.
- Newer explicit user instructions override older rules and must be reflected in the canonical specification in the same change.
- Existing prototype behavior is not authoritative when it conflicts with the canonical specification.
- Do not silently simplify, omit, or reinterpret locked mechanics.
- Clearly mark temporary behavior for unresolved design items as provisional.

## Implementation expectations

- Preserve the strict linear side-scrolling gameplay plane and mobile-first landscape design.
- Keep hearts/current health separate from lives.
- Preserve the approved hero differences, checkpoint/death behavior, 100-coin life rule, block roster, power-up rules, enemy rules, boss five-hit standard, campaign structure, and World 1 teaching sequence.
- Do not copy Nintendo code, art, characters, enemies, levels, maps, music, names, or protected identifiers.
- Add or update tests for every mechanic changed.
- When code conflicts with `docs/game-mechanics.md`, fix the code rather than weakening the specification unless the user explicitly changes the design.

## Before completing a gameplay task

1. Read the relevant sections of `docs/game-mechanics.md`.
2. Inspect current code for conflicts with those rules.
3. Implement the requested behavior without breaking other locked mechanics.
4. Run the most relevant available checks.
5. Report any provisional behavior, missing assets, or unresolved design decisions clearly.
