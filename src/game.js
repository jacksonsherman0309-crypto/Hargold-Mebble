import { CharacterRenderer } from './character-renderer.js?v=readability-pass-1';
import {
  MEADOW_WAKE_ENEMY_ACTORS,
  MEADOW_WAKE_LEVEL_DATA
} from './content/meadow-wake-level-data.js?v=level-foundation-1';
import { getCourseEnemyRoster } from './content/world-enemy-rosters.js?v=world-mobs-1';
import {
  MEADOW_WAKE_PITS,
  MEADOW_WAKE_TERRAIN_POINTS,
  createMeadowWakeBlocks,
  createMeadowWakeCoins,
  createMeadowWakeCompassCoins,
  createMeadowWakePlatforms
} from './content/meadow-wake-course.js?v=meadow-rooms-6';
import {
  attackMob,
  createMob,
  createProjectile,
  defeatMob,
  stepMob,
  stepProjectile,
  stompMob
} from './gameplay/enemies/mob-simulation.js?v=world-mobs-1';
import {
  activeCourseSurfaces,
  breakBlocksWithRollingShell,
  resolveBlockHeadHit,
  resolveOneWayPlatformLanding,
  resolveSolidBlockSideCollision,
  resetCoursePlatforms,
  stepBlockFeedback,
  stepCoursePlatforms,
  transportRiderWithPlatform,
  supportHeightAt
} from './gameplay/levels/platform-block-runtime.js?v=block-production-1';
import { createActorActivationRuntime } from './gameplay/levels/actor-activation-runtime.js?v=level-foundation-1';
import { HERO_PROFILES } from './gameplay/movement/hero-profiles.js?v=unified-motion-2';
import { createMovementInputBuffer } from './gameplay/movement/movement-input-buffer.js?v=unified-motion-2';
import { MOVEMENT_STATES } from './gameplay/movement/movement-state-machine.js?v=unified-motion-2';
import {
  applyMovementBounce,
  applyMovementDamage,
  createUnifiedCharacterState,
  movementBody,
  setMovementForcedState,
  stepUnifiedCharacterController,
  trySwapUnifiedHero
} from './gameplay/movement/unified-character-controller.js?v=unified-motion-2';
import { leaveExternalSupport } from './gameplay/movement/movement-collision-resolver.js?v=unified-motion-2';
import { clamp } from './runtime/math.js';
import { FixedStepLoop } from './runtime/fixed-step.js';
import { fatalHazardEvent } from './runtime/hazards/fatal-hazards.js';
import { createLinearGround } from './runtime/terrain/linear-ground.js';
import { AnimationDebugPanel } from './animation/animation-debug-panel.js?v=meshy-rigs-1';

/*
 * Browser game integration. Physics is owned by the unified controller under
 * src/gameplay/movement; this file supplies course, combat, camera, and input
 * adapters only.
 */

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const status = document.querySelector('#status');
const W = canvas.width;
const H = canvas.height;
const SCALE = 70;
const WORLD_END = MEADOW_WAKE_LEVEL_DATA.bounds.maxX;
const keys = new Set();
const touch = {
  left: false,
  right: false,
  jump: false,
  slam: false,
  action: false,
  swap: false
};
const loop = new FixedStepLoop({ hz: 120 });
const inputBuffer = createMovementInputBuffer();
const runtimeParameters = new URLSearchParams(location.search);
const movementDebugEnabled = runtimeParameters.has('debugMovement');
const animationDebugEnabled = runtimeParameters.has('debugAnimation');
const animationDebugDrive = runtimeParameters.get('debugDrive');
const requestedArtPreviewX = Number(runtimeParameters.get('artPreview'));
const initialCourseX = Number.isFinite(requestedArtPreviewX)
  ? clamp(requestedArtPreviewX, 1.8, WORLD_END - 1)
  : 1.8;
let characterLoadStatus = 'Loading 3D characters...';
const characterRenderer = new CharacterRenderer({
  mount: canvas.parentElement,
  width: W,
  height: H,
  onProgress(message) {
    characterLoadStatus = message;
  }
});
let animationDebugPanel = null;

const terrain = createLinearGround(MEADOW_WAKE_TERRAIN_POINTS);
const pits = MEADOW_WAKE_PITS;
const coins = createMeadowWakeCoins(x => terrain.heightAt(x));
const compassCoins = createMeadowWakeCompassCoins();
const checkpoint = { x: 70.5, reached: false };
const platforms = createMeadowWakePlatforms();
const blocks = createMeadowWakeBlocks(x => terrain.heightAt(x));
const COURSE_ID = MEADOW_WAKE_LEVEL_DATA.id;
const COURSE_NAME = MEADOW_WAKE_LEVEL_DATA.name;
const COURSE_ROSTER = getCourseEnemyRoster(COURSE_ID);

