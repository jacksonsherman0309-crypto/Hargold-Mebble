# Hargold & Mebble — Hidden Chests, Chest Mimics, and World Treasure Troves

Last consolidated: July 27, 2026

This document is the newest authority for per-level hidden reward chests, chest mimics, and world treasure troves. Newer explicit user instructions override older plans. This is a design and data contract; it does not claim the runtime, chest assets, mimic behavior, rewards, or trove rooms are already implemented.

## 1. Scope and authored-course rule

- Every completion-bearing course must contain exactly one genuine hidden reward chest and exactly one chest mimic.
- Every world must contain exactly one secret treasure trove.
- With ten campaign worlds, the authored campaign target is ten treasure troves.
- These objects must be individually authored into each course and world. A generic random-placement pass may not replace authored locations, access methods, or reward pacing.
- This system must not alter existing mob designs, behaviors, attacks, movement, counts, placements, or rosters.
- Until its behavior is separately approved, the chest mimic is an environmental chest hazard/interactable rather than an addition to the normal mob roster.

## 2. Genuine hidden reward chest in every course

Every completion-bearing course must contain one genuine reward chest.

The chest must be reached through at least one of the following authored structures:

- a hidden area;
- a difficult optional route using a tricky gameplay mechanic;
- a timed mechanism;
- a hidden switch;
- a multi-step mechanism or switch chain;
- another explicitly approved difficult-access construction.

The genuine chest cannot sit openly on the mandatory main route. Reaching it must reward exploration, mechanical understanding, timing, precision, or route mastery.

### Locked genuine-chest reward

- Exactly 2 extra lives.
- An authored amount of the course currency.
- The currency amount is intentionally undecided and must remain data-driven rather than hard-coded into every chest.

The reward must obey the existing 99-life cap. Overflow handling at 99 lives remains unresolved and must not be invented without approval.

## 3. One chest mimic in every course

Every completion-bearing course must also contain exactly one chest mimic.

### Visual parity

Before activation, the mimic must be indistinguishable from the genuine chest. It must use the same:

- chest mesh and silhouette;
- scale and proportions;
- materials and colors;
- closed pose and idle presentation;
- shadow treatment;
- highlight and interaction treatment;
- pre-trigger sound behavior;
- camera treatment;
- apparent reward framing.

Do not add eyes, teeth, breathing, shaking, particles, discoloration, altered lighting, unusual sound, UI warnings, or any other pre-trigger tell.

### Placement parity

The mimic must be similarly placed to the genuine chest:

- both should require comparable exploration or access effort;
- both should occupy spaces that plausibly contain a meaningful reward;
- one cannot be obviously fake because it is much easier, emptier, more exposed, or differently framed;
- the player must not be able to identify the mimic by placement grammar alone.

### Reveal timing

The player must not learn that the chest is a mimic until reaching and activating its reveal trigger. Its exact post-reveal behavior, damage, escape pattern, defeat rules, and reward outcome remain undecided.

Mebble's X-ray View does not identify which chest is genuine and which is a mimic.

## 4. One secret treasure trove per world

Each world must contain one expertly hidden treasure trove that rewards persistent exploration and deliberate searching for secret areas.

The trove must be substantially more hidden and more valuable than the ordinary per-level chest. It cannot be placed on a routine optional branch or behind an obvious collectible detour.

### Trove interior

After the player has already discovered and entered the trove, it must contain:

- a large path of standard coins leading through the trove toward its chest;
- one primary treasure chest at the end of that coin path;
- a visually and mechanically substantial treasure-room presentation.

The large coin path is an interior reward sequence. On Normal, Hard, and Impossible, no portion of that path may be visible, audible, camera-framed, or otherwise detectable from the normal course before the trove entrance is discovered.

### Locked trove chest reward

Every world trove chest contains:

- Exactly 7 extra lives.
- A massive authored amount of the course currency.
- Exactly 1 additional special reward.

The currency quantity remains undecided and must be authored per world. It must be substantially greater than the currency amount in a normal per-level reward chest.

The 7-life award must obey the existing 99-life cap. Overflow behavior remains unresolved.

## 5. World 2 and World 7 exclusive learned skills

The special reward in the World 2 treasure trove is a learned skill.

The special reward in the World 7 treasure trove is a different learned skill.

These two skills are exclusive to their corresponding treasure troves:

- They cannot be awarded by normal level completion.
- They cannot appear in another chest or treasure trove.
- They cannot be purchased in a shop.
- They cannot be dropped by a mob or boss.
- They cannot be granted by a power-up block.
- They cannot be unlocked through currency, achievements, difficulty completion, or another campaign path.
- Once legitimately collected, each skill persists as a profile progression unlock according to the eventual save contract.

The identities, controls, duration, cooldowns, and gameplay effects of both skills remain undecided.

The special rewards for the other worlds also remain undecided.

## 6. Difficulty-specific treasure-trove locations

Every world must author treasure-trove access data by difficulty.

### Easy

