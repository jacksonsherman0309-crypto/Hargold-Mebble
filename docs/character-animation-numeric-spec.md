# Hargold & Mebble — Numeric Character Animation Contract

Status: approved original project-authored production contract  
Approved: July 30, 2026  
Machine-readable authority: `data/character-animation-numeric-spec.json`

## 1. Purpose and clean-room boundary

This document gives Codex a complete numeric target for authoring the locked Hargold
and Mebble models. It is an original project specification. It does **not** require
or permit importing, tracing, retargeting, measuring, frame-matching, or inspecting
any third-party animation asset, code, rig, binary, or proprietary tuning.

Author every clip from:

1. the locked Hargold and Mebble visible meshes and their matching 24-bone rigs;
2. the current deterministic controller state and measured velocity;
3. project contact events and terrain probes;
4. the exact original values in this document and
   `data/character-animation-numeric-spec.json`.

Do not replace either visible mesh or rig. Do not use root motion. Do not use
negative object scale for facing changes.

## 2. Authority and implementation targets

The numeric JSON is authoritative when a number in prose is ambiguous. Apply it to:

- `src/animation/locked-meshy-animation-library.js`;
- `src/animation/character-animation-config.js`;
- `src/character-renderer.js`;
- `src/gameplay/movement/unified-character-controller.js`;
- `data/animation-state-mapping.json`;
- the live animation-validation course and animation tests.

The controller remains the sole owner of world translation, velocity, collision,
facing decisions, and action legality. Animation communicates those decisions; it
does not delay, replace, or override them.

## 3. Units, timebase, and axes

| Quantity | Contract |
| --- | --- |
| Physics simulation | 120 fixed steps per second |
| Animation authoring | 60 authored frames per second |
| Ratio | 2 simulation steps per authored frame |
| Angle values | Degrees in this document and JSON; convert once to radians in runtime |
| Distances | Metres |
| Character-relative offsets | Percent of that hero's standing height |
| Hargold height | 1.82 m |
| Mebble height | 2.2932 m |
| Rotation space | Additive local-space deltas over the locked bind pose |
| Translation space | Additive local-space deltas over the locked bind pose |
| Root motion | Disabled |
| Facing | Visual-root rotation; never negative scale |

Use semantic flexion/extension helpers rather than scattering rig-specific signs
through every clip. On the current rigs, torso forward lean is positive local-X.
Map semantic leg and arm angles through one tested rig-axis helper. Yaw is local-Y
and roll is local-Z.

Use quaternion slerp for rotations, cubic Hermite interpolation for unconstrained
translations, and a constraint hold plus inertialized release for planted feet.

## 4. Controller coupling

Keep the current shared horizontal controller values:

| Value | Number |
| --- | ---: |
| Walk reference | 3.20 m/s |
| Run reference | 5.70 m/s |
| Full speed | 7.15 m/s |
| Full-speed animation entry | 4.65 m/s |
| Crawl | 1.35 m/s |
| Acceleration from rest | 18 m/s² |
| Moving acceleration | 22 m/s² |
| Full-speed acceleration | 25 m/s² |
| Release deceleration | 16 m/s² |
| Opposite-input skid deceleration | 30 m/s² |
| Slide friction | 5 m/s² |
| Skid/slide entry | 3.00 m/s |
| Skid/slide exit | 1.10 m/s |

Locomotion phase must be distance-driven:

```text
phase = positiveModulo(
  phase + abs(horizontalVelocity) * dt / cycleDistanceMetres,
  1
)
```

Preserve phase between walk, run, and full-speed cycles. When a one-shot enters
locomotion, choose the nearest legal planted-foot phase rather than restarting at
phase zero every time.

A mixer-only fallback may use:

```text
playbackRate =
  clamp(abs(horizontalVelocity) / authoredSpeedMetresPerSecond, 0.65, 1.35)
```

Distance phase is the production target because it remains correct on slopes,
moving platforms, and terrain modifiers.

### Air-pose weights