let player = createUnifiedCharacterState({
  footX: initialCourseX,
  footY: terrain.heightAt(initialCourseX)
});
let cameraX = 0;
let cameraY = 0;
let lastFrame = performance.now();
let session = createSession(initialCourseX);
let mobs = [];
let mobActivation = createCourseMobActivation();
let projectiles = [];
let notice = 'Meadow Wake: stomp Critters; stomp then kick Shellbacks.';
let noticeSeconds = 5;

function createSession(spawnX = 1.8) {
  return {
    healthLayers: 1,
    maximumHealthLayers: 1,
    lives: 3,
    standardCoins: 0,
    compass: 0,
    state: 'playing',
    spawnX,
    invulnerabilitySeconds: 0,
    attackSeconds: 0,
    enemiesDefeated: 0,
    doubleJumpUnlocked: false
  };
}

function createMobFromActor(placement) {
    const parameters = placement.parameters;
    const type = parameters.enemyType;
    if (!COURSE_ROSTER.includes(type)) {
      throw new Error(`${type} does not belong to ${COURSE_ID}`);
    }
    const mob = createMob({
      id: placement.id,
      type,
      x: placement.position.x,
      direction: -1
    });
    mob.y = groundHeightAt(mob.x);
    mob.previousY = mob.y;
    mob.spawnX = placement.position.x;
    mob.patrolFrom = parameters.patrolFrom;
    mob.patrolTo = parameters.patrolTo;
    mob.activated = false;
    return mob;
}

function createCourseMobActivation() {
  return createActorActivationRuntime(MEADOW_WAKE_ENEMY_ACTORS, {
    spawn(placement) {
      const mob = createMobFromActor(placement);
      mobs.push(mob);
      return mob;
    },
    activate(mob) {
      mob.activated = true;
    },
    sleep(mob) {
      mob.activated = false;
    },
    despawn(mob) {
      const index = mobs.indexOf(mob);
      if (index >= 0) mobs.splice(index, 1);
    }
  });
}

function updateCourseMobActivation() {
  const minX = Math.max(0, cameraX / SCALE);
  const maxX = Math.min(WORLD_END, (cameraX + W) / SCALE);
  mobActivation.update({
    cameraBounds: { minX, maxX },
    scrollDirection: Math.sign(player.velocityX) || player.facing
  });
}

function inPit(x) {
  return pits.some(pit => x > pit.from && x < pit.to);
}

function groundHeightAt(x) {
  return inPit(x) ? 20 : terrain.heightAt(x);
}

function terrainMaterialAt(x) {
  const regions = MEADOW_WAKE_LEVEL_DATA.terrainGeometry.materialRegions;
  for (let index = regions.length - 1; index >= 0; index -= 1) {
    const region = regions[index];
    if (x >= region.from && x <= region.to) return region.material;
  }
  return 'normal';
}

function readGamepadSnapshot() {
  const gamepad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
  if (!gamepad) return {};
  const horizontal = gamepad.axes[0] ?? 0;
  const vertical = gamepad.axes[1] ?? 0;
  const pressed = index => Boolean(gamepad.buttons[index]?.pressed);
  return {
    left: horizontal < -0.35 || pressed(14),
    right: horizontal > 0.35 || pressed(15),
    jump: pressed(0),
    down: vertical > 0.5 || pressed(13),
    action: pressed(1),
    swap: pressed(4),
    pause: pressed(9)
  };
}

function rawInputSnapshot() {
  const gamepad = readGamepadSnapshot();
  return {
    left: keys.has('ArrowLeft') || keys.has('KeyA') || touch.left || gamepad.left ||
      animationDebugDrive === 'left' &&
        characterRenderer.isReady(player.hero) &&
        !characterRenderer.animationDebugOverride,
    right: keys.has('ArrowRight') || keys.has('KeyD') || touch.right || gamepad.right ||
      animationDebugDrive === 'right' &&
        characterRenderer.isReady(player.hero) &&
        !characterRenderer.animationDebugOverride,
    jump: keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW') ||
      touch.jump || gamepad.jump,
    down: keys.has('ArrowDown') || keys.has('KeyS') || touch.slam || gamepad.down,
    action: keys.has('KeyE') || touch.action || gamepad.action,
    swap: keys.has('KeyQ') || touch.swap || gamepad.swap,
    pause: keys.has('Escape') || gamepad.pause
  };
}

