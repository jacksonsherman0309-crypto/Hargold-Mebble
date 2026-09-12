# Meadow Wake — Level 1 layout delivery

Date: September 11, 2026 (America/New_York).
Scope: playable terrain interactions, authored obstacles, mobs and collectible routes. Character models, rigs and animation assets are unchanged.

## Implemented course

The 124-metre course retains twelve named rooms, seven authored beats, 28 platforms, 36 block instances, 160 trail coins, three Compass Coins, checkpoint at 70.5 metres and goal at 123.25 metres. This is course-specific implementation, not a generated level template.

| Section | Playable layout |
| --- | --- |
| Trailhead Camp / Elder Root Walk | Safe runway, overhead block lesson, solid stump and springy fallen-log launch for C1 without learned double jump. |
| Mason Shelf / Shellback Quarry | Protection before the isolated first Critter. Shellback on the quarry staging ledge; stomp and kick through adjacent ground-level masonry to unlock C2. |
| Timberyard / Stump Creek Hollow | Solid timber climb, optional scaffold/hoist route, separated patrols, bramble clue, concealed lower creek shelf, C3 and working return route. |
| Lantern Bridge / Mill Meadow | Rope crossing, safe checkpoint recovery, lower running route, optional paddle route and shell reuse. |
| Root Terrace / Lookout Ruins | Visible upper/lower routes, contained optional Mebble-glide transfers, rotating/falling steps and Hargold reinforced blocks. Ground route remains open. |
| Flowering Run / Three-Gap Vista | Final protection and enemy reading, solid stump, three graduated gaps with existing recovery mechanisms and a grounded goal trigger. |

## Terrain fixes

Five existing props now have solid side collision: opening stump, fallen log, timber stack, bramble stump and final stump. Existing root, boulder and timber support artwork joins those bodies to the earth. Stump/log crowns and the timber cap align with the collision top; the rocking log has stationary boulder footings. Collision meshes are not rendered as finished art. Awning, elevated decks, bridges and lifts retain one-way behavior.

Overhead blocks leave standing clearance for both heroes, including Mebble, while protection blocks remain hittable with ordinary jumps. Body-footprint support at platform edges removes the early repeated-landing soft lock. Respawn restores the camera; checkpoints do not activate during fatal falls; the finish requires safe ground contact.

## Mobs and archive reconciliation

Six Camp Critters and three Shellbacks are spread through the course instead of five actors clustered near the opening. Patrols avoid the safe opening, secret entry/return, bridge/checkpoint recovery and final landing islands. The HUD counts the nine authored actors rather than the changing active pool.

Current canon admits only Critter and Shellback in Meadow Wake. The older archive's three Spike Beetles and one Camp Sentry belong to later introductions in 1-3 and 1-4, so they are not inserted or replaced with invented extra encounters. Compatible archived counts of six Critters and three Shellbacks are retained and aligned to the current twelve-room layout.

The first Shellback stays on its authored staging ledge until kicked off it. Idle/waking shells are safe reusable tools; a second stomp no longer destroys the needed shell. Rolling shells remain dangerous and respond to grounded obstacles.

## Collectible routes

C1 uses a normal jump from the springy fallen log. C2 unlocks only after actual rolling-shell impacts destroy the three low column blocks; the supported cap collapses. Jumping around an intact column does not award it. C3 uses the interrupted low trail and concealed creek shelf, with a tested return. Creek coins are on the lower route rather than projected onto the ground above. Pickups intersect the whole player body instead of only the foot point. Restart resets route locks and teaching cues.

## Verification

Tested runtime commit: `47ce461c78d05fbd533d6f937f72f6b85d85c799`.
Evidence run: `34662866800`, Meadow Wake layout validation.

- **26 targeted regressions pass**, reproduced by `npm run test:level-one`.
- **15 independent canonical, physics, platform, terrain and movement suite commands pass.**
- **11 real Chromium browser views pass** with no JavaScript errors, missing assets or fallback rendering. Desktop captures use 1536 x 864; mobile-sized captures use 844 x 390.
- Both heroes finish input-only main-route runs using normal abilities, with no learned double jump and no life lost. Individual obstacle, protection-block, creek-return, C1 and normal-input shell-route tests also pass.

The gameplay harness executes the actual browser integration, 120 Hz controller, collision, combat and collectibles, with rendering/DOM stubbed. It is not a separate replacement gameplay simulation. Browser captures independently exercise the real renderer from the assembled static-site payload.

The full `npm test` still stops at the pre-existing `tests/animation-production-system.test.mjs:33` assertion (`undefined` versus `false`), reproduced before these changes. This remains reported separately; character work was not changed to conceal the failure.

Deployment now includes the required `data` JSON directory. Final workflow cleanup removes temporary source-transfer tooling and restores read-only CI permissions.

## References and production boundary

Sources include AGENTS, current canonical level/roster data, the world-specific archive policy, terrain production standard, Meadow Wake emergency restoration report, exact World 1 construction plan, enemy catalog and encounter manifests, plus the stored production-quality and current-deployment terrain images.

The restored landform, room sequence, living-surface layer, backgrounds, lighting and original characters are retained. Foreground changes narrowly fit existing obstacle artwork to corrected gameplay bodies; character-renderer edits only refresh import cache keys.

This delivers the gameplay-layout correction pass, not a claim that final DCC-authored terrain assets, mobile LODs/texture compression, all difficulty variants, final art approval or target-device profiling are complete. Deterministic speedrun timings do not validate ordinary-player two-minute pacing. Software-WebGL captures are not an iPhone frame-rate guarantee. The stored final-art target remains a separate production gate.
