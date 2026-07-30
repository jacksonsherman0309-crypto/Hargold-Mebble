# Hargold & Mebble — Current Game Canon

Last consolidated: July 29, 2026

This is the first-read human summary of the currently approved game direction. Newer explicit user instructions override older material. Historical files remain reference-only unless this document or another current canonical source restores them.

## Campaign

- Ten worlds total.
- Worlds 1–7 are the main campaign and contain **8 levels total each, including the secret level**.
- Worlds 8–9 are secret expert worlds and currently retain 9 levels each.
- World 10 is the final postgame world and currently retains 9 levels.
- Current campaign total: 83 completion slots and 249 Compass Coins.
- Each level contains exactly three Compass Coins.
- World 10 unlocks after 100% completion of Worlds 1–9.
- Existing fork, boss, and secret-course plans must be remapped carefully; do not silently delete approved content.

## Presentation and platform

- Mobile-first landscape platformer.
- Fully rendered 3D characters, enemies, props, and environments.
- Strict linear side-scrolling gameplay plane.
- “2.75D” comes from depth, lighting, parallax, camera work, and fully modeled assets—not free depth-lane movement.
- Typical level target is roughly two minutes.
- Terrain should be predominantly connected ground with purposeful elevation, platforms, gaps, blocks, routes, and landmarks.

## Heroes

### Hargold

Short, broad, round explorer with green outfit, brimmed hat and feather, scarf/cape, goatee, backpack, and brown boots. Hargold can break Hargold-only blocks. His double jump is a learned ability.

### Mebble

Tall, thin explorer with a very long neck and visible Adam’s apple, small top hat, crooked glasses, bushy eyebrows, cape, and taller boots. Mebble jumps slightly higher and has an innate cape-parachute glide.

The current locked original user-supplied Meshy rigs are the live character-animation targets. Preserve their visible meshes and approved proportions unless the user explicitly replaces them.

## Movement

- No separate run or sprint button.
- Holding left or right accelerates smoothly through movement tiers until full running speed.
- Releasing direction decelerates smoothly.
- Preserve responsive acceleration, skids, variable jump, bounce, crouch, slide, ground slam, air twirl, safe swapping, moving-platform transport, and other approved movement systems.
- Hargold: learned double jump.
- Mebble: innate glide and slightly higher jump.
- Normal gameplay remains on one linear side-scrolling plane.

## Health, lives, checkpoints, and hazards

- Hearts and lives are separate systems.
- Maximum survivable health states: three.
- Every 100 coins awards one extra life.
- Lives stack to 99.
- Losing all hearts costs one life.
- Falling into a bottomless pit, lava, or poison immediately costs one life regardless of hearts or power-up state.
- Respawn at the latest reached checkpoint; otherwise restart the level.

## Blocks

There are exactly four canonical block types:

1. Standard breakable block.
2. Hargold-only block.
3. Coin block.
4. Power-up block.

A hidden block is a reveal state, not a fifth type.

- Approved standard Coin Block: Concept F.
- Approved Power-Up Block: Glow Box I—blue body, gold corner framing/hardware, bright circular glowing center, no question mark.
- Coin Block reward distribution: 1 coin 78%, 5 coins 14%, 10 coins 7%, 100 coins 1%.
- World block variants use the approved base models with world-theme color expressed through the cracked lines and accents.

## Level and terrain construction

- Every level is individually authored.
- Shared schemas and tools may support levels but may not generate generic replacements.
- Most ordinary progression should remain on connected ground.
- Platforms and blocks must have a gameplay purpose: teach, test, route, gate, recover, hide, or reward.
- Avoid excessive pits and long flat or empty runs.
- Use uneven terrain, slopes, cliffs, terraces, bridges, logs, ruins, moving mechanisms, and optional elevated routes.
- Keep hazards and landing surfaces visually clear.
- Use reusable world-specific terrain and prop kits while preserving unique level identities.
- Meshy is appropriate for reusable modeled blocks, obstacles, props, and modular pieces. Terrain and final level assembly should be authored in a dedicated 3D/editor pipeline and integrated into the game runtime.

## Worlds

1. Verdant Vale — bright grassland; easiest world; Verdant Wyrm.
2. Tideglass Coast — coastal cliffs, flooded coves, tidal caves; Wraithbound.
3. Crystal Dunes — desert and crystal terrain; Luminite Golem.
4. Skyreach Range — high-altitude wind and aerial mechanisms; Altitude Archmage.
5. Ember Rift — volcano, heat, lava, and eruption hazards; Sand Wraith.
6. Overgrown Grove — dense forest with camp-industrial intrusion; Camp Head; second-hardest main world.
7. Toxic Fen — poison river, swamp, sluices, and toxic machinery; Fen Phantasm; hardest main world.
8. Secret World A — expert world; Bone Crusher; final title/theme pending.
9. Secret World B — expert world; Tempest Warden; final title/theme pending.
10. Final World — unlocked after 100% completion; hardest overall; final title/theme/boss pending.

## Enemies and bosses

- Original enemy roster; common enemies generally remain small and readable.
- Current named mobs include Camp Critter, Shellback, Acorn Bomber, Dirt Squirt, Spike Beetle, Camp Sentry, and Camp Chipper.
- Camp Sentry must visibly fire projectiles with readable pose, muzzle effect, and path.
- Camp Chipper uses the larger detailed camp-worker/wood-chipper identity and reaches roughly Hargold’s waist.
- Bosses require five earned damage events.

## Power-ups

Current selected set includes Grow/Size, Fire, Ice, Bubblebloom Charm, Stonefist Gloves, Mebble’s innate Glide Cape, an open movement/exploration slot, and an ultra-rare timed power-up excluded from boss levels.

## Repository authority

- Current canon and executable rules belong in active `docs/`, `src/`, `data/`, `assets/`, and `tests/` paths.
- Old builds, rejected procedural characters, superseded 90-slot plans, duplicate exports, and imported raw packages are historical or local-source material—not active runtime authority.
- Do not report plans, manifests, tests, or placeholder geometry as finished production assets.
