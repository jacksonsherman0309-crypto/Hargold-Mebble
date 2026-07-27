# Simplified Directional Running

## Status
Approved gameplay mechanic. This specification supersedes any separate run or sprint action.

## Required Input Model

- Remove separate run, sprint, dash, and run-toggle actions from player controls.
- Holding left or right is the only input required to build horizontal movement speed.
- A fresh directional press begins at a controlled lower movement speed.
- Continuing to hold the same direction smoothly accelerates the character.
- After a short hold period, the character automatically reaches full running speed.
- Walk, accelerating run, and full-speed run are phases of one continuous velocity curve, not separate player-selected modes.

## Release and Reversal Behavior

- Releasing directional input must produce a short, smooth deceleration rather than an immediate stop.
- Reversing direction while moving quickly must first apply braking and a readable skid response.
- Acceleration in the opposite direction begins only after the braking phase has reduced or reversed horizontal momentum.

## Jump and Air-Control Integration

- Jump distance must scale naturally with the horizontal speed present at takeoff.
- Horizontal momentum must carry into the jump.
- Air control should remain responsive without instantly replacing the momentum inherited from the ground.
- Landing should return the character to the same continuous acceleration model without requiring any extra button.

## Character Rules

- Hargold and Mebble both use this same input model.
- Character-specific acceleration, top speed, traction, jump height, or handling values may differ only where intentionally tuned for their proportions and abilities.
- Neither character may require a dedicated run or sprint button.

## Required State Progression

`Idle -> Initial Movement -> Accelerating Run -> Full-Speed Run`

These labels describe internal movement phases only. They must not be exposed as separate player actions.

## Implementation Acceptance Criteria

1. No dedicated run, sprint, dash, or run-toggle binding exists in gameplay controls.
2. Holding one direction alone reaches maximum configured ground speed.
3. Speed rises smoothly over time rather than switching instantly between walk and run values.
4. Releasing input decelerates smoothly.
5. High-speed reversal produces braking/skid behavior before opposite acceleration.
6. Ground speed affects jump distance and carries into airborne movement.
7. Both Hargold and Mebble follow this model.
8. Mobile controls require only directional input for horizontal speed buildup.

## Repository Completion Rule

Any future approved gameplay mechanic, movement change, system rule, or implementation directive must be committed to this repository. A mechanic is not considered complete when it exists only in chat, external notes, or an implementation prompt.
