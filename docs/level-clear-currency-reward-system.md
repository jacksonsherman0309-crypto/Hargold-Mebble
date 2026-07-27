# Hargold & Mebble — Level-Clear Currency Reward System

Last consolidated: July 27, 2026

This document is the newest authority for end-of-level currency rewards. It defines a deterministic reward calculation based on clear completion, clear speed, standard-coin collection, Compass Coin collection, eligible mob defeats, and difficulty.

The final display name and visual design of the currency remain intentionally unassigned. Until explicitly named, implementation should use the internal identifier `level_clear_currency` and the generic label `course currency` in development UI only.

## 1. Core rule

Every completed level awards course currency.

The amount must increase when the player:

- completes the level faster;
- collects more score-eligible standard coins;
- collects more of the level's three Compass Coins, with all three receiving the full Compass component;
- defeats a higher percentage of score-eligible mobs;
- completes the course on a higher difficulty.

The calculation must be deterministic. The same course state, clear time, collectible totals, eligible mob results, and difficulty must produce the same reward.

## 2. Per-course authored values

Every course and every supported difficulty must define:

- `base_reward`: the course's maximum pre-multiplier reward at a 100-point performance score;
- `gold_time_seconds`: time required for the maximum speed score;
- `par_time_seconds`: midpoint used by the speed curve;
- `reward_cutoff_seconds`: time at or beyond which the speed component becomes zero;
- `coin_reward_target`: score-eligible coin units required for the maximum coin score;
- `eligible_mob_ids`: the finite authored mob instances counted by the mob component.

These values are course-specific. They must reflect the actual route length, optional paths, hidden areas, difficulty layout, and normal first-clear pace. A universal time target or mob quota must not replace authored values.

## 3. Performance score

A completed level produces a performance score from 25 to 100 points.

| Component | Maximum points |
|---|---:|
| Level clear | 25 |
| Speed | 25 |
| Standard coins | 15 |
| Compass Coins | 20 |
| Eligible mobs defeated | 15 |
| **Total** | **100** |

The guaranteed 25 clear points ensure every successful completion awards currency even when the player clears slowly and ignores optional content.

### 3.1 Clear component

Every valid level completion awards exactly 25 points.

A failed attempt, quit, timeout, or uncompleted exit awards no level-clear currency.

### 3.2 Speed component

Speed contributes from 0 to 25 points.

- Clear at or faster than `gold_time_seconds`: 25 points.
- Between `gold_time_seconds` and `par_time_seconds`: interpolate linearly from 25 down to 15 points.
- Between `par_time_seconds` and `reward_cutoff_seconds`: interpolate linearly from 15 down to 0 points.
- At or slower than `reward_cutoff_seconds`: 0 points.

The timer:

- begins when normal player control starts;
- ends when the valid level exit is secured;
- excludes loading, menus, paused time, mandatory noninteractive cinematics, and the post-clear sequence;
- continues through checkpoint deaths and respawns during the same level entry;
- resets only when the entire course is restarted from the beginning or re-entered.

This rewards a clean, fast clear without counting system delays or forcing players to skip noninteractive presentation.

### 3.3 Standard-coin component

Standard coins contribute from 0 to 15 points.

`coin_score = 15 × min(1, performance_coin_units_collected / coin_reward_target)`

Use score-eligible coin units rather than raw randomized payouts:

- each fixed loose standard coin counts as one unit;
- deterministic authored multi-coin rewards may define a fixed number of units;
- a randomized coin block receives a fixed authored performance-credit value, normally one unit when activated, regardless of whether its economy payout is 1, 5, 10, or 100 coins;
- life awards from the 100-coin system remain separate and do not add bonus performance units;
- the component is capped at 15 points.

This preserves the player's incentive to collect coins while preventing random block outcomes from changing the reward score.

### 3.4 Compass Coin component

Each level contains exactly three Compass Coins. Their score is intentionally nonlinear so collecting all three matters more than collecting only one.

| Compass Coins collected | Points |
|---|---:|
| 0 | 0 |
| 1 | 4 |
| 2 | 10 |
| 3 | 20 |

Only Compass Coins collected during the current clear count toward the current payout. Previously saved Compass Coins remain permanently recorded for campaign completion but do not automatically count as collected during a replay.

