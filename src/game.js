import { CharacterRenderer } from './character-renderer.js';

/*
 * Browser-compatible test entry.
 *
 * Keep this file dependency-free so index.html also works when opened directly
 * from disk. The production-quality reusable implementations remain under
 * src/runtime and are covered by the automated tests.
 */
function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

function approach(value, target, rate, deltaSeconds) {
  if (value < target) return Math.min(target, value + rate * deltaSeconds);
  return Math.max(target, value - rate * deltaSeconds);
}

class FixedStepLoop {
  constructor({ hz = 120, maximumFrameSeconds = 0.25, maximumStepsPerFrame = 30 } = {}) {
    this.stepSeconds = 1 / hz;
    this.maximumFrameSeconds = maximumFrameSeconds;
    this.maximumStepsPerFrame = maximumStepsPerFrame;
    this.accumulator = 0;
    this.totalSteps = 0;
  }

  advance(elapsedSeconds, step) {
    const boundedElapsed = Math.min(elapsedSeconds, this.maximumFrameSeconds);
    this.accumulator += boundedElapsed;
    let executed = 0;
    while (this.accumulator + Number.EPSILON >= this.stepSeconds && executed < this.maximumStepsPerFrame) {
      step(this.stepSeconds, this.totalSteps);
      this.accumulator -= this.stepSeconds;
      this.totalSteps += 1;
      executed += 1;
    }
    if (this.accumulator >= this.stepSeconds) this.accumulator %= this.stepSeconds;
  }
}

function createLinearGround(points) {
  function heightAt(positionX) {
    const x = clamp(positionX, points[0][0], points.at(-1)[0]);
    for (let index = 0; index < points.length - 1; index += 1) {
      const from = points[index];
      const to = points[index + 1];
      if (x >= from[0] && x <= to[0]) {
        return lerp(from[1], to[1], (x - from[0]) / (to[0] - from[0]));
      }
    }
    return points.at(-1)[1];
  }
  return { heightAt };
}

const PROVISIONAL_MOTION_TUNING = Object.freeze({
  status: 'provisional-engineering-tuning',
  walkSpeed: 3.2,
  runSpeed: 5.7,
  groundAccelerationWalk: 18,
  groundAccelerationRun: 22,
  releaseDeceleration: 16,
  lowSpeedTurnAcceleration: 25,
  highSpeedSkidDeceleration: 30,
  skidThreshold: 3,
  skidExitSpeed: 1.1,
  airAcceleration: 11,
  airReverseAcceleration: 14,
  airMaximumWalkSpeed: 3.6,
  airMaximumRunSpeed: 5.9,
  baseJumpSpeed: 10.4,
  runningJumpBonus: 1.55,
  heldJumpGravity: 22.6,
  releasedJumpGravity: 39.2,
  fallGravity: 36.8,
  apexGravity: 16,
  apexVelocityWindow: 0.84,
  maximumFallSpeed: 15.8,
  jumpBufferSeconds: 5 / 60,
  coyoteSeconds: 4 / 60,
  hardLandingSpeed: 13.2,
  minimumJumpCutVelocity: -4.7,
  glideGravity: 5.6,
  glideMaximumFallSpeed: 2.9
});

const PROVISIONAL_HERO_PROFILES = Object.freeze({
  Hargold: Object.freeze({ width: 1.52, height: 3.32, jumpSpeedAddition: 0, airControlMultiplier: 1 }),
  Mebble: Object.freeze({ width: 1.16, height: 3.68, jumpSpeedAddition: 1.16, airControlMultiplier: 1.08 })
});

function createMotionState({
  hero = 'Hargold',
  footX = 0,
  footY = 0,
  grounded = true
} = {}) {
  return {
    hero, footX, footY,
    velocityX: 0, velocityY: 0, grounded, facing: 1,
    locomotion: grounded ? 'idle' : 'fall', stateSeconds: 0,
    coyoteSeconds: grounded ? PROVISIONAL_MOTION_TUNING.coyoteSeconds : 0,
    jumpBufferSeconds: 0, glide: 'closed', landingSpeed: 0
  };
}

function motionBody(state) {
  const profile = PROVISIONAL_HERO_PROFILES[state.hero];
  return {
    x: state.footX - profile.width / 2,
    y: state.footY - profile.height,
    width: profile.width,
    height: profile.height
  };
}

