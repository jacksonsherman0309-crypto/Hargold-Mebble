# Hargold & Mebble — Historical Build Handoff

Last reviewed: July 25, 2026

This document preserves useful information from the earlier Build 025–030 planning package while clearly separating it from current canon and actual repository implementation.

## Authority rule

Current authority order:

1. Newest explicit user instruction.
2. `docs/canonical-design-bible.md`.
3. `docs/level-production-plan.md`.
4. `docs/game-mechanics.md`.
5. `src/canonical-data.js` and its tests.
6. Historical Build 025–030 material, only where it does not conflict with the sources above.

Historical names, themes, bosses, and systems must not silently replace newer canon.

## Build 025 summary

Build 025 reported the following preproduction work as structurally planned and audited:

- 10 worlds.
- 90 level/completion plans.
- 270 Compass collectible slots.
- 90 hidden collectible concepts and 39 expert-hidden concepts.
- World-map graph and house availability.
- Power-Up House panel-game planning.
- Save version 3 with inventory, house history, and map state.
- Temporal and boss execution bindings.
- Route declarations across all 90 levels.
- Rig-ready contracts for heroes, selected enemies, bosses, and environments.
- 220 automated code/contract tests reported passing.

Build 025 did **not** include:

- actual 3D models;
- skeleton assets;
- skin weights;
- materials or textures;
- animation clips;
- implemented level collision geometry;
- a real Unity project.

Build 025 open decisions included the final World 10 name, a One-Up House minigame, and reserve-item capacity. Those remain non-canon unless later explicitly approved.

## Build 027 summary

Build 027 expanded model-independent encounter planning:

- 53 regular-enemy profiles.
- 10 bosses.
- Encounter and simultaneous-enemy budgets for all 90 completion slots.
- 14 then-approved new-mob placements.
- Mobile projectile/effect ceilings.
- Offscreen-spawn and recovery-gap restrictions.
- 26 featureless lava/poison eruption placements.
- 258 code/contract tests reported passing.

Useful retained principles:

- Enemy entries should be offscreen or telegraphed.
- Enemies cannot spawn in safe landing areas.
- Dense encounters require recovery space.
- Lava/poison pool contact is fatal, while configured eruption orbs/globules may use ordinary heart damage and knockback.

Roster names and placements still require current-canon review.

## Build 028 summary

Build 028 reported:

- 285 automated checks.
- 90 campaign entries audited.
- Seven encounter zones scaffolded for each entry.
- 630 encounter zones total.
- 90 coordinate-free level geometry scaffolds.
- Deterministic enemy/projectile/VFX pooling contracts.
- Simultaneous-entity cap enforcement.
- Boss-minion cap sharing.
- Offscreen sleep/wake behavior.
- Checkpoint and exit cleanup contracts.
- Unity-ready naming, layer, tag, importer, and addressable conventions.

The geometry scaffolds intentionally left these fields unresolved:

- bounds;
- platform coordinates;
- wall coordinates;
- hazard geometry;
- final camera volumes;
- spawn-anchor positions;
- Hargold-block coordinates;
- Mebble-obstacle coordinates;
- boss-arena bounds.

Build 028 did **not** include a Unity project, scenes, prefabs, meshes, animation clips, or implemented collision layouts.

## Build 029 summary

Build 029 added model-independent production contracts for:

- Save version 4 with migration from versions 1–3.
- Per-level difficulty records, best times, clear counts, and last hero used.
- Independent tracking for all three Compass collectibles.
- Secret-exit and boss history.
- Learned-skill and ending-state persistence.
- Level-editor command/data model with undo, redo, validation, and JSON export.
- Deterministic checkpoint-local persistence.
- Animation templates for heroes, enemy behavior families, bosses, and abilities.
- Audio-event registry and mobile voice-management contracts.
- Privacy-minimized deterministic replay and analytics.

Build 029 did **not** include a graphical Unity editor, real animation clips, audio files, a Unity scene, or final collision geometry.

A standalone browser level-editor prototype also existed historically. It supported placing platforms, hazards, enemies, blocks, collectibles, markers, import/export, undo/redo, local saving, and a simplified preview. It may be used as an interface reference but is not a production Unity editor or proof that all game systems are implemented.

## Build 030 summary

Build 030 reported:

- 374 automated contract checks.
- 10 original world-music identities planned.
- 90 distinct level-cue contracts.
- 10 dedicated boss-theme contracts.
- Boss music escalation across five damage events.
- 84 planned hero nonverbal bark variants.
- 151 mob sound-event contracts.
- 50 boss sound-event contracts.
- 834 unified audio-event contracts.
- Text-only/localization-backed communication rules.

Retained current principles:

- No spoken dialogue or lip-sync requirement.
- Tutorials, objectives, reactions, and boss notices use text bubbles.
- Hargold and Mebble use original nonverbal reactions.
- Music and vocal performances cannot copy recognizable Nintendo material.

Build 030 did **not** include final composed music, recorded vocalizations, creature audio, final mixes, localization packages, models, animation clips, Unity scenes, or implemented level geometry.

## Conflicting historical world plans

Some historical scaffolds used world assignments that no longer match current canon:

- Historical World 5 was largely a desert/Sand Wraith plan. Current World 5 is Ember Rift.
- Historical World 6 was largely a snow/ice plan. Current World 6 is Overgrown Grove with Camp Head.
- Historical Worlds 8 and 9 had bone/echo and chrono/archive identities. Current secret-world titles/themes are not fully locked.
- Historical World 10 used Ironwood/Gobbler-oriented names. Current final-world title, detailed theme, and boss remain open.

Codex may salvage individual mechanic ideas only after adapting them to current canon and clearly marking unapproved changes as provisional.

## What is actually in the GitHub repository now

- Runnable landscape browser prototype.
- Current HTML/CSS/JavaScript source.
- Root Codex instructions.
- Canonical game-mechanics document.
- Canonical design bible.
- Canonical level-production plan.
- Machine-readable campaign/mechanics data.
- Automated canonical contract tests.
- This historical handoff.

## What is not yet complete

- Full commercial game code.
- Full 90-level implemented geometry.
- Finished enemies and boss encounters.
- Production 3D models, rigs, animation, materials, and textures.
- Final music, sound effects, or recordings.
- A complete Unity project and mobile build pipeline.
- Full save, world-map, inventory, house, replay, pooling, editor, and audio systems integrated into the current runnable prototype.

These missing items must remain visible in status reporting. Planning contracts are not equivalent to finished production code.