### 3.5 Eligible-mob component

Eligible mob defeats contribute from 0 to 15 points.

`mob_score = 15 × eligible_mobs_defeated / eligible_mob_count`

Rules:

- each authored eligible mob instance has a stable unique identifier;
- each instance counts at most once per clear;
- score eligibility must not alter mob design, movement, placement, behavior, attacks, health, or roster;
- exclude infinite respawners, endlessly summoned mobs, hazards, invulnerable set dressing, and objects that cannot be defeated;
- boss damage phases are not counted as ordinary mobs;
- if a level has zero eligible mobs, award the full 15 mob points automatically so the level is not penalized for its authored structure;
- checkpoint respawns must not allow the same unique mob instance to be counted repeatedly.

## 4. Total score

`performance_score = 25 + speed_score + coin_score + compass_score + mob_score`

Clamp the result to the inclusive range 25–100 after a valid clear.

The end-of-level results screen must show all five component values before showing the final reward.

## 5. Difficulty multipliers

Difficulty substantially increases the currency payout.

| Difficulty | Multiplier |
|---|---:|
| Easy | 1.0× |
| Normal | 1.5× |
| Hard | 2.5× |
| Impossible | 4.0× |

The multiplier applies after the complete performance score is calculated.

Higher difficulty must never lower the payout for an otherwise identical numerical score and base reward. Course-specific targets may differ by difficulty to reflect altered layouts, hidden blocks, weather, hazards, and encounter pressure.

## 6. Final reward formula

`final_reward = round(base_reward × difficulty_multiplier × performance_score / 100)`

The result is an integer and cannot be negative.

Example for a course with `base_reward = 100`:

- Easy, 100-point clear: 100 currency.
- Normal, 100-point clear: 150 currency.
- Hard, 100-point clear: 250 currency.
- Impossible, 100-point clear: 400 currency.
- Normal, 70-point clear: 105 currency.
- Impossible, 50-point clear: 200 currency.

## 7. Results presentation

The level-clear screen should reveal the score in this order:

1. Course clear — 25 points.
2. Time and speed points.
3. Standard coins and coin points.
4. Compass Coins and Compass points.
5. Eligible mobs defeated and mob points.
6. Total performance score.
7. Difficulty multiplier.
8. Final currency reward and updated wallet balance.

The presentation should make it obvious why the player earned the displayed amount and which category could improve on a replay.

## 8. Persistence and integrity

The save system must store:

- current wallet balance;
- total lifetime course currency earned;
- most recent reward breakdown per course and difficulty;
- best performance score per course and difficulty;
- best active clear time per course and difficulty;
- highest single payout per course and difficulty.

Currency must be granted exactly once for each completed clear transaction. The reward transaction must be idempotent so closing, reconnecting, reloading, or replaying the results sequence cannot duplicate the payout.

## 9. Open economy decisions

The following remain intentionally unresolved until explicitly approved:

- final currency name;
- visual icon and material;
- wallet cap, if any;
- replay payout reduction or full-repeat payout policy;
- first-clear bonuses;
- perfect-clear bonuses beyond the existing 100-point calculation;
- purchase catalogue and prices;
- whether currency is shared across save files or stored per campaign save.

Do not invent these values and present them as locked canon.

## 10. Validation failures

Reject an implementation when:

- a completed course gives no currency;
- reward values depend on random coin-block payout luck;
- paused or noninteractive time lowers the speed score;
- checkpoint deaths reset the active attempt timer;
- the same mob can be farmed repeatedly within one clear for extra score;
- infinite spawners are included in the eligible-mob denominator;
- previously collected Compass Coins automatically count on a replay without being recollected;
- Easy, Normal, Hard, or Impossible uses a multiplier other than 1.0, 1.5, 2.5, or 4.0 without a newer explicit rule;
- the results screen hides the component breakdown;
- a duplicated results transaction grants currency twice;
- scoring requirements alter mob designs, behaviors, placements, or rosters;
- a planning document is reported as a completed runtime economy implementation.

## 11. Production boundary

This document, its canonical data file, and its schema define the approved reward contract. They do not by themselves implement the wallet, timer, results screen, save migration, transaction protection, or live reward calculation. Codex must implement and test those systems before reporting them as playable.