```text
riseWeight =
  clamp((-verticalVelocity - 0.84) / max(launchSpeed - 0.84, 0.001), 0, 1)

apexWeight =
  1 - smoothstep(0.84, 2.50, abs(verticalVelocity))

fallWeight =
  clamp((verticalVelocity - 0.84) / (15.80 - 0.84), 0, 1)

landingPrepWeight =
  1 - smoothstep(0.05, 0.18, predictedSecondsToGround)
```

Do not loop one fixed jump animation at a constant rate. Continuously solve ascent,
apex, fall, and landing-preparation poses from vertical velocity and predicted
contact time.

## 5. Transition priority

Resolve competing presentation states in this order:

1. defeat;
2. hurt or knockback;
3. ground-slam impact;
4. ground-slam descent;
5. ground-slam startup;
6. landing;
7. double jump, twirl, or glide;
8. ordinary rise, apex, or fall;
9. skid or planted turn;
10. slide, crouch, or crawl;
11. walk, run, or full speed;
12. idle.

A higher-priority gameplay event may interrupt a lower-priority one-shot. Never
finish an animation at the cost of delayed control.

## 6. Blend limits

| Transition | Seconds | 60 fps frames |
| --- | ---: | ---: |
| Idle to walk | 0.0500 | 3 |
| Gait to gait | 0.0667 | 4 |
| Brake | 0.0500 | 3 |
| Turn | 0.0333 | 2 |
| Skid | 0.0333 | 2 |
| Crouch | 0.0667 | 4 |
| Slide | 0.0333 | 2 |
| Jump launch | 0.0167 | 1 |
| Air pose | 0.0500 | 3 |
| Landing | 0.0167 | 1 |
| Slam startup | 0.0167 | 1 |
| Slam impact | 0 | 0 |
| Damage | 0.0167 | 1 |

No responsive blend may exceed 0.12 seconds.

## 7. Locomotion phase landmarks

### Walk

| Landmark | Phase |
| --- | ---: |
| Left contact | 0.00 |
| Left down | 0.08 |
| Left passing | 0.25 |
| Left up | 0.38 |
| Right contact | 0.50 |
| Right down | 0.58 |
| Right passing | 0.75 |
| Right up | 0.88 |
| Loop | 1.00 |

### Run

| Landmark | Phase |
| --- | ---: |
| Left contact | 0.00 |
| Left compression | 0.07 |
| Left passing | 0.22 |
| Left flight | 0.36 |
| Right contact | 0.50 |
| Right compression | 0.57 |
| Right passing | 0.72 |
| Right flight | 0.86 |
| Loop | 1.00 |

### Full speed

| Landmark | Phase |
| --- | ---: |
| Left contact | 0.00 |
| Left compression | 0.06 |
| Left passing | 0.20 |
| Left flight | 0.34 |
| Right contact | 0.50 |
| Right compression | 0.56 |
| Right passing | 0.70 |
| Right flight | 0.84 |
| Loop | 1.00 |

Mirror the semantic lead/trail pose at phase 0.50. Do not duplicate a second set of
arbitrary keys.

## 8. Locomotion cycle dimensions

| Hero | Gait | Frames | Seconds | Authored speed | Cycle distance |
| --- | --- | ---: | ---: | ---: | ---: |
| Hargold | Walk | 36 | 0.6000 | 2.55 m/s | 1.5300 m |
| Mebble | Walk | 40 | 0.6667 | 2.55 m/s | 1.7000 m |
| Hargold | Run | 28 | 0.4667 | 4.80 m/s | 2.2400 m |
| Mebble | Run | 30 | 0.5000 | 4.80 m/s | 2.4000 m |
| Hargold | Full speed | 22 | 0.3667 | 7.15 m/s | 2.6217 m |
| Mebble | Full speed | 25 | 0.4167 | 7.15 m/s | 2.9792 m |

Hargold's cadence is slightly faster and his stride is relatively shorter.
Mebble's longer legs cover more distance per cycle.

## 9. Foot-contact constraints

