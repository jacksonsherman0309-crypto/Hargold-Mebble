# Hargold & Mebble — Canonical Level Production Plan

Last consolidated: July 25, 2026

This file defines the current level-planning rules and the approved campaign outline available to Codex. It is not permission to invent final names, layouts, bosses, or themes for items marked pending.

Read this with:

- `docs/canonical-design-bible.md`
- `docs/game-mechanics.md`
- `src/canonical-data.js`

## 1. Campaign accounting

- 10 worlds.
- 90 completion slots total: 9 per world.
- 270 Compass Coin slots total: 3 per completion slot.
- Worlds 1–7 are the main campaign.
- Worlds 8–9 are secret worlds and harder than all main worlds.
- World 10 unlocks only after 100% completion of Worlds 1–9.
- Every world has one hidden exit that reveals its secret ninth completion slot.
- One of the eight main progression slots is a fork with two alternative routes; completing either route satisfies that slot.
- The fork routes must be meaningfully different and cannot be treated as two nearly identical copies.

## 2. Universal level requirements

Every production level must satisfy these rules unless an explicit newer instruction overrides them:

- Strict linear side-scrolling gameplay plane.
- Fully rendered 3D “2.75D” presentation target.
- Use the approved Meadow Wake gameplay reference as the minimum quality floor for environment density, terrain volume, materials, lighting, parallax, and side-view composition while keeping all production assets and layouts original.
- Apply the quality floor across the complete authored course. No section may fall back to generic boxes, repetitive procedural dressing, flat playable cards, or visibly unfinished background/foreground treatment.
- Average completion target near two minutes at a moderately quick pace, excluding unusually large finales.
- Required route remains completable by Hargold.
- Wall-contact reactions are required, but unrestricted wall jumping is not currently enabled.
- One or two Mebble-required obstacles, grouped into one contained section whenever practical.
- Several Hargold-only blocks or Hargold-specific interactions.
- Avoid repeated back-and-forth swapping on the required main path.
- Reserve additional swaps for optional rooms, shortcuts, hidden exits, secrets, and Compass Coins.
- Exactly three Compass Coins.
- At least one checkpoint in a standard full-length level unless a deliberately short special course is approved.
- Checkpoint placement should fall after the mechanic has been introduced and safely demonstrated, before its hardest combination.
- Normal course construction should include terrain changes, pits or other risk, blocks, coin routes, enemies, optional exploration, and a clear ending challenge.
- No long empty walking stretches.
- Handcraft playable foregrounds with rolling terrain, layered grassy ledges, detailed earth/stone faces, bridges, stumps, camps, cliffs, ruins, varied platforms, elevated routes, and secret shelves.
- Target approximately 80–90% supported terrain and 10–20% meaningful pit spans across a normal course; pit rhythm remains individually authored per course.
- Use terrain mechanisms—including moving, falling, rotating, lift, and seesaw platforms—to create timing and route decisions without depending on increased enemy density.
- Place standard, Hargold-only, coin, power-up, and hidden instances only through the four canonical block types; a hidden block is a reveal state, not a fifth type.
- Use dense coins as movement language: ground trails, jump arcs, vertical stacks, optional challenge paths, interrupted secret clues, and rewards.
- Integrate camp structures, logs, stumps, fences, and ruins into traversal so each course reads as a place as well as a platforming sequence.
- Fatal pits, lava, and poison use dedicated hazard volumes and bypass hearts and power-ups.
- Foreground art cannot hide required hazards or landing surfaces.
- Enemy spawns must be offscreen or visibly telegraphed and never occur inside a safe landing area.
- Mobile landscape camera and touch-control visibility must be validated.

## 3. Recommended beat scaffold

Seven encounter/camera beats are a useful construction scaffold but are not a mandatory identical template:

1. Establish the environment and level-specific mechanic.
2. Safe demonstration with low punishment.
3. First real test.
4. Variation or route choice.
5. Checkpoint and short recovery.
6. Combined advanced challenge.
7. Final exam, exit sequence, or boss transition.

A level may merge, expand, or reorder beats when its concept benefits, but it must preserve readable teaching and escalation.

## 4. Compass Coin planning

