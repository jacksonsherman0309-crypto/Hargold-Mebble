# Movement and Collision Specification — Build 017

## Completion status

The model-independent player-physics feature set is complete for level construction and proxy simulation. Both heroes share the full universal movement baseline. Hargold's double jump and Mebble's glide are additions to that baseline, not replacements for standard movement.

Final visual motion remains rig-dependent: authored poses, foot locking, animation blending, cape motion and collider-to-mesh alignment are not physics features and remain deferred.

## Simulation

- Deterministic fixed-step simulation at 120 Hz.
- Rendering and user interface are intentionally absent.
- Variable frame time is converted into bounded fixed simulation steps.
- The same input replay produces identical final state and position.

## Universal hero movement

Implemented for both Hargold and Mebble:

- walking and running with separate acceleration targets;
- release deceleration, low-speed turnaround and high-speed skid;
- variable-height jump and speed-dependent running-jump bonus;
- coyote time and jump buffering;
- jump-combo timing and triple-jump multiplier;
- wall contact probing, wall slide, wall-jump launch and wall-coyote timing;
- brief post-wall-jump steering lock and same-wall regrab suppression;
- crouching and blocked stand-up under low ceilings;
- high-speed duck slide and slope-driven slide acceleration;
- momentum-preserving jump out of a slide;
- spin jump from the ground;
- one air spin per airtime with controlled fall braking;
- normal fall, fast fall and terminal velocity;
- ground slam with hard-landing event;
- stomp bounce and strong stomp bounce;
- one-way-platform drop-through;
- swimming, diving, vertical steering, current response and surface breach;
- fence, vine and ladder climbing with jump detachment;
- rope grabbing, pendulum swing, pumping, climbing and momentum-based release;
- carrying light and heavy objects with speed, acceleration and jump penalties;
- deterministic carried-object drop and inherited throw velocity;
- hurt knockback, hurt lock and invulnerability timing;
- hero switching that preserves foot origin and momentum and rejects an unsafe taller collider.

## Hero additions

### Hargold

- Hargold-only block-breaking interaction contract.
- Unlockable double jump.
- Heavier collider and stronger ground-slam/stomp values.

### Mebble

- Slightly faster movement and higher base jump.
- Cape glide with open, sustained and close states.
- Narrower but taller collider.

## Terrain and moving-solid support

Implemented:

- flat ground and linear slopes;
- multi-foot ground sampling at center and both feet;
- small-step traversal across seams and low ledges;
- rectangular floors, walls and ceilings;
- one-way platforms;
- horizontal, vertical and orbital kinematic platforms;
- rider transport and takeoff momentum inheritance;
- stable rider attachment through platform reversals and abrupt stops;
- swept moving-solid collision to prevent tunneling;
- falling and collapsing platforms;
- manually armed heavy falling objects;
- deterministic compound-solid depenetration;
- conveyor surfaces;
- normal, ice, low-slip, mud and sand materials;
- water volumes with current, drag, buoyancy and surface metadata;
- hazard volumes and bottomless-pit kill planes.

## Fatal hazard contract

The movement layer emits authoritative hazard metadata. The level-session and run-state layers apply the life loss.

- Pits, lava, poison, static compression and heavy-object crushing cause immediate life loss.
- These hazards bypass hearts, invulnerability and active power-ups.
- Every life loss exits the course and returns to the world map.
- A reached checkpoint remains available when the same course is re-entered.
- Entering another course, finishing the course or reaching game over clears that course checkpoint.
- Fatal contact is idempotent after the active course session has ended.

## Animation integration contract

`animationIntent(player)` exposes, without prescribing a rig:

- locomotion state;
- normalized horizontal speed;
- vertical speed;
- grounded state and foot origin;
- facing direction;
- surface material and slope;
- crouch and slide status;
- wall contact and wall-slide data;
- spin status;
- water, carried-object and rope data;
- active hero identity.

## Automated verification

Build 017 contains 59 movement tests, including:

- target walk/run speeds and stopping behavior;
- short, full and running jump measurements;
- deterministic replay;
- slopes, seams, moving platforms and fast swept solids;
- water, climbing and rope behavior;
- carrying and throwing;
- ground slam and stomp bounce;
- universal wall slides and wall jumps for both heroes;
- wall-coyote timing;
- high-speed and downhill slides;
- slide-jump momentum retention;
- spin jump and one-air-spin limits;
- safe and blocked hero switching;
- fatal pit, lava, poison and crushing metadata.

## Rig-dependent integration remaining

These do not change the completed physics rules:

- final collider dimensions measured against the finished meshes;
- per-animation foot-contact markers;
- stride-to-speed synchronization;
- root-motion reconciliation, should any clip contain root translation;
- final landing, wall-jump, slide, spin and attack transition blending;
- Mebble cape and clothing secondary motion.
