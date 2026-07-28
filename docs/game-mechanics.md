# Hargold & Mebble — Canonical Game Mechanics

Last consolidated: July 25, 2026

This is the authoritative gameplay specification for Codex and all collaborators. Newer explicit user instructions override older rules. Existing prototype code is not authoritative when it conflicts with this file.

## 1. Core product rules

- Mobile-first side-scrolling platformer, primarily played in landscape orientation.
- Target test device includes iPhone 14 Pro Max; every touch control must remain visible, comfortable, and clear of critical gameplay.
- The playable route is a strict linear side-scrolling plane. Normal gameplay does not allow free forward/backward depth movement.
- Presentation is fully rendered 3D “2.75D”: 3D heroes, enemies, bosses, props, and environments with parallax, cinematic depth, foreground/background transitions, camera sweeps, and rotating boss arenas while gameplay remains readable on the linear plane.
- Movement should be smooth, responsive, and precise, with readable jump arcs, acceleration/deceleration, stomp timing, and low input latency.
- Nintendo platformers may be studied only as general responsiveness references. Do not copy Nintendo code, characters, enemies, blocks, levels, maps, music, names, art, or protected identifiers.
- Placeholder shapes are acceptable only for temporary engineering tests. Playable milestones should use approved or production-intent assets.

## 2. Required player actions

- Move left and right.
- Variable-height jump.
- Swap between Hargold and Mebble where swapping is enabled.
- Use the active hero ability or active power-up action.
- Pause and restart.
- Mobile and keyboard controls must produce the same core behavior.
- Space/W/Up starts a jump when grounded or within coyote time. One later fresh press triggers Mebble's twirl, Hargold's twirl before unlock, or Hargold's learned double jump after unlock.
- Down/S or the mobile SLAM control starts the universal ground slam from ascent, apex, or descent.

## 3. General movement

- Use smooth acceleration rather than immediately snapping to maximum speed.
- Deceleration must remain responsive enough for precise landings.
- Hargold and Mebble share identical horizontal base-controller tuning for walk, run, sprint, turning, braking, and air control.
- Directional hold accelerates through walk, run, and full-speed locomotion. There is no separate manual sprint action; animation blending follows actual horizontal velocity.
- Jump height should respond to how long the jump control is held.
- Air twirl is limited to once per airborne sequence, preserves horizontal momentum, and applies a short bounded hang-time window without adding jump height as a second launch.
- Ground slam uses explicit startup, descent, impact, and recovery phases. A held airborne Down input becomes an ordinary fast fall when the ground-slam clearance and airborne-time requirements are not satisfied.
- Unrestricted wall jumping is disabled for both heroes unless a later explicit rule adds it.
- Coyote time and jump buffering may be used to improve responsiveness without making jumps automatic.
- All mandatory progression jumps must be possible with Hargold in the intended state.
- Mebble jumps slightly higher than Hargold.
- Required presentation states include crouch, crawl, slide, rolling momentum, wall reaction, ledge stop, look up, duck, landing recovery, hurt, and victory.
- Movement and animation blending should be energetic and readable while deterministic simulation remains authoritative and root motion remains disabled by default.
- The gameplay plane remains linear even when visual paths curve or the camera moves through depth.

## 4. Hero swapping

- Swapping changes between Hargold and Mebble.
- Preserve foot position during a valid swap.
- Never place the new hero inside terrain, an enemy, a hazard, or another invalid space.
- Block the swap with clear feedback when Mebble’s taller body cannot fit.
- Early World 1 teaches hero swapping.
- Required and optional routes may use the heroes’ different abilities.

## 5. Hargold mechanics

- Shorter, wider, heavier hero.
- Uses the shared horizontal base controller without a movement-speed penalty.
- Can break Hargold-only blocks and designated heavy barriers.
- Must be capable of all required progression jumps.
- Gains a double jump as a learned progression skill.
- The double jump is not available before unlock unless a clearly labeled developer test mode enables it.
- It can be used once during an airborne sequence and resets on landing or another explicitly approved reset condition.
- Hargold is the primary force-based and reinforced-block hero.