function canOccupy(candidate) {
  if (candidate.x < 0 || candidate.x + candidate.width > WORLD_END) return false;
  const lowOverhang = candidate.x < 14.6 && candidate.x + candidate.width > 13.2;
  if (lowOverhang && candidate.height > HERO_PROFILES.Hargold.height) return false;
  return !blocks.some(block => {
    if (block.broken || (block.hidden && !block.revealed)) return false;
    const blockBody = {
      x: block.x - block.width / 2,
      y: block.y - block.height / 2,
      width: block.width,
      height: block.height
    };
    return overlaps(candidate, blockBody);
  });
}

function swapPlayer() {
  if (session.state !== 'playing') return;
  const result = trySwapUnifiedHero(player, { canOccupy });
  notice = result.accepted
    ? `${result.hero} active — feet and momentum preserved.`
    : 'Swap blocked: Mebble cannot safely fit here.';
  noticeSeconds = 2.2;
}

function respawn() {
  resetCoursePlatforms(platforms);
  player = createUnifiedCharacterState({
    hero: player.hero,
    footX: session.spawnX,
    footY: terrain.heightAt(session.spawnX),
    doubleJumpUnlocked: session.doubleJumpUnlocked
  });
  session.healthLayers = session.maximumHealthLayers;
  session.invulnerabilitySeconds = 1;
  session.attackSeconds = 0;
  inputBuffer.reset();
  projectiles = [];
  mobActivation.reset();
  mobs = [];
  mobActivation = createCourseMobActivation();
}

function loseLife(hazardType) {
  if (session.state !== 'playing') return;
  const event = fatalHazardEvent(hazardType);
  session.lives = Math.max(0, session.lives - 1);
  notice = `${event.hazardType.toUpperCase()}: life lost; health protection bypassed.`;
  noticeSeconds = 3;
  if (session.lives === 0) {
    session.state = 'game-over';
    setMovementForcedState(player, MOVEMENT_STATES.DEAD);
    return;
  }
  respawn();
}

function damagePlayer(source, direction = 1) {
  if (session.state !== 'playing' || session.invulnerabilitySeconds > 0) return false;
  session.healthLayers = Math.max(0, session.healthLayers - 1);
  if (session.healthLayers === 0) {
    session.lives = Math.max(0, session.lives - 1);
    notice = `${source}: health depleted; one life lost.`;
    noticeSeconds = 2.5;
    if (session.lives === 0) {
      session.state = 'game-over';
      setMovementForcedState(player, MOVEMENT_STATES.DEAD);
    } else {
      respawn();
    }
  } else {
    applyMovementDamage(player, direction);
    session.invulnerabilitySeconds = 0.8;
    notice = `${source}: one health layer lost.`;
    noticeSeconds = 1.8;
  }
  return true;
}

function restartCourse() {
  session = createSession();
  checkpoint.reached = false;
  for (const item of [...coins, ...compassCoins]) item.taken = false;
  for (const block of blocks) {
    block.broken = false;
    block.consumed = false;
    block.revealed = !block.hidden;
    block.bumpSeconds = 0;
    block.bumpDuration = 0;
    block.flashSeconds = 0;
    block.impactSerial = 0;
    block.impactKind = 'idle';
  }
  resetCoursePlatforms(platforms);
  player = createUnifiedCharacterState({
    footX: session.spawnX,
    footY: terrain.heightAt(session.spawnX),
    doubleJumpUnlocked: session.doubleJumpUnlocked
  });
  mobActivation.reset({ preservePersistentComplete: false });
  mobs = [];
  mobActivation = createCourseMobActivation();
  projectiles = [];
  inputBuffer.reset();
  notice = 'Course restarted with the Meadow Wake mob roster.';
  noticeSeconds = 2;
}

function awardStandardCoins(amount) {
  session.standardCoins += amount;
  while (session.standardCoins >= 100) {
    session.standardCoins -= 100;
    session.lives = Math.min(99, session.lives + 1);
    notice = '100 trail coins earned one life.';
    noticeSeconds = 2.2;
  }
}

function collectItems() {
  for (const coin of coins) {
    if (!coin.taken && Math.hypot(player.footX - coin.x, player.footY - coin.y) < 0.55) {
      coin.taken = true;
      awardStandardCoins(1);
    }
  }
  for (const coin of compassCoins) {
    if (!coin.taken && Math.hypot(player.footX - coin.x, player.footY - coin.y) < 0.65) {
      coin.taken = true;
      session.compass += 1;
      notice = `Compass Coin ${session.compass}/3 collected.`;
      noticeSeconds = 2;
    }
  }
}

function overlaps(left, right) {
  return left.x < right.x + right.width && left.x + left.width > right.x &&
    left.y < right.y + right.height && left.y + left.height > right.y;
}

