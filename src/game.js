const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const status = document.querySelector('#status');

const W = canvas.width;
const H = canvas.height;
const groundY = 600;
const gravity = 2400;
const keys = new Set();
const touch = { left: false, right: false, jump: false };

const heroes = {
  Hargold: { width: 74, height: 92, speed: 330, jump: 820, color: '#496f3b', accent: '#9b3c2d' },
  Mebble: { width: 58, height: 126, speed: 350, jump: 875, color: '#5f477f', accent: '#d3b36b' }
};

const level = {
  coins: [520, 690, 845, 1190, 1380, 1510, 1880].map((x, i) => ({ x, y: i % 2 ? 430 : 500, taken: false })),
  platforms: [
    { x: 450, y: 535, w: 210, h: 28 },
    { x: 780, y: 470, w: 190, h: 28 },
    { x: 1120, y: 520, w: 240, h: 28 },
    { x: 1460, y: 430, w: 220, h: 28 },
    { x: 1810, y: 500, w: 250, h: 28 }
  ],
  pits: [{ x: 980, w: 120 }, { x: 1690, w: 105 }],
  checkpoint: { x: 1375, reached: false },
  goalX: 2150
};

const player = {
  hero: 'Hargold', x: 120, y: groundY - heroes.Hargold.height,
  vx: 0, vy: 0, onGround: false, coins: 0, lives: 3, spawnX: 120
};

let cameraX = 0;
let last = performance.now();
let jumpLock = false;

function resetPlayer(loseLife = false) {
  if (loseLife) player.lives = Math.max(0, player.lives - 1);
  if (player.lives === 0) {
    player.lives = 3;
    player.coins = 0;
    level.coins.forEach(c => c.taken = false);
    level.checkpoint.reached = false;
    player.spawnX = 120;
  }
  const h = heroes[player.hero];
  player.x = player.spawnX;
  player.y = groundY - h.height;
  player.vx = 0;
  player.vy = 0;
}

