# Purpose-Driven Level Blueprint

## Status and scope

This document is a production construction contract for authored Hargold & Mebble courses. It does not authorize a universal procedural generator to replace world-specific level plans. Shared schemas, validators, editor tools, and generation assistance may support authored courses, but every course must retain its own mechanic, beat flow, enemy purposes, routes, collectibles, checkpoint, difficulty variants, and final signature.

The opening outdoor courses of New Super Mario Bros. Wii and New Super Mario Bros. U are used only as structural reference for readable platforming grammar. Do not copy Nintendo maps, geometry, code, art, enemy designs, names, music, or protected identifiers.

## Core principle

Every placed object must answer:

> What does this object make the player do, understand, choose, or discover?

Blocks, platforms, slopes, pits, pipes, enemies, and collectibles are gameplay devices before they are decoration. Decorative objects may reinforce the scene, but collision-bearing objects must have a gameplay purpose.

## Opening-world reference findings

Across outdoor grassland, athletic, tower, and castle courses, the recurring structure is:

1. Introduce one idea safely.
2. Repeat it with a minor variation.
3. Combine it with one previously learned element.
4. Provide recovery or a checkpoint.
5. Escalate the same idea.
6. Finish with a final exam using only taught rules.

Ground-focused opening courses keep the majority of the mandatory route on readable terrain. Elevated paths are usually optional, faster, safer, or reward-bearing. Athletic courses deliberately invert this ratio, but reduce enemy variety so terrain motion remains readable. Towers use vertical chambers, stable rest ledges, and alternating ascent directions. Castles use one dominant hazard family and safe pockets between high-consequence sequences.

## Course composition targets

For an ordinary outdoor World 1 course:

- 60–80% continuous ground on the primary route.
- 10–25% raised ledges, blocks, bridges, or compact platform groups.
- 5–15% pits or major aerial traversal.

For an athletic course:

- Platform coverage may dominate.
- Enemy count should be reduced by roughly 20–35% compared with a grounded course.
- One platform family should provide most of the challenge.

These are Hargold & Mebble production targets, not copied measurements.

## Blocks are functional objects

Every interactive block or structural block group must carry at least one purpose tag:

- `route_support`
- `jump_takeoff`
- `landing_surface`
- `elevation_step`
- `enemy_control`
- `hazard_cover`
- `reward_container`
- `powerup_delivery`
- `secret_route_hint`
- `route_gate`
- `mechanic_tutorial`
- `recovery_platform`
- `moving_platform_anchor`
- `destructible_shortcut`
- `character_specific_interaction`

Blocks without a purpose tag must not be generated or retained.

### Interactive blocks versus structural terrain

The four interactive block classes remain:

1. Standard breakable block.
2. Hargold-only block.
3. Coin block.
4. Power-up block.

Not every rectangular surface is one of these. Permanent environment geometry includes stone platforms, reinforced ruins, cliff ledges, bridge supports, carved shelves, tower walls, castle floors, mechanical housings, and large terrain slabs.

A required platform must be permanent when breaking it would:

- destroy the only route;
- remove a required landing surface;
- trap the player;
- create an unintended pit;
- erase an encounter;
- make a collectible impossible;
- expose unfinished geometry;
- create uncontrolled sequence breaking.

A breakable block is valid only when it reveals a reward, opens an optional route, removes a temporary obstruction, creates a shortcut, demonstrates Hargold’s strength, changes an encounter, or opens a secret chamber.

Do not use long rows of breakable blocks as filler.

### Block-group grammar

- One block: precise reward, hint, or isolated landing aid.
- Two blocks: short platform or directional cue.
- Three blocks: stable landing platform or simple formation.
- Four to six blocks: meaningful platform, ceiling, gate, or destructible wall.
- Seven or more blocks: architecture or a deliberately authored challenge.

Avoid random checkerboards, unsupported floating rectangles, and decorative block spam.

## Terrain grammar

The generator and editor should assemble functional landforms rather than a flat plane with decorations:

