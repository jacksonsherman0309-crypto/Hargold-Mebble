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

## Hidden-block hints and Mebble X-ray View

[`docs/hidden-block-hint-and-xray-amendment.md`](docs/hidden-block-hint-and-xray-amendment.md) is the newest authority for hidden-block clues and Mebble's learned detection skill.

It locks these rules:

- hidden blocks may be hinted only by coins or approved weather interaction;
- Easy allows readable coin and weather hints;
- Normal allows reduced coin and weather hints;
- Hard prohibits coin hints and permits only a light, brief weather display;
- Impossible prohibits coin, weather, audio, lighting, scenery, UI, camera, and every other natural hint;
- Impossible replaces Nightmare as the fourth and highest difficulty label;
- Mebble learns `X-ray View`, which can reveal every hidden block category on every difficulty without automatically activating or consuming the blocks;
- mob design, behavior, placement, and roster remain untouched by this amendment.

Machine-readable values are stored in [`data/canonical/hidden-block-hint-and-xray-amendment.json`](data/canonical/hidden-block-hint-and-xray-amendment.json) and validated by [`schemas/hidden-block-hint-and-xray-amendment.schema.json`](schemas/hidden-block-hint-and-xray-amendment.schema.json). This amendment supersedes broader hidden-block hint suggestions in older planning material.

## Level-clear currency rewards

[`docs/level-clear-currency-reward-system.md`](docs/level-clear-currency-reward-system.md) is the newest authority for end-of-level currency payouts.

Every valid level clear awards currency based on a 100-point performance score:

- 25 guaranteed points for completing the course;
- up to 25 points for clear speed;
- up to 15 points for score-eligible standard coins;
- up to 20 points for the three Compass Coins;
- up to 15 points for the percentage of eligible mobs defeated.

Difficulty applies a substantial final multiplier: Easy `1.0×`, Normal `1.5×`, Hard `2.5×`, and Impossible `4.0×`. Each course and difficulty must define its own base reward, gold/par/cutoff times, coin target, and stable eligible-mob IDs. Random coin-block payouts cannot change the performance score, and scoring eligibility cannot change any mob design, behavior, placement, or roster.

Machine-readable values are stored in [`data/canonical/level-clear-currency-reward-system.json`](data/canonical/level-clear-currency-reward-system.json) and validated by [`schemas/level-clear-currency-reward-system.schema.json`](schemas/level-clear-currency-reward-system.schema.json). The final currency name, icon, wallet cap, shop prices, and repeat-clear payout policy remain intentionally unresolved.

## Hidden reward chests, chest mimics, and world treasure troves

[`docs/hidden-chest-mimic-and-world-trove-system.md`](docs/hidden-chest-mimic-and-world-trove-system.md) is the newest authority for course chests and world treasure troves.

It locks these rules:

- every completion-bearing course contains exactly one genuine hidden reward chest and exactly one chest mimic;
- the genuine chest requires a hidden area, tricky mechanic, timed mechanism, hidden switch, or comparable difficult access;
- every genuine course chest awards exactly 2 extra lives plus an authored, still-undecided currency amount;
- the mimic must look, sound, frame, and place identically enough that the player cannot identify it before reaching and activating it;
- Mebble's X-ray View cannot distinguish the mimic from the genuine chest;
- every world contains exactly one expertly hidden treasure trove;
- each trove contains an interior coin path leading to a chest with exactly 7 extra lives, a massive authored currency amount, and one special reward;
- the World 2 and World 7 trove rewards are exclusive learned skills unavailable anywhere else in the game;
- Easy uses a different trove location from the higher difficulties;
- Easy is the only difficulty that may eventually receive a separately approved trove hint;
- Normal, Hard, and Impossible troves have no gameplay hints of any kind;
- the interior coin path cannot be seen or detected before entry on Normal, Hard, or Impossible;
- trove discovery, chest claims, mimic triggers, and exclusive-skill awards require idempotent save tracking.

