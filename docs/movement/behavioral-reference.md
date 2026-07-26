# Unified movement behavioral reference

Status: implemented clean-room controller target, with project-scale tuning still provisional.

The production authority is `src/gameplay/movement/unified-character-controller.js` at a deterministic 120 Hz fixed step. Animation consumes state and events; it does not drive collision or root motion.

| Mechanic | Observable behavior | Input and transitions | Hero adaptation | Test method | Confidence / source |
| --- | --- | --- | --- | --- | --- |
| Walk, run, sprint | Speed builds through acceleration; releasing direction coasts to rest | `Idle → Walk → Run → Sprint`; release enters walk/run/brake while slowing | Shared horizontal base | Fixed-step terminal-speed and release tests | High; project design decision and direct prototype observation |
| Reversal and skid | Low-speed turns remain responsive; a high-speed reversal brakes before changing facing | Opposite direction; `Sprint/Run → Skid → Turn` | Shared | Threshold and state tests | High; project design decision |
| Variable jump | A tap produces a lower apex than a held press | Space while grounded/coyote; `JumpStartup → Rise → Apex → Fall` | Mebble receives a small profile jump addition | Measured tap/full jump | High; canonical requirement |
| Buffer and coyote | A slightly early press fires on landing; a slightly late press fires after leaving an edge | Buffered Space and coyote timers | Shared | Boundary tests | High; canonical requirement |
| Air twirl | One fresh airborne Space press gives bounded hang time and preserves horizontal momentum | `Rise/Fall → Twirl`; resets only on an approved landing/bounce reset | Mebble always; Hargold only before double-jump unlock | One-use, reset, and airtime tests | High; explicit production target |
| Hargold double jump | First valid airborne Space press launches once after progression unlock | `Rise/Fall → DoubleJump`; landing resets | Hargold only, locked by default | Locked/unlocked/one-use tests | High; explicit production target |
| Mebble glide | Holding Space while descending eases into a lower fall-speed cap; release closes the cape | `Fall → GlideOpening → Glide → GlideClosing` | Mebble only; finite uninterrupted duration | Activation, cap, and exhaustion tests | High; explicit production target |
| Fast fall | Down while descending accelerates fall without impact attack and keeps steering | `Fall → FastFall`; release returns to fall | Shared | Low-clearance differentiation test | High; explicit production target |
| Ground slam | A valid fresh airborne Down press pauses briefly, accelerates sharply, impacts, then recovers | `GroundSlamStartup → GroundSlamFall → GroundSlamImpact → GroundSlamRecovery` | Shared; surface/block consequences remain authored | Phase and impact-state tests | High; explicit production target |
| Stomp bounce | Valid top contact produces an upward rebound; holding Space at contact may strengthen it | `Stomp → StompBounce` | Shared; enemy classification decides safety | Rebound and spiked-enemy runtime tests | High; canonical enemy rules |
| Slopes | Foot origin follows sampled support; uphill target speed decreases and downhill target speed increases | Ground locomotion samples surface height, angle, normal, and material | Shared | Slope speed ordering and calibration | Medium; final production geometry is pending |
| Moving platforms | Rider receives platform displacement; launch inherits configurable platform velocity | Support ID and velocity clear on separation | Shared | Transport and launch tests | High for translation; rotation needs production geometry |
| One-way platforms | Landing occurs only while descending and crossing from above | Down+Space activates temporary platform-specific drop-through | Shared | Below-contact and drop-through tests | High |
| Swap | Feet and momentum remain stable; unsafe taller fits are rejected | `SwapOut/SwapIn` presentation intent | Hargold/Mebble collider profiles | Low-ceiling rejection test | High; collider dimensions remain provisional |
| Damage and death | Damage cancels airborne utilities and applies deterministic knockback; death overrides controller input | `Damage → Knockback`; fatal state → `Dead` | Shared | Runtime and hazard tests | High |
| Wall contact | Side collision stops horizontal motion without granting a wall jump or resetting air actions | Wall-contact event/presentation reaction | Shared | Collision adapter checks | High; newer explicit rule |

Open production questions:

- Final collider dimensions require approved deforming meshes and gameplay-camera review.
- Final tuning requires target-device input latency and production level-geometry calibration.
- Rotating-platform tangent inheritance and steep-slope slide-only classification need production collision shapes.
- Animation clips, sound, camera impulses, particles, and hit-stop consumers must be authored against the emitted events.