## 6. Mebble mechanics

- Taller, thinner hero.
- Uses the shared horizontal base controller.
- Jumps slightly higher than Hargold.
- Has an innate cape parachute/glide.
- Holding Space while descending opens the cape, slows the fall, and permits limited horizontal correction or a short glide.
- Glide must not create infinite flight or height gain.
- Can reach and activate selected switches that Hargold cannot reach.
- His taller collision body must be respected in tunnels and during swaps.

## 7. Earned exploration skill

- Beaconscope Lantern is an earned player skill, not a random power-up drop.
- It is reserved for reveal/exploration functionality as later levels define it.

## 8. Hearts, health layers, lives, and damage

### Separate systems

- Hearts/current health and lives are separate resources.
- Never label hearts as lives or implement them as one counter.

### Health layers

- Base/small state has one current health layer; losing that final layer costs one life.
- Standard Grow/Size grants one extra survivable hit.
- Eligible additional power-up states may grant another survivable hit.
- Current cap: three total survivable health layers.
- A normal damaging hit removes one layer and downgrades the state in a predictable, readable order.
- Losing all current health costs exactly one life.

### Lives

- Default starting lives remain 3 until explicitly changed.
- Every 100 standard coins awards 1 extra life.
- Retain excess coins after awarding the life.
- Lives stack to a maximum of 99.
- At 0 lives, enter a game-over flow. Production gameplay must not silently reset lives to 3.

### Instant-death hazards

- Bottomless pits, lava, and poison immediately cost one life regardless of remaining hearts or power-up state.
- These hazards bypass the health-layer system entirely.
- After losing a life, respawn at the most recent reached checkpoint.
- If no checkpoint has been reached, restart the level from the beginning.
- Respawn at a safe position; temporary invulnerability may prevent unavoidable repeat damage.

## 9. Checkpoints and exits

- Reaching a checkpoint updates the respawn position for the current level.
- Checkpoint activation needs visible and audible confirmation.
- Normal exits complete the level when completion requirements are satisfied.
- Secret exits are separate from normal exits and unlock their intended secret content.
- Manual restart must not corrupt permanent progression or collectible records.

## 10. Coins and major collectibles

### Standard coins

- Standard coins count toward the 100-coins-for-one-life loop.
- Coin pickup must provide immediate visual and audio feedback.
- Lives remain capped at 99.

### Compass Coins

- Every level contains exactly 3 of the same major collectible: Compass Coins.
- Compass Coins should appear distinctly golden and more important than standard coins.
- Store three persistent collectible slots per level for completion tracking.

## 11. Approved block roster

Keep the standard roster at four types unless explicitly expanded:

1. Standard breakable blocks
   - Both heroes can break them when in the required state/action.
2. Hargold-only blocks
   - Only Hargold can break them.
3. Coin blocks
   - Bright yellow may remain, but shape, surface, animation, and icon must be original.
   - Use a coin-specific symbol, not a mystery/chance symbol.
4. Power-up blocks
   - Spawn an eligible power-up or reward under the level rules.

Block hits need animation, sound, and clear feedback. Consumed blocks must not duplicate contents unless intentionally reusable. Hidden progression switches may be placed inside hittable blocks.

Rendered blocks and platforms are never scenery-only substitutes. Blocks need collision and authored hit behavior; one-way platforms accept landings from above and allow upward movement through their underside. Gameplay-camera scale should keep Hargold at roughly two to three common-enemy heights, with Mebble visibly taller and thinner.

## 12. Coin-block reward table

When a randomized coin block uses the approved reward table, use exactly:

- 1 coin: 78%
- 5 coins: 14%
- 10 coins: 7%
- 100 coins: 1%

