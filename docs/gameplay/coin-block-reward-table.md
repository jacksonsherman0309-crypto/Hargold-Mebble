# Hidden Coin Block Reward Table

## Status

Approved gameplay rule. This document replaces the previous coin-block reward values.

## Placement

- Use only 2–3 approved Coin Block Concept F blocks in a normal level.
- Coin blocks are exploration rewards rather than routine coin sources.
- At least one coin block per level should be substantially better hidden than the others.

## Reward distribution

When activated, each coin block makes one weighted reward roll:

| Reward | Probability |
|---:|---:|
| 10 coins | 78% |
| 50 coins | 14% |
| 100 coins | 7% |
| 300 coins | 1% |

The probabilities total 100%. A one-coin result is not permitted for these hidden coin blocks.

## Separation from standard blocks

This table applies only to the approved dedicated coin block. Standard mossy cobblestone blocks may still include disguised single-coin blocks under the separate standard-block rules: those dispense exactly one coin, change into the solid brown used state, and cannot dispense another reward.

## Implementation requirements

- Use a weighted random selection; do not select uniformly from the four values.
- Resolve and award the entire result from a single activation.
- Preserve the existing 100-coins-per-extra-life rule, so large rewards may immediately award multiple extra lives when thresholds are crossed.
- Apply this table consistently in gameplay logic, level generation, tests, documentation, and balancing tools unless explicitly replaced.