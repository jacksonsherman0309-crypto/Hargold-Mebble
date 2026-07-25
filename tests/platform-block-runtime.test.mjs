import assert from 'node:assert/strict';
import {
  activeCourseSurfaces,
  breakBlocksWithRollingShell,
  platformTop,
  resolveBlockHeadHit,
  resolveOneWayPlatformLanding,
  resolveSolidBlockSideCollision,
  stepBlockFeedback,
  supportHeightAt
} from '../src/gameplay/levels/platform-block-runtime.js';
import {
  MEADOW_WAKE_BLOCK_DEFINITIONS,
  MEADOW_WAKE_PLATFORMS,
  createMeadowWakeBlocks
} from '../src/content/meadow-wake-course.js';

const platform = MEADOW_WAKE_PLATFORMS[0];
const landingState = {
  footX: platform.x,
  footY: platformTop(platform) + 0.14,
  velocityY: 4,
  grounded: false,
  supportPlatformId: null,
  doubleJumpUsed: true,
  groundSlamming: true,
  glide: 'open',
  locomotion: 'fall',
  stateSeconds: 1
};
const landingBody = {
  x: landingState.footX - 0.5,
  y: landingState.footY - 1.82,
  width: 1,
  height: 1.82
};
const landing = resolveOneWayPlatformLanding(
  landingState,
  platformTop(platform) - 0.12,
  MEADOW_WAKE_PLATFORMS,
  landingBody
);
assert.equal(landing?.platformId, platform.id);
assert.equal(landingState.footY, platformTop(platform));
assert.equal(landingState.grounded, true);
assert.equal(landingState.supportPlatformId, platform.id);
assert.equal(landingState.doubleJumpUsed, false);

const risingState = { ...landingState, grounded: false, velocityY: -3, footY: platformTop(platform) + 0.1 };
assert.equal(
  resolveOneWayPlatformLanding(risingState, platformTop(platform) - 0.1, MEADOW_WAKE_PLATFORMS, landingBody),
  null,
  'one-way ledges must allow upward travel from below'
);

assert.equal(
  supportHeightAt(landingState, platform.x, () => 8, MEADOW_WAKE_PLATFORMS),
  platformTop(platform)
);
assert.equal(
  supportHeightAt(landingState, platform.x + platform.width, () => 8, MEADOW_WAKE_PLATFORMS),
  8
);
assert.equal(landingState.supportPlatformId, null);

function hitBlock(hero, blockType) {
  const block = {
    id: `${hero}-${blockType}`,
    type: blockType,
    x: 2,
    y: 4,
    width: 0.74,
    height: 0.74,
    broken: false,
    bumpSeconds: 0
  };
  const body = { x: 1.6, y: 4.2, width: 0.8, height: 1.82 };
  const state = {
    hero,
    footY: body.y + body.height,
    velocityY: -6,
    grounded: false,
    supportPlatformId: null,
    locomotion: 'rise'
  };
  const event = resolveBlockHeadHit(state, 4.48, [block], body);
  return { block, state, event };
}

const standardHit = hitBlock('Mebble', 'standard-breakable');
assert.equal(standardHit.event?.type, 'block-broken');
assert.equal(standardHit.block.broken, true);
assert.ok(standardHit.state.velocityY > 0, 'a block hit must stop upward motion');

const rejectedHit = hitBlock('Mebble', 'hargold-only');
assert.equal(rejectedHit.event?.type, 'block-rejected');
assert.equal(rejectedHit.block.broken, false);

const hargoldHit = hitBlock('Hargold', 'hargold-only');
assert.equal(hargoldHit.event?.type, 'block-broken');
assert.equal(hargoldHit.block.broken, true);

const shellBlocks = [
  { id: 'standard', type: 'standard-breakable', x: 2, y: 4, width: 0.74, height: 0.74, broken: false, bumpSeconds: 0 },
  { id: 'hargold', type: 'hargold-only', x: 2, y: 4, width: 0.82, height: 0.82, broken: false, bumpSeconds: 0 }
];
assert.deepEqual(
  breakBlocksWithRollingShell({ x: 1.5, y: 3.5, width: 1, height: 1 }, shellBlocks),
  ['standard']
);
assert.equal(shellBlocks[0].broken, true);
assert.equal(shellBlocks[1].broken, false);
stepBlockFeedback(shellBlocks, 1);
assert.equal(shellBlocks[0].bumpSeconds, 0);

const solidBlocks = [
  { id: 'solid', type: 'hargold-only', x: 4, y: 5, width: 0.8, height: 0.8, broken: false }
];
const sideState = { footX: 3.75, velocityX: 4 };
const previousSideBody = { x: 2.8, y: 4.5, width: 0.8, height: 1.2 };
const currentSideBody = { x: 3.35, y: 4.5, width: 0.8, height: 1.2 };
assert.equal(
  resolveSolidBlockSideCollision(sideState, previousSideBody, solidBlocks, currentSideBody)?.side,
  'left'
);
assert.equal(sideState.velocityX, 0);
assert.equal(sideState.footX, 3.2);

const surfaces = activeCourseSurfaces(MEADOW_WAKE_PLATFORMS, [
  ...solidBlocks,
  { ...solidBlocks[0], id: 'broken', broken: true }
]);
assert.ok(surfaces.some(surface => surface.id === 'solid'));
assert.ok(!surfaces.some(surface => surface.id === 'broken'));

const instantiated = createMeadowWakeBlocks(() => 8);
assert.equal(instantiated.length, MEADOW_WAKE_BLOCK_DEFINITIONS.length);
assert.ok(instantiated.every(block => block.broken === false));
assert.ok(instantiated.some(block => block.type === 'hargold-only'));

console.log('Meadow Wake platform and block runtime checks passed.');