function mobBody(mob) {
  return {
    x: mob.x - mob.width / 2,
    y: mob.y - mob.height,
    width: mob.width,
    height: mob.height
  };
}

function activeBlockAtPoint(point) {
  return blocks.find(block => {
    if (block.broken || (block.hidden && !block.revealed)) return false;
    return point.x >= block.x - block.width / 2 &&
      point.x <= block.x + block.width / 2 &&
      point.y >= block.y - block.height / 2 &&
      point.y <= block.y + block.height / 2;
  }) ?? null;
}

function sensorSurfaceAtPoint(point, activeSurfaces, predicate = () => true) {
  const tolerance = 0.12;
  return activeSurfaces.find(surface =>
    predicate(surface) &&
    point.x >= surface.x - surface.width / 2 &&
    point.x <= surface.x + surface.width / 2 &&
    Math.abs(point.y - (surface.y - surface.height / 2)) <= tolerance
  ) ?? null;
}

function defeatForPlayer(mob) {
  if (!mob.alive) return;
  defeatMob(mob);
  session.enemiesDefeated += 1;
  notice = `${mob.type.replaceAll('_', ' ')} defeated.`;
  noticeSeconds = 1.2;
}

function updateCombat(input, previousPlayerFootY, dt) {
  session.invulnerabilitySeconds = Math.max(0, session.invulnerabilitySeconds - dt);
  session.attackSeconds = Math.max(0, session.attackSeconds - dt);
  if (input.actionPressed && (player.grounded || player.hero === 'Hargold')) {
    session.attackSeconds = player.hero === 'Hargold' ? 0.28 : 0.22;
  }

  const playerBody = movementBody(player);
  const target = { x: player.footX, y: player.footY - playerBody.height * 0.55 };
  for (const mob of mobs) {
    if (!mob.activated) continue;
    const events = stepMob(mob, dt, {
      groundHeightAt,
      hasGroundAhead: x => !inPit(x),
      minimumX: mob.state === 'shell-roll' ? 0.7 : mob.patrolFrom,
      maximumX: mob.state === 'shell-roll' ? WORLD_END - 0.7 : mob.patrolTo,
      target
    });
    for (const event of events) {
      if (event.type === 'projectile-fired') projectiles.push(createProjectile(event.projectile));
    }
    if (!mob.alive) continue;
    const body = mobBody(mob);

    if (session.attackSeconds > 0) {
      const attackReach = player.hero === 'Hargold' ? 1.35 : 1.05;
      const inFront = (mob.x - player.footX) * player.facing >= -0.15;
      const verticalOverlap = playerBody.y < body.y + body.height && playerBody.y + playerBody.height > body.y;
      if (inFront && verticalOverlap && Math.abs(mob.x - player.footX) <= attackReach) {
        const result = attackMob(mob, { direction: player.facing });
        if (result.outcome === 'defeat') {
          session.enemiesDefeated += 1;
          notice = `${mob.type.replaceAll('_', ' ')} defeated.`;
          noticeSeconds = 1.2;
        } else if (result.outcome === 'shell-launched') {
          notice = 'Shellback launched — it can defeat other mobs.';
          noticeSeconds = 1.8;
        }
        session.attackSeconds = 0;
      }
    }

    if (!overlaps(playerBody, body) || !mob.damaging) continue;
    const mobTop = body.y;
    const stompedFromAbove = player.velocityY > 0 &&
      previousPlayerFootY <= mobTop + 0.16 &&
      player.footY >= mobTop;
    if (stompedFromAbove) {
      const result = stompMob(mob);
      if (result.outcome === 'damage-player') {
        damagePlayer('Unsafe spiked stomp', player.footX < mob.x ? -1 : 1);
      } else {
        const wasGroundSlamming = player.groundSlamming;
        player.footY = mobTop;
        applyMovementBounce(player, {
          kind: 'enemy',
          jumpHeld: input.jumpHeld,
          strong: wasGroundSlamming
        });
        if (result.outcome === 'defeat') {
          session.enemiesDefeated += 1;
          notice = `${mob.type.replaceAll('_', ' ')} stomped.`;
        } else {
          notice = result.outcome === 'shell-retracted'
            ? 'Shellback retracted. Press Action beside it to kick.'
            : 'Rolling Shellback stopped.';
        }
        noticeSeconds = 1.8;
      }
    } else if (!(mob.type === 'shellback' && mob.state === 'shell-roll' && mob.launchGraceSeconds > 0)) {
      damagePlayer('Enemy contact', player.footX < mob.x ? -1 : 1);
    }
  }

  for (const shell of mobs) {
    if (!shell.alive || shell.type !== 'shellback' || shell.state !== 'shell-roll') continue;
    const shellBody = mobBody(shell);
    const shellBrokenBlocks = breakBlocksWithRollingShell(shellBody, blocks);
    if (shellBrokenBlocks.length) {
      notice = `Rolling Shellback smashed ${shellBrokenBlocks.length} breakable block${shellBrokenBlocks.length === 1 ? '' : 's'}.`;
      noticeSeconds = 1.8;
    }
    for (const targetMob of mobs) {
      if (targetMob === shell || !targetMob.alive) continue;
      if (overlaps(shellBody, mobBody(targetMob))) {
        defeatForPlayer(targetMob);
        shell.direction *= -1;
      }
    }
  }

  for (const projectile of projectiles) {
    stepProjectile(projectile, dt, {
      terrainCollision: shot => shot.y >= groundHeightAt(shot.x) || shot.x < 0 || shot.x > WORLD_END
    });
    if (!projectile.alive) continue;
    const projectileBody = {
      x: projectile.x - projectile.radius,
      y: projectile.y - projectile.radius,
      width: projectile.radius * 2,
      height: projectile.radius * 2
    };
    if (overlaps(playerBody, projectileBody)) {
      projectile.alive = false;
      damagePlayer('Enemy projectile', projectile.velocityX < 0 ? -1 : 1);
    }
  }
  projectiles = projectiles.filter(projectile => projectile.alive);
}

