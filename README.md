# Hargold & Mebble

Development repository for the mobile-first Hargold & Mebble side-scrolling platformer.

## Codex source of truth

Codex must begin with [`AGENTS.md`](AGENTS.md). The complete current handoff is divided into:

- [`docs/canonical-design-bible.md`](docs/canonical-design-bible.md) — complete current design direction, hero canon, campaign, visuals, audio, save, and production rules.
- [`docs/level-production-plan.md`](docs/level-production-plan.md) — World 1 plans, universal level requirements, Worlds 2–10 status, and historical-plan conflict handling.
- [`docs/game-mechanics.md`](docs/game-mechanics.md) — detailed gameplay mechanics.
- [`src/canonical-data.js`](src/canonical-data.js) — executable rules and campaign data for 10 worlds, 90 completion slots, and 270 Compass Coin slots.
- [`tests/canonical-contract.test.mjs`](tests/canonical-contract.test.mjs) — invariant checks for the approved game contract.
- [`docs/historical-build-handoff.md`](docs/historical-build-handoff.md) — preserved Build 025–030 planning information and honest production boundaries.

Newly approved mechanics, level plans, or designs should update the relevant documents, machine-readable data, implementation, and tests in the same change.

## Run the current browser prototype

Open `index.html` directly in a modern browser, or serve the repository through any static web server.

Current prototype controls:

- Move: `A` / `D` or arrow keys
- Jump: `Space`, `W`, or up arrow
- Swap hero: `Q`
- Restart: `R`

## Run canonical contract checks

```bash
npm test
```

## Current implemented prototype

- Landscape-first browser test build.
- Strict linear side-scrolling movement plane.
- Keyboard and on-screen controls.
- Basic movement, jumping, coins, pits, checkpoint, hero swapping, camera follow, and level goal.
- Placeholder canvas rendering pending approved production assets.
- Machine-readable canonical campaign and mechanics data.
- Automated contract tests.

## Current production status

This repository now gives Codex the complete **current approved information** available for mechanics, design direction, campaign accounting, World 1 level plans, later-world themes/bosses, universal level requirements, historical build concepts, and open decisions.

It does **not** yet contain a complete commercial 3D game. The following still require real implementation and assets:

- Full 90-level collision geometry and playable layouts.
- Complete enemies, bosses, combat, power-ups, saves, world map, houses, inventory, replay, pooling, editor, and audio integration.
- Production 3D models, skeletons, skin weights, materials, textures, and animation clips.
- Final music, sound effects, nonverbal recordings, and localization content.
- A complete Unity project, mobile build pipeline, and target-device profiling.

Planning documents, manifests, tests, and contracts must never be reported as finished production assets.

## Development rule

Gameplay code, level data, approved assets, tests, progress notes, and every newly approved mechanic or design decision should be committed here so Codex and collaborators work from the actual project state rather than chat-only history.
