const CONTACT_EPSILON = 0.035;

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

  state.footY = platformTop(landing, state.footX);
  state.velocityY = 0;
  state.grounded = true;
  state.supportPlatformId = landing.id;
  state.doubleJumpUsed = false;
  state.groundSlamming = false;
  state.glide = 'closed';
  state.locomotion = 'land-soft';
  state.stateSeconds = 0;
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

    const canBreak = block.type === 'standard-breakable' ||
      (block.type === 'hargold-only' && state.hero === 'Hargold');
    const rewardType = !block.consumed && block.type === 'coin'
      ? 'block-coin'
      : !block.consumed && block.type === 'power-up'
        ? 'block-power-up'
        : null;
    block.broken = canBreak;
    block.revealed = true;
    block.bumpSeconds = canBreak ? 0.18 : 0.14;
    if (rewardType) block.consumed = true;
    state.footY = underside + body.height;
    state.velocityY = Math.max(0.8, Math.abs(state.velocityY) * 0.08);
    state.grounded = false;
    state.supportPlatformId = null;
    state.locomotion = 'fall';
    return {
      type: canBreak
        ? 'block-broken'
        : rewardType ?? (block.consumed ? 'block-used' : 'block-rejected'),
      blockId: block.id,
      blockType: block.type,
      hero: state.hero,
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
      state.footX = left - body.width / 2;
      state.velocityX = 0;
      return { type: 'block-side-contact', blockId: block.id, side: 'left' };
    }
    if (previousBody.x >= right - CONTACT_EPSILON && body.x < right) {
      state.footX = right + body.width / 2;
      state.velocityX = 0;
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
    block.bumpSeconds = 0.18;
    broken.push(block.id);
  }
  return broken;
}

export function stepBlockFeedback(blocks, deltaSeconds) {
  for (const block of blocks) {
    block.bumpSeconds = Math.max(0, block.bumpSeconds - deltaSeconds);
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

export function transportRiderWithPlatform(state, platforms) {
  if (!state.supportPlatformId || !state.grounded) return false;
  const platform = platforms.find(item => item.id === state.supportPlatformId);
  if (!platform) return false;

  const deltaX = platform.x - platform.previousX;
  state.footX += deltaX;
  state.footY = platformTop(platform, state.footX);
  return deltaX !== 0 || platform.y !== platform.previousY || platform.angle !== 0;
}