function fixedUpdate(dt) {
  if (session.state !== 'playing') return;
  const input = inputBuffer.consumeStep();
  if (input.swapPressed) swapPlayer();
  stepCoursePlatforms(platforms, dt, {
    supportPlatformId: player.supportPlatformId,
    riderX: player.footX
  });
  transportRiderWithPlatform(player, platforms, dt);
  const previousPlayerFootY = player.footY;
  const previousPlayerBody = movementBody(player);
  const previousHeadY = previousPlayerBody.y;
  const previousSupportPlatformId = player.supportPlatformId;
  const activeSurfaces = activeCourseSurfaces(platforms, blocks);
  updateCourseMobActivation();
  stepUnifiedCharacterController(player, input, dt, {
    groundHeightAt: x => supportHeightAt(player, x, groundHeightAt, activeSurfaces),
    hasGroundAt: x => !inPit(x) || Boolean(
      player.supportPlatformId &&
      activeSurfaces.some(surface =>
        surface.id === player.supportPlatformId &&
        x >= surface.x - surface.width / 2 &&
        x <= surface.x + surface.width / 2
      )
    ),
    surfaceAt: x => {
      const angle = terrain.angleAt(x);
      return {
        angle,
        normal: { x: Math.sin(angle), y: -Math.cos(angle) },
        material: terrainMaterialAt(x)
      };
    },
    wallAt: point => {
      const block = activeBlockAtPoint(point);
      if (block) return { id: block.id, material: block.type };
      if (point.x <= 0.8 || point.x >= WORLD_END) return { id: 'course-boundary' };
      return null;
    },
    headAt: point => {
      const block = activeBlockAtPoint(point);
      return block ? { id: block.id, material: block.type } : null;
    },
    semisolidAt: point => {
      const surface = sensorSurfaceAtPoint(point, activeSurfaces, candidate => candidate.oneWay);
      return surface ? { id: surface.id, top: surface.y - surface.height / 2 } : null;
    },
    movingPlatformAt: point => {
      const surface = sensorSurfaceAtPoint(
        point,
        activeSurfaces,
        candidate => Boolean(candidate.motion)
      );
      return surface
        ? {
            id: surface.id,
            velocityX: surface.velocityX ?? 0,
            velocityY: surface.velocityY ?? 0
          }
        : null;
    },
    minimumX: 0.8,
    maximumX: WORLD_END,
    doubleJumpUnlocked: session.doubleJumpUnlocked
  });
  if (previousSupportPlatformId && !player.supportPlatformId && player.grounded) {
    player.footY = previousPlayerFootY;
    leaveExternalSupport(player, { downwardSpeed: 0.2 });
  }
  if (!player.grounded) {
    resolveOneWayPlatformLanding(player, previousPlayerFootY, activeSurfaces, movementBody(player));
  }
  player.blockBreakStrength = player.hero === 'Hargold' || session.healthLayers > 1 ? 1 : 0;
  const blockEvent = resolveBlockHeadHit(player, previousHeadY, blocks, movementBody(player));
  if (blockEvent?.type === 'block-broken') {
    notice = blockEvent.blockType === 'hargold-only'
      ? 'Hargold broke the reinforced explorer block.'
      : 'Breakable block smashed.';
    noticeSeconds = 1.5;
  } else if (blockEvent?.type === 'block-rejected') {
    notice = 'That reinforced block requires Hargold.';
    noticeSeconds = 1.8;
  } else if (blockEvent?.type === 'block-too-strong') {
    notice = 'This stonework needs explorer strength or a rolling Shellback.';
    noticeSeconds = 1.8;
  } else if (blockEvent?.type === 'block-coin') {
    awardStandardCoins(blockEvent.reward);
    notice = `${blockEvent.reward} trail coin${blockEvent.reward === 1 ? '' : 's'} released.`;
    noticeSeconds = 1.3;
  } else if (blockEvent?.type === 'block-power-up') {
    session.maximumHealthLayers = Math.max(2, session.maximumHealthLayers);
    session.healthLayers = session.maximumHealthLayers;
    notice = 'Explorer protection restored.';
    noticeSeconds = 1.8;
  }
  if (!blockEvent) {
    resolveSolidBlockSideCollision(player, previousPlayerBody, blocks, movementBody(player));
  }
  stepBlockFeedback(blocks, dt);
  collectItems();
  updateCombat(input, previousPlayerFootY, dt);

  if (!checkpoint.reached && player.footX >= checkpoint.x) {
    checkpoint.reached = true;
    session.spawnX = checkpoint.x;
    notice = 'Checkpoint reached.';
    noticeSeconds = 2.5;
  }
  if (player.footY > 11.5) loseLife('pit');
  if (player.footX >= WORLD_END - 0.75) {
    session.state = 'complete';
    setMovementForcedState(player, MOVEMENT_STATES.VICTORY);
    notice = 'Meadow Wake complete.';
    noticeSeconds = Infinity;
  }
}

