# Archived motion and physics extraction

The untouched Build 009 HTML remains under `archive/full-motion/`. Its reusable
algorithms are implemented under `src/runtime/`; its embedded artwork, level
layout, five-heart prototype, automatic lives reset, unsafe swap, random visual
effects, and pixel constants are not production authority.

Build 017 source code was not imported. Its complete model-independent behavior
contract is represented by modular deterministic systems:

- `motion/motion-controller.js`: acceleration, skids, variable/running jump,
  buffer/coyote timing, glide, grounding, and safe foot-origin swaps.
- `motion/action-controller.js`: double jump, walls, crouch/slides, spin, fast
  fall, ground slam, stomp bounce, drop-through state, hurt lock, and animation
  intent.
- `environment/movement-volumes.js`: surface families, swimming/diving/current/
  breach behavior, fence/vine/ladder climbing, and ropes.
- `objects/carry.js`: light/heavy carry contracts, deterministic drop/throw, and
  inherited velocity.
- `collision/kinematic-solids.js`: platform motion/rider transport, current-step
  velocity, swept broadphase, and compression metadata.
- `hazards/fatal-hazards.js`: canonical instant-death metadata and idempotence.

All numeric tuning and collider sizes remain explicitly provisional. Final
colliders, stride synchronization, foot markers, animation blending, and cape
secondary motion require the production character assets.

The archived level editor was inspected as workflow reference. It remains
archived and is not treated as production geometry or authoritative preview
physics.