- run-up flat;
- shallow uphill;
- crest;
- short decline;
- valley;
- ledge;
- recovery flat;
- obstacle rise.

Every hill must alter a jump arc, obscure or reveal an enemy, create height, enable sliding, build momentum, separate encounters, conceal a route, or frame a collectible.

Avoid constant sawtooth terrain. Landforms need enough width to be readable and playable.

## Pit rules

Every pit must have one purpose:

- `basic_jump_test`
- `moving_platform_test`
- `enemy_timing_test`
- `momentum_test`
- `vertical_drop`
- `route_split`
- `castle_hazard`
- `athletic_sequence`

No decorative pits.

Recommended World 1 escalation:

1. Preview the gap from safe ground.
2. Use a narrow gap with a generous landing.
3. Add an enemy before or after the gap.
4. Raise the landing.
5. Add a fixed or moving platform.
6. Add an optional difficult gap for a collectible.
7. Finish with a combined test.

Do not place the first major pit immediately after spawn. Do not chain more than three high-consequence gaps without recovery in an early-world course.

Recovery may be broad ground, a checkpoint, a power-up, a safe coin line, a low-pressure encounter, or a visual pause.

## Platform rules

A platform must bridge a gap, provide elevation, create a safer route, create a risky shortcut, carry an enemy, teach timing, provide recovery, form a collectible route, or control pacing.

Every floating platform needs:

- a readable approach;
- a clear destination;
- enough landing width;
- camera visibility;
- a relationship to nearby terrain.

Moving-platform sequence:

1. Show motion from safety.
2. Require stepping onto one platform.
3. Require one jump between moving and fixed surfaces.
4. Add one low-threat enemy.
5. Add a second moving platform.
6. Add pit consequence.
7. Add an optional collectible route.
8. Finish with a combined sequence.
9. Return to stable ground.

## Enemy choreography

Enemies are moving level geometry. They should control jump timing, landing choice, waiting, route choice, momentum, block use, or gap crossing.

Every placement must belong to a defined encounter pattern:

- `basic_approach`: one visible ground enemy on broad terrain.
- `terrain_assisted`: enemy on a slope, ledge, or stepped surface.
- `jump_commitment`: enemy influences a gap landing.
- `overhead_pressure`: aerial or projectile pressure above a grounded obstacle.
- `timed_emergence`: predictable emergence from a fixed structure.
- `platform_occupancy`: enemy controls a platform the player needs.
- `enemy_as_tool`: enemy can be bounced from, redirected, carried, or used.
- `paired_behavior`: two compatible enemies create one readable situation.
- `recovery_encounter`: simple enemy after a difficult sequence.

The validator must ensure:

- patrol enemies cannot walk into unavoidable spawn deaths;
- enemies do not turn at unexplained invisible borders;
- aerial enemies have visible approach space;
- projectile enemies have readable firing lanes;
- enemies do not occupy blind landing coordinates;
- enemies near pits have controlled patrol bounds;
- overlapping cycles do not create impossible timing states;
- foreground art never hides collision-critical enemies.

World 1 production targets for a roughly two-minute course:

- 18–30 common enemy instances.
- 2–5 enemy families.
- No more than two active enemy families in an ordinary encounter.
- In an enemy-themed course, the primary family supplies roughly 40–60% of placements.
- Tutorials begin with isolated examples.

These are authored planning targets, not automatic density rules and not substitutions for named mob purposes.

## Course length and pacing

Use movement time, not raw map width, as the main length metric.

- Expert completion: 90–120 seconds.
- Normal first completion: 150–240 seconds.
- Exploratory completion: 240–360 seconds.
- Major gameplay segments: 10–14.

Typical segment duration:

- tutorial or recovery: 5–10 seconds;
- ordinary encounter: 8–15 seconds;
- platform sequence: 12–25 seconds;
- collectible challenge: 10–25 seconds;
- set piece: 20–35 seconds.

## Twelve-segment authored course template

