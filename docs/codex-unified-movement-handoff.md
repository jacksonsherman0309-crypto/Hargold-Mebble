# Codex Handoff — Unified Character Movement and Physics

Use `src/runtime/motion/motion-controller.js` as the single reusable source of truth for character locomotion. Do not create another disconnected movement controller inside `src/game.js`, a level file, or a character renderer.

## Source boundary

This implementation is clean-room project code. It is informed by observable side-scrolling platformer behavior, the project's archived Build 009/017 specifications, and the current Hargold & Mebble canon. It does not contain Nintendo source code, decompiled code, extracted constants, meshes, animation files, or other proprietary assets.

Do not search for, import, translate, or paste leaked/decompiled Nintendo code. Behavioral observation may be used to tune the original controller, but every implementation must remain independently authored and covered by repository tests.

## Required input mapping

- Left/right: `A` / `D` or arrow keys.
- Run: `X`.
- Sprint: `Shift`.
- Initial jump: `Space`, `W`, or up arrow.
- Mid-air twirl: press `Space` again while airborne. Feed this as another `jumpPressed` edge. The modular controller permits one twirl per airtime and resets it on landing.
- Ground slam: press `S` or down arrow while airborne. Feed the edge as `downPressed` or `groundSlamPressed`; continue feeding `fastFallHeld` while held.
- Mebble glide: `E` / action while descending.

## Current action contract

The controller now exposes these animation/state names:

- `takeoff`
- `rise`
- `apex`
- `fall`
- `air-spin`
- `ground-slam`
- `land-soft`
- `land-hard`
- `walk`
- `run`
- `sprint`
- `skid`
- `turn`
- `crouch`
- `crawl`
- `duck-slide`

State fields relevant to rendering and collision effects:

- `spinUsed`: prevents repeated twirls during one airtime.
- `spinSeconds`: remaining authored twirl presentation window.
- `spinDirection`: signed visual rotation direction.
- `groundSlamming`: active downward slam state.
- `groundSlamImpact`: one-fixed-step landing event for shockwave, debris, block, enemy, camera, and audio reactions.
- `landingSpeed`: pre-impact vertical speed.

## Integration order

1. Read `AGENTS.md` and all mandatory files it lists.
2. Replace the duplicate provisional movement implementation in `src/game.js` with imports from:
   - `src/runtime/motion/motion-controller.js`
   - `src/runtime/motion/motion-tuning.js`
   - `src/runtime/fixed-step.js`
3. Add input-edge tracking for `downPressed` alongside the existing `jumpPressed` edge.
4. Bind the airborne second Space press to the modular controller's `air-spin` action.
5. Bind airborne Down/S to `ground-slam`.
6. Drive the character animation graph directly from `state.locomotion`; do not infer actions only from raw velocity.
7. Consume `groundSlamImpact` during the exact fixed step in which it is true to trigger:
   - impact animation and brief pose hold;
   - camera impulse;
   - dust/debris effect;
   - breakable-block query;
   - enemy/interactive-object hit query;
   - sound event.
8. Keep gameplay simulation at 120 Hz. Visual interpolation may run at display refresh rate.
9. Run `npm test` after integration.

## Tuning policy

All values in `motion-tuning.js` remain provisional. Tune through measurable behavioral targets rather than copying another game's data:

- time to walk/run/sprint speed;
- stopping distance;
- reversal/skid duration;
- standing and running jump apex height;
- time to apex;
- total airtime;
- short-hop ratio;
- horizontal jump range at each speed tier;
- twirl fall-arrest amount and duration;
- ground-slam startup, downward speed, and recovery;
- Mebble glide descent rate.

Record future target measurements and changes in project documentation and tests.

## Acceptance checks

- One movement module controls both heroes.
- Space launches a normal jump from the ground.
- A second Space press while airborne creates `air-spin` once per jump.
- The twirl visibly rotates the complete 3D character and briefly arrests/softens downward motion.
- Down/S in the air creates a decisive `ground-slam` with reduced horizontal drift.
- Slam landing creates a one-step `groundSlamImpact` event and `land-hard` state.
- Landing restores the next jump's twirl.
- Mebble's glide cannot overlap the twirl or slam.
- Ground movement, coyote time, input buffering, variable jump height, skidding, air steering, and deterministic replay remain intact.
- Tests pass and `src/game.js` no longer maintains a separate physics algorithm.