The 100-coin reward must correctly award extra lives and obey the 99-life cap.

## 13. Switches and progression gates

- Required progression switches must be visible or hidden inside a hittable block.
- Hidden switches pop out with a reveal animation and sound cue.
- Mebble may activate selected high switches inaccessible to Hargold.
- Switch effects must be visually traceable to the gate, path, platform, or mechanism they affect.
- Required switches cannot become permanently missable without a reset path.
- Optional switches may reveal collectibles, shortcuts, secret exits, or alternate routes.

## 14. Power-up system

### General rules

- Fire and Ice are separate power-ups with separate visuals and abilities.
- Eligible power-ups may add health protection, but current health cannot exceed the three-layer cap.
- Damage downgrades the power-up state predictably.
- Power-up placement should aid pacing and recovery without trivializing hazards.
- The ultra-rare timed power-up cannot appear in boss levels.

### Current roster

1. Standard Grow/Size
   - Increases the hero from base state and grants one additional survivable hit.
2. Fire
   - Grants a fire projectile or attack.
   - Used against ice-weak targets and approved fire interactions.
3. Ice
   - Grants freezing/ice attacks.
   - Required to defeat configured fire enemies.
4. Bubblebloom Charm
   - Creates bubbles for utility and enemy/object interaction.
   - Active bubbles pop when the hero touches them.
   - The player cannot stand on or ride bubbles.
   - Bubbles may trap lightweight enemies or lift approved objects.
5. Stonefist Gloves
   - Punch or ground-strike reinforced blocks.
   - Create a short-range shockwave.
   - Apply knockback and interact with heavy stone mechanisms.
6. Mebble Glide Cape
   - Innate Mebble ability, not a random drop.
   - May receive progression upgrades later.
7. Open movement/exploration slot
   - Not finalized. Do not invent a permanent replacement without approval.
8. Ultra-rare timed power-up
   - Powerful and time-limited.
   - Cannot appear in boss fights.
   - Final identity is not locked.

## 15. Combat and enemy interactions

- Most common enemies are defeated in one valid hit.
- Safe stomps defeat eligible common enemies.
- Spiked enemies damage the player when stomped without the appropriate protective mechanic or power-up.
- Ordinary enemy contact removes one health layer unless explicitly configured as instant death.
- A defeated enemy should not remain damaging through its defeat animation unless intentionally designed.
- Fire enemies require Ice to defeat when configured by that rule.
- Tidebiter remains water-only.
- Early levels should not be crowded with flying/gliding enemies.

### Named enemy mechanics

- Camp Critter: small common ground enemy; one-hit defeat; distinct behavior from other ground enemies.
- Camp Sentry: anchored projectile enemy; visible firing pose, muzzle effect, projectile, and path are mandatory.
- Camp Chipper: larger than the smallest mobs, approximately Hargold waist height; more involved camp-worker/wood-chipper behavior and equipment.
- Shellback: early World 1 ground enemy.
- Acorn Bomber: introduces rolling or dropped acorn hazards.
- Dirt Squirt: burrow/tunnel-oriented enemy.
- Spike Beetle: spiked enemy; unsafe to stomp without correct protection.
- Steamgor: power-up-gated defeat; apply the fire-enemy-requires-Ice rule.
- Tidebiter: water-only.
- Storm Hulk: jump and shockwave attacks when implemented.

## 16. Boss mechanics

- Every world ends with a boss.
- Standard boss defeat requires 5 successful hits, not 3.
- Hits must be earned through readable attack windows and telegraphs.
- Difficulty should escalate through phases, not only extra health.
- Boss arenas may use controlled 2.75D camera movement while player movement remains readable and constrained.
- Ultra-rare timed power-ups do not appear in boss levels.
- No human bosses except Camp Head.

### Boss lineup