function worldToScreenX(x) {
  return x * SCALE - cameraX;
}

function worldToScreenY(y) {
  return y * SCALE;
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#76c9e8');
  sky.addColorStop(0.72, '#d8edbd');
  sky.addColorStop(1, '#e7d398');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  for (let layer = 0; layer < 3; layer += 1) {
    ctx.fillStyle = ['#7fb777', '#639b62', '#497a4f'][layer];
    const parallax = cameraX * (0.08 + layer * 0.08);
    for (let x = -300; x < W + 400; x += 320) {
      ctx.beginPath();
      ctx.arc(x - (parallax % 320), 500 + layer * 45, 230 - layer * 30, Math.PI, 0);
      ctx.fill();
    }
  }
}

function drawTerrain() {
  ctx.fillStyle = '#294c31';
  ctx.beginPath();
  ctx.moveTo(worldToScreenX(0), H);
  ctx.lineTo(worldToScreenX(0), worldToScreenY(terrain.heightAt(0)));
  for (let x = 0; x <= WORLD_END; x += 0.12) {
    if (inPit(x)) {
      ctx.lineTo(worldToScreenX(x), H + 40);
    } else {
      ctx.lineTo(worldToScreenX(x), worldToScreenY(terrain.heightAt(x)));
    }
  }
  ctx.lineTo(worldToScreenX(WORLD_END), H);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#7eaa57';
  ctx.lineWidth = 12;
  ctx.beginPath();
  let drawing = false;
  for (let x = 0; x <= WORLD_END; x += 0.08) {
    if (inPit(x)) {
      drawing = false;
      continue;
    }
    const method = drawing ? 'lineTo' : 'moveTo';
    ctx[method](worldToScreenX(x), worldToScreenY(terrain.heightAt(x)));
    drawing = true;
  }
  ctx.stroke();

  const overhangX = worldToScreenX(13.2);
  ctx.fillStyle = '#6f644b';
  ctx.fillRect(overhangX, worldToScreenY(terrain.heightAt(13.9) - 3.45), 1.4 * SCALE, 18);
  ctx.fillStyle = '#a4c36a';
  ctx.fillRect(overhangX, worldToScreenY(terrain.heightAt(13.9) - 3.45), 1.4 * SCALE, 7);
}