| Gait | Left planted phase | Right planted phase | Locked axes |
| --- | --- | --- | --- |
| Walk | 0.96→0.13, wrapping | 0.46→0.63 | Vertical and forward |
| Run | 0.975→0.095, wrapping | 0.475→0.595 | Vertical and forward |
| Full speed | 0.985→0.065, wrapping | 0.485→0.565 | Vertical and forward |

Release the constraint inertially over two authored frames. Slide and skid permit
**vertical-only** contact correction. Horizontally locking a skid or slide foot
against controller translation is forbidden.

## 10. Exact gait-pose magnitudes

Angles below are semantic magnitudes. The lead leg is the contacting or forward
leg at phase 0.00; swap sides at phase 0.50.

### Hargold walk

| Pose | Torso | Pelvis Y | Lead hip/knee/ankle | Trail hip/knee/ankle | Arms | Elbow |
| --- | ---: | ---: | --- | --- | --- | ---: |
| Contact | 4° forward | -0.8% H | 24° flex / 10° / 8° dorsiflex | 20° extend / 38° / 18° plantar | 28° forward / 24° back | 28° |
| Down | 4.5° | -1.8% H | 18° / 24° / 4° dorsiflex | 14° extend / 44° / 12° plantar | 22° / 20° | 30° |
| Passing | 3.5° | +0.2% H | support 6° extend / 12° / 6° plantar | swing 5° flex / 62° / 10° plantar | 5° / 5° | 26° |
| Up | 4° | +1.2% H | support 18° extend / 8° / 16° plantar | swing 22° flex / 58° / 2° dorsiflex | 24° / 20° | 28° |

Pelvis yaw magnitude is 5° at contact and 4° at up. Pelvis roll is 3° at
contact and 2° at up. Chest yaw counters pelvis yaw at -0.65.

### Mebble walk

| Pose | Torso | Pelvis Y | Lead hip/knee/ankle | Trail hip/knee/ankle | Arms | Elbow |
| --- | ---: | ---: | --- | --- | --- | ---: |
| Contact | 3° forward | -0.6% H | 28° / 8° / 10° dorsiflex | 24° extend / 42° / 20° plantar | 32° / 28° | 24° |
| Down | 3.5° | -1.5% H | 22° / 22° / 5° dorsiflex | 18° extend / 48° / 14° plantar | 24° / 22° | 26° |
| Passing | 3° | +0.3% H | support 7° extend / 10° / 7° plantar | swing 6° flex / 68° / 11° plantar | 6° / 6° | 24° |
| Up | 3° | +1.5% H | support 22° extend / 7° / 18° plantar | swing 26° flex / 64° / 3° dorsiflex | 28° / 24° | 24° |

Pelvis yaw magnitude is 6° and roll is 4° at contact. Chest yaw counters at
-0.65. Mebble's neck counter-roll is -0.62 of pelvis roll.

### Hargold run

| Pose | Torso | Pelvis Y / compression | Lead leg | Trail leg | Arms / elbow |
| --- | ---: | ---: | --- | --- | --- |
| Contact | 14° | -1.4% / 2.6% | 36° hip, 18° knee, 8° dorsiflex | 38° extend, 52° knee, 20° plantar | 48°/44°, elbow 58° |
| Compression | 15° | -2.8% / 4.2% | 28°, 42°, 2° dorsiflex | 30° extend, 58°, 14° plantar | 40°/38°, elbow 62° |
| Passing | 14° | +0.5% / 1.0% | support 10° extend, 16°, 8° plantar | swing 5° flex, 82°, 12° plantar | 12°/12°, elbow 56° |
| Flight | 14° | +2.2% / 0 | 34° extend, 12°, 18° plantar | 42° flex, 72°, 4° dorsiflex | 48°/44°, elbow 58° |

Flight windows: phase 0.31–0.43 and 0.81–0.93.

### Mebble run

