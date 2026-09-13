# Meadow Wake browser terrain repair — 13 September 2026

Implementation: `living-bank-20260913-r3`, on `visual/meadow-wake-production-rebuild`.
**Do not update main or replace the live release without the user's approval.**

## Repair

The old visual entry point imported a different query-string URL for
`CharacterRenderer` than `game.js`. JavaScript therefore created two module
instances, and terrain changes were patched onto the unused renderer. The new
entry point patches the exact gameplay renderer and installs one terrain pass.
The earlier stacked experimental passes are not activated.

The replacement retains all 25 terrain modules, all 12 room ranges, all five
pit intervals, and the original course data. The visible contact row tracks the
collision curve to 1.21 logical pixels; collision data and physics are unchanged.
Room-specific bank depth, embedded rounded stone, hanging turf, and overlapping
understory vegetation replace the oversized flat soil curtain. The 12 rock/soil
terrain ledges use the same material language, retaining their existing platform
roots, contact heights, widths and motion. Timber and rope structures, scenery
props, heroes, enemies, blocks, coins, checkpoint and progression are not edited.

Only the original texture kit is used. The supplied quality reference remains a
review image and is never fetched, cropped or tiled into live terrain. The old
reference-cropping surface-polish module has been replaced with a compatibility
export to the same terrain implementation.

## Verification

- `npm run test:terrain`: 10 tests passed, including renderer identity, course
  immutability, height/edge alignment, geometry validity, deterministic output,
  merged-mesh budget, idempotent installation, ledges and review-image exclusion.
- `npm run test:level-one`: all 26 layout and real-input puzzle tests passed.
- Local Chromium captures: opening (8.4 m), quarry (35.2 m), creek (59.2 m), and
  finale (118.2 m); all returned ready, 25 modules, 12 ledges, and no JavaScript,
  console, or HTTP errors.
- The CI visual gate also checks a 932×430 landscape viewport and a creek collision
  overlay. It records the exact tested commit and packages only a passing build.
  CI does not modify the renderer or branch while testing it.

The local review archive omits Blender/Unity source dependencies, so the full
`npm test` run cannot be certified from that archive. The existing layout CI
separately records the full suite, including its pre-existing animation issue.
Software-rendered capture timings are not a mobile-device frame-rate guarantee.

This change implements the requested browser terrain repair. It does not mark
the separate DCC visible master, character rigs, or the entire game's visual art
as approved. Human visual review and permission to update main remain outstanding.