1. Verdant Vale — Verdant Wyrm
2. Tideglass Coast — Wraithbound
3. Crystal Dunes — Luminite Golem
4. Skyreach Range — Altitude Archmage
5. Ember Rift — Sand Wraith
6. Overgrown Grove — Camp Head
7. Toxic Fen — Fen Phantasm
8. Secret World A — Bone Crusher
9. Secret World B — Tempest Warden
10. Final World — boss not finalized

### Camp Head

- Boss-only; never a regular mob.
- Uses a handheld oversized turkey-launching cannon.
- Primary phase uses turkey projectile volleys.
- Low-health phase adds a clearly telegraphed melee “bass slap” with a large fish.
- The melee attack is reserved for the low-health phase.

## 17. Level structure and pacing

- Target average completion time is about 2 minutes at a moderately quick pace.
- Levels must include real platforming content: terrain variation, pits, blocks, enemies, coin routes, hazards, and optional exploration.
- Avoid empty walking stretches.
- Normal courses target approximately 80–90% supported terrain and 10–20% meaningful pit spans, with exact placement authored per course.
- Meadow Wake specifically uses a ground-first introduction: approximately
  65–75% of ordinary forward play stays on connected ground, while its few
  true-gap events are grouped and clearly framed rather than repeated across
  every screen.
- The authored target mix is 70% connected-ground play, 20% optional elevated
  play, and 10% dedicated platform sequences. The percentages describe course
  pacing and do not authorize generated or evenly repeated layouts.
- Foreground flow alternates hills, layered ledges, bridges, vertical climbs, ruins, camps, clearings, and elevated or concealed routes.
- Moving, falling, rotating, lift, and seesaw platforms are collision-bearing mechanisms, not decorative motion.
- Dense coin trails, arcs, stacks, optional paths, and interrupted secret clues teach movement and reward exploration.
- Environmental structures such as camp decks, fallen logs, stumps, fences, and ruins may carry traversal and block formations when their collision remains readable.
- Meadow Wake is divided into twelve named outdoor gameplay rooms nested inside
  its existing seven beats. Each room has a dominant landmark connected to at
  least one collision-bearing traversal element and an authored landform
  language distinct from the rooms around it.
- Meadow Wake's landmark cadence targets roughly eight to ten seconds of play
  per room. Landmarks orient the route and cannot be treated as scenery-only
  backdrop dressing.
- All Meadow Wake blocks are members of named gameplay phrases with a teaching,
  route, recovery, gating, secret, or reward purpose.
- Teach a mechanic safely, test it, then combine it with prior mechanics.
- Required paths remain possible for Hargold.
- Optional routes may reward Mebble’s jump/glide, Hargold’s block breaking, switches, power-ups, or learned skills.
- Each level contains exactly 3 Compass Coins.
- Each world has one hidden exit in one level that reveals that world’s secret ninth level.

### Per-world route format

- Eight main progression slots.
- One slot is a fork pair; the player chooses one of two alternative levels/routes to continue.
- One secret ninth level is unlocked through the hidden exit.
- Fork choices must be meaningfully different rather than near-duplicates.

## 18. Campaign progression and difficulty

- Total worlds: 10.
- Worlds 1–7 are the main campaign.
- Worlds 8 and 9 are secret worlds and harder than any main-campaign world.
- World 10 unlocks only after 100% completion of Worlds 1–9, including both secret worlds.
- World 10 is substantially harder than the rest of the game.
- Four modes: Easy, Normal, Hard, Nightmare.
- World 1 is the easiest.
- Worlds 6 and 7 are the hardest main worlds; World 7 is clearly harder than World 6.
- Nothing after World 1 should be treated as one-star difficulty; later worlds begin around 2.5 stars or higher on the internal scale.

## 19. World themes