Machine-readable values are stored in [`data/canonical/hidden-chest-mimic-and-world-trove-system.json`](data/canonical/hidden-chest-mimic-and-world-trove-system.json) and validated by [`schemas/hidden-chest-mimic-and-world-trove-system.schema.json`](schemas/hidden-chest-mimic-and-world-trove-system.schema.json). Mimic behavior, currency amounts, Easy hint language, reward repeatability, life overflow, the World 2 and World 7 skill designs, and the other world-specific special rewards remain intentionally unresolved.

## Archived files already added directly

These smaller files are already in GitHub:

- `archive/full-motion/hargold_mebble_full_motion_build_009_qa.json`
- `archive/physics/build-017-movement-spec.md`
- `archive/physics/physics_completion_matrix.json`

The larger standalone HTML builds, complete archived preproduction files, character-reference images, and any package folders still require the drag-and-import step because the File Library connection cannot transfer their complete contents directly into GitHub.

## Codex source of truth

Codex must begin with [`AGENTS.md`](AGENTS.md). Key sources include:

- [`docs/canonical-design-bible.md`](docs/canonical-design-bible.md) — current design direction and hero canon.
- [`docs/hidden-chest-mimic-and-world-trove-system.md`](docs/hidden-chest-mimic-and-world-trove-system.md) — newest per-course chest pair, mimic parity, world trove, no-hint, and exclusive-skill authority.
- [`docs/level-clear-currency-reward-system.md`](docs/level-clear-currency-reward-system.md) — newest end-of-level performance score, difficulty multiplier, currency payout, results, and persistence authority.
- [`docs/hidden-block-hint-and-xray-amendment.md`](docs/hidden-block-hint-and-xray-amendment.md) — newest hidden-block hint, difficulty, Impossible-label, and Mebble X-ray authority.
- [`docs/course-format-and-hero-action-amendment.md`](docs/course-format-and-hero-action-amendment.md) — newest course-orientation, cape-glide, twirl-removal, and hero-slam authority.
- [`docs/world-specific-archive-policy.md`](docs/world-specific-archive-policy.md) — mandatory authored-course preservation policy.
- [`docs/level-production-plan.md`](docs/level-production-plan.md) — current campaign requirements.
- [`docs/purpose-driven-level-blueprint.md`](docs/purpose-driven-level-blueprint.md) — functional terrain, blocks, pits, platforms, and enemy choreography contract, except where superseded by the hidden-block amendment.
- [`docs/game-mechanics.md`](docs/game-mechanics.md) — gameplay mechanics, except where superseded by newer amendments.
- [`docs/movement-and-collision-spec.md`](docs/movement-and-collision-spec.md) — movement and interaction contract, except where superseded by newer amendments.
- [`src/canonical-data.js`](src/canonical-data.js) — current executable rules and campaign facts.
- [`data/canonical/hidden-chest-mimic-and-world-trove-system.json`](data/canonical/hidden-chest-mimic-and-world-trove-system.json) — machine-readable newest chest, mimic, trove, and exclusive-skill rules pending runtime implementation.
- [`data/canonical/level-clear-currency-reward-system.json`](data/canonical/level-clear-currency-reward-system.json) — machine-readable newest reward rules pending runtime implementation.
- [`data/canonical/hidden-block-hint-and-xray-amendment.json`](data/canonical/hidden-block-hint-and-xray-amendment.json) — machine-readable newest hidden-block and X-ray rules pending runtime migration.
- [`data/canonical/course-and-action-amendment.json`](data/canonical/course-and-action-amendment.json) — machine-readable course/action rules pending migration into affected runtime modules.
- [`src/runtime/fixed-step.js`](src/runtime/fixed-step.js) — deterministic 120 Hz simulation foundation.
- [`docs/historical-build-handoff.md`](docs/historical-build-handoff.md) — archived Build 025–030 handoff and production boundaries.
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
