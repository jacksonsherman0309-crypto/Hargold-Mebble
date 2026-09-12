/** Course-specific collision and route rules. Visible terrain is not rebuilt. */
import { platformTop } from './platform-block-runtime.js?v=level-one-layout-20260911';

// Only objects whose approved visible bodies meet the ground have solid sides.
// Awning, scaffold, bridge, lifts and optional high ledges remain one-way.
export const GROUNDED_OBSTACLE_IDS = Object.freeze([
  'opening-stump-step', 'fallen-log-launch', 'timber-stack-climb',
  'bramble-clue-step', 'final-hill-stump'
]);
export const QUARRY_BASE_BLOCK_IDS = Object.freeze([
  'shell-column-a', 'shell-column-b', 'shell-column-c'
]);

export function groundedObstacleBodies(platforms, heightAt) {
  return platforms.filter(platform => GROUNDED_OBSTACLE_IDS.includes(platform.id))
    .map(platform => {
      const top = platformTop(platform);
      const left = platform.x - platform.width / 2;
      const right = platform.x + platform.width / 2;
      const bottom = Math.max(heightAt(left), heightAt(platform.x), heightAt(right)) + 0.04;
      return {
        id: `${platform.id}:body`, platformId: platform.id,
        type: 'terrain-obstacle', x: platform.x, y: (top + bottom) / 2,
        width: platform.width, height: Math.max(0.04, bottom - top),
        hidden: false, broken: false
      };
    });
}

export function solidAtPoint(point, solids) {
  return solids.find(solid => !solid.broken && (!solid.hidden || solid.revealed)
    && point.x >= solid.x - solid.width / 2 && point.x <= solid.x + solid.width / 2
    && point.y >= solid.y - solid.height / 2 && point.y <= solid.y + solid.height / 2) ?? null;
}

export function collectibleTouchesBody(coin, body, radius = 0.15) {
  if (coin.taken || coin.locked) return false;
  const closestX = Math.max(body.x, Math.min(coin.x, body.x + body.width));
  const closestY = Math.max(body.y, Math.min(coin.y, body.y + body.height));
  return Math.hypot(coin.x - closestX, coin.y - closestY) <= radius;
}

/** The ground-level base must actually be hit by a shell; walking/jumping
 * around the column does not award the route-commitment Compass Coin. The cap
 * falls with its destroyed support. All of this remains visible block state.
 */
export function updateQuarryRoute(blocks, compassCoins) {
  const base = QUARRY_BASE_BLOCK_IDS.map(id => blocks.find(block => block.id === id));
  if (base.some(block => !block || !block.broken || block.impactKind !== 'shell-break')) return false;
  const cap = blocks.find(block => block.id === 'shell-column-cap');
  if (cap && !cap.broken) {
    cap.broken = true;
    cap.impactKind = 'shell-break';
    cap.impactSerial = (cap.impactSerial ?? 0) + 1;
    cap.bumpSeconds = cap.bumpDuration = 0.2;
    cap.flashSeconds = 0.16;
  }
  const coin = compassCoins.find(candidate => candidate.id === '1-1-C2');
  if (!coin || !coin.locked) return false;
  coin.locked = false;
  return true;
}

/** Solid logs/steps stop shells as well as heroes. Ordinary patrol intervals
 * already avoid these bodies; a kicked shell can leave its original interval.
 */
export function resolveRollingShellObstacle(shell, previousX, obstacles) {
  if (!shell.alive || shell.state !== 'shell-roll') return false;
  const half = shell.width / 2;
  for (const obstacle of obstacles) {
    const left = obstacle.x - obstacle.width / 2;
    const right = obstacle.x + obstacle.width / 2;
    const top = obstacle.y - obstacle.height / 2;
    const bottom = obstacle.y + obstacle.height / 2;
    if (shell.y <= top || shell.y - shell.height >= bottom) continue;
    if (shell.direction > 0 && previousX + half <= left + 0.02 && shell.x + half >= left) {
      shell.x = left - half - 0.01;
      shell.direction = -1;
      return true;
    }
    if (shell.direction < 0 && previousX - half >= right - 0.02 && shell.x - half <= right) {
      shell.x = right + half + 0.01;
      shell.direction = 1;
      return true;
    }
  }
  return false;
}

// Teaching cues are one-time room entries, not new hazards or automatic play.
export const MEADOW_WAKE_TEACHING_CUES = Object.freeze([
  { id: 'log', from: 14.8, to: 17, text: 'Jump onto the fallen log, then jump again for its springy launch and upper Compass Coin.' },
  { id: 'first-critter', from: 24.4, to: 26.2, text: 'Protection block first. Watch the Critter, then jump onto its back.' },
  { id: 'quarry', from: 30, to: 32, text: 'Stomp the Shellback, land to its left, then press ACTION to kick it through the low masonry.' },
  { id: 'creek', from: 57.8, to: 59.5, text: 'The low coin trail breaks at the brambles. Look below the grass; a creek shelf leads back to the bridge.' },
  { id: 'upper-route', from: 84, to: 85.8, text: 'Optional upper route: ride the root lift and use Mebble’s glide to control the ruin transfers. The ground route remains open.' },
  { id: 'hargold', from: 98.9, to: 100, text: 'The reinforced block group is Hargold’s. Hit it from below; the main path continues underneath.' },
  { id: 'panorama', from: 108.8, to: 110.2, text: 'Three widening gaps ahead. Read the landing islands; the goal is beyond the last one.' }
].map(Object.freeze));