1. Verdant Vale — bright grasslands, rolling hills, streams, woodland edges, stone ruins.
2. Tideglass Coast — coastal cliffs, flooded coves, tidal caves, water mobility.
3. Crystal Dunes — desert/crystal world with sand hazards, shifting dunes, crystal spires.
4. Skyreach Range — altitude/sky world with wind, lifts, moving platforms.
5. Ember Rift — volcano and heat world.
6. Overgrown Grove — forest biome; Camp Head boss.
7. Toxic Fen — poison river/swamp; designated poison is instant death.
8. Secret World A — hidden, very difficult; Bone Crusher boss.
9. Secret World B — hidden, very difficult; Tempest Warden boss.
10. Final World — 100%-completion unlock; substantially hardest; final boss TBD.

## 20. World 1 teaching sequence

1. Meadow Wake
   - Movement, jumping, swapping, basic blocks.
   - Camp Critter and Shellback.
2. Acorn Run
   - Rolling slopes and Acorn Bomber hazards.
3. Burrowbank
   - Tunnels, Dirt Squirts, Spike Beetles.
4. Sentry Span
   - Camp Sentry introduction and projectile timing.
5. Ruin Rise
   - Vertical segments and Hargold-only blocks.
6. Glideway
   - Mebble glide training.
7. Cliffline Fork
   - Branch choice between two alternative routes.
8. Verdant Gate
   - Castle/arena lead-in.
9. Secret level
   - Revealed through Verdant Vale’s hidden exit.

World boss: Verdant Wyrm, defeated after 5 successful hits.

## 21. Camera and readability

- Camera follows the active hero smoothly and looks ahead in the travel direction.
- The playable surface and collision plane remain obvious.
- Cinematic sweeps, rotations, zooms, and foreground/background movement cannot hide hazards or unexpectedly change controls.
- Boss camera movement may be dramatic but input and collision remain predictable.
- Normal gameplay has no free depth lanes.
- Parallax and scenery must not obscure platforms.

## 22. Mobile HUD and controls

- Landscape layout is mandatory for the primary mobile build.
- All controls must fit on an iPhone 14 Pro Max without clipping.
- Touch controls cannot cover the active hero or critical hazards.
- Show separate indicators for:
  - Current hearts/health layers.
  - Lives, capped at 99.
  - Standard coins toward the next extra life.
  - Three Compass Coin slots.
  - Active power-up/ability.
- Never label hearts as lives.
- Touch buttons need visible pressed states and reliable pointer-cancel behavior.

## 23. Required implementation tests

As systems are implemented, add or maintain tests for:

- Hargold/Mebble acceleration, deceleration, jump, landing, and swap.
- Mebble jump height being slightly greater than Hargold’s.
- Valid swap preserving feet and invalid/tight swaps being rejected.
- Mebble glide slowing descent without infinite flight.
- Hargold double jump unavailable before unlock and usable once per airborne sequence afterward.
- Hargold-only blocks rejecting Mebble.
- Exact coin-block probability distribution totaling 100%.
- Each 100 coins granting one life, preserving excess, and capping lives at 99.
- Hearts and lives updating independently.
- Normal damage removing health and zero health costing one life.
- Pit, lava, and poison bypassing health and immediately costing one life.
- Checkpoint respawn and no-checkpoint level restart.
- Game-over at zero lives with no automatic production reset to 3.
- Exactly three Compass Coins per level with persistent state.
- Spiked stomp damage without correct protection.
- Configured fire enemies requiring Ice.
- Bosses requiring 5 valid hits.
- Ultra-rare power-up exclusion from boss levels.
- Mobile control visibility at the target viewport.

## 24. Open decisions — do not finalize without approval

- Identity/mechanics of the seventh movement/exploration power-up.
- Identity/mechanics of the ultra-rare timed power-up.
- Final World theme details and final boss.
- Exact numerical tuning for acceleration, gravity, jump velocity, coyote time, buffering, glide speed, and invulnerability.
- Exact heart icon presentation beyond the approved three-layer cap.

Temporary implementations for open items must be clearly marked provisional and never presented as approved canon.
