# Standard and Coin Block Mechanics

## Status
Approved gameplay and level-generation directive.

## Coin block placement

- Use the approved stone coin-block model and the existing locked reward table.
- Coin blocks must remain sparse: normally **2–3 per level**.
- At least **1 coin block per level** should be meaningfully better hidden than the others.
- Do not use coin blocks as routine decoration or filler.
- Place them as intentional rewards for exploration, route reading, or noticing a suspicious space.

## Coin block rewards

Each activation resolves once using the locked distribution:

- **1 coin:** 78%
- **5 coins:** 14%
- **10 coins:** 7%
- **100 coins:** 1%

After payout, the block must enter its exhausted/used state and cannot award coins again.

## Standard mossy cobblestone block behavior

Standard blocks should reproduce the functional role and readability of brick blocks in New Super Mario Bros. Wii while using Hargold & Mebble's original visuals and rules.

### Breakable standard block

This is the majority case.

- Begins as the approved world-themed mossy cobblestone block.
- Breaks when struck from below by a normal upward jump.
- Breaks when struck from above by a slam/ground-pound.
- Produces a brief impact response before fragmenting: small compression/bounce, debris, dust, and a clear break sound.
- Leaves no persistent collision after destruction.
- Contains no reward unless explicitly authored as another approved block type.

### Hidden single-coin standard block

This is the minority case and must look identical to a breakable standard block before activation.

- Does **not** break on the first valid hit.
- May be activated from below by a normal upward jump or from above by a slam/ground-pound.
- Dispenses exactly **1 coin**.
- Immediately and permanently changes into the **solid brown used-block state**.
- The brown used block remains solid collision.
- It cannot be broken, reactivated, or dispense another reward.

## Recommended generation balance

Use this as the default procedural target unless a hand-authored section calls for a different composition:

- **Breakable empty blocks:** approximately 80–90% of standard-block instances.
- **Hidden single-coin blocks:** approximately 10–20% of standard-block instances.

Apply the ratio across a level rather than forcing it within every small block cluster. Avoid predictable patterns that reveal which blocks contain coins.

## Placement principles

- Standard blocks should usually serve a traversal purpose: temporary ceiling, destructible barrier, step, platform edge, route divider, secret-space cover, or controlled obstruction.
- Do not fill large regions with blocks merely for visual density.
- Keep enough unbreakable terrain beneath or around block arrangements to preserve the intended route after breakable blocks are destroyed.
- Hidden single-coin blocks should reward curiosity without making progress depend on guessing.
- The solid brown used-state conversion must be immediate and visually unmistakable.

## Implementation states

Recommended state machine:

1. `StandardBreakableIdle`
2. `StandardBreakableHit`
3. `StandardBreakableDestroyed`
4. `StandardSingleCoinIdle`
5. `StandardSingleCoinPayout`
6. `StandardUsedBrown`

The two idle states must share the same visible model and materials. Their behavior differs only in authored block data.