| Pose | Torso | Pelvis Y / compression | Lead leg | Trail leg | Arms / elbow |
| --- | ---: | ---: | --- | --- | --- |
| Contact | 12° | -1.1% / 2.0% | 42°, 16°, 10° dorsiflex | 44° extend, 56°, 22° plantar | 54°/50°, elbow 52° |
| Compression | 13° | -2.2% / 3.5% | 34°, 38°, 3° dorsiflex | 36° extend, 64°, 15° plantar | 46°/44°, elbow 56° |
| Passing | 12° | +0.7% / 0.8% | support 12° extend, 14°, 9° plantar | swing 6° flex, 92°, 13° plantar | 14°/14°, elbow 50° |
| Flight | 12° | +2.8% / 0 | 40° extend, 10°, 20° plantar | 48° flex, 80°, 5° dorsiflex | 54°/50°, elbow 52° |

Flight windows: phase 0.30–0.44 and 0.80–0.94.

### Hargold full speed

| Pose | Torso | Pelvis Y / compression | Lead leg | Trail leg | Arms / elbow |
| --- | ---: | ---: | --- | --- | --- |
| Contact | 24° | -2.0% / 5.5% | 50°, 22°, 8° dorsiflex | 52° extend, 68°, 24° plantar | 68°/64°, elbow 78° |
| Compression | 25° | -3.2% / 7.0% | 42°, 52°, 2° dorsiflex | 44° extend, 78°, 16° plantar | 58°/56°, elbow 82° |
| Passing | 24° | +0.9% / 1.5% | support 14° extend, 18°, 10° plantar | swing 8° flex, 105°, 14° plantar | 18°/18°, elbow 72° |
| Flight | 24° | +3.2% / 0 | 52° extend, 10°, 22° plantar | 58° flex, 86°, 4° dorsiflex | 68°/64°, elbow 78° |

Flight windows: phase 0.28–0.45 and 0.78–0.95.

### Mebble full speed

| Pose | Torso | Pelvis Y / compression | Lead leg | Trail leg | Arms / elbow |
| --- | ---: | ---: | --- | --- | --- |
| Contact | 21° | -1.7% / 4.5% | 56°, 20°, 10° dorsiflex | 58° extend, 72°, 26° plantar | 74°/70°, elbow 72° |
| Compression | 22° | -2.7% / 6.0% | 48°, 48°, 3° dorsiflex | 48° extend, 84°, 18° plantar | 64°/62°, elbow 76° |
| Passing | 21° | +1.1% / 1.2% | support 16° extend, 16°, 11° plantar | swing 10° flex, 112°, 15° plantar | 20°/20°, elbow 66° |
| Flight | 21° | +4.0% / 0 | 58° extend, 8°, 24° plantar | 64° flex, 92°, 6° dorsiflex | 74°/70°, elbow 72° |

Flight windows: phase 0.27–0.46 and 0.77–0.96.

## 11. Starts and gait transitions

### Move start

Hargold: 10 frames. Mebble: 11 frames.

- Frame 0: incoming grounded pose.
- Frame 2: Hargold leans 8° with a 1% pelvis dip; Mebble leans 7° with a
  0.8% dip.
- Hargold first toe-off: frame 4; first contact: frame 7.
- Mebble first toe-off: frame 5; first contact: frame 8.
- Exit into walk phase 0.12.
- World acceleration begins immediately on the controller tick; the clip does not
  postpone movement.

Walk-to-run acceleration is 12 frames for Hargold and 14 for Mebble. Preserve
phase and ramp stride amplitude to 135% of the incoming walk amplitude before
settling to the run template.

Run-to-full-speed is a phase-synchronized blend, not a separate arbitrary take:
4 frames for Hargold and 5 for Mebble.

## 12. Release stopping

A release stop has entry, physics-driven hold, and exit. Do not play one fixed
deceleration clip and return to idle while the controller is still moving.

```text
brakeProgress =
  clamp(1 - abs(horizontalVelocity) / max(entrySpeed, 0.001), 0, 1)
```

Entry: 5 frames for both heroes. Exit: 5 frames Hargold, 6 frames Mebble.