function trySwapHero(state, { canOccupy = () => true } = {}) {
  const nextHero = state.hero === 'Hargold' ? 'Mebble' : 'Hargold';
  const profile = PROVISIONAL_HERO_PROFILES[nextHero];
  const candidate = {
    x: state.footX - profile.width / 2,
    y: state.footY - profile.height,
    width: profile.width,
    height: profile.height
  };
  if (!canOccupy(candidate, nextHero)) return { accepted: false, hero: state.hero };
  state.hero = nextHero;
  return { accepted: true, hero: nextHero };
}

function stepMotion(state, input, deltaSeconds, {
  groundHeightAt = () => 0,
  minimumX = -Infinity,
  maximumX = Infinity
} = {}) {
  const tuning = PROVISIONAL_MOTION_TUNING;
  const profile = PROVISIONAL_HERO_PROFILES[state.hero];
  const previousFootY = state.footY;
  state.stateSeconds += deltaSeconds;
  state.jumpBufferSeconds = input.jumpPressed
    ? tuning.jumpBufferSeconds
    : Math.max(0, state.jumpBufferSeconds - deltaSeconds);
  state.coyoteSeconds = state.grounded
    ? tuning.coyoteSeconds
    : Math.max(0, state.coyoteSeconds - deltaSeconds);

  if (state.jumpBufferSeconds > 0 && (state.grounded || state.coyoteSeconds > 0)) {
    const runRatio = clamp(Math.abs(state.velocityX) / tuning.runSpeed, 0, 1);
    state.velocityY = -(tuning.baseJumpSpeed + profile.jumpSpeedAddition + tuning.runningJumpBonus * runRatio);
    state.grounded = false;
    state.coyoteSeconds = 0;
    state.jumpBufferSeconds = 0;
    state.glide = 'closed';
  }

  const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (state.grounded) {
    const speed = Math.abs(state.velocityX);
    const maximum = input.run ? tuning.runSpeed : tuning.walkSpeed;
    const reversing = state.velocityX !== 0 && direction !== 0 && Math.sign(state.velocityX) !== direction;
    if (direction === 0) {
      state.velocityX = approach(state.velocityX, 0, tuning.releaseDeceleration, deltaSeconds);
      state.locomotion = Math.abs(state.velocityX) < 1e-6 ? 'idle' : speed > tuning.walkSpeed * 0.92 ? 'run' : 'walk';
    } else if (reversing && speed >= tuning.skidThreshold) {
      state.velocityX = approach(state.velocityX, 0, tuning.highSpeedSkidDeceleration, deltaSeconds);
      state.locomotion = 'skid';
    } else {
      state.facing = direction;
      state.velocityX = approach(
        state.velocityX,
        direction * maximum,
        reversing ? tuning.lowSpeedTurnAcceleration : input.run ? tuning.groundAccelerationRun : tuning.groundAccelerationWalk,
        deltaSeconds
      );
      state.locomotion = Math.abs(state.velocityX) > tuning.walkSpeed * 0.94 ? 'run' : 'walk';
    }
    state.footX = clamp(state.footX + state.velocityX * deltaSeconds, minimumX, maximumX);
    state.footY = groundHeightAt(state.footX);
    state.velocityY = 0;
  } else {
    if (direction !== 0) {
      const reversing = state.velocityX !== 0 && Math.sign(state.velocityX) !== direction;
      const maximum = input.run ? tuning.airMaximumRunSpeed : tuning.airMaximumWalkSpeed;
      state.velocityX = approach(
        state.velocityX,
        direction * maximum,
        (reversing ? tuning.airReverseAcceleration : tuning.airAcceleration) * profile.airControlMultiplier,
        deltaSeconds
      );
      state.facing = direction;
    }
    const absoluteVerticalSpeed = Math.abs(state.velocityY);
    let gravity = absoluteVerticalSpeed <= tuning.apexVelocityWindow
      ? tuning.apexGravity
      : state.velocityY < 0
        ? input.jumpHeld ? tuning.heldJumpGravity : tuning.releasedJumpGravity
        : tuning.fallGravity;
    const shouldGlide = state.hero === 'Mebble' && input.glideHeld && state.velocityY > tuning.apexVelocityWindow;
    if (shouldGlide) {
      gravity = tuning.glideGravity;
      state.velocityY = Math.min(state.velocityY, tuning.glideMaximumFallSpeed);
      state.glide = state.glide === 'closed' ? 'opening' : 'sustained';
    } else {
      state.glide = state.glide === 'opening' || state.glide === 'sustained' ? 'closing' : 'closed';
    }
    state.velocityY = Math.min(tuning.maximumFallSpeed, state.velocityY + gravity * deltaSeconds);
    if (!input.jumpHeld && state.velocityY < tuning.minimumJumpCutVelocity) {
      state.velocityY = tuning.minimumJumpCutVelocity;
    }
    state.footX = clamp(state.footX + state.velocityX * deltaSeconds, minimumX, maximumX);
    state.footY += state.velocityY * deltaSeconds;
    const groundY = groundHeightAt(state.footX);
    if (state.velocityY >= 0 && state.footY >= groundY && previousFootY <= groundY) {
      state.landingSpeed = state.velocityY;
      state.footY = groundY;
      state.velocityY = 0;
      state.grounded = true;
      state.glide = 'closed';
      state.locomotion = state.landingSpeed >= tuning.hardLandingSpeed ? 'land-hard' : 'land-soft';
    } else {
      state.locomotion = state.velocityY < -tuning.apexVelocityWindow
        ? 'rise'
        : state.velocityY <= tuning.apexVelocityWindow ? 'apex' : 'fall';
    }
  }
}

