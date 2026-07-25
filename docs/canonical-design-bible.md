# Hargold & Mebble — Canonical Design Bible

Last consolidated: July 25, 2026

This is the top-level design source of truth for Codex and collaborators. It works with `docs/game-mechanics.md`, `docs/level-production-plan.md`, and `src/canonical-data.js`. When sources conflict, the newest explicit user-approved rule wins. Historical Build 025–030 material is reference-only where it conflicts with this document.

## 1. Game identity

- Original mobile-first platforming game starring Hargold and Mebble.
- Primary play format: phone held in landscape orientation.
- Target test device includes iPhone 14 Pro Max.
- Browser prototype remains useful for fast testing, but the production visual target is a fully rendered 3D game.
- Gameplay is a strict linear side-scrolling plane with jumping and vertical platforming.
- “2.75D” means fully rendered 3D heroes, enemies, bosses, props, and environments with controlled visual depth, parallax, cinematic camera sweeps, foreground/background transitions, curved visual paths, and rotating boss arenas.
- Normal gameplay does not use free depth-lane movement or unrestricted 3D roaming.
- The visual plane must always remain readable. Foreground art cannot hide required platforms, fatal hazards, enemies, or landing surfaces.

## 2. Originality boundary

- Nintendo platformers may be studied only for broad responsiveness, pacing, readability, and genre conventions.
- Do not copy Nintendo source code, level geometry, maps, characters, mobs, blocks, pipes, music, names, dialogue, animation, art, or protected visual identifiers.
- All final mechanics, art, characters, enemies, bosses, worlds, objects, layouts, songs, and power-ups must remain original to Hargold & Mebble.
- Hero vocal performances cannot imitate Mario, Luigi, their actors, catchphrases, or recognizable pitch/delivery patterns.

## 3. Locked hero appearance

The latest approved Hargold and Mebble model is locked. Do not change proportions, clothing, colors, accessories, or defining facial features without explicit approval.

### Hargold

- Locked visual authority: `assets/references/Hargold locked production character sheet.png`.
- Very short.
- Very round, heavy, and wider/fatter than Mebble.
- Layered olive-green explorer jacket over a tan shirt, matching the locked sheet.
- Wide-brim olive-green hat with brown band and orange feather.
- Deep red-brown wrapped scarf/cape collar.
- Brown belt and boots.
- Dark moustache and rounded chin beard/goatee treatment exactly as shown in the locked sheet.
- Brown field backpack with flap, straps, pockets, and leaf badge.
- Belt-mounted explorer pouches and brass-colored hardware.
- Cheerful round facial structure with a moderate expression rather than an exaggerated permanent smile.
- Smooth polished 3D game-model finish.

### Mebble

- Locked visual authority: `assets/references/Mebble locked production character sheet.png`.
- Taller and significantly thinner than Hargold.
- Very long, skinny neck.
- Clearly protruding Adam’s apple that must remain visible while standing, moving, jumping, gliding, and posing.
- Small brown top hat with green band and leaf detail.
- Less-round glasses, slightly crooked.
- Very bushy eyebrows.
- Cream rolled-sleeve shirt, brown vest, dark trousers, double belts, and explorer pouches as shown in the locked sheet.
- Tall brown lace-up boots.
- Green cape with the locked back emblem; cape expands as a parachute/glider.
- Do not hide the long neck or Adam’s apple with collar, cape, pose, cropping, or lighting.
- Smooth polished 3D game-model finish.

### Reference-use rule

- The two locked production character sheets above override older character renderings where they differ.
- Their orthographic views, detail callouts, silhouettes, colors, clothing, and visible rig-layout intent are modeling requirements.
- Text printed on a PNG such as “fully rigged,” topology counts, software names, or material claims is descriptive reference content, not proof that editable meshes, armatures, weights, materials, or animation files exist in the repository.
- The separate gameplay-quality image supplied on July 25, 2026 is a lighting, rendering, environment-density, camera, UI-polish, and overall finish target only. It does not override the locked hero sheets or canonical gameplay rules.

### Production character quality