Expected normal-surface stopping results under 16 m/s² release deceleration:

| Entry speed | Stop time | 60 fps frames | Distance |
| ---: | ---: | ---: | ---: |
| 3.20 m/s | 0.2000 s | 12.000 | 0.3200 m |
| 5.70 m/s | 0.35625 s | 21.375 | 1.015313 m |
| 7.15 m/s | 0.446875 s | 26.8125 | 1.597578 m |

Peak Hargold brake pose: torso 16° forward, 7% compression, front knee 52°,
rear knee 38°, arms 38° behind. Peak Mebble pose: torso 18°, 6% compression,
front knee 48°, rear knee 34°, arms 44° behind.

Choose the plant foot from the outgoing gait phase. Use vertical-only contact
after the plant; horizontal deceleration must remain controller-owned.

## 13. High-speed skid and reversal

Trigger on opposite input while speed is at least 3.0 m/s. Decelerate at
30 m/s² until 1.1 m/s.

- Reaction: 3 frames.
- Plant and maximum brace: frame 6.
- Hold the brace while speed remains above 1.1 m/s.
- Pivot: 4 frames Hargold, 5 Mebble.
- Flip facing exactly at 50% pivot progress.
- Push-off: 6 frames Hargold, 7 Mebble.

Expected normal-surface time and distance to skid-exit speed:

| Entry | Time | 60 fps frames | Distance |
| ---: | ---: | ---: | ---: |
| 3.00 m/s | 0.06333 s | 3.8 | 0.129833 m |
| 5.70 m/s | 0.15333 s | 9.2 | 0.521333 m |
| 7.15 m/s | 0.20167 s | 12.1 | 0.831875 m |

Hargold peak: 26° brace against prior travel, 12% compression, feet 16% H
ahead of pelvis, front knee 75°, rear 45°, arms 62° brace.

Mebble peak: 30° brace, 10% compression, feet 19% H ahead, front knee 68°,
rear 40°, arms 68°, neck counter-lean 8°.

The skid foot receives vertical-only correction. Emit a plant effect once, then
distance-driven scrape effects every 0.45 m while speed exceeds 4.65 m/s.

## 14. Low-speed turn

Below skid speed:

| Value | Hargold | Mebble |
| --- | ---: | ---: |
| Duration | 8 frames | 10 frames |
| Compression | 6% H | 5% H |
| Torso twist | 12° | 14° |
| Facing flip | frame 4 | frame 5 |

The head leads the body by two frames. Do not emit skid effects.

## 15. Crouch and crawl

Collider height remains 58% of standing height.

### Crouch

| Value | Hargold | Mebble |
| --- | ---: | ---: |
| Entry | 6 frames | 7 frames |
| Exit | 6 frames | 8 frames |
| Visible height | 72% H | 68% H |
| Pelvis drop | 12% H | 16% H |
| Hip flexion | 48° | 55° |
| Knee flexion | 88° | 98° |
| Ankle dorsiflexion | 18° | 20° |
| Torso lean | 8° | 12° |
| Extra | elbows 46° | elbows 42°, neck counter -6° |

Hold indefinitely while down is held. When down is released, remain crouched if
the standing collider cannot fit.

### Crawl

| Value | Hargold | Mebble |
| --- | ---: | ---: |
| Cycle | 32 frames | 36 frames |
| Cycle distance | 0.72 m | 0.81 m |
| Torso lean | 18° | 22° |
| Lead knee | 100° | 108° |
| Trail knee | 70° | 76° |
| Arm swing | 22° | 28° |

Contacts occur at phases 0.00 and 0.50. Mebble counters the neck by -7°.

## 16. Duck slide

Trigger at 3.0 m/s or above. Exit at 1.1 m/s. Friction is 5 m/s².

- Entry: 6 frames Hargold, 7 Mebble.
- Sustain: parameterized hold driven by actual speed and slope.
- Exit: 8 frames Hargold, 9 Mebble.
- A blocked stand returns to crouch.
- A slide jump launches immediately and preserves horizontal velocity.

