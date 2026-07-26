# Unified movement tuning guide

All shared values live in `src/gameplay/movement/movement-tuning.js`; hero-only differences live in `hero-profiles.js`. Do not duplicate these numbers in the browser integration, animation system, or level scripts.

`movement-parameters.js` defines the machine-readable parameter schema,
horizontal response cases, and terrain-response profiles. Visible material
names do not determine physics directly; authored terrain supplies a gameplay
material ID.

Run:

```bash
npm run calibrate:movement
```

The report measures target-speed times, stopping and reversal distances, tap/full/running jumps, apex and airtime, twirl extension, Hargold double jump, Mebble glide, ground slam, landing thresholds, stomp rebound, platform inheritance, and slope response.

Important parameter groups:

| Group | Primary values | Increasing them does |
| --- | --- | --- |
| Ground targets | `walkSpeed`, `runSpeed`, `sprintSpeed` | Raises the corresponding stable horizontal speed |
| Ground response | `groundAcceleration*`, `releaseDeceleration`, `highSpeedSkidDeceleration` | Reaches targets, stops, or reverses sooner |
| Context response | `accelerationFromRest`, `accelerationWhileMoving`, `noInputDeceleration`, `oppositeInputBraking`, `activeTurnAcceleration`, slow/medium/fast cases | Changes one acceleration context without flattening starts, coasting, and reversals into one value |
| Jump | `baseJumpSpeed`, `runningJumpBonus`, `heldJumpGravity`, `releasedJumpGravity` | Changes initial height/momentum or hold sensitivity |
| Forgiveness | `jumpBufferSeconds`, `coyoteSeconds` | Widens the valid early/late input window |
| Twirl | `airTwirlSeconds`, `airTwirlGravityMultiplier`, `airTwirlMaximumFallSpeed` | Extends or strengthens the bounded hang |
| Glide | `glideOpeningSeconds`, `maximumGlideSeconds`, `glideGravity`, `glideMaximumFallSpeed` | Alters opening delay, duration, and descent rate |
| Slam | `groundSlamPrepareSeconds`, `groundSlamAcceleration`, `groundSlamMaximumSpeed`, impact/recovery timers | Alters anticipation, commitment, impact arrival, and lockout |
| Slope | `uphillSpeedPenalty`, `downhillSpeedBoost`, `maximumWalkableSlopeRadians` | Alters speed response and classification boundary |
| Damage/bounce | hurt and stomp speed/timer values | Alters rebound, knockback, and control lock |

Every numeric value also has machine-readable unit, purpose, state, effect direction, and hero-override policy in `MOVEMENT_PARAMETER_DOCUMENTATION`.

Tuning rules:

1. Change one behavior family at a time.
2. Run `npm test` and the calibration report.
3. Compare measured outcomes, not only how a single animation looks.
4. Keep Hargold and Mebble horizontal base tuning shared.
5. Put intentional hero differences in `hero-profiles.js`.
6. Never infer production collider dimensions from the 2D sheets; validate against the final approved meshes.
