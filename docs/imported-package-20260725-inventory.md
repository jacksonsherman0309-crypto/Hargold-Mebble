# Imported package inventory — 20260725-110552

Inventory completed before implementation changes on July 25, 2026.

Package root: `archive/imported-packages/20260725-110552/loose-files`

The package contains 15 files. The two Meadow Wake Build 003 HTML files are
byte-identical (same size and SHA-256); both originals remain preserved.

| File | Bytes | Classification | Restoration use |
| --- | ---: | --- | --- |
| `boss_fight_master_plan.md` | 30,468 | Ten authored boss contracts | Parsed into attacks, telegraphs, counterplay, five earned damage events and arena mutations |
| `Character design evolution of Mebble.png` | 2,570,051 | Locked visual-history reference | Inspected as reference; current locked production sheet remains authoritative |
| `encounter_budget_manifest.json` | 191,640 | Build 027, 90-level enemy budgets | Loaded per course without density-based replacement |
| `encounter_zone_manifest.json` | 888,378 | Build 028, 630 authored zones | Loaded as seven exact zones and their authored waves per course |
| `enemy_catalog.json` | 10,090 | Build 018, 39 enemy definitions | Converted into modular behavior-family definitions; canon overrides are applied explicitly |
| `enemy_framework_spec.md` | 2,347 | Enemy behavior/interaction contract | Runtime rules and validation reference |
| `hargold_mebble_full_motion_build_009.html` | 12,024,547 | Playable fixed-step motion build | Historical movement, mobile input, geometry and session reference |
| `hargold_mebble_level_editor.html` | 975,310 | Visual editor and Meadow Wake sample | Editor schema, validation, undo/redo, import/export and authored sample-layout reference |
| `hargold_mebble_meadow_wake_mob_motion_build_003 (1).html` | 1,148,083 | Playable mob-motion build, duplicate | Preserved unchanged |
| `hargold_mebble_meadow_wake_mob_motion_build_003.html` | 1,148,083 | Playable mob-motion build | Source for Camp Critter and Shellback state-machine restoration |
| `interaction_matrix.json` | 5,394 | Build 021, 29 interaction rules | Loaded into the modular interaction resolver with current-canon overrides |
| `level_geometry_scaffolds.json` | 506,003 | Build 028, 90 coordinate-free scaffolds | Loaded as construction scaffolds; never represented as implemented geometry |
| `world_1_construction_plan.md` | 27,572 | Nine authored Verdant Vale courses | Parsed course-by-course; the historical boss/secret slots are realigned to current canon |
| `world_10_construction_plan.md` | 35,047 | Nine historical Ironwood courses | Mechanics retained as provisional references; title and final boss are not adopted as canon |
| `world_9_construction_plan.md` | 33,406 | Nine historical Chrono Archive courses | Mechanics retained as provisional Secret World B references |

## Canon realignments

- Archived World 1 `1-9` Verdant Gate maps to current slot `1-8`.
- Archived World 1 `1-8` Rootbound Hollow maps to current secret slot `1-9`
  and remains a provisional historical course design because the current secret
  level is not yet approved.
- Drowned Coast and Luminite Glade mechanics are retained under current
  Tideglass Coast and Crystal Dunes identities.
- Historical World 5 desert material is mechanics-only reference for Ember
  Rift; it is not treated as the current world plan.
- Historical World 6 snow material is mechanics-only reference for Overgrown
  Grove.
- Pit of Echoes and Chrono Archive remain provisional references for Secret
  Worlds A and B.
- Ironwood Siege, General Gobbler and duplicate Master Mossback assignments
  remain historical. Final World title, detailed identity and boss stay open.
- The archived `camp_chipper.oneHit: false` value is overridden by current canon:
  Camp Chipper is a one-hit enemy.

## Production-truth boundary

The package contains real playable Meadow Wake geometry in its standalone HTML
builds, plus substantial modularizable enemy behavior. The 90-level geometry
manifest contains no coordinates, platforms, walls, hazards, camera bounds or
spawn positions. Its authored plans, collectible solutions, character
requirements and encounter schedules are restored as data contracts, not
misreported as finished levels.