```text
speedScalar =
  clamp((abs(horizontalVelocity) - 1.1) / (7.15 - 1.1), 0, 1)
```

Expected normal-surface travel:

| Entry speed | Time to 1.1 m/s | Distance |
| ---: | ---: | ---: |
| 3.00 m/s | 0.38 s | 0.779 m |
| 7.15 m/s | 1.21 s | 4.99125 m |

Hargold: pelvis at 29% H above the foot origin; torso leans backward
`16 + 8 × speedScalar` degrees; front hip 62°, front knee 18°, rear hip 28°,
rear knee 104°, front foot 20% H ahead, rear toe 15% H behind, arms 48°.

Mebble: pelvis 27% H; torso `22 + 8 × speedScalar` degrees back; front hip 68°,
front knee 14°, rear hip 34°, rear knee 110°, front foot 24% H ahead, rear toe
18% H behind, arms 56°, neck counter 8°.

Only vertical ground correction is allowed. Emit slide dust every 0.50 m while
speed exceeds 4.65 m/s.

## 17. Jump and airborne posing

Physics launches on the same 120 Hz step that accepts the jump. Animation has zero
gameplay launch latency.

| Value | Hargold | Mebble |
| --- | ---: | ---: |
| Standing launch | 10.40 m/s | 11.56 m/s |
| Maximum running launch | 11.95 m/s | 13.11 m/s |
| Takeoff clip | 8 frames | 7 frames |
| Visible takeoff compression | 16% H | 13% H |

Takeoff keys:

- frame 0: controller applies launch velocity and emits `jump-launch`;
- frame 1: maximum visible compression and foot release;
- frame 3: maximum leg extension;
- frame 4: arms pass shoulder height;
- final frame: settle into the velocity-driven rise pose.

Shared vertical values: held gravity 22.6 m/s², released gravity 39.2 m/s²,
apex gravity 16 m/s², falling gravity 36.8 m/s², apex window ±0.84 m/s,
terminal fall speed 15.8 m/s, jump buffer 5/60 s, coyote time 4/60 s.

### Rise pose

Hargold: torso 4° back, knees 58°, arms raised 58°.  
Mebble: torso 3° back, knees 66°, arms 64°, neck counter 5°.

### Apex pose

Hargold: upright torso, knees 70°, arms spread 45°.  
Mebble: upright torso, knees 78°, arms spread 55°.

### Fall pose

Hargold: torso 6° forward, knees 32°, ankles 12° dorsiflexed, arms 30°.  
Mebble: torso 7°, knees 38°, ankles 14°, arms 38°, neck counter -4°.

Running-jump torso lean is 8° at walk speed, 14° at run speed, and 18° at full
speed. Preserve the outgoing planted foot and locomotion phase.

## 18. Landing

Emit `landing-contact` on frame 0. Root position remains controller-owned.

### Soft landing

Condition: pre-impact vertical speed below 13.2 m/s.

| Value | Hargold | Mebble |
| --- | ---: | ---: |
| Duration | 8 frames | 9 frames |
| Maximum compression | frame 2, 12% H | frame 2, 10% H |
| Run-cancel opening | frame 4 | frame 4 |

### Heavy landing

Condition: pre-impact vertical speed at least 13.2 m/s.

| Value | Hargold | Mebble |
| --- | ---: | ---: |
| Duration | 16 frames | 14 frames |
| Maximum compression | frame 2, 22% H | frame 2, 18% H |
| Hold compression | through frame 4 | through frame 4 |
| Run-cancel opening | frame 6 | frame 6 |

Use both feet for vertical landings. At high horizontal speed, select the lead
contact foot from predicted trajectory and outgoing phase, then flow back into
locomotion without restarting the gait.

## 19. Air twirl

One use per airborne sequence.

- Duration: 19 frames, approximately 0.3167 s; controller duration remains 0.32 s.
- Visual spin axis: local Y on a visual-only spin root.
- Collision facing and controller facing do not rotate.