function drawCollectibles() {
  for (const coin of coins) {
    if (coin.taken) continue;
    ctx.fillStyle = '#f6ca45';
    ctx.beginPath();
    ctx.ellipse(worldToScreenX(coin.x), worldToScreenY(coin.y), 9, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const coin of compassCoins) {
    if (coin.taken) continue;
    const x = worldToScreenX(coin.x);
    const y = worldToScreenY(coin.y);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffe06a';
    ctx.strokeStyle = '#9d6715';
    ctx.lineWidth = 4;
    ctx.fillRect(-16, -16, 32, 32);
    ctx.strokeRect(-16, -16, 32, 32);
    ctx.restore();
  }
}

function drawMarkers() {
  const cpX = worldToScreenX(checkpoint.x);
  const cpY = worldToScreenY(terrain.heightAt(checkpoint.x));
  ctx.strokeStyle = '#4a3524';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(cpX, cpY);
  ctx.lineTo(cpX, cpY - 115);
  ctx.stroke();
  ctx.fillStyle = checkpoint.reached ? '#f2ca4e' : '#e6e5d7';
  ctx.fillRect(cpX, cpY - 115, 72, 34);

  const goalX = worldToScreenX(35.5);
  const goalY = worldToScreenY(terrain.heightAt(35.5));
  ctx.fillStyle = '#f1e5b5';
  ctx.fillRect(goalX, goalY - 150, 12, 150);
  ctx.fillStyle = '#8f3d33';
  ctx.fillRect(goalX + 12, goalY - 150, 75, 38);
}

function drawPlayer() {
  if (characterRenderer.isReady(player.hero)) return;
  const body = movementBody(player);
  const x = worldToScreenX(body.x);
  const y = worldToScreenY(body.y);
  const width = body.width * SCALE;
  const height = body.height * SCALE;
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.scale(player.facing, 1);
  ctx.fillStyle = player.hero === 'Hargold' ? '#496f3b' : '#5c4b79';
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, Math.min(width, height) * 0.28);
  ctx.fill();
  ctx.fillStyle = player.hero === 'Hargold' ? '#9b4937' : '#344c2e';
  ctx.fillRect(-width * 0.48, -height * 0.12, width * 0.96, height * 0.14);
  ctx.fillStyle = '#eed0aa';
  ctx.beginPath();
  ctx.arc(0, -height * 0.27, Math.min(width, height) * 0.22, 0, Math.PI * 2);
  ctx.fill();
  if (player.hero === 'Mebble' && player.glide !== 'closed') {
    ctx.fillStyle = 'rgba(48, 75, 43, .84)';
    ctx.beginPath();
    ctx.moveTo(-width * 0.35, -height * 0.08);
    ctx.quadraticCurveTo(-width * 1.15, height * 0.05, -width * 1.35, height * 0.35);
    ctx.lineTo(width * 1.35, height * 0.35);
    ctx.quadraticCurveTo(width * 1.15, height * 0.05, width * 0.35, -height * 0.08);
    ctx.fill();
  }
  ctx.restore();
}

