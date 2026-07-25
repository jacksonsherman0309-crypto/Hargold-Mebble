const CONTACT_EPSILON = 0.035;

export function platformTop(platform) {
  return platform.y - platform.height / 2;
}

export function activeCourseSurfaces(platforms, blocks) {
  return [
    ...platforms,
    ...blocks
      .filter(block => !block.broken)
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
      return platformTop(support);
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
    const top = platformTop(platform);
    const crossedTop = previousFootY <= top + CONTACT_EPSILON && currentFootY >= top;
    if (!crossedTop) continue;
    if (!landing || top < platformTop(landing)) landing = platform;
  }
  if (!landing) return null;

  state.footY = platformTop(landing);
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
    block.broken = canBreak;
    block.bumpSeconds = canBreak ? 0.18 : 0.12;
    state.footY = underside + body.height;
    state.velocityY = Math.max(0.8, Math.abs(state.velocityY) * 0.08);
    state.grounded = false;
    state.supportPlatformId = null;
    state.locomotion = 'fall';
    return {
      type: canBreak ? 'block-broken' : 'block-rejected',
      blockId: block.id,
      blockType: block.type,
      hero: state.hero
    };
  }
  return null;
}

export function resolveSolidBlockSideCollision(state, previousBody, blocks, body) {
  for (const block of blocks) {
    if (block.broken) continue;
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