Each level has exactly three Compass Coins with distinct challenge roles:

1. Visible challenge
   - Clearly shown but requires platforming execution, timing, or route mastery.
2. Route commitment
   - Requires carrying an enemy/object, preserving a mechanism state, choosing a route, or using a hero ability intentionally.
3. Well hidden
   - Uses environmental clues, interrupted coin trails, suspicious geometry, optional rooms, Beaconscope reveals, or secret interactions.

Later worlds may classify selected well-hidden coins as expert-hidden. A hidden coin must be discoverable through fair clues rather than random invisible-wall searching.

## 5. Hero-gating construction rules

### Mebble sections

- One or two required Mebble obstacles per level.
- Group them in a contained sequence whenever possible.
- Examples: high switch, longer glide transfer, higher wall transfer, controlled slow-fall shaft, or tall-body interaction.
- Do not make the player swap to Mebble for one obstacle, immediately swap back, then repeat that pattern throughout the level.

### Hargold sections

- Several Hargold-only blocks or heavy interactions per level.
- Heavy-rock enemies require Hargold ground slam.
- Hargold’s required route cannot depend on his learned double jump before that skill is unlocked.
- Optional post-unlock routes may use the double jump.

### Shared movement

- Both heroes receive readable wall-collision reactions; neither has an unrestricted wall jump.
- Mebble jumps slightly higher and has glide.
- Required jumps remain reachable by Hargold through geometry, switches, moving objects, or approved power-ups.

## 6. World 1 — Verdant Vale

Theme: bright grasslands, rolling hills, streams, woodland edges, and stone ruins.

Difficulty: easiest world; introduces core controls and hero differences without becoming an empty tutorial.

Boss: Verdant Wyrm, five earned damage events.

### 1-1 — Meadow Wake

Purpose:

- Teach movement, variable jump, wall-collision reactions, and hero swapping.
- Introduce standard breakable blocks and coin blocks.
- Introduce Camp Critter and Shellback.

Construction direction:

- Begin with a safe movement runway and small elevation changes.
- Introduce the first enemy with enough space to observe its behavior.
- Use an upper coin arc and a springy/fallen-log style launch for the first visible Compass Coin.
- Use a Shellback to open a short breakable route for the route-commitment Compass Coin.
- Use an interrupted low coin trail and concealed creek shelf for the hidden Compass Coin.
- After the checkpoint, alternate visible upper ledges and a lower creek route so route choice feels intentional.
- Include one grouped Mebble section and one Hargold-only block group.
- Preserve the approved bright layered valley background, lighting, atmosphere, depth, and color palette while bringing the collision-bearing foreground to the same visual finish.
- Treat all seven Meadow Wake beats as one continuous environment finish pass: authored near-field props, modeled terrain relief, section-specific midground landmarks, stable warm daylight, atmospheric separation, and unobstructed landing/hazard silhouettes must continue through the goal.
- Construct the seven authored beats as a continuously evolving approximately two-minute course with roughly 85% supported ground, meaningful ravines, dense coin guidance, camp decks, a fallen-log launch, breakable ruins, lifts, falling ledges, a rope bridge, creek routes, rotating stonework, and three graduated final gaps.
- Re-author the visible layout around nine readable traversal phases inside
  those seven beats: camp departure, first natural obstacle, first encounter,
  gentle elevation, one controlled gap sequence, an open running meadow, one
  compact platform challenge, a combination challenge, and the exit approach.
- Keep approximately 65–75% of ordinary forward progression on connected
  ground. Elevated platforms supplement that route and each must have a named
  teaching, reward, shortcut, secret, or timing purpose.
- Tune the finished World 1-1 route toward 70% connected-ground play, 20%
  optional elevated play, and 10% dedicated platform sequences while
  preserving the individually authored room and beat flow.
- Group true gaps into authored events rather than distributing them evenly:
  the concealed creek pocket with its recovery shelf, the framed rope-bridge
  ravine, and the three-gap final panorama.
- Use explicit modular terrain chunks with irregular modeled silhouettes,
  grass overhangs, clay/loam strata, embedded stone, exposed roots, eroded
  edges, and clean collision profiles. Long stretched terrain slabs are not an
  acceptable visible implementation.
