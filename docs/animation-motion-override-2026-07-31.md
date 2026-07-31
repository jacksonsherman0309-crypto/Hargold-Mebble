# Animation Motion Override — Ground Slam, Hargold Twirl, and Crouch-Walk

Approved: July 31, 2026
Status: authoritative narrow override

This document records the newest user-approved animation corrections. It supersedes conflicting ground-slam, air-twirl, and crawl/crouch-walk behavior in older animation, movement, validation, and gameplay documents.

The implementation remains clean-room. Do not import, trace, inspect, retarget, copy, or frame-match any third-party animation, code, rig, or asset. The external comparison supplies only high-level action grammar: a ground-pound must have an immediately recognizable anticipation, compact aerial reorientation, committed descent silhouette, forceful impact, and recovery. All timings, poses, angles, controller rules, and tests below are original Hargold & Mebble production values.

## 1. Ground slam: mandatory visual rebuild

### Current failure

The present action can read as an ordinary jump followed by a straight drop. A pause in vertical velocity and a feet-down fall pose are not enough to create a distinct attack identity.

### Required visual identity

The ground slam must read in five unmistakable phases:

1. **Air brake** — the current jump pose is interrupted immediately without adding upward velocity.
2. **Compact tuck** — knees and hips pull inward while the arms create a visible counter-shape.
3. **Forward aerial reorientation** — the visible model performs one fast, compact forward somersault around the screen-normal axis. This is visual rotation only; the controller and collision body do not rotate.
4. **Committed slam column** — rotation stops before descent becomes fast. The hips remain low, the boots project forward/up, the torso is compact, and the silhouette no longer resembles a jump or normal fall.
5. **Impact and rebound** — contact produces an immediate compression peak, brief force hold, visible recoil, dust/ring response, and a controlled return to standing.

Do not reuse `jump_takeoff`, `jump_rise`, `jump_fall`, `land_heavy`, or a simple vertical translation as the ground-slam animation.

### Startup timing at 60 authored frames per second

| Frame | Required action |
| ---: | --- |
| 0 | Accept input, emit `ground-slam-air-brake`, cancel jump-cut and glide, preserve horizontal momentum for the controller to brake, set vertical velocity to zero, and apply **no upward displacement**. |
| 1 | Begin tuck: hips 35°, knees 68°, arms 28° outward, torso 8° forward. |
| 2 | Begin forward visual roll and emit `ground-slam-tuck`. |
| 3 | Tuck becomes compact: hips 58°, knees 102°, elbows 48°, torso 18° forward. |
| 4 | Maximum tuck: hips 72°, knees 116°, ankles 18° plantarflexed, arms 42° outward. |
| 5–7 | Complete one original 360° forward visual somersault. Keep the character centered on the controller root; do not create root motion. |
| 8 | Snap into the committed slam silhouette and emit `ground-slam-orient`. |
| 9 | Emit `ground-slam-commit` and begin controller-driven descent. |

The complete startup is **9 authored frames / 0.15 seconds**. It must never add negative vertical velocity. The brief air brake is an anticipation, not a second jump.

### Committed descent silhouette

The descent pose remains stable after frame 9. Do not keep spinning during the fall.

#### Hargold descent

- Torso forward lean: 10°
- Hips flexed: 46°
- Knees flexed: 88°
- Ankles plantarflexed: 18°
- Boots forward/up from the pelvis: 15% of height
- Hip/pelvis visual drop: 13% of height
- Arms: 26° outward and 18° back
- Elbows: 42°
- Head: 8° downward counter-angle
- Foot separation: 19% of height

#### Mebble descent

- Torso forward lean: 8°
- Hips flexed: 42°
- Knees flexed: 82°
- Ankles plantarflexed: 20°
- Boots forward/up from the pelvis: 17% of height
- Hip/pelvis visual drop: 15% of height
- Arms: 30° outward and 16° back
- Elbows: 38°
- Neck/head downward counter-angle: 12°
- Foot separation: 17% of height

The controller remains authoritative for world motion. Retain the deterministic descent physics unless a measured gameplay test proves a separate controller defect:

- acceleration: 90 m/s²;
- initial committed speed: 18 m/s;
- maximum descent speed: 23 m/s;
- horizontal braking: 16 m/s².

### Impact and recovery

Impact is not a normal landing.

| Property | Hargold | Mebble |
| --- | ---: | ---: |
| Impact frames | 6 | 6 |
| Maximum compression frame | 2 | 2 |
| Hold through frame | 3 | 3 |
| Torso compression | 29% height | 23% height |
| Hip flexion | 82° | 74° |
| Knee flexion | 116° | 108° |
| Ankle dorsiflexion | 26° | 23° |
| Torso forward lean | 32° | 27° |
| Arm brace | 56° | 60° |
| Head/neck lag | 9° | 14° |
| Recovery frames | 12 | 10 |
| Recovery cancel frame | 7 | 6 |

Required impact events:

- `landing-contact` on the collision step;
- `ground-slam-impact` on impact frame 0;
- `ground-slam-compression-peak` on frame 2;
- `ground-slam-rebound` on frame 4;
- `recovery-cancel-open` at the hero-specific cancel frame.

Hargold must produce the heavier camera impulse, dust radius, debris response, and enemy/block force. Mebble uses the same action family with lighter presentation. Do not claim completion if the body only moves vertically and the five visual phases are not readable at gameplay scale.

### Ground-slam acceptance tests

- No startup frame may increase jump height or add upward velocity.
- By frame 4, the silhouette must be visibly different from jump rise, apex, fall, and fast fall.
- The visual somersault must complete before fast descent begins.
- During committed descent, the pose must remain stable and compact rather than looping.
- Ground slam must not select or blend through a regular jump or heavy-landing clip as its primary identity.
- Impact frame 2 must be visibly more compressed than heavy landing.
- Validate from standing jump, running jump, Hargold double jump, Mebble glide exit, left/right facing, and 30/60/120 render fps.

## 2. Air twirl: Hargold only

Only Hargold can perform the airborne twirl.

### Controller rules

- Add an explicit `hero === 'Hargold'` guard before any transition into `TWIRL`.
- Mebble must never enter `TWIRL`, select `mebble_air_spin`, emit `twirl-start`, receive twirl gravity, or have fall speed clamped by twirl logic during live gameplay.
- Keep Hargold's `doubleJumpUsed` and `airTwirlUsed` as separate resources. Starting Hargold's double jump must **not** set `airTwirlUsed = true`.
- Hargold may use one double jump and one twirl in the same airborne sequence.
- If Hargold's double jump is unlocked and unused, the first extra airborne Jump press performs the double jump; the next eligible airborne Jump press performs the twirl.
- If the double jump is unavailable or already consumed, the next eligible airborne Jump press performs the twirl.
- Ground slam, damage, death, hero swap, and landing cancel active twirl timing as appropriate.
- Stomp/spring bounce reset behavior must remain deterministic and be covered by tests.

### Mebble input priority

- Ground Jump press: normal jump.
- Holding Jump while descending and eligible: glide opening/sustain.
- Releasing Jump: glide close.
- Additional airborne Jump presses do not twirl and must not silently borrow Hargold's double jump.

The fixed Mebble air-spin inspection clip may remain only as deprecated debug evidence if removing it would break tooling. It must be labeled `debug-only / not a live Mebble ability` and must never be reachable from the live controller, live state map, validation instructions, or player-facing controls.

### Twirl acceptance tests

- Hargold without double jump unlocked: jump, then airborne Jump press enters `TWIRL` once.
- Hargold with double jump unlocked: first airborne Jump press enters `DOUBLE_JUMP`; second eligible airborne Jump press enters `TWIRL`.
- A third twirl request in the same air sequence is rejected.
- Mebble airborne Jump press never enters `TWIRL` and never emits a twirl event.
- Mebble glide behavior is unchanged.
- Validation UI and instructions describe twirl as Hargold-only.

## 3. Crawl state is a crouching squat-walk

The action currently named `crawl` is not a hands-and-knees crawl. Its approved visual behavior is a low crouching squat-walk in the same broad movement family as a classic side-scrolling crouch-walk.