1. **Opening read** — broad safe ground, visible setting, no immediate pit.
2. **First interaction** — introduce the primary mechanic on safe footing.
3. **Confirmation** — repeat with one variation and a useful reward.
4. **Elevation change** — hill, ledge, low platform, or valley.
5. **First meaningful encounter** — combine one enemy with the primary terrain mechanic.
6. **Optional route** — upper/lower branch that reconnects; mandatory route works for both heroes.
7. **Pre-checkpoint test** — moderate combination; checkpoint follows earned success.
8. **Post-checkpoint variation** — same mechanic in a changed context.
9. **Advanced combination** — mechanic plus one established enemy or hazard.
10. **Optional mastery challenge** — collectible route; failure usually returns to the main path.
11. **Final exam** — strongest legal combination of taught mechanics.
12. **Goal approach** — short release of tension with a visible finish.

## World 1 archetype application

### 1. Meadow Wake

- About 75% grounded traversal.
- Rolling terrain and basic enemies.
- Blocks teach rewards, jumping, and route support.
- One short pit sequence.
- One optional upper path.

### 2. Acorn Run

- Stronger slope and momentum use.
- One new obstacle family.
- Two enemy families.
- One hidden or elevated route.
- Minimal lethal gaps.

### 3. Burrowbank

- Grounded terrain with tunnels and stepped banks.
- Dirt Squirts and Spike Beetles receive authored terrain relationships.
- Optional mastery route without converting the course into an underground stage.

### 4. Sentry Span

- Camp Sentry introduction on broad safe ground.
- Cover blocks and elevation matter.
- Projectile lanes remain readable.
- Later encounters combine sentries with short pits or narrow crossings.

### 5. Ruin Rise

- Permanent stone architecture dominates.
- Required platforms are non-breakable.
- Hargold-only blocks create optional shortcuts, secrets, or encounter changes.
- Uses limited vertical chambers and stable rest ledges.

### 6. Glideway

- Safe first glide demonstration.
- Gradually increasing gap width.
- Optional airborne collectible routes.
- Hargold always receives a valid mandatory path.

### 7A. Athletic fork

- Platform-heavy.
- Reduced enemy variety.
- One moving-platform family escalates from safe introduction to final exam.

### 7B. Ground-hazard fork

- Primarily grounded.
- Stronger enemy choreography.
- Slopes, fixed structures, rolling hazards, and short gaps.

### 8. Verdant Gate

- Recombines World 1 mechanics.
- More permanent architecture.
- One dominant hazard family.
- Clear boss approach and recovery before the arena.

### Secret course

- One unusual mechanic with a distinct identity.
- Higher optional difficulty.
- Does not simply increase every pit and enemy count.

## Mandatory validation failures

A course fails review when:

- more than 20% of collision-bearing blocks lack a gameplay purpose;
- a required platform is breakable;
- Hargold cannot complete the mandatory route;
- a mechanic first appears over an instant-death pit;
- an enemy occupies an unavoidable blind landing;
- the player must jump from an off-camera surface;
- more than three difficult gaps occur without recovery;
- foreground art obscures collision edges;
- a power-up appears after the section designed around it;
- a collectible requires an unavailable ability;
- a secret route has no environmental hint;
- the same encounter template repeats more than three times without meaningful variation;
- enemy density rises while platform complexity is already at maximum;
- a moving-platform cycle can create an impossible state;
- breaking blocks can destroy the only route;
- empty ground exists only to inflate duration;
- unrelated mechanics are mixed without authored teaching order.

## Implementation directive

Generate or author levels as sequences of intentional movement problems.

Do not produce random blocks, decorative floating platforms, excessive breakable terrain, constant pits, evenly spaced enemies, long flat filler, coin-only guidance, or unrelated obstacle mixtures.

Use the companion schema in `schemas/level-blueprint.schema.json` and the authored template in `data/level-blueprints/world-1-template.json` to store purpose, route, enemy, recovery, and validation metadata without replacing exact world-specific plans.