| Frame | Rotation |
| ---: | ---: |
| 0 | 0° |
| 3 | 55° |
| 9 | 205° |
| 15 | 335° |
| 19 | 360° |

Hargold arms spread 64°; Mebble 70°. Twirl gravity multiplier remains 0.32 and
fall speed is capped at 1.4 m/s.

## 20. Stomp bounce

Normal bounce: 8 m/s, 12 frames. Strong bounce: 11 m/s, 14 frames.

- frame 0: contact;
- frame 2: maximum compression;
- frame 3: rebound event;
- frame 7 normal / frame 8 strong: full extension.

Normal compression is 10% H for Hargold and 8% H for Mebble. Strong bounce uses
1.2 times the pose amplitude.

## 21. Ground slam

This is a shared **feet-down vertical action**. Belly-first, fist-first, and
head-first poses are forbidden. Fast fall is a separate state.

Keep these controller values:

| Value | Number |
| --- | ---: |
| Input buffer | 0.14 s |
| Minimum air time | 0.08 s |
| Minimum clearance | 0.65 m |
| Startup | 0.10 s |
| Descent acceleration | 90 m/s² |
| Initial descent speed | 18 m/s |
| Maximum descent speed | 23 m/s |
| Horizontal brake | 16 m/s² |
| Impact lock | 0.075 s |
| Recovery | 0.16 s |

### Startup: 6 frames

- frame 0: incoming airborne pose;
- frame 2: knees tuck and horizontal braking is visible;
- frame 4: center of mass aligns directly over the feet;
- frame 5: `ground-slam-commit`;
- frame 6: feet-down descent pose.

### Descent

Use a 12-frame reference pose set, but parameterize/hold it from actual descent
speed. Do not visibly bob or cycle while falling.

Hargold: torso 4° forward, hip flexion 12°, knees 20°, ankles 15° plantar,
feet separated 18% H, upper arms adducted 18°, elbows 25°.

Mebble: torso 2°, hip 10°, knees 18°, ankles 18° plantar, feet 15% H apart,
upper arms 16°, elbows 22°, neck counter 2°.

### Impact: 5 frames

`ground-slam-impact` occurs on frame 0. Maximum compression occurs on frame 2.

Hargold: 24% H compression, hip 72°, knee 108°, ankle 24° dorsiflex,
torso 28°, arms brace 38°.

Mebble: 19% H compression, hip 65°, knee 98°, ankle 22°, torso 24°,
arms 42°, neck counter -6°.

### Recovery: 10 frames

- frame 0: hold impact compression;
- frame 4: half rise;
- frame 6: `recovery-cancel-open`;
- frame 10: standing or locomotion pose.

Hargold uses stronger gameplay effects and interaction strength, not a different
belly/fist animation family.

## 22. Hargold double jump

Hargold only. Mebble may not fall back to this clip.

- Duration: 19 frames.
- Launch speed: 9.45 m/s on frame 0.
- Frame 2: 12% H midair tuck.
- Frame 6: second extension peak.
- Frame 10: torso twist peak 16°; pelvis counters -12°.
- Frame 19: settle into rise pose.
- Raised knee 70°; driving knee 25°.
- No full-body 360° spin; this must remain distinct from the air twirl.

## 23. Mebble glide

Mebble only.

| Phase | Duration |
| --- | ---: |
| Open | 7 frames |
| Sustain loop | 24 frames |
| Close | 6 frames |

Controller values: maximum 2.4 s, gravity 5.6 m/s², maximum fall speed 2.9 m/s.

Sustain body pose: torso 10° forward, chest lifted 6°, arms spread 65°,
elbows 18°, lead leg trails 20°, rear leg trails 35°, head/neck counters -8°.
Vertical bob is at most 0.5% H and body roll is at most 2°.

Damage, ground slam, landing, or defeat may interrupt glide. The current body can
take the glide pose, but the current rig cannot independently open the cape.
Do not claim otherwise until source controls are added.

## 24. Ledge, wall, damage, and idle