- The rejected blockout geometry and its animation clips are superseded. Replacement hero sources must be built from empty Blender scenes and must not reuse prior character geometry.
- The replacement must preserve the locked identities, silhouettes, proportions, clothing, colors, accessories, and defining facial features above.
- Production meshes require smooth rounded topology, clean deformation edge flow, sculpted faces, expressive brows, detailed hands and boots, layered garments, authored cloth folds, clean UVs, optimized game topology, and planned LODs.
- Hero bodies and soft garments must deform as continuous skinned surfaces. Bone-parented upper-arm, forearm, elbow, hand, thigh, or shin pieces that read as an articulated wooden doll are not acceptable production geometry.
- Character approval requires action-pose and gameplay-camera deformation review; a neutral T-pose or still turntable is not sufficient evidence of an animated production character.
- Final materials require authored PBR texture sets, including base color, roughness, normal detail, and ambient-occlusion support where appropriate. Procedural flat-color materials are not a final substitute.
- Production rigs require IK/FK limbs, finger articulation, eye, brow, jaw and mouth controls, gameplay sockets, and secondary controls for Hargold's hat, feather and scarf and Mebble's hat, cape and clothing.
- Every gameplay clip must be newly authored with readable anticipation, controlled squash and stretch, follow-through, overlapping secondary motion, lively idle posing, reliable foot contacts, and seamless state blending.
- Nintendo games may be used only as a broad craftsmanship, readability, responsiveness, and finish benchmark. Do not copy proprietary tuning values, poses, animation data, code, meshes, materials, textures, or protected designs.

## 4. Core movement

- Smooth acceleration and responsive deceleration.
- Both heroes use the same shared horizontal base-controller tuning for walking, running, sprinting, turning, braking, and air control.
- Walk, run, and sprint are separate locomotion targets with seamless speed-driven blending.
- Precise, readable jump arcs.
- Variable jump height based on input hold duration.
- Coyote time and jump buffering are allowed for responsiveness.
- Wall jumps are universal for both Hargold and Mebble.
- All required main-route jumps must be possible for Hargold in the intended state.
- Mebble jumps slightly higher than Hargold.
- The required character state set includes crouch, crawl, slide, rolling momentum, wall reaction, ledge stop, look up, duck, landing recovery, hurt, and victory in addition to the existing universal movement baseline.
- Animation presentation cannot alter deterministic gameplay outcomes or introduce unrestricted depth movement.
- Normal control mapping remains consistent through cinematic camera movement.

### Hargold movement/ability

- Uses the shared horizontal base controller without a speed penalty.
- Can break Hargold-only blocks and heavy barriers.
- Heavy-rock enemies can only be defeated by Hargold’s ground slam.
- Gains double jump as a learned progression skill.
- Double jump is not available by default unless an explicit developer test mode enables it.
- Once unlocked, it may be used once during an airborne sequence and resets on landing or an approved reset object.

### Mebble movement/ability

- Uses the shared horizontal base controller and retains the slightly higher jump.
- Innate cape parachute/slow-fall.
- Holding glide during descent slows vertical speed and permits limited horizontal correction.
- Glide cannot generate infinite height or unrestricted flight.
- Selected high switches or long transfers require Mebble.

## 5. Hero swapping and gating

- Player can swap heroes in levels where swapping is enabled.
- Preserve foot position during valid swaps.
- Reject swaps that would place the new hero inside a wall, floor, enemy, hazard, or space too small for Mebble.
- Give clear feedback when a swap is rejected.
- One to two obstacles per level should require Mebble.
- Several blocks per level should require Hargold.
- Group mandatory Mebble obstacles into one contained section whenever practical.
- Avoid repeated back-and-forth hero switching on required main routes.
- Additional swaps are best reserved for optional rooms, hidden exits, Compass Coins, shortcuts, and rewards.

## 6. Hearts, health, lives, and death

### Separate systems

- Hearts/current health and lives are separate systems.
- Never describe hearts as lives or show them as one shared counter.

### Health layers

- Base/small state has one health layer.
- Grow/Size adds one survivable hit.
- An eligible power-up may add one more survivable hit.
- Maximum current protection is three survivable health layers.
- Normal damage removes one layer and downgrades state in a readable order.
- Losing the final health layer costs one life.

### Lives and coins