function fatalHazardEvent(type) {
  return {
    type: 'fatal-hazard',
    hazardType: type,
    bypasses: ['hearts', 'invulnerability', 'activePowerUp']
  };
}

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const status = document.querySelector('#status');
const W = canvas.width;
const H = canvas.height;
const SCALE = 70;
const WORLD_END = 36;
const keys = new Set();
const touch = { left: false, right: false, run: false, jump: false, action: false };
const loop = new FixedStepLoop({ hz: 120 });
let characterLoadStatus = 'Loading 3D characters...';
const characterRenderer = new CharacterRenderer({
  mount: canvas.parentElement,
  width: W,
  height: H,
  onProgress(message) {
    characterLoadStatus = message;
  }
});

const terrain = createLinearGround([
  [0, 7.9], [5, 7.9], [8, 7.25], [12, 7.85], [16, 7.15],
  [20, 7.75], [24, 7.1], [28, 7.8], [32, 7.25], [WORLD_END, 7.8]
]);
const pits = [{ from: 9.4, to: 10.8 }, { from: 21.1, to: 22.7 }, { from: 30.1, to: 31.5 }];
const coins = [3.5, 6.8, 8.7, 12.5, 15.2, 18.4, 23.5, 26.2, 29.1, 33.2]
  .map((x, index) => ({ x, y: terrain.heightAt(x) - (index % 3 === 0 ? 1.55 : 0.8), taken: false }));
const compassCoins = [
  { x: 8.9, y: terrain.heightAt(8.9) - 2.2, taken: false },
  { x: 24.4, y: terrain.heightAt(24.4) - 2.4, taken: false },
  { x: 34.2, y: terrain.heightAt(34.2) - 1.7, taken: false }
];
const checkpoint = { x: 18, reached: false };

let player = createMotionState({ footX: 1.8, footY: terrain.heightAt(1.8) });
let previousInput = { jump: false, swap: false };
let cameraX = 0;
let lastFrame = performance.now();
let session = createSession();
let notice = 'Reach the trail marker. Hold Action as Mebble to glide.';
let noticeSeconds = 5;

function createSession() {
  return { healthLayers: 1, lives: 3, standardCoins: 0, compass: 0, state: 'playing', spawnX: 1.8 };
}

function inPit(x) {
  return pits.some(pit => x > pit.from && x < pit.to);
}

function groundHeightAt(x) {
  return inPit(x) ? 20 : terrain.heightAt(x);
}

function inputSnapshot() {
  const jump = keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW') || touch.jump;
  const swap = keys.has('KeyQ');
  const action = keys.has('KeyE') || keys.has('ArrowDown') || keys.has('KeyS') || touch.action;
  const snapshot = {
    left: keys.has('ArrowLeft') || keys.has('KeyA') || touch.left,
    right: keys.has('ArrowRight') || keys.has('KeyD') || touch.right,
    run: keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyX') || touch.run,
    jumpPressed: jump && !previousInput.jump,
    jumpHeld: jump,
    glideHeld: action,
    fastFallHeld: action
  };
  if (swap && !previousInput.swap) swapPlayer();
  previousInput = { jump, swap };
  return snapshot;
}

