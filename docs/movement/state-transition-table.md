# Unified movement state transitions

Higher-priority forced states preempt locomotion. The canonical names and animation aliases are in `movement-state-machine.js`.

| From | Trigger | To | Exit / reset |
| --- | --- | --- | --- |
| Idle/Walk/Run/Sprint | Direction and speed target | Walk/Run/Sprint | Release, reverse, jump, crouch, forced state |
| Run/Sprint | High-speed opposite direction | Skid | Speed falls below skid exit, then Turn |
| Ground locomotion | Down held | Crouch/Crawl/DuckSlide | Down released and stand clearance succeeds |
| Ground/coyote | Buffered Space | JumpStartup | Immediate rise integration |
| JumpStartup/Rise | Upward motion | Rise | Apex velocity window |
| Rise | Apex window | Apex | Downward velocity |
| Apex | Downward velocity | Fall | Land, twirl, glide, fast fall, or slam |
| Airborne | Fresh Space and twirl available | Twirl | Timer expires; remains airborne |
| Hargold airborne | Fresh Space, skill unlocked, unused | DoubleJump | Timer expires; remains airborne |
| Mebble descending | Space held, cape permitted | GlideOpening | Opening timer expires |
| GlideOpening | Opening complete | Glide | Space release, exhaustion, slam, damage, land |
| Airborne descending | Down held without valid slam activation | FastFall | Down release, land, or slam |
| Airborne with clearance | Fresh Down | GroundSlamStartup | Startup timer expires |
| GroundSlamStartup | Startup complete | GroundSlamFall | Surface/enemy/hazard contact |
| GroundSlamFall | Solid impact | GroundSlamImpact | Impact timer expires |
| GroundSlamImpact | Impact timer complete | GroundSlamRecovery | Recovery timer expires |
| Airborne | Valid soft/hard contact | SoftLand/HardLand | Recovery timer or jump buffer |
| Airborne | Valid enemy top contact | StompBounce | Normal rise/apex/fall sequence |
| Supported one-way | Down held + fresh Space | Fall/drop-through | Platform cleared or ignore timer expires |
| Any controllable | Survivable hit | Damage/Knockback | Hurt lock expires and support resolves |
| Any | Fatal outcome | Dead | Explicit respawn/restart |
| Valid swap state | Swap input and safe target body | SwapIn | Next legal locomotion state |
| Any | Course completion/script | Victory/Scripted | Script or restart |

Unrestricted wall jump is intentionally absent. Side contacts emit a wall-contact event and preserve vertical movement.