- Default starting lives: 3 until explicitly changed.
- Every 100 standard coins awards one extra life.
- Retain excess coins after the award.
- Lives cap at 99.
- At zero lives, use a game-over flow. Do not silently reset to three lives in production gameplay.

### Instant-death hazards

- Bottomless pits, lava, and poison immediately cost one life regardless of hearts or power-up state.
- These hazards bypass hearts, active power-ups, and invulnerability.
- After a life loss, respawn at the most recent checkpoint if one was reached.
- Without a checkpoint, restart the level from the beginning.
- Boss damage progress resets after a life loss/re-entry.

## 7. Checkpoints and persistence

- Checkpoint activation requires clear visual and audio feedback.
- Checkpoint snapshots may retain defeated enemies, activated one-time mechanisms, destroyed persistent blocks, and completed pre-checkpoint encounter waves.
- Post-checkpoint temporary changes roll back after life loss.
- Temporary power-ups may reset after life loss.
- Permanent campaign collectible records remain saved.
- Manual restart cannot corrupt campaign progression.

## 8. Collectibles

- Exactly three major collectibles per completion slot.
- Current major collectible name: Compass Coin.
- Compass Coins should appear distinctly golden and more important than standard coins.
- Campaign structure contains 90 completion slots and 270 Compass Coin slots.
- Each level tracks its three Compass Coins separately.
- Standard coins feed the 100-coins-for-one-life system.

## 9. Four block types only

Keep the standard roster limited to four types unless explicitly changed:

1. Standard breakable blocks — both heroes.
2. Hargold-only blocks — Hargold only.
3. Coin blocks — both heroes.
4. Power-up blocks — both heroes.

Additional named materials may visually theme a Hargold-only block, but they do not create extra gameplay block categories.

Visible course blocks and traversable platforms are gameplay geometry. A rendered block must respond to a valid underside hit, enforce its hero interaction rule, and persist its consumed or destroyed state. A rendered one-way platform must support landing from above while permitting travel from below.

### Coin blocks

- Bright yellow/gold is allowed.
- Shape, surface treatment, symbol, animation, and sound must be original.
- Use a coin-specific symbol, not a generic mystery symbol.
- Approved randomized reward table:
  - 1 coin: 78%
  - 5 coins: 14%
  - 10 coins: 7%
  - 100 coins: 1%

## 10. Switches

- Required switches are visible or hidden inside hittable blocks.
- Hidden switches pop out with a reveal animation and sound cue.
- Switch effects must clearly connect to the gate, platform, route, or mechanism they affect.
- Mebble can activate selected high switches.
- Required switches cannot become permanently missable without a reset path.
- Optional switches may reveal collectibles, shortcuts, secret exits, or alternate routes.

## 11. Power-ups and earned skills

### Current approved set

1. Grow/Size — adds one survivable health layer.
2. Fire — separate fire projectile/attack.
3. Ice — separate freezing/ice attack; required for configured fire enemies.
4. Bubblebloom Charm — creates utility bubbles; hero contact pops them; bubbles cannot be stood on or ridden; may trap light enemies or lift approved objects.
5. Stonefist Gloves — punches/ground strikes reinforced objects, creates a short shockwave, applies knockback, and operates heavy stone mechanisms.
6. Mebble Glide Cape — innate ability, not a random drop.
7. Open movement/exploration power-up slot — not finalized.
8. Ultra-rare timed power-up — final identity not locked; cannot appear in boss levels.

### Earned skill

- Beaconscope Lantern is a progression-earned exploration/reveal skill, not a random level drop.

## 12. Enemy design standards

- All enemies must be original and production-intent 3D models.
- Most common enemies are smaller than the heroes, generally knee-to-waist height relative to Hargold and below Mebble’s waist.
- In the gameplay camera, Hargold should read at roughly two to three common-enemy heights. Mebble remains visibly taller and thinner. Character render and collision scale must be evaluated against enemies, blocks, platform thickness, and terrain—not in isolation.
- Most common enemies die from one valid hit.
- Eyes should be smaller and less uniform: roughly 20% smaller on non-animal enemies and 10% smaller on animal enemies compared with rejected concepts.
- Smiles should be reduced and expressions should be more moderate.
- Avoid identical human-like faces across unrelated enemies.
- Early levels should not be crowded with flying/gliding enemies.

