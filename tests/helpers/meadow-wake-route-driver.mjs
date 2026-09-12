import { groundedObstacleBodies } from '../../src/gameplay/levels/meadow-wake-course-runtime.js';
import { MEADOW_WAKE_PITS, MEADOW_WAKE_TERRAIN_POINTS } from '../../src/content/meadow-wake-course.js';
import { createLinearGround } from '../../src/runtime/terrain/linear-ground.js';
const terrain = createLinearGround(MEADOW_WAKE_TERRAIN_POINTS);

/** Input-only deterministic speedrun: no teleport, health/life grants, block
 * removal, unlocked double jump, or direct calls to combat/pickup functions. */
export function driveMainRoute(live, maximumSeconds = 60) {
  let state = live.snapshot();
  let jumpFrames = 0, releasedFrames = 10, wasGrounded = state.player.grounded;
  let livesLost = 0, previousLives = state.session.lives;
  for (let frame = 0; frame < maximumSeconds * 120; frame++) {
    const x = state.player.footX;
    const obstacles = groundedObstacleBodies(state.platforms, value => terrain.heightAt(value));
    const gap = MEADOW_WAKE_PITS.some(pit => !pit.bridged && pit.from - x > -.25 && pit.from - x < 1.75);
    const obstacle = obstacles.some(solid => solid.x - solid.width / 2 - x > -.7 && solid.x - solid.width / 2 - x < 1.6);
    const barrier = state.blocks.some(block => !block.broken && !block.hidden && block.y + block.height / 2 > terrain.heightAt(block.x) - 2.3 && block.x - x > -.5 && block.x - x < 2);
    if (!wasGrounded && state.player.grounded) jumpFrames = 0;
    wasGrounded = state.player.grounded;
    const creekReturn = state.player.supportPlatformId?.startsWith('concealed-creek') && x > 62;
    if ((gap || obstacle || barrier || creekReturn || state.player.movementState === 'wall-contact') && state.player.grounded && releasedFrames > 2) jumpFrames = 58;
    const jump = jumpFrames > 0;
    if (jumpFrames > 0) jumpFrames--;
    releasedFrames = jump ? 0 : releasedFrames + 1;
    state = live.step({ right: true, jump, action: frame % 20 < 10 });
    livesLost += Math.max(0, previousLives - state.session.lives);
    previousLives = state.session.lives;
    if (state.session.state !== 'playing') return { state, seconds: (frame + 1) / 120, livesLost };
  }
  return { state, seconds: maximumSeconds, livesLost };
}
