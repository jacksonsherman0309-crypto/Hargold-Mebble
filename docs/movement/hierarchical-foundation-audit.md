# Hierarchical movement and level-foundation audit

Status: implemented clean-room foundation, July 26, 2026.

This audit records the controller and level-runtime decision made before the
hierarchical foundation was implemented. Architectural lessons are expressed
in original Hargold & Mebble modules and project-scale values. No Nintendo
source, decompiled code, constants, data formats, assets, or identifiers are
included.

## Previous controller structure

The active runtime already had several strong foundations:

- deterministic 120 Hz fixed-step integration;
- velocity-based ground and air movement;
- one shared horizontal baseline for Hargold and Mebble;
- input edges, jump buffering, coyote time, variable jump height, and running
  jump momentum;
- Hargold's gated double jump, Mebble's finite cape glide, air twirl, fast
  fall, ground-slam phases, landing recovery, bounce, damage, swap, and
  moving-platform inheritance;
- gameplay-owned root translation with animation-intent and event output.

The structural weaknesses were:

- `movement-state-machine.js` was a flat enum, priority table, and label setter;
- enter/update/exit ownership, transition permissions, input permissions,
  collision policy, and presentation hooks were not state contracts;
- ground awareness was primarily a center-height callback, with head, wall,
  block, and semisolid handling applied later by integration-specific code;
- terrain response had only a few scalar modifiers rather than named response
  profiles;
- Meadow Wake instantiated its small mob list at course start and activated by
  player distance rather than camera envelopes;
- the authored course data was rich but did not have one validated root schema
  separating terrain, visuals, areas, actors, entrances, triggers, rails,
  camera settings, and persistent state;
- moving mechanisms used per-platform motion fields without a reusable
  node-path runtime.

## Retained systems

| System | Decision | Reason |
| --- | --- | --- |
| `FixedStepLoop` | Retain | Already deterministic at the canonical 120 Hz |
| Unified controller state and public commands | Retain | Existing game, tests, combat, swap, and renderer depend on the stable API |
| Velocity integration and `approach` math | Retain | Matches the approved physics ownership model |
| Input buffer | Retain | Correctly separates held and fresh-press actions |
| Jump, twirl, double-jump, glide, slam, bounce, damage, and landing math | Retain and route through hierarchy | Already clean-room, tested, and canon-compatible |
| External platform/block collision adapters | Retain during migration | They remain authoritative for current authored block and semisolid geometry |
| Movement events and telemetry | Extend | Suitable integration boundary for animation, audio, VFX, camera, and debugging |
| Existing enemy behavior/combat | Retain unchanged | Enemy redesign is outside this phase |

## Replaced or extended systems

| Previous behavior | New foundation |
| --- | --- |
| Flat state labels | Grounded/Airborne/Special state graph with a definition for every leaf |
| State label setter | Lifecycle-aware transitions with enter, per-step update, exit, allowed transitions, collision policy, animation selection, input permissions, and audio/VFX hook metadata |
| Fixed ground response | Context-selected acceleration plus terrain-response profiles |
| Center-only ground query | Three foot, six wall, three head, ledge, slope, semisolid, and moving-platform probes |
| Ad hoc course root data | Validated `LEVEL_DATA_SCHEMA_VERSION = 1` |
| Player-distance mob activation | Camera-aware prewarm/activate/sleep/despawn envelopes |
| Custom path logic only | Reusable deterministic node rail/follower runtime |

## Implemented state graph

```text
Grounded
|-- Idle / Walk / Run / Sprint / Brake
|-- Turn / Skid
|-- Crouch / Crawl / Slide
|-- Landing / SoftLand / HardLand
|-- GroundAction
`-- GroundSlamImpact / GroundSlamRecovery