### Ledge stop

10 frames for both heroes. Front foot plants on frame 2; rear foot catches on
frame 6. Hargold leans 14° away from the edge and reaches 42° forward. Mebble
leans 18° and reaches 50°.

### Wall contact and slide

Entry is 6 frames. Sustain is velocity-driven with a 3.4 m/s maximum wall-slide
speed. Wall-side hand reach is 48° Hargold and 56° Mebble; outside-arm balance is
34° and 42°. Same-wall regrab suppression remains 10/60 s.

### Damage

Hurt duration is 14 frames. Reaction begins on frame 1, peaks on frame 4, and
control recovery may begin no earlier than frame 10.

Hargold peak: torso recoil 24°, twist 12°, arm throw 58°.  
Mebble peak: recoil 30°, twist 16°, arms 66°, neck lag 10°.

Knockback posing follows actual knockback velocity. Defeat targets are 72 frames
Hargold and 66 frames Mebble.

### Idle

Primary idle loop: 168 frames. Secondary idle loop: 192 frames.

Hargold: chest-breath pitch ±1.2°, pelvis vertical ±0.3% H, head sway ±0.8°.  
Mebble: chest ±1.8°, pelvis ±0.35% H, head ±1.3°, neck ±1.5°.

## 25. Required event markers

Every production clip/state must expose applicable markers:

- `left-foot-contact`, `left-toe-off`;
- `right-foot-contact`, `right-toe-off`;
- `brake-plant`, `skid-plant`, `facing-flip`;
- `slide-enter`;
- `jump-launch`, `twirl-start`;
- `stomp-contact`, `stomp-rebound`;
- `ground-slam-commit`, `ground-slam-impact`;
- `landing-contact`;
- `recovery-cancel-open`.

Brake dust repeats every 0.55 m, skid scrape every 0.45 m, and slide dust every
0.50 m while speed exceeds 4.65 m/s. Effects are distance-driven, not clip-loop
driven.

## 26. Validation tolerances

Reject implementation when any of these fail:

| Check | Maximum |
| --- | ---: |
| Planted-foot slip | 1.5% of hero height |
| Vertical foot penetration | 0.5% of hero height |
| Gait phase discontinuity | 0.08 cycle |
| Knee flexion | 125° |
| Elbow flexion | 115° |
| Controller-event to correct state | 2 authored frames |
| Responsive blend | 0.12 s |

Review silhouettes at 100–150 pixels tall. Test left and right facing at 30, 60,
and 120 render fps on flat ground, uphill, downhill, uneven ground, narrow
platforms, and moving platforms.

Automatic failures:

- animation changes controller velocity or collision;
- a clip contains world-space root translation;
- a planted foot exceeds slip tolerance;
- facing flips before the pivot marker;
- crouch stands into a blocked ceiling;
- slide or skid horizontally pins a foot;
- ground slam becomes belly-first, fist-first, or head-first;
- negative scale mirrors a hero;
- unavailable face, finger, cape, or accessory controls are reported complete;
- any third-party animation or code asset is imported, inspected, traced, or
  retargeted.

## 27. Required implementation sequence

1. Read the machine-readable JSON and existing controller/rig files.
2. Add semantic pose helpers that map human-readable joint motion to current bone
   axes once.
3. Replace time-only locomotion with distance phase while retaining phase
   continuity.
4. Add authored contact/toe-off markers and per-foot locks.
5. Split braking, skid, crouch, and slide into entry/hold/exit behavior.
6. Convert jump and airborne states to velocity-parameterized poses.
7. Implement the exact feet-down slam phases and event timing.
8. Preserve Hargold-only double jump and Mebble-only glide.
9. Update state mapping, debug telemetry, and the validation course.
10. Add deterministic tests for every threshold, marker, phase, and failure rule.
11. Run `npm test`.
12. Report real runtime behavior separately from rig-limited or documentation-only
    work.

A document or passing structural test is not a finished animation. Completion
requires the locked models visibly performing each state in the live validation
course with the tolerances above.