function drawOverlay() {
  const hearts = '♥'.repeat(session.healthLayers).padEnd(3, '♡');
  ctx.fillStyle = 'rgba(7, 20, 12, .78)';
  ctx.fillRect(18, 18, 480, 76);
  ctx.fillStyle = '#f7f0d2';
  ctx.font = '800 20px system-ui';
  ctx.fillText(`${player.hero}  ${hearts}  Lives ${session.lives}`, 34, 48);
  ctx.fillStyle = '#f4cf53';
  ctx.font = '700 16px system-ui';
  ctx.fillText(`Coins ${session.standardCoins}/100  ·  Compass ${session.compass}/3  ·  Mobs ${session.enemiesDefeated}/${mobs.length}`, 34, 76);
  ctx.fillStyle = 'rgba(7, 20, 12, .78)';
  ctx.fillRect(W - 330, 18, 312, 58);
  ctx.fillStyle = '#fff6d8';
  ctx.textAlign = 'right';
  ctx.font = '800 18px system-ui';
  ctx.fillText(`${COURSE_ID} ${COURSE_NAME}`, W - 34, 44);
  ctx.fillStyle = '#b8dd90';
  ctx.font = '700 13px system-ui';
  ctx.fillText('Verdant Vale roster: Critter + Shellback', W - 34, 66);
  ctx.textAlign = 'left';

  if (noticeSeconds > 0) {
    ctx.font = '700 16px system-ui';
    const width = Math.min(700, ctx.measureText(notice).width + 44);
    ctx.fillStyle = 'rgba(7, 20, 12, .78)';
    ctx.fillRect((W - width) / 2, 108, width, 42);
    ctx.fillStyle = '#fff6d8';
    ctx.textAlign = 'center';
    ctx.fillText(notice, W / 2, 135);
    ctx.textAlign = 'left';
  }
  if (session.state === 'game-over' || session.state === 'complete') {
    ctx.fillStyle = 'rgba(4, 12, 8, .72)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff6d8';
    ctx.textAlign = 'center';
    ctx.font = '900 48px system-ui';
    ctx.fillText(session.state === 'game-over' ? 'GAME OVER' : 'COURSE COMPLETE', W / 2, H / 2 - 15);
    ctx.font = '700 20px system-ui';
    ctx.fillText('Press R or tap RESTART to begin again', W / 2, H / 2 + 30);
    ctx.textAlign = 'left';
  }
  if (movementDebugEnabled && player.telemetry) {
    const debug = player.telemetry;
    const lines = [
      `${debug.previousState} → ${debug.currentState}  ${debug.stateDurationSeconds.toFixed(3)}s`,
      `pos ${debug.position.x.toFixed(3)}, ${debug.position.y.toFixed(3)}  vel ${debug.velocity.x.toFixed(3)}, ${debug.velocity.y.toFixed(3)}`,
      `grounded ${debug.grounded}  support ${debug.supportPlatformId ?? 'terrain/none'}  normal ${debug.surfaceNormal.x.toFixed(2)}, ${debug.surfaceNormal.y.toFixed(2)}`,
      `buffer ${debug.jumpBufferSeconds.toFixed(3)}  coyote ${debug.coyoteSeconds.toFixed(3)}  twirl ${debug.twirlAvailable}  double ${debug.doubleJumpAvailable}`,
      `glide ${debug.glideState} ${debug.glideSeconds.toFixed(2)}s  slam ${debug.groundSlamPhase}`
    ];
    ctx.fillStyle = 'rgba(5, 10, 8, .9)';
    ctx.fillRect(18, H - 158, 720, 138);
    ctx.fillStyle = '#d9f6cf';
    ctx.font = '600 14px ui-monospace, monospace';
    lines.forEach((line, index) => ctx.fillText(line, 30, H - 132 + index * 23));
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawPlayer();
  drawOverlay();
}

function frame(now) {
  const elapsed = Math.max(0, Math.min(0.1, (now - lastFrame) / 1000));
  lastFrame = now;
  inputBuffer.sample(rawInputSnapshot(), elapsed);
  loop.advance(elapsed, fixedUpdate);
  noticeSeconds = Math.max(0, noticeSeconds - elapsed);
  const sprintLookAhead = player.locomotion === 'sprint'
    ? clamp(player.velocityX * 24, -150, 150)
    : 0;
  const targetCamera = Math.max(
    -W * 0.22,
    player.footX * SCALE - W * 0.34 + sprintLookAhead
  );
  cameraX += (targetCamera - cameraX) * Math.min(1, elapsed * 5);
  const cameraSurfaceY = terrain.heightAt(clamp(player.footX, 0, WORLD_END));
  const terrainFraming = cameraSurfaceY * SCALE - H * 0.77;
  const airborneFollow = clamp(
    (player.footY - cameraSurfaceY) * SCALE * 0.15,
    -30,
    16
  );
  const targetCameraY = clamp(terrainFraming + airborneFollow, -78, 28);
  cameraY += (targetCameraY - cameraY) * Math.min(1, elapsed * 3.6);
  status.textContent = `${session.state === 'playing' ? 'PLAYING' : session.state.toUpperCase()} · 120 Hz · ${characterLoadStatus}`;
  draw();
  characterRenderer.render({
    hero: player.hero,
    screenX: worldToScreenX(player.footX),
    screenY: worldToScreenY(player.footY),
    facing: player.facing,
    locomotion: player.locomotion,
    glide: player.glide,
    horizontalSpeed: player.velocityX,
    grounded: player.grounded,
    cameraX,
    cameraY,
    coins,
    compassCoins,
    blocks,
    platforms,
    mobs,
    projectiles
  }, elapsed);
  animationDebugPanel?.update();
  requestAnimationFrame(frame);
}

if (animationDebugEnabled) {
  animationDebugPanel = new AnimationDebugPanel({
    renderer: characterRenderer,
    getGameplaySnapshot: () => ({
      movementState: player.movementState,
      velocityX: player.velocityX,
      velocityY: player.velocityY,
      grounded: player.grounded
    }),
    onHeroRequested: requestedHero => {
      if (requestedHero !== player.hero) trySwapUnifiedHero(player, { canOccupy });
    }
  });
}

addEventListener('keydown', event => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
  if (event.code === 'KeyR') restartCourse();
  keys.add(event.code);
});
addEventListener('keyup', event => keys.delete(event.code));
addEventListener('blur', () => {
  keys.clear();
  for (const action of Object.keys(touch)) touch[action] = false;
  inputBuffer.reset();
});

for (const button of document.querySelectorAll('[data-action]')) {
  const action = button.dataset.action;
  const set = value => {
    button.classList.toggle('active', value);
    if (action === 'restart' && value) restartCourse();
    else if (action in touch) touch[action] = value;
  };
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    set(true);
  });
  button.addEventListener('pointerup', () => set(false));
  button.addEventListener('pointercancel', () => set(false));
  button.addEventListener('lostpointercapture', () => set(false));
}

requestAnimationFrame(frame);