function swapHero() {
  const old = heroes[player.hero];
  const feet = player.y + old.height;
  player.hero = player.hero === 'Hargold' ? 'Mebble' : 'Hargold';
  player.y = feet - heroes[player.hero].height;
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function solidGroundAt(x) {
  return !level.pits.some(p => x > p.x && x < p.x + p.w);
}

function update(dt) {
  const h = heroes[player.hero];
  const left = keys.has('ArrowLeft') || keys.has('KeyA') || touch.left;
  const right = keys.has('ArrowRight') || keys.has('KeyD') || touch.right;
  const jump = keys.has('ArrowUp') || keys.has('KeyW') || keys.has('Space') || touch.jump;

  const target = (right ? 1 : 0) - (left ? 1 : 0);
  player.vx += (target * h.speed - player.vx) * Math.min(1, dt * (target ? 10 : 14));

  if (jump && player.onGround && !jumpLock) {
    player.vy = -h.jump;
    player.onGround = false;
    jumpLock = true;
  }
  if (!jump) jumpLock = false;

  player.vy += gravity * dt;
  const previousBottom = player.y + h.height;
  player.x = Math.max(0, player.x + player.vx * dt);
  player.y += player.vy * dt;
  player.onGround = false;

  const body = { x: player.x, y: player.y, w: h.width, h: h.height };
  for (const p of level.platforms) {
    if (player.vy >= 0 && previousBottom <= p.y + 10 && overlap(body, p)) {
      player.y = p.y - h.height;
      player.vy = 0;
      player.onGround = true;
    }
  }

  const feetX = player.x + h.width / 2;
  if (player.y + h.height >= groundY && solidGroundAt(feetX)) {
    player.y = groundY - h.height;
    player.vy = 0;
    player.onGround = true;
  }

  if (player.y > H + 160) resetPlayer(true);

  for (const coin of level.coins) {
    if (!coin.taken && Math.hypot(player.x + h.width / 2 - coin.x, player.y + h.height / 2 - coin.y) < 58) {
      coin.taken = true;
      player.coins += 1;
    }
  }

  if (!level.checkpoint.reached && player.x >= level.checkpoint.x) {
    level.checkpoint.reached = true;
    player.spawnX = level.checkpoint.x;
  }

  if (player.x > level.goalX) {
    status.textContent = `TEST COMPLETE · ${player.hero} · Coins ${player.coins}/${level.coins.length}`;
  } else {
    status.textContent = `${player.hero} · Lives ${player.lives} · Coins ${player.coins}/${level.coins.length}`;
  }

  cameraX += (Math.max(0, player.x - W * 0.34) - cameraX) * Math.min(1, dt * 5);
}

function drawHill(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x - cameraX * .18, y, r, Math.PI, 0);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#79c9e9');
  sky.addColorStop(1, '#d8f0c2');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 7; i++) drawHill(i * 280 + 50, 510, 220, i % 2 ? '#7db774' : '#6aa663');
  ctx.fillStyle = '#315b37';
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.fillStyle = '#4f7b3f';
  ctx.fillRect(0, groundY, W, 28);

  for (const pit of level.pits) {
    ctx.fillStyle = '#183021';
    ctx.fillRect(pit.x - cameraX, groundY - 2, pit.w, H - groundY + 2);
  }

  for (const p of level.platforms) {
    ctx.fillStyle = '#8a7653';
    ctx.fillRect(p.x - cameraX, p.y, p.w, p.h);
    ctx.fillStyle = '#78a754';
    ctx.fillRect(p.x - cameraX, p.y, p.w, 9);
  }

  for (const coin of level.coins) {
    if (coin.taken) continue;
    ctx.fillStyle = '#f5ca3e';
    ctx.beginPath();
    ctx.ellipse(coin.x - cameraX, coin.y, 15, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9b6a18';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  const cpX = level.checkpoint.x - cameraX;
  ctx.strokeStyle = '#4d3524';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(cpX, groundY);
  ctx.lineTo(cpX, groundY - 150);
  ctx.stroke();
  ctx.fillStyle = level.checkpoint.reached ? '#f2c94c' : '#d8ddd6';
  ctx.fillRect(cpX, groundY - 150, 90, 45);

  const goalX = level.goalX - cameraX;
  ctx.fillStyle = '#efe5ba';
  ctx.fillRect(goalX, groundY - 210, 18, 210);
  ctx.fillStyle = '#953d35';
  ctx.fillRect(goalX + 18, groundY - 210, 105, 58);

  const h = heroes[player.hero];
  const px = player.x - cameraX;
  ctx.save();
  ctx.translate(px + h.width / 2, player.y + h.height / 2);
  ctx.fillStyle = h.color;
  ctx.beginPath();
  ctx.roundRect(-h.width / 2, -h.height / 2, h.width, h.height, h.width * .35);
  ctx.fill();
  ctx.fillStyle = h.accent;
  ctx.fillRect(-h.width * .42, -h.height * .18, h.width * .84, 15);
  ctx.fillStyle = '#f0d2ad';
  ctx.beginPath();
  ctx.arc(0, -h.height * .28, Math.min(h.width, h.height) * .22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#182018';
  ctx.fillRect(-12, -h.height * .32, 6, 6);
  ctx.fillRect(7, -h.height * .32, 6, 6);
  ctx.restore();

  ctx.fillStyle = 'rgba(10,20,13,.7)';
  ctx.fillRect(18, 18, 340, 52);
  ctx.fillStyle = '#fff8dd';
  ctx.font = '700 24px system-ui';
  ctx.fillText('Meadow Wake — Movement Test', 34, 52);
}

function loop(now) {
  const dt = Math.min(.033, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyQ' && !keys.has(e.code)) swapHero();
  if (e.code === 'KeyR') resetPlayer(false);
  keys.add(e.code);
});
addEventListener('keyup', e => keys.delete(e.code));

for (const button of document.querySelectorAll('[data-action]')) {
  const action = button.dataset.action;
  const set = value => {
    button.classList.toggle('active', value);
    if (action === 'swap' && value) swapHero();
    else if (action in touch) touch[action] = value;
  };
  button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); set(true); });
  button.addEventListener('pointerup', () => set(false));
  button.addEventListener('pointercancel', () => set(false));
}

resetPlayer(false);
requestAnimationFrame(loop);
