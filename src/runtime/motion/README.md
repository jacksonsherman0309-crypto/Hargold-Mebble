# Legacy motion import compatibility

The active implementation lives in `src/gameplay/movement`. The files in this
directory preserve older import paths for non-movement traversal modules and
tests, but they do not implement a second locomotion controller.

- `motion-controller.js` delegates create, step, body, and swap operations to
  the unified controller.
- `motion-tuning.js` re-exports the unified tuning and hero profiles.
- `action-controller.js` contains presentation/traversal compatibility state
  only; it does not solve jumps, twirls, slams, bounces, damage, or wall jumps.

See `docs/movement/migration-audit.md`.
