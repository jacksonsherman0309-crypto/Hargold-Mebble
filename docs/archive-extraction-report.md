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

## World-specific imported package restoration

The complete 15-file package under
`archive/imported-packages/20260725-110552/loose-files` was inventoried before
implementation. See `docs/imported-package-20260725-inventory.md`.

The restored modular implementation now includes:

- `src/content/archive-realignment.js`: explicit current-canon world and slot
  realignments, including the World 1 finale/secret-slot correction.
- `src/content/world-specific-content.js`: joins the exact 90 authored enemy
  budgets, 630 encounter zones and coordinate-free course scaffolds without
  generating replacement courses.
- `src/gameplay/enemies/enemy-runtime.js`: deterministic state-machine families,
  including the archived Shellback retract/wake/roll/emerge cycle.
- `src/content/world-enemy-rosters.js`: current-canon world/course ownership so
  archived preview rosters cannot introduce mobs in the wrong course.
- `src/gameplay/enemies/mob-simulation.js`: fixed-step spatial patrols, terrain
  turns, Camp Critter stomps, Shellback retract/kick/roll/stop/wake behavior,
  Sentry/Acorn projectile contracts and Dirt Squirt telegraph states.
- `src/gameplay/combat/combat-runtime.js`: typed combatants, attacks, damage,
  defeat, invulnerability and temporary status handling. Defeated combatants
  stop damaging immediately.
- `src/gameplay/interactions/interaction-runtime.js`: archived interaction rules
  with explicit current-canon overrides.
- `src/gameplay/encounters/encounter-runtime.js`: course-specific wave
  scheduling, simultaneous caps, recovery gaps and spawn-policy enforcement.
- `src/gameplay/bosses/boss-runtime.js`: parsed authored boss contracts,
  telegraphs, sequential five-event damage progression, arena mutations and
  life-loss reset behavior.

The live Meadow Wake page currently instantiates only the canonical `1-1`
roster: Camp Critter and Shellback. Their simulation drives temporary 3D
behavior proxies in the WebGL scene. Those proxies validate behavior and
readability but are not final production enemy models, rigs, materials or
animation assets.

Historical course identities that conflict with current canon remain marked
provisional or mechanics-only. No coordinate-free scaffold is exposed as
finished geometry.
