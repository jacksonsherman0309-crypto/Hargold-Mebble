# Stump Launcher Interactive Terrain Contract

## Canonical classification

The Stump Launcher is **not a mob, enemy, hazard, turret, or projectile source**. It is an interactive terrain object and reusable launch pad for Hargold and Mebble.

Any earlier concept describing a creature living inside the stump or firing wooden projectiles is rejected and must not be implemented.

## Core purpose

The Stump Launcher launches a hero upward in a controlled arc when the hero lands on or jumps onto its spring-loaded leaf pad.

It exists to:

- reach elevated platforms;
- cross authored gaps;
- access hidden areas;
- reach Compass Coins, hidden chests, switches, and optional routes;
- create timed traversal sequences;
- support multiplayer-safe regrouping and shared access.

It must never exist as decoration without a traversal purpose.

## Visual construction

The object consists of:

- a broad, rooted hollow stump;
- a clearly readable top opening;
- a thick woven or layered leaf pad inside the opening;
- restrained vines, moss, fungi, snow, crystals, or biome-specific dressing;
- a sturdy grounded silhouette that reads as permanent terrain;
- no face, eyes, mouth, creature, weapon, barrel, projectile, or enemy expression.

The stump must remain visually original and biome-compatible. The launch surface must be readable from the side-scrolling camera without looking like a generic trampoline.

## Interaction sequence

1. **Ready** — leaf pad is raised and stable.
2. **Compression** — the hero lands; the pad compresses visibly and stores force.
3. **Launch** — the pad rebounds and sends the hero along the authored trajectory.
4. **Recoil** — leaves overshoot slightly and settle.
5. **Reset** — the pad returns to ready state after a short cooldown.

The launch must not damage the hero.

## Launch behavior

Each placement must author:

- launch origin;
- launch angle;
- launch height;
- horizontal displacement;
- apex position;
- landing target or valid landing region;
- cooldown;
- whether player steering is allowed during flight;
- whether a stomp or slam changes launch strength;
- failure recovery;
- multiplayer behavior.

The default launch is a reliable upward arc. It must be deterministic and produce the same trajectory for the same entry state.

Small hero-weight differences may affect animation timing, but must not make required access impossible for either hero. Hargold and Mebble must both be able to use every mandatory Stump Launcher.

## Multiplayer-safe requirements

A Stump Launcher may not strand a second player.

For every mandatory launcher placement, at least one of the following must be true:

- the launcher resets quickly enough for the second hero;
- both heroes can occupy and launch from it together;
- the first hero activates a return lift, bridge, rope, ramp, or shared platform;
- the landing route reconnects to a regroup point accessible to both heroes;
- a second launcher or equivalent return mechanism is provided.

The first hero using the launcher must not permanently consume, disable, move, or destroy it.

## Placement grammar

Approved uses include:

- direct launch to a higher grounded route;
- gap crossing with a broad safe landing;
- optional collectible arc;
- hidden-area access;
- timed mechanism where the player must enter during a safe window;
- chained launch sequence with clear recovery points;
- weather interaction where gust timing modifies but does not randomize the authored arc;
- secret chest route where the launcher is part of the mechanical solution.

Rejected uses include:

- random launchers without a destination;
- blind launches into off-screen hazards;
- launches that require hero swapping;
- mandatory launches usable by only one hero;
- one-use launchers that strand another player;
- launches with inconsistent force;
- unavoidable enemy collision at the apex or landing;
- launch paths that violate the strict horizontal course orientation by becoming a vertical-level substitute.

## Camera and readability

The camera must reveal enough of the intended trajectory to support informed use. A brief camera lead or framing adjustment may show the target, but the launcher should not require a cinematic interruption for every use.

For secret routes, the destination may be partially concealed, but the launch must remain fair and recoverable.

## Biome variants

Biome variants may change materials and dressing while preserving identical mechanical readability:

- standard woodland;
- autumn;
- jungle or overgrown;
- snowy or frozen;
- crystal;
- desert-dried;
- toxic-fen growth;
- ember-charred.

Variants cannot change collision size or launch behavior unless the authored placement explicitly declares a mechanical variant.

## Validation failures

Reject a placement when:

- the object is classified as a mob;
- it contains or launches a creature or projectile;
- it damages the hero by default;
- either hero cannot complete a required launch;
- the landing target is unreadable or unfair;
- the launch is nondeterministic;
- the object is consumed after one player uses it;
- multiplayer testing can strand a player;
- it exists without traversal purpose;
- it replaces the horizontal course format with prolonged vertical climbing.

## Production boundary

This contract defines the canonical design and implementation requirements. It does not claim that the final 3D mesh, rigged leaf deformation, launch physics, animation, audio, particles, or authored course placements are already implemented.
