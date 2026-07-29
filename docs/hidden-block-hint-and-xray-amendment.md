# Hidden-Block Hint and Mebble X-Ray Amendment

Last approved: July 27, 2026

This amendment is the newest authority for hidden-block hinting, hidden-block difficulty scaling, and Mebble's learned X-ray skill. It supersedes any older document, prototype behavior, level plan, or generator rule that hints hidden blocks through shadows, wall markings, sound cues, particle asymmetry, suspicious scenery, block-row gaps, platform silhouettes, lighting changes, or other environmental tells not explicitly permitted below.

## 1. Allowed hint channels

Before Mebble unlocks and uses X-ray View, hidden blocks may be hinted only through:

1. deliberately placed coins; and
2. approved weather interaction with the invisible block volume.

No other hint language is allowed.

Prohibited pre-reveal hints include:

- shadows or darkened rectangles;
- wall markings, cracks, carvings, decals, or symbols;
- sound cues or proximity tones;
- lighting pulses or glows;
- suspicious missing blocks in an otherwise regular row;
- scenery asymmetry authored solely to expose the block;
- dust, mist, snow, sand, spores, leaves, or particles unless they are part of the approved weather-hint channel for that difficulty;
- camera framing that deliberately centers an invisible block;
- route geometry that makes the answer obvious without player testing;
- UI markers, arrows, tutorials, or text labels.

A revealed hidden block must still materialize visibly and provide normal impact, collision, and reward feedback. The restriction applies to hints before discovery, not to the reveal response after a valid hit.

## 2. Difficulty names and authority

The four current difficulty tiers are:

1. Easy
2. Normal
3. Hard
4. Impossible

`Impossible` is the highest difficulty label and supersedes older references to `Nightmare` where those references describe the fourth difficulty slot.

## 3. Difficulty hint matrix

### Easy

- Coin hints are allowed and should be the primary clue.
- Weather hints are allowed and may be clearly readable.
- Hidden blocks that interrupt routine jumps must remain rare.
- A blocking hidden block should normally produce a recoverable mistake rather than an immediate life loss.
- Major secret-route hidden blocks should receive the clearest permitted coin or weather clue.

Typical coin treatments may include a coin arc, a single coin suspended over empty space, or a coin line that becomes reachable after the block is revealed. Coins must still look like natural collectible placement rather than an explicit tutorial arrow.

### Normal

- Coin hints are allowed, but they should be less frequent and less explicit than on Easy.
- Weather hints are allowed at moderate subtlety.
- A level may contain a handful of hidden blocks, but not every course must contain a hidden block that obstructs a jump.
- Blocking placements may appear in selected courses and should usually remain recoverable on first contact.

### Hard

- Coin hints are prohibited.
- Only a light weather display may hint an invisible block.
- The weather interaction must be brief, subtle, and easy to miss at full movement speed.
- Hidden blocks may interfere with routine jumps more often than on Normal.
- The placement remains fixed between attempts and must never depend on randomness.

Examples of permissible light weather display include:

- a few snowflakes briefly landing against the invisible top surface;
- a thin sand stream splitting around the block volume;
- a light mist curl diverting around one edge;
- a small number of rain or ash particles striking the invisible surface.

The display cannot outline the entire block continuously or function as an obvious rectangular marker.

### Impossible

- Coin hints are prohibited.
- Weather hints are prohibited.
- No environmental, audio, lighting, particle, UI, camera, or scenery hint may reveal an undiscovered hidden block.
- Players must discover blocks through testing, memory, level knowledge, or Mebble's unlocked X-ray View.
- Hidden blocks may interrupt routine jumps at the highest approved frequency, but first-contact outcomes must remain mechanically valid rather than impossible or random.

Impossible may be unforgiving, but it may not create:

- an unavoidable death with no learnable response;
- an impossible route state;
- a required blind jump into off-camera geometry;
- random hidden-block locations;
- inconsistent collision between attempts;
- a trap that permanently prevents level completion.

## 4. Weather hints

Weather hints are collision-reactive world effects, not decorative symbols placed beside a block.

Approved weather channels include:

- snowfall and blizzard particles;
- sand and sandstorm particles;
- Toxic Fen mist or vapor;
- rain, ash, pollen, or other world-authored atmospheric particles where a course explicitly uses them.

Weather-hint rules:

- Easy may show a readable but natural interaction.
- Normal may show an intermittent, less complete interaction.
- Hard may show only a light, brief interaction.
- Impossible shows no weather interaction with undiscovered hidden blocks.
- Weather cannot make hidden blocks permanently visible before discovery.
- Weather cannot change the hidden block's collision state.
- Decorative weather simulation must respect the selected difficulty's hint setting.

