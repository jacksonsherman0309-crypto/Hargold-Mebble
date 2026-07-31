# Hargold & Mebble — Movement and Collision Specification

Last reconciled: July 25, 2026

This document preserves the complete model-independent movement baseline established by Build 017 and reconciles it with current canon. It defines required runtime behavior; it does not claim that the current browser prototype already implements every item.

## 1. Simulation

- Deterministic fixed-step simulation target: 120 Hz.
- Variable render-frame time is converted into bounded fixed simulation steps.
- Excessive elapsed time is clamped to prevent unbounded catch-up.
- The same initial state, input sequence, and deterministic seed must produce the same final simulation state.
- Gameplay simulation owns movement. Root motion is disabled by default.
- Rendering, animation, cape motion, and final collider-to-mesh fitting are separate integration layers.
- The active controller uses a hierarchical Grounded, Airborne, and Special
  state graph. Every leaf owns lifecycle hooks, allowed transitions, collision
  policy, animation intent, sound/effect hook IDs, and input permissions.

## 2. Universal hero movement

Both Hargold and Mebble share this complete baseline:

- walk;
- run;
- sprint;
- separate walk/run acceleration targets;
- automatic acceleration through the full-speed tier without a separate manual sprint action;
- release deceleration;
- low-speed turnaround;
- high-speed skid;
- slope-dependent uphill/downhill movement modifiers;
- variable-height jump;
- speed-dependent running-jump bonus;
- coyote time;
- jump buffering;
- jump-combo timing and triple-jump multiplier;
- wall contact probing;
- wall slide;
- wall-contact reaction without an unrestricted wall jump;
- wall-coyote timing;
- brief collision-reaction steering damping where required;
- same-wall regrab suppression;
- crouch;
- crawl;
- blocked stand-up under low ceilings;
- high-speed duck slide;
- rolling momentum;
- wall-collision reaction without penetration;
- ledge-stop presentation when input is released near an exposed edge;
- look-up and duck presentation states;
- slope-driven slide acceleration;
- momentum-preserving jump from a slide;
- spin jump from the ground;
- one air twirl per airborne sequence, triggered by a fresh airborne jump press, with preserved horizontal momentum and bounded hang time but no additional launch;
- normal fall;
- fast fall;
- terminal velocity;
- ground slam triggered by a fresh airborne Down/S/SLAM press from ascent, apex, or descent, with a short deterministic intent buffer plus prepare, committed descent, impact, and recovery phases;
- hard-landing event;
- stomp bounce;
- strong stomp bounce;
- one-way-platform drop-through;
- swimming;
- diving;
- vertical water steering;
- current response;
- water-surface breach;
- fence climbing;
- vine climbing;
- ladder climbing;
- jump detachment from climbables;
- rope grabbing;
- rope pendulum swing;
- rope pumping;
- rope climbing;
- momentum-based rope release;
- carrying light objects;
- carrying heavy objects with stronger movement/jump penalties;
- deterministic carried-object drop;
- inherited throw velocity;
- hurt knockback;
- hurt input lock;
- damage invulnerability timing;
- landing recovery;
- victory presentation state;
- hero switching that preserves foot origin and momentum;
- rejection of unsafe swaps when Mebble’s taller collider cannot fit.

## 3. Hero-specific additions

### Hargold

- Shorter, wider, heavier collider profile.
- Uses the shared horizontal base-controller tuning without a speed penalty.
- Stronger ground-slam and stomp values.
- Hargold-only block-breaking interaction.
- Heavy-rock enemies require Hargold ground slam.
- Unlockable double jump.
- Double jump is an addition to the shared universal movement baseline.

### Mebble

- Narrower but taller collider profile.
- Uses the shared horizontal base-controller tuning and has a slightly higher base jump.
- Cape glide with open, sustained, and close states.
- Glide slows descent and permits limited horizontal correction.
- Glide cannot generate infinite flight or height.

## 4. Terrain and solid support

The production movement layer must support:

- flat ground;
- linear slopes;
- multi-foot ground sampling at center and both feet;
- traversal across small seams and low ledges;
- rectangular floors, walls, and ceilings;
- one-way platforms;
- horizontal kinematic platforms;
- vertical kinematic platforms;
- orbital kinematic platforms;
- rider transport;
- takeoff momentum inheritance;
- stable attachment through platform reversals and abrupt stops;
- swept moving-solid collision to prevent tunneling;
- falling platforms;
- collapsing platforms;
- manually armed heavy falling objects;
- deterministic compound-solid depenetration;
- conveyor surfaces;
- surface material metadata;
- water volumes;
- hazard volumes;
- bottomless-pit kill planes.
- three independent foot probes at heel, center, and toe;
- left/right wall probes at lower, middle, and upper body height;
- left/center/right head probes;
- ledge, slope-normal, semisolid, and moving-platform anchor probes.

The probe result is the shared contact snapshot for support, safe landing
height, slope/material response, wall/head contact, semisolids, exposed ledges,
and moving-platform velocity. A single capsule or center ray cannot be the only
source of terrain understanding.

## 5. Surface materials

Required model-independent material families:

- normal;
- ice;
- low-slip;
- mud;
- sand;
- conveyor.

Material response can modify acceleration, stopping distance, slope movement, and carried-object behavior without corrupting deterministic simulation.

The current data-driven response registry also contains dirt, snow, wood,
shallow-water, sinking-terrain, leaf, cloud, beach, and carpet profiles for
authored course use. These extend presentation-aware terrain metadata without
overriding the canonical required families above.

## 5A. Level runtime foundation

Playable level data is separated into terrain geometry, visual environment,
gameplay areas, actor placements, entrances/exits, trigger ranges, rails,
camera settings, and persistent state.

