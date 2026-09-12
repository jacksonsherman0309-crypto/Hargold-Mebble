# Meadow Wake — production visual rebuild

Date: September 11, 2026
Branch: `visual/meadow-wake-production-rebuild`

## Objective

Replace the old runtime-modeled/fallback visual presentation with a production-facing Meadow Wake environment that approaches the supplied gameplay target while preserving the completed Level 1 collision, routes, mobs, collectibles, checkpoint, and goal underneath it.

This is **not** another collision/layout pass. Gameplay geometry is treated as locked unless visual verification exposes a genuine mismatch.

## Supplied target hierarchy

1. **Primary in-game quality target:** the supplied Meadow Wake gameplay frame: dense moss/grass cliff faces, irregular earthen silhouettes, layered forest/mountain/waterfall depth, authored camp construction, vegetation, flowers, fences, rocks and readable platform landmarks.
2. **Course/content target:** the supplied panoramic World 1-1 sheet: authored progression, obstacle vocabulary, landmarks, secrets, bridge, ruins, enemies and three Compass Coin beats. Current repository canon still wins where the historical sheet conflicts with later enemy introductions.
3. **Object-language targets:** supplied Hargold/Mebble turnaround, enemy mob chart, coin-block image, Glow Box image and illuminated block image. Character reconstruction is out of scope for this pass; the sheets establish proportion/material language for the environment and props.

## Non-negotiable visual corrections

- Stop presenting the existing procedural/runtime-modeled scenery as finished terrain.
- Ground silhouette must read as irregular living earth: thick turf lip, exposed soil/stone strata, moss, roots and deep foreground vegetation rather than a clean extrusion.
- Increase near-ground visual density substantially with flowers, broadleaf plants, grasses, roots, stones, timber and fence details while preserving gameplay readability.
- Rebuild room landmarks as authored compositions: opening camp, root/log lesson, quarry masonry, timberyard, stump/creek hollow, lantern bridge, mill, root terrace, lookout ruins, flowering run and three-gap vista.
- Background must deliver strong atmospheric separation: close forest, valley, waterfalls, distant cliffs/mountains and sky rather than one flat repeated plate.
- Breakable/coin/power blocks must converge on the supplied chunky stone/wood/metal-framed object language. Glow/reward blocks must read as internally illuminated rather than painted emissive cubes.
- Camp Critter and Shellback presentation must converge on the supplied enemy-sheet proportions/material language without changing their tested gameplay behavior.
- Existing collision/debug geometry must remain visually hidden in normal play.

## First production gate

Do not call this rebuild complete until three representative frames visibly clear the old Codex presentation:

- **Opening:** camp + first block lesson + stump/log landscape.
- **Middle:** quarry/timber/creek or bridge composition showing authored vertical depth.
- **Final:** ruins/flowering run/three-gap vista with layered distant scenery.

Each frame must be compared directly against the supplied targets at gameplay scale. Passing tests alone is insufficient.

## Implementation sequence

1. Replace/augment the far and midground art system so the valley has multiple parallax depth bands and waterfall/cliff landmarks.
2. Rework the visible terrain body/material stack: irregular soil-rock relief, thicker turf crown, moss/root breakup and deep foreground occlusion.
3. Build room-specific foreground dressing sets instead of uniformly scattering repeated foliage.
4. Upgrade camp, quarry, bridge, timber, stump, mill and ruin landmark geometry/materials.
5. Replace block visuals with target-matched authored block families while keeping block state logic untouched.
6. Upgrade Critter/Shellback visual meshes/materials only after the environment establishes the final scale/material baseline.
7. Capture opening/middle/final desktop and mobile frames and reject the pass if it still reads like the previous fallback.

## Locked gameplay boundary

The verified Level 1 delivery remains authoritative for course length, room sequence, platform/block positions, enemy placements, Compass routes, checkpoint and goal. Character models/rigs/animations are not part of this visual rebuild.
