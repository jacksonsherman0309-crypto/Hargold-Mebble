# Enemy Framework Specification — Build 016

## Implemented shared combat integration

Every implemented enemy now owns a deterministic combatant record containing health, team, mass class, tags, weaknesses, immunities, temporary statuses and combat events. The enemy state machine remains responsible for movement and behavior; the shared combat layer handles damage and status resolution.

- Player attacks and enemy contact attacks use the same typed attack contract.
- One-hit enemies are defeated through the shared damage pipeline rather than separate ad hoc flags.
- Ice can apply a timed frozen state to surviving non-boss enemies.
- Frozen enemies stop their behavior simulation until the status expires.
- Rolling Shellback contact is exposed as an impact attack with stronger knockback.
- Camp Sentry projectiles carry explicit attack metadata for later player/session integration.
- Stationary Shellback shells deflect ordinary projectiles while accepting impact, shockwave and Ice interactions.

## Camp Critter

- Ground patrol, gravity and floor following.
- Wall turning.
- Side-contact damage classification.
- Stomp defeat.
- Shared elemental and projectile damage.
- Rolling-shell defeat through the combat contract.

## Shellback

- Walking patrol and ledge turning.
- First-stomp retraction.
- Stationary kickable shell.
- High-speed rolling shell with wall bounce.
- Stomp-to-stop behavior.
- Five-second wake cycle and warning state.
- Rolling-shell enemy impacts routed through shared damage.
- Armored-shell projectile deflection.

## Camp Sentry

- Target-facing aim behavior.
- Timed firing and recoil states.
- Visible projectile position, velocity, radius, owner, lifetime and attack metadata.
- Terrain impact events and target-bounds collision queries.

## Automated verification

The suite covers patrols, stomps, shell states, shell impacts, Sentry firing, contact classification, shared damage, frozen holds, armored deflection and unified contact attacks.

## Next enemy-code milestone

- Lock Camp Chipper’s gameplay behavior and implement its state machine.
- Add frozen-enemy platform, kick and shatter behavior.
- Add Bubblebloom capture/release integration for enemies.
- Add reflected projectile ownership changes and environmental-switch targets.
- Add spawn/despawn and checkpoint restoration rules.
