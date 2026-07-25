# World-Specific Archive Policy

This project must not convert the archived campaign into a universal or procedurally generated level template.

## Core rule

Every world and every course is an authored, specific design. Shared schemas, loaders, validators, pools, and simulation systems may support the campaign, but they may not replace or flatten the authored content.

When implementing a particular course, Codex must read that course's archived construction plan, encounter budget, encounter-zone schedule, collectible requirements, character requirements, difficulty variants, map connections, and any associated boss contract before editing implementation code.

## Required archived sources

When present under `archive/imported-packages`, inspect all relevant files, especially:

- `world_1_construction_plan.*` through `world_10_construction_plan.*`, including differently named world-plan files.
- `encounter_budget_manifest.json`.
- `encounter_zone_manifest.json`.
- `level_geometry_scaffolds.json`.
- enemy roster, enemy profile, behavior-family, distribution, interaction-matrix, pooling, combat, projectile, and checkpoint-runtime files.
- `boss_fight_master_plan.md`, individual boss fight plans, boss runtime files, and boss execution bindings.
- world-map, route-declaration, save/progression, temporal, editor, animation-event, and audio-event files.
- earlier playable HTML builds and the level editor.

## Per-level content that must be preserved

For each course, preserve its own:

- identity and world-specific mechanic;
- secondary mechanic and environmental interaction;
- target duration and difficulty;
- seven-beat flow or other approved authored sequence;
- checkpoint location and purpose;
- exact enemy roster, count, purpose, encounter waves, and recovery gaps;
- power-up support;
- three Compass Coin solutions;
- Mebble-required obstacle grouping;
- Hargold-only block groups and uses;
- route/fork/secret-exit connections;
- Easy, Normal, Hard, and Nightmare differences;
- final signature set piece;
- boss approach, arena, attacks, earned damage events, arena mutations, retry rules, and playable escape where specified.

A generic level schema may store these fields. It may not invent generic replacements for them.

## Historical conflict handling

Archived files preserve prior implementation and planning work, including material that may use older world names, bosses, or campaign ordering. Never delete or ignore useful mechanics because a historical label conflicts with current canon.

Use this order of authority:

1. New explicit user instruction.
2. Current canonical design documents and `src/canonical-data.js`.
3. The newest archived implementation compatible with current canon.
4. Older archived files as implementation reference.

When adapting older work, preserve reusable code and authored course mechanics, then update conflicting names, roster assignments, and campaign placement to current canon. Document every realignment instead of silently flattening or discarding the source.

## Production honesty

The archive contains substantial course design, enemy distribution, encounter scheduling, interaction, boss, editor, pooling, save, and runtime work. Some geometry files are coordinate-free construction scaffolds rather than finished playable layouts. Do not describe empty coordinates, contracts, or plans as implemented geometry or completed 3D content.