### Locked interaction rules

- Camp Chipper is a one-hit enemy.
- Heavy-rock enemies require Hargold ground slam.
- Spiked enemies damage unsafe stomps.
- Configured fire enemies require Ice.
- Tidebiter remains in water.
- Defeated enemies should not remain damaging during defeat animation unless intentionally designed.

### Named enemies currently referenced

- Camp Critter — small one-hit ground enemy.
- Camp Sentry — anchored projectile enemy with a readable firing pose, muzzle effect, visible projectile, and readable path.
- Camp Chipper — approximately Hargold waist height; fuller camp-worker/wood-chipper identity and accessories; one-hit.
- Shellback — early ground enemy with multi-state behavior.
- Acorn Bomber — rolling/dropped acorn hazards.
- Dirt Squirt — burrow/tunnel behavior.
- Spike Beetle — spiked, unsafe stomp.
- Steamgor — fire enemy requiring Ice.
- Tidebiter — water-only.
- Storm Hulk — jump and shockwave attacks.
- Rock Runt, Crabber, Mud Mite, Wormlet and other approved roster entries remain available subject to current world placement plans.

## 13. Boss design

- Every world ends with a boss.
- Standard boss defeat requires five earned damage events.
- Each hit needs a readable setup, telegraph, counterplay window, and consequence.
- Bosses escalate through phases and arena changes rather than only gaining health.
- Boss arenas may use controlled 2.75D rotation and cinematic movement while the playable plane remains strict and readable.
- Ultra-rare timed power-ups cannot appear in boss levels.
- No human boss except Camp Head.

### Current boss lineup

1. Verdant Vale — Verdant Wyrm.
2. Tideglass Coast — Wraithbound.
3. Crystal Dunes — Luminite Golem.
4. Skyreach Range — Altitude Archmage.
5. Ember Rift — Sand Wraith.
6. Overgrown Grove — Camp Head.
7. Toxic Fen — Fen Phantasm.
8. Secret World A — Bone Crusher.
9. Secret World B — Tempest Warden.
10. Final World — not finalized.

### Camp Head

- Boss-only.
- Handheld oversized turkey-launching cannon, carried with both hands and visibly braced.
- Primary phase uses turkey projectile volleys.
- Low-health phase adds a telegraphed “bass slap” melee attack using a large fish.
- Bass slap is reserved for low health.

## 14. Campaign structure

- Ten worlds total.
- Worlds 1–7: main campaign.
- Worlds 8–9: secret worlds, harder than every main world.
- World 10: unlocks after 100% completion of Worlds 1–9, including both secret worlds; substantially hardest overall.
- Four modes: Easy, Normal, Hard, Nightmare.
- World 1 is the easiest.
- Worlds 6 and 7 are the hardest main worlds, with World 7 clearly hardest.
- Worlds after World 1 should not be treated as one-star difficulty.

### Per-world route structure

- Eight main completion slots.
- One slot contains a fork pair of alternative routes; the player chooses one to continue.
- One hidden exit reveals a secret ninth completion slot.
- The fork routes must be meaningfully different.
- The secret level is not a replacement for the fork.
- Each completion slot contains three Compass Coins.

## 15. Current world identities

1. Verdant Vale — bright grasslands, streams, woodland edges, stone ruins.
2. Tideglass Coast — coastal cliffs, flooded coves, tidal caves, water mobility.
3. Crystal Dunes — desert/crystal terrain, shifting sand, crystal spires.
4. Skyreach Range — altitude, wind, aerial lifts, moving platforms.
5. Ember Rift — volcano and heat.
6. Overgrown Grove — forest biome and camp-industrial intrusion.
7. Toxic Fen — poison river/swamp.
8. Secret World A — exact title/theme still subject to current canon review.
9. Secret World B — exact title/theme still subject to current canon review.
10. Final World — exact title/theme and final boss remain open.

## 16. Level pacing and construction