function canOccupy(candidate) {
  if (candidate.x < 0 || candidate.x + candidate.width > WORLD_END) return false;
  const lowOverhang = candidate.x < 14.6 && candidate.x + candidate.width > 13.2;
  return !(lowOverhang && candidate.height > PROVISIONAL_HERO_PROFILES.Hargold.height);
}

function swapPlayer() {
  if (session.state !== 'playing') return;
  const result = trySwapHero(player, { canOccupy });
  notice = result.accepted
    ? `${result.hero} active — feet and momentum preserved.`
    : 'Swap blocked: Mebble cannot safely fit here.';
  noticeSeconds = 2.2;
}

function respawn() {
  player = createMotionState({
    hero: player.hero,
    footX: session.spawnX,
    footY: terrain.heightAt(session.spawnX)
  });
  previousInput = { jump: false, swap: false };
}

function loseLife(hazardType) {
  if (session.state !== 'playing') return;
  const event = fatalHazardEvent(hazardType);
  session.lives = Math.max(0, session.lives - 1);
  notice = `${event.hazardType.toUpperCase()}: life lost; health protection bypassed.`;
  noticeSeconds = 3;
  if (session.lives === 0) {
    session.state = 'game-over';
    player.velocityX = 0;
    player.velocityY = 0;
    return;
  }
  respawn();
}

function restartCourse() {
  session = createSession();
  checkpoint.reached = false;
  for (const item of [...coins, ...compassCoins]) item.taken = false;
  player = createMotionState({ footX: session.spawnX, footY: terrain.heightAt(session.spawnX) });
  notice = 'Course restarted.';
  noticeSeconds = 2;
}

function collectItems() {
  for (const coin of coins) {
    if (!coin.taken && Math.hypot(player.footX - coin.x, player.footY - coin.y) < 0.55) {
      coin.taken = true;
      session.standardCoins += 1;
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

function fixedUpdate(dt) {
  if (session.state !== 'playing') return;
  const input = inputSnapshot();
  stepMotion(player, input, dt, {
    groundHeightAt,
    minimumX: 0.8,
    maximumX: WORLD_END
  });
  collectItems();

  if (!checkpoint.reached && player.footX >= checkpoint.x) {
    checkpoint.reached = true;
    session.spawnX = checkpoint.x;
    notice = 'Checkpoint reached.';
    noticeSeconds = 2.5;
  }
  if (player.footY > 11.5) loseLife('pit');
  if (player.footX >= 35.4) {
    session.state = 'complete';
    notice = 'Movement test complete.';
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
  const body = motionBody(player);
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
  ctx.fillText(`Coins ${session.standardCoins}/100  ·  Compass ${session.compass}/3`, 34, 76);

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
}

function draw() {
  drawBackground();
  drawTerrain();
  drawCollectibles();
  drawMarkers();
  drawPlayer();
  drawOverlay();
}

function frame(now) {
  const elapsed = Math.max(0, Math.min(0.1, (now - lastFrame) / 1000));
  lastFrame = now;
  loop.advance(elapsed, fixedUpdate);
  noticeSeconds = Math.max(0, noticeSeconds - elapsed);
  const targetCamera = Math.max(0, player.footX * SCALE - W * 0.34);
  cameraX += (targetCamera - cameraX) * Math.min(1, elapsed * 5);
  status.textContent = `${session.state === 'playing' ? 'PLAYING' : session.state.toUpperCase()} · 120 Hz · ${characterLoadStatus}`;
  draw();
  characterRenderer.render({
    hero: player.hero,
    screenX: worldToScreenX(player.footX),
    screenY: worldToScreenY(player.footY),
    facing: player.facing,
    locomotion: player.locomotion,
    glide: player.glide
  }, elapsed);
  requestAnimationFrame(frame);
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
});

for (const button of document.querySelectorAll('[data-action]')) {
  const action = button.dataset.action;
  const set = value => {
    button.classList.toggle('active', value);
    if (action === 'swap' && value) swapPlayer();
    else if (action === 'restart' && value) restartCourse();
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