- Gameplay areas own bounds, camera framing, zoom, vertical tracking,
  background, music, direction, and activation rules.
- Actor records own type, plane-locked position, area, visual layer,
  parameters, event channels, persistent ID, and activation bounds.
- Camera-aware activation prewarms actors ahead of the visible screen,
  activates outside the visible edge, sleeps actors behind play, and despawns
  non-persistent actors farther behind.
- Node rails own position, arrival/exit speed, acceleration, wait, easing, loop
  mode, facing rule, and trigger requirements.
- Generic schemas store authored course data; they cannot generate or flatten
  the campaign's world-specific content.

## 6. Water

Water volumes may define:

- current direction and strength;
- drag;
- buoyancy;
- surface height;
- entry/exit events;
- ordinary swimmable water;
- separately configured fatal water conditions.

Tidebiter remains water-only. Ordinary water is not automatically fatal.

## 7. Fatal hazards

Current mandatory instant-death hazards:

- bottomless pit;
- lava pool;
- poison pool.

Historical simulation also supported explicit fatal compression and heavy-object crushing. Those may remain in the runtime as dedicated fatal-hazard types when the level uses them.

Fatal hazards:

- immediately cost one life;
- bypass hearts/current health;
- bypass invulnerability;
- bypass active power-up protection;
- trigger at most one authoritative life-loss event after the active course session ends;
- respawn from the latest current-course checkpoint or restart from level start when none exists;
- reset boss damage progress.

## 8. Moving-solid safety

- Use swept collision checks for fast active solids.
- Resolve horizontal and vertical crossing without tunneling through the player.
- Rider transport reads current platform velocity rather than stale prior-frame values.
- Detect static compression and heavy descending-object compression.
- Never repeatedly consume lives while the player remains inside the same fatal state after the course session has ended.

## 9. Carrying and throwing

- Light and heavy objects apply distinct speed, acceleration, and jump penalties.
- Drops and throws are deterministic.
- Throw velocity inherits an approved portion of hero velocity.
- Object interactions must not move the hero off the strict side-scrolling plane.
- Shellback and other carryable enemies/objects require explicit state machines rather than being treated as generic scenery.

## 10. Hero switching

A valid swap:

- preserves foot origin;
- preserves safe horizontal/vertical momentum;
- updates the collider to the new hero profile;
- revalidates overlap against nearby solids and hazards.

An invalid swap:

- is rejected when the taller collider cannot fit;
- does not move the active hero;
- gives readable visual/audio/UI feedback;
- cannot be used to clip through walls, ceilings, enemies, or gates.

## 11. Animation-intent output

The movement layer should expose animation intent without hard-coding a particular rig:

- locomotion state;
- normalized horizontal speed;
- vertical speed;
- grounded state;
- foot origin;
- facing direction;
- surface material and slope;
- crouch/slide state;
- wall-contact and wall-slide data;
- spin state;
- water state;
- carried-object state;
- rope state;
- active hero;
- glide state;
- ground-slam/hard-landing events;
- stomp-bounce events;
- hurt/knockback state.
- crawl, rolling-momentum, wall-reaction, ledge-stop, look-up, landing-recovery, and victory presentation state.

## 12. Required movement tests

- Walk/run/full-speed target speeds and automatic acceleration transitions.
- Identical horizontal base tuning for Hargold and Mebble.
- Release stopping distance.
- Low-speed turn and high-speed skid.
- Short jump lower than full jump.
- Running jump bonus.
- Mebble jump slightly higher than Hargold.
- Coyote jump.
- Buffered jump on landing.
- Jump-combo/triple-jump timing.
- Hargold double jump locked/unlocked behavior.
- Mebble glide descent cap and no infinite flight.
- Wall contact and wall-slide presentation for both heroes; unrestricted wall jump is not enabled.
- Wall-coyote timing.
- Same-wall regrab suppression.
- Crouch and blocked stand-up.
- Crawl, rolling momentum, wall reaction, ledge stop, look-up, duck, landing recovery, and victory intent.
- Duck slide and downhill slide.
- Momentum retention on slide jump.
- Spin jump and one-air-spin limit.
- Ground slam and stomp bounce.
- Slope grounding and seam traversal.
- Ice/low-slip stopping behavior.
- Moving-platform rider transport and momentum inheritance.
- Swept moving-solid collision.
- Falling/collapsing platform behavior.
- One-way drop-through.
- Swimming, diving, currents, and surface breach.
- Fence, vine, ladder, and rope behavior.
- Light/heavy carry penalties and deterministic throws.
- Safe hero swap and blocked tall-collider swap.
- Pit/lava/poison fatal metadata.
- Compression/crushing metadata where used.
- Deterministic replay from identical inputs.

## 13. Rig-dependent integration status

The locked original Meshy models now exist in the live runtime. The approved
numeric contract in `data/character-animation-numeric-spec.json` drives a
project-authored semantic-pose layer on the exact locked rigs. Distance-driven
walk/run/full-speed phase, explicit left/right contact and toe-off windows,
controller-driven air poses, feet-down ground slam, planted turn/skid timing,
in-place root-motion policy, contact correction, bounded slope adaptation,
and responsive transition blending are implemented.

The following still require reviewed source-asset work:

- collider-to-visible-body review in every hero state;
- source-rig corrective shapes or bones for stressed joints;
- facial and individual finger controls;
- Mebble cape and clothing secondary controls;
- hat, feather, glasses, belt, backpack, and scarf controls;
- final target-device visual and performance approval.

The current locked rigs have 24 body bones and zero morph targets. Missing
facial, finger, cape, accessory, and corrective controls cannot be finalized
only in the runtime state machine.