## 5. Coin hints

Coin hints may be used only on Easy and Normal.

Coin hints may:

- suggest an upward strike location;
- indicate a step toward an upper route;
- lead toward a hidden room or Compass Coin path;
- create a jump arc that intersects a hidden block;
- make a seemingly unreachable coin collectible after discovery.

Coin hints may not:

- display a literal block-shaped coin outline;
- spell out instructions;
- create an arrow graphic;
- remain on Hard or Impossible variants;
- be replaced by another explicit visual marker when removed.

Difficulty variants must author separate coin layouts where necessary. Removing a hint coin cannot leave required collectible accounting, life economy, or route pacing in an invalid state.

## 6. Hidden blocks that obstruct jumps

Hidden blocks may intentionally disrupt a familiar or routine jump by shortening the jump arc, stopping upward travel, changing landing timing, or forcing a revised takeoff point.

Their frequency increases by difficulty:

- Easy: very few; many levels contain none.
- Normal: a handful across the campaign; not every level contains one.
- Hard: common enough to affect route-reading, with no coin hints and only light weather tells.
- Impossible: most frequent and completely unhinted before discovery unless Mebble uses X-ray View.

Regardless of difficulty:

- the block location is deterministic;
- the collision result is consistent;
- the player can learn a corrected timing or alternate route;
- required progression remains possible;
- the block becomes visibly solid after discovery;
- the revealed block may become a useful landing or route-support surface;
- no mob design, roster, behavior, or authored placement is changed by this amendment.

## 7. Mebble's learned X-ray View

Mebble gains a learned progression skill called `X-ray View`.

This is a hero skill, not a random power-up and not a default starting ability.

After the skill is unlocked and activated:

- every hidden block relevant to the currently loaded course space becomes visible to the player through a clear X-ray outline or material treatment;
- reward blocks, route-support blocks, precision-interference blocks, secret-access blocks, and other hidden-block categories are all included;
- the display works on Easy, Normal, Hard, and Impossible;
- the display works through snow, sand, mist, and other approved atmosphere;
- the display reveals location and block boundaries but does not automatically strike, activate, consume, or materialize the block;
- normal collision and discovery rules remain unchanged until the player validly hits or otherwise activates the block;
- revealed information must remain readable without obscuring hazards, platforms, mobs, or the gameplay plane;
- the effect must use an original Hargold & Mebble visual identity rather than copying another game's X-ray presentation.

X-ray View is the intended learned counterplay to fully unhinted Impossible-mode blocks. The skill may reduce search friction, but it does not remove the movement execution required to reach, strike, or use a hidden block.

The exact input mapping, duration, cooldown, resource cost, and whether the view is held or toggled remain implementation details until explicitly approved. Implementations must not silently add a consumable cost, random failure chance, or difficulty-based lockout.

## 8. Data requirements

Every authored hidden block must record at minimum:

- stable hidden-block identifier;
- category and gameplay purpose;
- enabled difficulties;
- whether it obstructs a routine jump;
- Easy coin-hint configuration;
- Normal coin-hint configuration;
- Easy weather-hint configuration;
- Normal weather-hint configuration;
- Hard light-weather configuration;
- explicit Impossible no-hint state;
- X-ray visibility state;
- pre-discovery collision state;
- post-discovery collision state;
- failure consequence and recovery path;
- route or reward dependency;
- deterministic placement guarantee.

## 9. Validation failures

Reject a course or difficulty variant when:

- a hidden block is hinted through any non-coin, non-weather channel before X-ray View;
- Hard contains coin hints;
- Hard's weather display is stronger than a light, brief interaction;
- Impossible contains coin, weather, sound, lighting, scenery, UI, or camera hints;
- X-ray View fails to show a hidden-block category;
- X-ray View automatically consumes or activates blocks;
- hidden-block placement changes between attempts;
- a jump-blocking hidden block produces an impossible route state;
- removing hint coins breaks coin totals, route readability, or collectible logic;
- the fourth difficulty remains labeled Nightmare in new canonical data instead of Impossible;
- this pass modifies mobs.

## 10. Production directive

Hidden blocks should create curiosity, secrets, rewards, route changes, and increasingly demanding timing without relying on a broad collection of environmental tells.

The only natural pre-discovery clues are coins and weather, and those clues diminish by difficulty:

- Easy: coin and clear weather clues;
- Normal: reduced coin and weather clues;
- Hard: no coins and only light weather clues;
- Impossible: no clues.

Mebble's learned X-ray View is the explicit player-controlled method for seeing all hidden blocks once the skill has been earned.