- Average completion target: about two minutes at a moderately quick pace.
- Levels need actual platforming density: terrain changes, pits, blocks, enemies, coin routes, hazards, optional rooms, and secrets.
- Avoid long empty walking sections.
- Preserve the approved World 1 environmental art direction: layered valley depth, warm daylight, atmospheric haze, saturated natural color, and detailed 3D scenery. Foreground construction must rise to that bar without restarting or flattening the art direction.
- Handcraft the playable foreground around movement decisions. Alternate rolling hills, ledges, bridges, vertical climbs, ruins, camps, clearings, elevated routes, and secrets rather than relying on broad uninterrupted ground.
- Standard courses should target approximately 80–90% supported terrain and 10–20% memorable pit spans. This is a course-level pacing ratio, not a command to distribute pits evenly.
- Terrain and mechanisms should provide substantial obstacle variety: narrow ledges, moving/falling/rotating platforms, lifts, seesaws, bridges, breakable formations, and optional routes.
- Use dense coin lines, arcs, vertical stacks, interrupted clues, and concealed rewards to teach jumps, guide momentum, and signpost route choices.
- Camps, fallen logs, stumps, fences, cliffs, and ruins should serve environmental storytelling and readable platforming roles rather than appearing as disconnected decoration.
- Teach a mechanic safely, test it, then combine it with previous mechanics.
- Use approximately seven encounter/camera beats as a planning scaffold where appropriate, but do not force identical pacing on every level.
- Spawn enemies offscreen or with a readable telegraph.
- Never spawn an enemy inside a safe landing zone.
- Use recovery gaps after dense enemy sequences.
- Required paths must remain possible for Hargold.

## 17. Camera

- Smoothly follow the active hero and look ahead in the travel direction.
- Keep the collision/play plane obvious.
- Cinematic sweeps, zooms, rotation, and foreground/background transitions cannot change control mapping or hide required hazards.
- Boss camera work can be dramatic while collision and player input remain predictable.

## 18. Mobile HUD and controls

- Landscape layout is mandatory for the primary mobile build.
- All controls must fit on iPhone 14 Pro Max without clipping.
- Touch controls cannot cover the active hero, fatal hazards, or required landing areas.
- Show separate HUD elements for:
  - current health layers/hearts;
  - lives, capped at 99;
  - standard coins toward the next life;
  - three Compass Coin slots;
  - active power-up/ability.
- Touch buttons require pressed states and reliable pointer-cancel handling.

## 19. Music, text, and vocalization

- Every world should have its own original musical identity.
- Every level should have a distinct original cue that retains its world’s leitmotif without becoming the same loop repeated 90 times.
- Every boss has a separate original boss theme.
- Boss music escalates through the five earned damage events.
- No spoken dialogue or lip-synced conversation.
- Tutorials, objectives, reactions, boss notices, and map notices use localization-backed text bubbles.
- Critical information must also be readable through animation, UI, telegraphs, or level design.
- Hargold and Mebble use original nonverbal grunts, cheers, yelps, breaths, pain sounds, and effort reactions.

## 20. Save/progression expectations

The complete save model should eventually record:

- completion by difficulty;
- best clear time and clear count;
- last hero used;
- each of the three Compass Coins independently;
- secret-exit discoveries and source levels;
- boss clears, best times, five-event completion, and no-damage history;
- Hargold double-jump unlock;
- Beaconscope Lantern unlock;
- world-map state;
- inventory/house state when those systems are finalized;
- main ending, postgame, and final-ending states.

## 21. Production truth

The GitHub repository currently contains a runnable browser prototype, canonical data, tests, and design documentation. It is not yet a complete commercial 3D game.

Historical Build 025–030 planning reported:

- 10 worlds;
- 90 completion slots;
- 270 Compass Coin slots;
- campaign, route, boss, save, editor-data, pooling, audio-event, rig-contract, and QA scaffolds.

Those builds explicitly did not include a real Unity project, implemented level geometry, final collision, 3D meshes, skeletons, skin weights, animation clips, materials, textures, final music, recorded voices, or final audio. Codex must not claim those assets exist until they are actually committed.

## 22. Change-control rule

Whenever the user approves a new mechanic, level plan, world name, design change, boss behavior, power-up, enemy, audio rule, or visual constraint:

1. Update this design bible and the relevant specialized document.
2. Update `src/canonical-data.js` when the rule is machine-readable.
3. Add or update tests.
4. Implement the behavior in playable code when the task includes implementation.
5. Mark unresolved items as open rather than inventing final canon.