- The Easy-mode trove must be in a different location from the trove used by the other difficulties.
- Knowledge of the Easy location must not reveal the Normal, Hard, or Impossible location.
- Easy may use an explicitly authored gameplay hint, but the allowed hint language is still undecided.
- Do not implement an Easy hint until the user separately approves its exact form.

### Normal

- No gameplay hints.

### Hard

- No gameplay hints.

### Impossible

- No gameplay hints.

Normal, Hard, and Impossible may use the same trove location or individually authored locations, but each must satisfy the no-hint rules and the full access challenge for that difficulty.

## 7. No-hint rule for Normal, Hard, and Impossible troves

The following are prohibited before discovery:

- coin trails or isolated coins pointing toward the entrance;
- weather interaction revealing an entrance or hidden volume;
- hidden-block weather outlines;
- audio cues, music changes, muffled treasure sounds, or directional sound;
- lighting changes, glow, reflections, shadows, or outlines;
- suspicious scenery gaps, cracks, markings, asymmetry, or repeated visual symbols;
- camera pauses, zooms, pans, framing, or focus;
- UI indicators, map markers, counters, notifications, or completion prompts;
- NPC dialogue or environmental text;
- particles, dust, mist, snow, sand, footprints, or other effects that expose the route;
- visible reward-room geometry through walls, floors, ceilings, or foreground layers;
- automatic route assistance.

The trove must be discovered through exploration, experimentation, mechanic knowledge, remembering unusual interactions, or deliberately testing spaces and systems.

Mebble's X-ray View remains limited to hidden blocks. It does not reveal treasure-trove entrances, treasure rooms, real-chest identity, mimic identity, or the shortest route to a trove. If an authored trove route happens to contain hidden blocks, X-ray View may reveal only those blocks under its existing rules.

## 8. Access-method requirements

A treasure-trove entrance should use one or more authored mechanisms such as:

- a deeply concealed hidden switch;
- a multi-stage switch sequence;
- a strict timed mechanism;
- a difficult character-ability sequence;
- an unusual but deterministic interaction chain;
- a difficult optional route with a concealed continuation;
- a secret mechanism that must be activated in a non-routine order;
- a world-specific exploration puzzle.

The solution must remain deterministic. It cannot depend on random chest identity, random switch order, random collision, or unpredictable physics.

The route must respect the repository-wide prohibition on underwater and vertical levels. Troves and their access routes remain horizontally readable course spaces even when they contain local elevation changes.

## 9. Persistence and replay

The game must separately track:

- genuine per-level chest discovered;
- genuine per-level chest reward claimed;
- per-level mimic triggered;
- world trove discovered;
- world trove reward claimed;
- World 2 skill acquired;
- World 7 skill acquired.

Transactions must be idempotent so reloads, deaths, checkpoint restoration, results replay, or save restoration cannot pay the same one-time reward twice.

Whether ordinary per-level chests and world troves can pay again on another difficulty or on replay remains unresolved. Do not invent repeatability rules.

## 10. Required authored data

Each completion-bearing course must define:

```text
course_id
difficulty
genuine_chest_location_id
genuine_chest_access_method
genuine_chest_currency_amount
mimic_location_id
mimic_access_method
visual_parity_profile
placement_parity_review
reward_repeatability_policy
```

Each world must define:

```text
world_id
easy_trove_location_id
normal_trove_location_id
hard_trove_location_id
impossible_trove_location_id
easy_hint_policy
trove_access_method_by_difficulty
trove_currency_amount
trove_special_reward_id
coin_path_plan
seven_life_reward
one_time_claim_key
```

## 11. Validation failures

Reject implementation or authored data when:

- a completion-bearing course lacks either the genuine chest or the mimic;
- a course contains more than one required genuine chest or more than one required mimic without explicit approval;
- the genuine chest is openly placed on the mandatory route;
- the mimic has any pre-trigger visual, audio, UI, animation, placement, or camera tell;
- the genuine chest and mimic are not comparably placed;
- the genuine chest does not award exactly 2 lives;
- a world lacks exactly one treasure trove;
- a trove chest does not award exactly 7 lives;
- the trove coin path is visible or detectable from the main course on Normal, Hard, or Impossible;
- a non-Easy trove has any gameplay hint;
- the Easy trove uses the same location as the higher-difficulty trove;
- X-ray View reveals a trove or distinguishes a mimic;
- the World 2 or World 7 skill can be acquired anywhere else;
- randomization changes a trove solution or chest identity;
- reward transactions can be claimed twice;
- the system changes the existing mob roster or behavior;
- planning files are described as finished chest assets or implemented gameplay.

## 12. Production directive

Every course must offer one meaningful hidden reward and one equally convincing deception. Every world must offer one deeply concealed treasure destination valuable enough to justify sustained exploration.

The player should trust that searching can uncover exceptional rewards, but should never be able to identify a mimic before committing to the chest. Normal, Hard, and Impossible treasure troves must be found without gameplay hints. Easy may eventually receive its own separately authored hint system, but its trove location must not teach the location used by the higher difficulties.