- Nest twelve continuous outdoor gameplay rooms inside the seven archived beats:
  Trailhead Camp, Elder Root Walk, Mason Shelf, Shellback Quarry, Timberyard
  Clearing, Stump Creek Hollow, Lantern Bridge, Mill Meadow, Root Terrace,
  Lookout Ruins, Flowering Run, and Three-Gap Vista.
- Hold a dominant original hero landmark in each room for roughly eight to ten
  seconds of play. Each landmark must carry or frame collision-bearing
  traversal such as an awning, root toe, boulder shelf, ruin ledge, timber
  stack, rope bridge, waterwheel paddle, root shelf, lookout stones, stump, or
  goal overlook.
- Use one continuous base-loam material across adjoining terrain modules and
  express room identity with modeled landforms and authored transitions.
  Straight material seams that expose the underlying module boundaries are not
  an acceptable finish.
- Store blocks as named gameplay phrases that teach, test, gate, recover, hide,
  or reward. Every visible or hidden Meadow Wake block must belong to one of
  those phrases.

### 1-2 — Acorn Run

Purpose:

- Teach maintaining speed over rolling slopes.
- Introduce Acorn Bomber hazards.
- Reinforce Shellback/object preservation.

Construction direction:

- Long readable descents feed controlled running jumps.
- First Compass Coin rewards carrying speed through a suspended ring.
- Second rewards preserving a Shellback through a hollow-tree section to clear a lower block tunnel.
- Third uses an apparently dangerous downward route caught by a hidden root shelf.

### 1-3 — Burrowbank

Purpose:

- Introduce tunnel compression and vertical burrow timing.
- Introduce Dirt Squirt and Spike Beetle.
- Teach that spiked enemies cannot be safely stomped without protection.

Construction direction:

- Alternate open banks with narrow underground passages.
- Use Dirt Squirt telegraphs before placing it under pressured jumps.
- Keep Mebble fit restrictions readable and never trap the player after swapping.

### 1-4 — Sentry Span

Purpose:

- Introduce Camp Sentry as a visible projectile enemy.
- Teach firing-pose, muzzle-effect, projectile-path, and cover timing.

Construction direction:

- First Sentry fires across a safe practice span.
- Later Sentries combine with moving platforms and optional projectile-redirection opportunities.
- Never obscure the projectile path with foreground art.

### 1-5 — Ruin Rise

Purpose:

- Vertical platforming.
- Hargold-only block introduction and reinforcement.
- Shared wall-contact and ledge-control practice.

Construction direction:

- Use readable stone shafts and staggered ledges.
- Hargold breaks required barriers while Mebble receives an optional high route.
- Do not require repeated swaps on every floor.

### 1-6 — Glideway

Purpose:

- Teach Mebble’s cape parachute and short glide.
- Demonstrate that glide slows descent but does not create unrestricted flight.

Construction direction:

- Start with safe downward glides.
- Add horizontal correction and rising/falling air as later tests.
- Hargold’s required path remains available through platforms, switches, or moving objects.

### 1-7 — Cliffline Fork

Purpose:

- First meaningful route fork.
- Player chooses one of two alternative levels/routes to continue.

Current status:

- Variant `1-7A`: final name and detailed layout pending.
- Variant `1-7B`: final name and detailed layout pending.

Required differentiation:

- One route should emphasize precision/platform geometry.
- The other should emphasize enemy/object interaction or hero abilities.
- Both must satisfy the same overall difficulty band and provide three Compass Coins for their respective route record.
- Do not finalize route names or layouts without approval.

### 1-8 — Verdant Gate

Purpose:

- World-finale approach.
- Compact review of World 1 mechanics.
- Verdant Wyrm boss encounter.

Construction direction:

- Place all three Compass Coins before the irreversible boss entrance.
- Put the retained checkpoint immediately before the boss sequence.
- Verdant Wyrm requires five earned damage events with readable phase escalation.
- Boss remains completable by either hero.

### 1-9 — Verdant Vale secret level

Current status:

- Final name, hidden-exit source, mechanic, and detailed layout pending.
- It must be unlocked by one hidden exit in Verdant Vale.
- It is optional and harder than the normal World 1 route without exceeding later-world difficulty.
- Do not invent permanent canon without approval.

