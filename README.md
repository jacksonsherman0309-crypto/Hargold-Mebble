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

## Purpose-driven course construction

Use [`docs/purpose-driven-level-blueprint.md`](docs/purpose-driven-level-blueprint.md) when authoring, converting, reviewing, or implementing course geometry and encounters.

It establishes the required production grammar for:

- functional block and structural-terrain placement;
- permanent versus breakable route surfaces;
- grounded-route, platform, and pit composition;
- mechanic introduction and escalation;
- enemy placement as traversal choreography;
- recovery spacing, camera readability, and mandatory validation failures.

Use [`schemas/level-blueprint.schema.json`](schemas/level-blueprint.schema.json) for machine-readable authored blueprint data and [`data/level-blueprints/world-1-template.json`](data/level-blueprints/world-1-template.json) as a planning scaffold. The template must be replaced with each course's exact authored content; it is not a universal course generator.

## Locked course format and hero actions

[`docs/course-format-and-hero-action-amendment.md`](docs/course-format-and-hero-action-amendment.md) is the newest authority for course orientation and the affected movement animations. It locks the following repository-wide rules:

- no underwater levels or prolonged swimming courses;
- no vertical levels, vertical towers, or continuous vertical autoscroll;
- horizontal side-scrolling progression remains mandatory;
- Mebble's cape opens into a broad wing-like glide silhouette with limited slow-fall and horizontal correction;
- the general airborne twirl is removed unless a later explicit exception is approved;
- Hargold's slam is a belly-first flop;
- Mebble's slam is a fist-first dive bomb.

Machine-readable values are stored in [`data/canonical/course-and-action-amendment.json`](data/canonical/course-and-action-amendment.json) and validated by [`schemas/course-and-action-amendment.schema.json`](schemas/course-and-action-amendment.schema.json). Older documents, prototypes, tests, and archived plans must be migrated when they conflict.

## Archived files already added directly

These smaller files are already in GitHub:

- `archive/full-motion/hargold_mebble_full_motion_build_009_qa.json`
- `archive/physics/build-017-movement-spec.md`
- `archive/physics/physics_completion_matrix.json`

The larger standalone HTML builds, complete archived preproduction files, character-reference images, and any package folders still require the drag-and-import step because the File Library connection cannot transfer their complete contents directly into GitHub.

## Codex source of truth

Codex must begin with [`AGENTS.md`](AGENTS.md). Key sources include:

- [`docs/canonical-design-bible.md`](docs/canonical-design-bible.md) — current design direction and hero canon.
- [`docs/course-format-and-hero-action-amendment.md`](docs/course-format-and-hero-action-amendment.md) — newest course-orientation, cape-glide, twirl-removal, and hero-slam authority.
- [`docs/world-specific-archive-policy.md`](docs/world-specific-archive-policy.md) — mandatory authored-course preservation policy.
- [`docs/level-production-plan.md`](docs/level-production-plan.md) — current campaign requirements.
- [`docs/purpose-driven-level-blueprint.md`](docs/purpose-driven-level-blueprint.md) — functional terrain, blocks, pits, platforms, and enemy choreography contract.
- [`docs/game-mechanics.md`](docs/game-mechanics.md) — gameplay mechanics, except where superseded by the newer amendment.
- [`docs/movement-and-collision-spec.md`](docs/movement-and-collision-spec.md) — movement and interaction contract, except where superseded by the newer amendment.
- [`src/canonical-data.js`](src/canonical-data.js) — current executable rules and campaign facts.
- [`data/canonical/course-and-action-amendment.json`](data/canonical/course-and-action-amendment.json) — machine-readable newest rules pending migration into affected runtime modules.
- [`src/runtime/fixed-step.js`](src/runtime/fixed-step.js) — deterministic 120 Hz simulation foundation.
- [`docs/historical-build-handoff.md`](docs/historical-build-handoff.md) — archived Build 025–030 scope and production boundaries.
- `archive/imported-packages` — preserved complete world, level, mob, boss, and runtime archives after import.

## Run the current browser prototype

Open `index.html` directly in a modern browser, or serve the repository through a static web server.

Current controls:

- Move: `A` / `D` or arrow keys
- Jump: `Space`, `W`, or up arrow
- Swap hero: `Q`
- Restart: `R`

## Run contract checks

```bash
npm test
```

## Current production boundary

The repository currently contains a playable browser prototype, canonical specifications, partial runtime foundations, and whichever archived packages have actually been imported.

The archived Build 018–030 work includes substantial enemy catalogs, combat and interaction rules, boss runtimes and plans, encounter scheduling, pooling, save/progression, editor data, and distinct plans for 90 courses. Some archived geometry outputs deliberately contain pending positions rather than finished collision coordinates.

The project still does not contain finished production 3D meshes, skeletons, skin weights, materials, textures, animation clips, completed 90-level collision geometry, a full Unity project, final audio, or target-device profiling.

Planning documents, schemas, manifests, tests, and contracts must never be reported as completed production assets.