Airborne
|-- JumpTakeoff / JumpRise / JumpApex / Fall
|-- FastFall / Twirl
|-- GroundPoundStartup / GroundPoundFall
|-- Stomp / Bounce / SpringBounce
|-- HargoldDoubleJump
`-- MebbleCapeGlideOpening / Sustain / Closing

Special
|-- LedgeGrab
|-- WallContact
|-- Swim
|-- MovingPlatform
|-- Damage / Knockback
|-- PipeDoorTransition
|-- SwapOut / SwapIn
|-- Dead / Respawning / Victory
`-- ScriptedMovement
```

Some state definitions are integration-ready rather than automatically entered
in Meadow Wake. In particular, ledge grab is not enabled as an unapproved new
ability; swim and transition states await a course that uses them. Wall contact
is entered by the existing wall resolver. Unrestricted wall jump remains
disabled.

Each definition in `MOVEMENT_STATE_DEFINITIONS` owns:

- `enter`, `update`, and `exit` lifecycle functions;
- an explicit transition set;
- foot, wall, head, semisolid, and hazard collision policy;
- animation clip intent and playback mode;
- sound and effect hook IDs;
- move, jump, down, action, swap, and pause input permissions.

## Movement parameter asset/schema

`movement-tuning.js` remains the numeric tuning asset. The new
`MOVEMENT_PARAMETER_SCHEMA` documents its units and required groups.

Horizontal response selects among:

- acceleration from rest;
- acceleration while already moving;
- no-input deceleration;
- opposite-input braking;
- active low-speed turn;
- very-slow, slow, medium, and fast acceleration;
- run-to-slower-target deceleration.

The selection also receives current speed tier, facing/velocity relationship,
sprint input, grounded/airborne context, movement state, and terrain profile.
The controller still integrates velocity; input never writes position
directly.

Terrain profiles are gameplay metadata separate from visible materials. The
foundation includes normal, dirt, sand, snow, ice, low-slip, wood, conveyor,
shallow-water, sinking-terrain, mud, leaf, cloud, beach, and carpet profiles.
Each carries acceleration, braking, traction, slope threshold, footstep,
landing/particle, jump, conveyor, and sink fields. Values remain provisional
clean-room project tuning.

## Collision sensor layout

```text
             Head-L   Head-C   Head-R

Wall-L upper                     Wall-R upper
Wall-L middle                    Wall-R middle
Wall-L lower                     Wall-R lower

        Heel-L   Foot-C   Toe-R ---- Forward ledge
                    |
             slope/material
             semisolid query
             moving-platform anchor
```

Sensors derive:

- support and swept landing candidates;
- safe landing height;
- surface ID, normal, angle, and gameplay material;
- left/right wall contact by height;
- ceiling contact by head probe;
- exposed edge and explicit grabbable-ledge metadata;
- semisolid contact;
- moving-platform ID and velocity.

Current block/platform adapters remain in place while the browser course uses
the sensor snapshot for terrain/support state and telemetry. This avoids a
risky one-step replacement of working authored collision.

## Level-data schema

`level-schema.js` validates these independent layers:

```text
Level
|-- terrainGeometry
|-- visualEnvironment
|-- gameplayAreas
|-- actors
|-- entrances
|-- triggers
|-- rails
|-- cameraSettings
`-- persistentState
```

Gameplay areas contain rectangular bounds, camera framing, zoom, vertical
tracking, background, music, direction, and activation rules. Actor placements
contain type, plane-locked position, area, visual layer, parameters, event
channels, persistent ID, activation bounds, and activation rules. Entrances
are destination records rather than improvised teleports. Validation rejects
actors or gameplay rails that leave `z = 0`.

`MEADOW_WAKE_LEVEL_DATA` is the first authored adapter. It preserves the
existing terrain, rooms, nine traversal phases, seven encounter/section
triggers, blocks, coins, Compass Coins, platforms, start/checkpoint/goal
records, and current five implemented enemy placements. It does not claim the
archived coordinate-free 90-level scaffolds are playable geometry.

## Camera-aware actor spawning

The actor runtime uses default envelopes measured in camera widths:

- prewarm: `1.25` screens ahead;
- activate: `0.30` screens ahead and `0.20` behind;
- sleep: `0.50` screen behind;
- despawn: `1.50` screens behind unless retained.

Persistent completion IDs prevent collected, defeated-one-time, or otherwise
completed actors from respawning. Area IDs and activation rules are carried by
every placement. Meadow Wake now uses this lifecycle for enemy instances while
leaving each mob's AI and combat state machine unchanged.

## Rail/path design

A validated rail contains two or more plane-locked nodes. Each normalized node
stores:

- position;
- arrival and exit speed;
- acceleration;
- wait duration;
- easing;
- loop mode;
- facing rule;
- trigger requirement;
- optional flags.

The fixed-step follower supports `once`, `loop`, and `ping-pong` paths and emits
arrival/movement results. Meadow Wake exposes authored rail adapters for its
vertical, orbital, and falling platform motions. Seesaws remain rotational
mechanisms rather than being misrepresented as translation rails.

## Remaining provisional integration

- Production mesh-measured collider and sensor offsets.
- Full geometry-backed head/wall/ledge queries beyond the current block and
  platform adapters.
- Automatic ledge-grab gameplay, which is not approved by current canon.
- Production swim, climb, rope, transition, and scripted course integrations.
- Migration of each moving platform from its current stable solver to the rail
  follower after behavior-equivalence tests.
- Production animation clips, sound, VFX, and camera consumers for emitted
  state hooks.
- Target-device tuning on final course collision and approved deforming hero
  meshes.
