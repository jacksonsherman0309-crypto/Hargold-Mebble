# Hargold & Mebble

Development repository for the mobile-first Hargold & Mebble side-scrolling platformer.

## Import the complete earlier game work

The earlier campaign must be imported as world-specific and level-specific authored material—not converted into a universal level generator.

After pulling the latest changes in GitHub Desktop:

1. Open the `Hargold-Mebble` folder.
2. Open `DROP_FILES_HERE`.
3. Drag downloaded old files, complete folders, or ZIP packages into it.
4. Return to the main `Hargold-Mebble` folder.
5. Double-click `IMPORT_FILES.bat`.
6. Tell Codex:

```text
Read AGENTS.md, docs/world-specific-archive-policy.md, and IMPORT_STATUS.txt. Inventory the complete imported package before changing code. Preserve every authored world's and level's mechanics, enemy placements, encounter waves, and boss structure. Do not replace them with a universal level template.
```

The importer:

- accepts files, folders, and ZIP packages;
- keeps original filenames and folder structure;
- expands ZIPs while preserving the original ZIP;
- stores every import under a timestamped `archive/imported-packages` folder;
- creates `IMPORT_STATUS.txt` with the complete imported-file inventory;
- copies files without deleting the originals.

## World-specific implementation policy

Codex must follow [`docs/world-specific-archive-policy.md`](docs/world-specific-archive-policy.md).

Each course retains its authored identity, mechanics, beat flow, enemy roster and purpose, encounter waves, checkpoint, power-up support, Compass Coin solutions, hero requirements, routes, difficulty variants, and final set piece. Boss courses also retain their exact approach, arena, attacks, five earned damage events, mutations, retry rules, and playable escape where specified.

Shared schemas, loaders, validators, pooling, simulation, and editor tools may support the campaign. They may not generate generic replacements for authored courses.

## Archived files already added directly

These smaller files are already in GitHub:

- `archive/full-motion/hargold_mebble_full_motion_build_009_qa.json`
- `archive/physics/build-017-movement-spec.md`
- `archive/physics/physics_completion_matrix.json`

The larger standalone HTML builds, complete archived preproduction files, character-reference images, and any package folders still require the drag-and-import step because the File Library connection cannot transfer their complete contents directly into GitHub.

## Codex source of truth

Codex must begin with [`AGENTS.md`](AGENTS.md). Key sources include:

- [`docs/canonical-design-bible.md`](docs/canonical-design-bible.md) — current design direction and hero canon.
- [`docs/world-specific-archive-policy.md`](docs/world-specific-archive-policy.md) — mandatory authored-course preservation policy.
- [`docs/level-production-plan.md`](docs/level-production-plan.md) — current campaign requirements.
- [`docs/game-mechanics.md`](docs/game-mechanics.md) — gameplay mechanics.
- [`docs/movement-and-collision-spec.md`](docs/movement-and-collision-spec.md) — movement and interaction contract.
- [`src/canonical-data.js`](src/canonical-data.js) — current executable rules and campaign facts.
- [`src/runtime/fixed-step.js`](src/runtime/fixed-step.js) — deterministic 120 Hz simulation foundation.
- [`docs/locked-meshy-animation-production.md`](docs/locked-meshy-animation-production.md) — current locked character assets, animation clips, validation course, quarantine policy, and verified source-rig limits.
- [`docs/historical-build-handoff.md`](docs/historical-build-handoff.md) — archived Build 025–030 scope and production boundaries.
- `archive/imported-packages` — preserved complete world, level, mob, boss, and runtime archives after import.

## Run the current browser prototype

Open `index.html` directly in a modern browser, or serve the repository through a static web server.

Current controls:

- Move: `A` / `D` or arrow keys
- Jump: `Space`, `W`, or up arrow
- Ground slam / fast fall: `S` or down arrow
- Attack / interact: `E`
- Swap hero: `Q`
- Restart: `R`

Holding left or right automatically accelerates from the slower movement tier
to full running speed. There is no separate run or sprint button.

Animation validation is available at:

```text
?animationValidation=1&debugAnimation=1
```

The live Meadow Wake course can be opened with its implemented gameplay
abilities and survivable health fully unlocked for testing:

```text
?fullyUnlocked=1
```

This URL-scoped test profile grants Hargold's learned double jump, three health
layers, and 99 lives. Mebble's innate glide and the shared twirl, ground slam,
combat, and safe hero swap remain available through their normal controls. It
does not write progression or represent the still-unimplemented elemental
power-up set; the ordinary URL keeps normal starting progression.

## Run contract checks

```bash
npm test
```

## Current production boundary

The repository currently contains a playable browser prototype, canonical specifications, partial runtime foundations, and whichever archived packages have actually been imported.

The archived Build 018–030 work includes substantial enemy catalogs, combat and interaction rules, boss runtimes and plans, encounter scheduling, pooling, save/progression, editor data, and distinct plans for 90 courses. Some archived geometry outputs deliberately contain pending positions rather than finished collision coordinates.

The repository now contains the locked original user-supplied Meshy Hargold and
Mebble visible meshes, 24-bone skins, embedded materials/textures, supplied
walk/run clips, and a modular controller-linked body-animation package. These
are real runtime assets.

The locked source rigs still do not contain facial morphs, finger bones,
independent cape/hat/glasses/accessory controls, pose-space correctives, or
mobile LODs. The project also does not contain completed collision geometry for
the current 83-slot campaign, a full Unity project, final audio, or
target-device profiling. The older 90-slot scaffolds remain preserved pending
the authored World 1–7 slot remap required by
`docs/campaign-level-count-override.md`.

Planning documents, schemas, manifests, tests, and contracts must never be reported as completed production assets.
