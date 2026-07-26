import assert from 'node:assert/strict';
import {
  platformTop,
  resolveOneWayPlatformLanding
} from '../../src/gameplay/levels/platform-block-runtime.js';
import {
  movementBody,
  trySwapUnifiedHero
} from '../../src/gameplay/movement/unified-character-controller.js';
import { MOVEMENT_TUNING } from '../../src/gameplay/movement/movement-tuning.js';
import { makeState, step } from './test-helpers.mjs';

const platform = {
  id: 'one-way',
  x: 0,
  y: 0,
  width: 4,
  height: 0.2,
  oneWay: true,
  angle: 0
};
const rising = makeState({ grounded: false, footY: platformTop(platform) + 0.1 });
rising.velocityY = -2;
assert.equal(
  resolveOneWayPlatformLanding(rising, platformTop(platform) - 0.1, [platform], movementBody(rising)),
  null
);

const drop = makeState({ footY: platformTop(platform) });
drop.supportPlatformId = platform.id;
step(drop, { downHeld: true, jumpPressed: true });
assert.equal(drop.dropThroughPlatformId, platform.id);
assert.equal(drop.grounded, false);
assert.equal(
  resolveOneWayPlatformLanding(drop, platformTop(platform) - 0.1, [platform], movementBody(drop)),
  null
);

const launch = makeState();
launch.supportPlatformId = 'moving';
launch.supportVelocityX = 2;
launch.supportVelocityY = -1;
step(launch, { jumpPressed: true, jumpHeld: true });
assert.ok(launch.velocityX >= 2 * MOVEMENT_TUNING.movingPlatformVelocityInheritance);
assert.equal(launch.supportPlatformId, null);

const swap = makeState({ hero: 'Hargold', footX: 3, footY: 5 });
const rejected = trySwapUnifiedHero(swap, {
  canOccupy: body => body.height <= 1.9
});
assert.equal(rejected.accepted, false);
assert.equal(swap.hero, 'Hargold');

console.log('Unified one-way, drop-through, platform inheritance, and swap checks passed.');
