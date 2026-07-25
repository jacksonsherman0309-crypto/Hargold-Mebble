# Modular motion extraction

These modules extract the reusable, model-independent algorithms that are
actually present in archived Full Motion Build 009:

- deterministic fixed-step compatibility;
- walk/run acceleration and target speeds;
- release deceleration, low-speed turns, and high-speed skids;
- variable-height and speed-dependent running jumps;
- coyote time and jump buffering;
- apex gravity and terminal fall speed;
- Mebble's descending cape glide;
- linear ground sampling;
- foot-origin-preserving hero swaps;
- rejection of unsafe taller-collider swaps.

The archived numeric constants and proxy collider dimensions are obsolete
engineering values, not current canon. `motion-tuning.js` therefore exposes
clearly labeled provisional meter-scale tuning. Final values remain open until
production models, target-device testing, and explicit approval.

Build 009 does **not** contain source for the complete Build 017 feature list.
The missing model-independent behavior has therefore been implemented from the
reconciled contract as small modules in `motion`, `environment`, `objects`,
`collision`, and `hazards`. See `docs/archive-extraction-report.md`.

These are reusable deterministic gameplay foundations, not a claim that the
current demo integrates every action with final geometry, session rules, or
animation. Triple-jump sequencing is represented by action state but still
needs level-session integration. Falling/collapsing platform arming and
compound depenetration require production level geometry. All exact tuning,
collider measurements, animation markers, and rig-dependent blending remain
provisional.