The internal `CRAWL` state name may remain for compatibility, but player-facing labels, validation text, and animation documentation must call it **Crouch-Walk** or **Squat-Walk**.

### Non-negotiable silhouette rules

- The character remains visibly crouched in every cycle frame.
- Neither hand touches the ground.
- Neither knee becomes a ground-contact limb.
- At least one boot remains planted at all times; there is no airborne phase.
- The head-height variation across the cycle may not exceed 2.5% of hero height.
- The pelvis may bob no more than 1.5% of hero height.
- The stride is a short shuffle, not a normal walk played slowly.
- The collider remains at the approved crouched height and cannot stand under blocked clearance.

### Cycle timing and distance

| Hero | Frames | Seconds | Speed | Distance per cycle |
| --- | ---: | ---: | ---: | ---: |
| Hargold | 32 | 0.533333 | 1.35 m/s | 0.72 m |
| Mebble | 36 | 0.600000 | 1.35 m/s | 0.81 m |

Contact phases:

- left boot contact: phase 0.00;
- left passing step: phase 0.25;
- right boot contact: phase 0.50;
- right passing step: phase 0.75;
- loop: phase 1.00.

Planted-foot windows:

- left: 0.94 → 0.16, wrapping;
- right: 0.44 → 0.66;
- lock axes: vertical and forward;
- two-frame inertial release at toe-off.

### Pose targets

#### Hargold

- Visible height: 70–72% standing height throughout the cycle
- Pelvis drop: 15% height
- Torso forward lean: 12°
- Support hip flexion: 58°
- Support knee flexion: 98°
- Swing hip flexion: 64°
- Swing knee flexion: 112°
- Ankle dorsiflexion: 18°
- Forward boot travel: 7% height
- Toe clearance: maximum 2.5% height
- Heel lift: maximum 3.5% height
- Arm counter-swing: maximum 10°
- Elbows: 56°

#### Mebble

- Visible height: 66–68% standing height throughout the cycle
- Pelvis drop: 18% height
- Torso forward lean: 15°
- Support hip flexion: 64°
- Support knee flexion: 104°
- Swing hip flexion: 70°
- Swing knee flexion: 118°
- Ankle dorsiflexion: 20°
- Forward boot travel: 8.5% height
- Toe clearance: maximum 3% height
- Heel lift: maximum 4% height
- Arm counter-swing: maximum 12°
- Elbows: 52°
- Neck counter-angle: 8° backward

Hands remain near the hips or outside the knees so the silhouette reads cleanly. Do not use broad walking arm swings.

### Crouch-walk transitions

- Crouch to crouch-walk entry: 5 frames Hargold, 6 frames Mebble.
- Crouch-walk to crouch exit: 5 frames Hargold, 6 frames Mebble.
- Direction reversal: plant the current support boot, use a four-frame squat pivot, then resume at the nearest legal opposite contact phase.
- Releasing Down under clear headroom exits through crouch before standing.
- Releasing Down under blocked headroom remains crouched.
- Reaching slide-entry speed transitions to slide without standing first.

### Crouch-walk acceptance tests

- Every sampled frame remains below the approved visible-height ceiling.
- Neither hand or knee contacts the ground.
- No frame resembles a normal standing walk.
- No frame contains an airborne interval.
- Foot slip remains within the global 1.5% hero-height limit.
- Test both heroes, both directions, starts/stops, reversals, low ceilings, inclines, declines, narrow platforms, and moving platforms.

## Required implementation surfaces

At minimum, reconcile and update:

- `data/character-animation-numeric-spec.json` or an authoritative machine-readable override consumed by the runtime;
- `src/animation/character-animation-numeric-runtime.js`;
- `src/animation/locked-meshy-animation-library.js` for debug inspection clips;
- `src/animation/character-animation-config.js`;
- `src/gameplay/movement/unified-character-controller.js`;
- `src/gameplay/movement/movement-tuning.js` only where controller values actually change;
- `src/content/animation-validation-course.js`;
- movement, animation-runtime, ground-slam, and validation tests;
- player-facing controls/instructions that currently imply Mebble can twirl.

Completion requires live visual verification on the locked Hargold and Mebble models. Documentation, state names, clip names, and structural tests alone are not completion.