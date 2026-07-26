import {
  applyMovementLanding
} from '../movement/unified-character-controller.js';
import {
  resolveExternalHeadHit,
  resolveExternalWallHit,
  transportWithSupport
} from '../movement/movement-collision-resolver.js';

const CONTACT_EPSILON = 0.035;
const BLOCK_BUMP_SECONDS = 0.18;
const BLOCK_FLASH_SECONDS = 0.16;

function registerBlockImpact(block, kind, { bumpSeconds = BLOCK_BUMP_SECONDS } = {}) {
  block.impactSerial = (block.impactSerial ?? 0) + 1;
  block.impactKind = kind;
  block.bumpDuration = bumpSeconds;
  block.bumpSeconds = bumpSeconds;
  block.flashSeconds = BLOCK_FLASH_SECONDS;
}

function standardBreakStrength(state) {
  if (Number.isFinite(state.blockBreakStrength)) return state.blockBreakStrength;
  return state.hero === 'Hargold' ? 1 : 0;
}

export function platformTop(platform, x = platform.x) {
  const seesawOffset = platform.motion?.type === 'seesaw'
    ? Math.tan(platform.angle ?? 0) * (x - platform.x)
    : 0;
  return platform.y - platform.height / 2 + seesawOffset;
}

export function activeCourseSurfaces(platforms, blocks) {
  return [
    ...platforms,
    ...blocks
      .filter(block => !block.broken && (!block.hidden || block.revealed))
      .map(block => ({ ...block, oneWay: true }))
  ];
}

export function bodyOverlapsHorizontal(body, obstacle, inset = 0.02) {
  const obstacleLeft = obstacle.x - obstacle.width / 2 + inset;
  const obstacleRight = obstacle.x + obstacle.width / 2 - inset;
  return body.x + body.width > obstacleLeft && body.x < obstacleRight;
}

export function supportHeightAt(state, x, terrainHeightAt, platforms) {
  if (state.supportPlatformId) {
    const support = platforms.find(platform => platform.id === state.supportPlatformId);
    const halfWidth = support?.width / 2 ?? 0;
    if (support && x >= support.x - halfWidth && x <= support.x + halfWidth) {
      return platformTop(support, x);
    }
    state.supportPlatformId = null;
  }
  return terrainHeightAt(x);
}

export function resolveOneWayPlatformLanding(state, previousFootY, platforms, body) {
  if (state.velocityY < 0) return null;
  const currentFootY = state.footY;
  let landing = null;
  for (const platform of platforms) {
    if (
      state.dropThroughSeconds > 0 &&
      state.dropThroughPlatformId === platform.id
    ) continue;
    if (!platform.oneWay || !bodyOverlapsHorizontal(body, platform)) continue;
    const landingX = Math.max(
      platform.x - platform.width / 2,
      Math.min(platform.x + platform.width / 2, state.footX)
    );
    const top = platformTop(platform, landingX);
    const crossedTop = previousFootY <= top + CONTACT_EPSILON && currentFootY >= top;
    if (!crossedTop) continue;
    if (!landing || top < platformTop(landing, landingX)) landing = platform;
  }
  if (!landing) return null;

  applyMovementLanding(state, {
    footY: platformTop(landing, state.footX),
    platformId: landing.id,
    landingSpeed: state.velocityY,
    surface: {
      angle: landing.angle ?? 0,
      material: landing.surfaceMaterial ?? 'normal'
    }
  });
  return { type: 'platform-landed', platformId: landing.id };
}

export function resolveBlockHeadHit(state, previousHeadY, blocks, body) {
  if (state.velocityY >= 0) return null;
  const currentHeadY = body.y;
  for (const block of blocks) {
    if (block.broken || !bodyOverlapsHorizontal(body, block, 0)) continue;
    const underside = block.y + block.height / 2;
    const crossedUnderside = previousHeadY >= underside - CONTACT_EPSILON &&
      currentHeadY <= underside + CONTACT_EPSILON;
    if (!crossedUnderside) continue;

    const requiredStrength = block.requiredStrength ?? 1;
    const canBreakStandard = block.type === 'standard-breakable' &&
      standardBreakStrength(state) >= requiredStrength;
    const canBreakHargold = block.type === 'hargold-only' && state.hero === 'Hargold';
    const canBreak = canBreakStandard || canBreakHargold;
    const rewardType = !block.consumed && block.type === 'coin'
      ? 'block-coin'
      : !block.consumed && block.type === 'power-up'
        ? 'block-power-up'
        : null;
    block.broken = canBreak;
    block.revealed = true;
    if (rewardType) block.consumed = true;
    const rejectedType = block.type === 'standard-breakable'
      ? 'block-too-strong'
      : block.type === 'hargold-only'
        ? 'block-rejected'
        : 'block-used';
    const eventType = canBreak
      ? 'block-broken'
      : rewardType ?? rejectedType;
    registerBlockImpact(
      block,
      canBreak
        ? 'break'
        : rewardType
          ? block.type === 'coin'
            ? 'coin-reward'
            : 'power-reward'
          : eventType === 'block-used'
            ? 'used-hit'
            : 'heavy-hit',
      { bumpSeconds: canBreak ? 0.2 : 0.16 }
    );
    resolveExternalHeadHit(state, {
      footY: underside + body.height,
      reboundSpeed: 0.8,
      blockId: block.id
    });
    return {
      type: eventType,
      blockId: block.id,
      blockType: block.type,
      hero: state.hero,
      impactSerial: block.impactSerial,
      reward: rewardType === 'block-coin'
        ? (block.reward ?? 1)
        : rewardType === 'block-power-up'
          ? (block.reward ?? 'health-layer')
          : null
    };
  }
  return null;
}