## 7. World 2 — Tideglass Coast

Current canon:

- Coastal cliffs, flooded coves, tidal caves, and water mobility.
- Boss: Wraithbound, five earned damage events.

Slots 2-1 through 2-9:

- Detailed current-canon names and layouts are pending approval.
- Plan water teaching gradually: shore movement, changing waterlines, currents, submerged routes, tidal timing, and advanced flooded structures.
- Tidebiter remains water-only.
- Fatal water conditions must be explicitly marked; ordinary water is not automatically instant death.
- One slot contains the fork pair; one hidden exit reveals 2-9.

## 8. World 3 — Crystal Dunes

Current canon:

- Desert/crystal terrain, shifting sand hazards, and crystal spires.
- Boss: Luminite Golem, five earned damage events.

Slots 3-1 through 3-9:

- Detailed current-canon names and layouts are pending approval.
- Progress from readable sand momentum and resonant crystal interactions into refraction, moving dunes, vertical spires, and combined late-world tests.
- One slot contains the fork pair; one hidden exit reveals 3-9.

## 9. World 4 — Skyreach Range

Current canon:

- High-altitude wind, aerial lifts, and moving platforms.
- Boss: Altitude Archmage, five earned damage events.

Slots 4-1 through 4-9:

- Detailed current-canon names and layouts are pending approval.
- Build wind and moving-platform complexity without turning Mebble’s glide into mandatory unrestricted flight.
- Control mapping remains unchanged during camera sweeps and rotating set pieces.
- One slot contains the fork pair; one hidden exit reveals 4-9.

## 10. World 5 — Ember Rift

Current canon:

- Volcano, heat, lava, and eruption hazards.
- Boss: Sand Wraith, five earned damage events.

Slots 5-1 through 5-9:

- Detailed current-canon names and layouts are pending approval.
- Lava pools are instant death.
- Featureless lava eruption orbs may deal ordinary one-heart damage and knockback when configured, while direct pool contact costs a life.
- Configured fire enemies require Ice.
- One slot contains the fork pair; one hidden exit reveals 5-9.

Important conflict rule:

- Older desert-world plans attached to World 5 are historical references only. World 5 is currently Ember Rift, not the old desert plan.

## 11. World 6 — Overgrown Grove

Current canon:

- Dense forest biome with camp-industrial intrusion.
- Boss: Camp Head, five earned damage events.
- World 6 is the second-hardest main world.

Slots 6-1 through 6-9:

- Detailed current-canon names and layouts are pending approval.
- The world should combine organic forest movement, camp machinery, wood-processing hazards, and established camp enemies.
- Camp Head uses turkey-cannon volleys and low-health bass-slap melee.
- One slot contains the fork pair; one hidden exit reveals 6-9.

Important conflict rule:

- Older snow-world plans attached to World 6 are historical references only. World 6 is currently Overgrown Grove.

## 12. World 7 — Toxic Fen

Current canon:

- Poison river, swamp, sluices, toxic machinery, and obscured-but-fair route clues.
- Boss: Fen Phantasm, five earned damage events.
- Hardest main-campaign world.

Slots 7-1 through 7-9:

- Detailed current-canon names and layouts require final review before being treated as locked.
- Poison pools are instant death.
- Featureless poison eruption globules may deal ordinary one-heart damage and knockback when configured; pool contact costs a life.
- Late levels may combine poison tides, seep valves, sporelight clues, projectile redirection, and collapsing sluice machinery.
- One slot contains the fork pair; one hidden exit reveals 7-9.

Finale direction retained for review:

- A large multi-act Fen Phantasm finale may include a fortress approach, rotunda duel, colossal side-scrolling pursuit, final stand, and player-controlled escape.
- All Compass Coins must occur before the irreversible boss door.
- Re-entry resumes from the pre-boss checkpoint but resets boss damage events.

## 13. World 8 — Secret World A

Current canon:

- Secret expert world.
- Harder than every main world.
- Boss: Bone Crusher, five earned damage events.

Slots 8-1 through 8-9:

- Final world title, theme, names, and layouts require current-canon approval.
- Historical bone/echo/catacomb concepts may be mined as references only and are not automatically locked.
- One slot contains the fork pair; one hidden exit reveals 8-9.

## 14. World 9 — Secret World B

Current canon:

- Secret expert world.
- Harder than every main world.
- Boss: Tempest Warden, five earned damage events.

Slots 9-1 through 9-9:

- Final world title, theme, names, and layouts require current-canon approval.
- Historical time/chrono concepts may be mined as references only and are not automatically locked.
- One slot contains the fork pair; one hidden exit reveals 9-9.

## 15. World 10 — Final World

Current canon:

- Unlocks only after 100% completion of Worlds 1–9.
- Substantially hardest world overall.
- Final title, detailed theme, and final boss are not locked.

Slots 10-1 through 10-9:

- Names and detailed layouts remain pending.
- The world should demand mastery of the complete game without unfairly requiring one hero for the final boss.
- One slot contains the fork pair; one hidden exit reveals 10-9.
- Do not adopt a historical final boss, “Gobbler” title, or Ironwood-style world name as current canon without approval.

## 16. Historical level-plan index — reference only

The following names appeared in older Build 018–030 planning and may contain useful mechanic concepts. They are not automatically current canon, especially where world themes changed.

### Historical World 2 examples

- Glassreef Drift
- Drowned Bellhouse
- Wraithbound finale concepts

### Historical World 3 examples

- Sunshard Sands
- Prism Bastion
- Glasswind Ravine
- Echoing Sepulcher
- Luminite Golem finale concepts

### Historical World 4 examples

- Cloudstep Cliffs
- Thunderhead Tunnel
- Kitewind Crossing
- Stormwatch Spire
- Skyrail Convoy
- Hollow Cloudhouse
- Aerie of the Altitude Archmage

### Historical World 5 examples — conflicts with current Ember Rift

- Mirage March
- Dunevault Descent
- Furnace Veins
- Sirocco Spires
- Tomb of Turning Suns
- Wraithwind Hollow
- Palace of the Sand Wraith

### Historical World 6 examples — conflicts with current Overgrown Grove

- Powderpath Rise
- Blackice Grotto
- Whiteout Wall
- Glacier Raft
- Hollow of the Lost Expedition

### Historical World 7 examples

- Sluicegate Bastion
- Sporelight Thicket
- Rotwood Raftway
- Mirror-Mire Manor
- The Fen Throne

### Historical World 8 examples

- Ribcage Rails
- Hollowbeat Vault
- Ossuary Lift
- Silent Bell Catacombs
- Marrow Foundry

### Historical World 9 examples

- Secondhand Steps
- Rewind Reservoir
- Clockrail Relay
- Yesterday’s Maze

### Historical World 10 examples — final canon remains open

- Timberline Breach
- Snarewood Run
- Canopy Cannonade
- Stockade Sabotage
- Dreadnought Convoy
- Black-Pine Orders
- The Last Muster
- Gobbler Command Citadel

## 17. Geometry status

Historical Build 028 created coordinate-free construction scaffolds for 90 levels. These contain IDs, camera-zone placeholders, checkpoint intent, collectible solution references, spawn-anchor groups, hero-gating counts, secret-exit declarations, boss damage-event counts, and implementation requirements.

They deliberately do not contain:

- final level coordinates;
- implemented collision geometry;
- terrain meshes;
- Unity scenes;
- prefabs;
- final camera volumes;
- actual spawn coordinates;
- production-tested jump distances.

Codex must use those ideas as planning inputs, not falsely report the 90 levels as built.

## 18. Level completion checklist

A level is not “complete” until it has:

- approved name and world placement;
- approved core mechanic and escalation;
- full collision geometry;
- required and optional route validation for both heroes;
- three placed/tested Compass Coins;
- checkpoint behavior;
- hidden-exit behavior where applicable;
- enemy placements and encounter budgets;
- block, switch, and power-up placements;
- fatal-hazard volumes;
- camera zones and mobile readability validation;
- final art kit and lighting;
- music cue assignment;
- sound and VFX events;
- save/progression integration;
- automated contract tests;
- target-device playtesting;
- no known progression softlocks.
