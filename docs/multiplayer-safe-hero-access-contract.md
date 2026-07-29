# Hargold & Mebble — Multiplayer-Safe Hero Access Contract

## Status

This document is the newest authority for hero-specific traversal, single-player swapping, and future cooperative multiplayer compatibility.

## Core rule

No course may require routine back-and-forth switching between Hargold and Mebble.

Hero differences may create meaningful asymmetric interactions, but they may not strand either hero or force repeated swaps to progress through ordinary course flow.

Whenever one hero can cross, activate, break, reach, or survive an obstacle that the other hero cannot, the capable hero must be able to grant access across that obstacle for the other hero.

## Required access outcomes

Every asymmetric obstacle must resolve into at least one approved shared-access result:

- open a permanent gate;
- lower or extend a bridge;
- create or reveal a shared platform;
- activate a lift or moving platform usable by both heroes;
- disable the hazard for both heroes;
- break a barrier and leave a traversable opening;
- trigger a persistent route transformation;
- release a rope, ladder, ramp, staircase, or climbable path;
- create a safe checkpoint or regroup point beyond the obstacle;
- provide a cooperative carry, launch, pull, or assist interaction that leaves neither player trapped;
- create an alternate route that reconnects before required progression continues.

The access solution must be readable, reliable, and usable by the second hero without requiring the first hero to abandon them permanently.

## Single-player application

Single-player hero swapping remains permitted where explicitly supported, but it must not become the ordinary rhythm of the level.

Required-route expectations:

- avoid repeated Hargold → Mebble → Hargold switching chains;
- group any mandatory hero-specific interaction into a contained section;
- after the capable hero completes the interaction, the route must remain open for the other hero;
- routine locomotion, common jumps, checkpoints, exits, and boss approaches must not require constant hero substitution;
- optional secrets may favor one hero, but obtaining them must not invalidate or trap the other hero's route state.

## Future multiplayer rule

Course geometry and mechanisms must be authored as though Hargold and Mebble may be controlled simultaneously by two players.

A multiplayer-valid course must ensure:

- neither player can be permanently left behind by required progression;
- no mandatory door closes before both players can pass;
- no lift, bridge, or mechanism becomes single-use in a way that strands the second player;
- hero-specific routes reconnect at an authored regroup point;
- camera boundaries and encounter triggers do not pull one player into an unrecoverable state;
- checkpoints, respawns, boss gates, and exits account for both players;
- one player's death, disconnect, or temporary absence does not corrupt permanent mechanism state;
- cooperative assists have fallback recovery rules;
- both heroes can reach every mandatory checkpoint and normal exit.

## Hero-specific obstacle examples

### Hargold obstacle

Hargold may break a reinforced barrier that Mebble cannot. The result must be a permanent opening, lowered rubble ramp, released bridge, or other route Mebble can immediately use.

Invalid: Hargold breaks through and drops into a chamber whose entrance seals before Mebble can follow.

### Mebble obstacle

Mebble may reach a high switch using his higher jump or glide. The switch must activate a shared bridge, lift, gate, platform sequence, or hazard shutdown that lets Hargold cross.

Invalid: Mebble glides across a mandatory gap while Hargold has no authored method to follow.

### Learned-skill obstacle

A learned skill may solve an optional secret or difficult shortcut. If it is used on the mandatory route, its result must create shared access and the skill must already be guaranteed by campaign progression.

## Forbidden patterns

Reject any course plan containing:

- alternating mandatory hero gates every few segments;
- a required gap only Mebble can cross with no way to assist Hargold;
- a required reinforced barrier only Hargold can pass if Mebble cannot follow;
- one-way hero tunnels that do not reconnect;
- mechanisms that reset before the second hero crosses;
- pressure plates that require one player to remain permanently behind;
- doors that lock after the first player enters;
- moving platforms that carry only one hero with no return cycle;
- checkpoints reachable by only one hero;
- required collectibles or exits that strand the partner;
- boss arenas that admit one hero while excluding the other;
- multiplayer solutions dependent on swapping identities rather than cooperating.

## Validation data required per asymmetric obstacle

Each authored obstacle must specify:

- `obstacle_id`;
- `capable_hero`;
- `blocked_hero`;
- `required_or_optional`;
- `activation_method`;
- `shared_access_result`;
- `persistence_rule`;
- `regroup_point`;
- `second_hero_crossing_method`;
- `single_player_resolution`;
- `multiplayer_resolution`;
- `reset_and_respawn_behavior`;
- `anti_stranding_validation`.

## Production directive

Hero differences should create cooperation, route transformation, and optional mastery—not repetitive character switching.

The design question for every asymmetric obstacle is:

**After one hero solves this, how does the other hero get through?**

If the course plan cannot answer that clearly, the obstacle is invalid.