export function resolveSolidBlockSideCollision(state, previousBody, blocks, body) {
  for (const block of blocks) {
    if (block.broken || (block.hidden && !block.revealed)) continue;
    const left = block.x - block.width / 2;
    const right = block.x + block.width / 2;
    const top = block.y - block.height / 2;
    const bottom = block.y + block.height / 2;
    const verticalOverlap = body.y < bottom && body.y + body.height > top;
    if (!verticalOverlap) continue;

    if (previousBody.x + previousBody.width <= left + CONTACT_EPSILON && body.x + body.width > left) {
      resolveExternalWallHit(state, {
        side: 'left',
        footX: left - body.width / 2,
        obstacleId: block.id
      });
      return { type: 'block-side-contact', blockId: block.id, side: 'left' };
    }
    if (previousBody.x >= right - CONTACT_EPSILON && body.x < right) {
      resolveExternalWallHit(state, {
        side: 'right',
        footX: right + body.width / 2,
        obstacleId: block.id
      });
      return { type: 'block-side-contact', blockId: block.id, side: 'right' };
    }
  }
  return null;
}

export function breakBlocksWithRollingShell(shellBody, blocks) {
  const broken = [];
  for (const block of blocks) {
    if (block.broken || block.type !== 'standard-breakable') continue;
    const blockBody = {
      x: block.x - block.width / 2,
      y: block.y - block.height / 2,
      width: block.width,
      height: block.height
    };
    const overlaps = shellBody.x < blockBody.x + blockBody.width &&
      shellBody.x + shellBody.width > blockBody.x &&
      shellBody.y < blockBody.y + blockBody.height &&
      shellBody.y + shellBody.height > blockBody.y;
    if (!overlaps) continue;
    block.broken = true;
    registerBlockImpact(block, 'shell-break', { bumpSeconds: 0.2 });
    broken.push(block.id);
  }
  return broken;
}

export function stepBlockFeedback(blocks, deltaSeconds) {
  for (const block of blocks) {
    block.bumpSeconds = Math.max(0, block.bumpSeconds - deltaSeconds);
    block.flashSeconds = Math.max(0, (block.flashSeconds ?? 0) - deltaSeconds);
  }
}

function resetPlatform(platform) {
  platform.x = platform.baseX;
  platform.y = platform.baseY;
  platform.previousX = platform.baseX;
  platform.previousY = platform.baseY;
  platform.velocityY = 0;
  platform.elapsed = 0;
  platform.angle = 0;
  platform.fallState = 'idle';
  platform.fallSeconds = 0;
}

export function resetCoursePlatforms(platforms) {
  for (const platform of platforms) resetPlatform(platform);
}

export function stepCoursePlatforms(
  platforms,
  deltaSeconds,
  { supportPlatformId = null, riderX = 0 } = {}
) {
  for (const platform of platforms) {
    platform.previousX = platform.x;
    platform.previousY = platform.y;
    platform.elapsed += deltaSeconds;
    const motion = platform.motion;
    if (!motion) continue;

    const phase = motion.phase ?? 0;
    if (motion.type === 'horizontal') {
      platform.x = platform.baseX +
        Math.sin(platform.elapsed * motion.speed + phase) * motion.range;
    } else if (motion.type === 'vertical') {
      platform.y = platform.baseY +
        Math.sin(platform.elapsed * motion.speed + phase) * motion.range;
    } else if (motion.type === 'orbit') {
      platform.x = platform.baseX +
        Math.cos(platform.elapsed * motion.speed + phase) * motion.radiusX;
      platform.y = platform.baseY +
        Math.sin(platform.elapsed * motion.speed + phase) * motion.radiusY;
    } else if (motion.type === 'seesaw') {
      const riderIsOnPlatform = supportPlatformId === platform.id;
      const normalizedOffset = riderIsOnPlatform
        ? Math.max(-1, Math.min(1, (riderX - platform.x) / (platform.width / 2)))
        : 0;
      const targetAngle = normalizedOffset * motion.maxAngle;
      const response = 1 - Math.exp(-motion.response * deltaSeconds);
      platform.angle += (targetAngle - platform.angle) * response;
    } else if (motion.type === 'falling') {
      if (supportPlatformId === platform.id && platform.fallState === 'idle') {
        platform.fallState = 'armed';
        platform.fallSeconds = 0;
      }
      if (platform.fallState !== 'idle') platform.fallSeconds += deltaSeconds;
      if (
        platform.fallState === 'armed' &&
        platform.fallSeconds >= motion.triggerDelay
      ) {
        platform.fallState = 'falling';
        platform.velocityY = 0;
      }
      if (platform.fallState === 'falling') {
        platform.velocityY += motion.gravity * deltaSeconds;
        platform.y += platform.velocityY * deltaSeconds;
      }
      if (
        platform.fallState === 'falling' &&
        platform.fallSeconds >= motion.triggerDelay + motion.resetDelay
      ) {
        resetPlatform(platform);
      }
    }
  }
}

export function transportRiderWithPlatform(state, platforms, deltaSeconds = 1 / 120) {
  if (!state.supportPlatformId || !state.grounded) return false;
  const platform = platforms.find(item => item.id === state.supportPlatformId);
  if (!platform) return false;

  const deltaX = platform.x - platform.previousX;
  transportWithSupport(
    state,
    deltaX,
    platformTop(platform, state.footX + deltaX),
    platform.id,
    {
      velocityX: deltaX / deltaSeconds,
      velocityY: (platform.y - platform.previousY) / deltaSeconds
    }
  );
  return deltaX !== 0 || platform.y !== platform.previousY || platform.angle !== 0;
}
