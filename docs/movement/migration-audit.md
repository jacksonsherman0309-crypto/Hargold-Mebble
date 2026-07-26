# Movement controller migration audit

## Active authority

`src/gameplay/movement/unified-character-controller.js` is the only active hero locomotion and physics authority. `movement-state-machine.js` owns the Grounded/Airborne/Special lifecycle contracts, and `movement-sensors.js` owns the shared multi-probe layout and derived contact snapshot. `src/game.js` samples browser/mobile input, advances the 120 Hz loop, supplies world collision queries, and consumes movement output.

## Migrated entry points

- Browser ground and air movement: unified controller step.
- Keyboard/touch input edges: `movement-input-buffer.js`.
- Legacy `runtime/motion/motion-controller.js`: compatibility facade that delegates to the unified controller.
- Damage knockback, stomp bounce, safe hero swap, and forced death/victory: unified exported commands.
- One-way landing, block head hit, side collision, support loss, and platform transport: collision adapters.
- Camera and character renderer: read-only consumers of controller state.
- Meadow Wake enemy placement: validated level data plus camera-aware actor
  activation; mob AI and combat remain unchanged.

## Direct mutation audit

No player velocity or grounded-state assignment remains in `src/game.js` or the platform/block runtime. Platform objects still mutate their own transforms and velocities. Environment traversal modules retain their own water/rope/carry simulation because those are explicit traversal modes; they are not active parallel ground/air controllers.

The old action controller now contains presentation/traversal compatibility state only. Its former air jump, twirl, slam, damage, bounce, and wall-jump solvers were removed.

The detailed retain/replace decision, state graph, parameter schema, collision
layout, level schema, actor lifecycle, and rail design are recorded in
`docs/movement/hierarchical-foundation-audit.md`.

## Animation dependencies

The renderer consumes `locomotion`, `glide`, facing, and horizontal speed. The unified state machine supplies compatibility aliases such as `air-spin`, `ground-slam`, `land-soft`, `land-hard`, and `hurt`. The event queue supplies takeoff, twirl, glide, slam, landing, damage, bounce, support, and contact events for future production clips, audio, VFX, and camera response.

## Still provisional

- Collider dimensions pending approved production meshes.
- Production animation clips and event consumers.
- Final target-device tuning.
- Rotating-platform tangent inheritance and steep-slope slide-only production collision.
- Final platform-specific gamepad remapping UI. The live page already maps the standard Gamepad API, keyboard, and mobile controls into the same buffered action schema.
