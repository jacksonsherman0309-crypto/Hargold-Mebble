# Hargold & Mebble

Development repository for the mobile-first Hargold & Mebble side-scrolling platformer.

## Easiest way to give Codex old files

After pulling the latest repository changes in GitHub Desktop:

1. Open the `Hargold-Mebble` folder.
2. Open `DROP_FILES_HERE`.
3. Drag any downloaded old build, character image, Blender file, or editor file into that folder.
4. Return to the main `Hargold-Mebble` folder.
5. Double-click `IMPORT_FILES.bat`.
6. Tell Codex:

```text
Read AGENTS.md first. Then inspect IMPORT_STATUS.txt and every newly imported file.
```

The importer automatically sorts files into the correct archive, reference-image, Blender, or export folder. It copies files instead of deleting the originals.

## Archived files already added directly

These smaller files were transferred into GitHub already:

- `archive/full-motion/hargold_mebble_full_motion_build_009_qa.json`
- `archive/physics/build-017-movement-spec.md`
- `archive/physics/physics_completion_matrix.json`

The oversized standalone full-motion HTML build and character-reference PNG files still require the simple drag-and-import process above because the File Library connection cannot transfer their complete binary contents directly to GitHub.

## Codex source of truth

Codex must begin with [`AGENTS.md`](AGENTS.md). The complete current handoff is divided into:

- [`docs/canonical-design-bible.md`](docs/canonical-design-bible.md) — complete current design direction, hero canon, campaign, visuals, audio, save, and production rules.
- [`docs/level-production-plan.md`](docs/level-production-plan.md) — World 1 plans, universal level requirements, Worlds 2–10 status, and historical-plan conflict handling.
- [`docs/game-mechanics.md`](docs/game-mechanics.md) — detailed gameplay mechanics.
- [`docs/movement-and-collision-spec.md`](docs/movement-and-collision-spec.md) — full universal movement, terrain, water, climbing, rope, carrying, moving-platform, and deterministic-simulation contract.
- [`src/canonical-data.js`](src/canonical-data.js) — executable rules and campaign data for 10 worlds, 90 completion slots, and 270 Compass Coin slots.
- [`src/runtime/fixed-step.js`](src/runtime/fixed-step.js) — reusable deterministic 120 Hz simulation foundation.
- [`tests/canonical-contract.test.mjs`](tests/canonical-contract.test.mjs) and [`tests/fixed-step.test.mjs`](tests/fixed-step.test.mjs) — current automated contract checks.
- [`docs/historical-build-handoff.md`](docs/historical-build-handoff.md) — preserved Build 025–030 planning information and honest production boundaries.

Newly approved mechanics, level plans, or designs should update the relevant documents, machine-readable data, implementation, and tests in the same change.

## Run the current browser prototype

Open `index.html` directly in a modern browser, or serve the repository through any static web server.

Current prototype controls:

- Move: `A` / `D` or arrow keys
- Jump: `Space`, `W`, or up arrow
- Swap hero: `Q`
- Restart: `R`

## Run contract checks

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
- Deterministic fixed-step runtime foundation.
- Automated canonical and fixed-step contract tests.

## Current production status

This repository gives Codex the current approved information available for mechanics, movement/collision behavior, design direction, campaign accounting, World 1 level plans, later-world themes/bosses, universal level requirements, historical build concepts, and open decisions.

It does **not** yet contain a complete commercial 3D game. The following still require real implementation and assets:

- Full 90-level collision geometry and playable layouts.
- Complete enemies, bosses, combat, power-ups, saves, world map, houses, inventory, replay, pooling, editor, and audio integration.
- Production 3D models, skeletons, skin weights, materials, textures, and animation clips.
- Final music, sound effects, nonverbal recordings, and localization content.
- A complete Unity project, mobile build pipeline, and target-device profiling.

Planning documents, manifests, tests, and contracts must never be reported as finished production assets.

## Development rule

Gameplay code, level data, approved assets, tests, progress notes, and every newly approved mechanic or design decision should be committed here so Codex and collaborators work from the actual project state rather than chat-only history.
