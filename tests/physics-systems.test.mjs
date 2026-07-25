import assert from 'node:assert/strict';
import { createMotionState } from '../src/runtime/motion/motion-controller.js';
import {
  animationIntent, applyHurt, createActionState, stompBounce, tryAirJump,
  updateAirActions, updateStanceActions, updateWallActions
} from '../src/runtime/motion/action-controller.js';
import {
  attachClimb, createRopeState, stepClimb, stepRope, stepWater,
  SURFACE_MATERIALS
} from '../src/runtime/environment/movement-volumes.js';
import { pickUp, releaseCarried } from '../src/runtime/objects/carry.js';
import {
  createKinematicSolid, inheritedPlatformVelocity, moveSolid, sweptSolidHit,
  transportRider
} from '../src/runtime/collision/kinematic-solids.js';
import { createCourseFatalGate, fatalHazardEvent } from '../src/runtime/hazards/fatal-hazards.js';

const dt = 1 / 120;
const input = { left: false, right: false, jumpPressed: false, jumpHeld: false };

for (const hero of ['Hargold', 'Mebble']) {
  const motion = createMotionState({ hero, grounded: false });
  const action = createActionState();
  motion.velocityY = 9;
  const event = updateWallActions(motion, action, { ...input, jumpPressed: true }, { leftWall: true }, dt);
  assert.equal(event.type, 'wall-jump');
  assert.ok(motion.velocityX > 0 && motion.velocityY < 0);
}

const hargold = createMotionState({ grounded: false });
const hargoldAction = createActionState();
assert.equal(tryAirJump(hargold, hargoldAction), false);
assert.equal(tryAirJump(hargold, hargoldAction, { doubleJumpUnlocked: true }), true);
assert.equal(tryAirJump(hargold, hargoldAction, { doubleJumpUnlocked: true }), false);

updateStanceActions(hargold, hargoldAction, { downHeld: true }, {});
assert.equal(hargoldAction.crouched, false, 'airborne heroes do not crouch');
hargold.grounded = true;
updateStanceActions(hargold, hargoldAction, { downHeld: true }, {});
assert.equal(hargoldAction.crouched, true);
updateStanceActions(hargold, hargoldAction, { downHeld: false }, { canStand: () => false });
assert.equal(hargoldAction.crouched, true, 'blocked stand remains crouched');

hargold.grounded = false; hargold.velocityY = 1;
updateAirActions(hargold, hargoldAction, { spinPressed: true, fastFallHeld: true }, dt);
assert.equal(hargoldAction.airSpinUsed, true);
assert.equal(hargoldAction.fastFalling, true);
assert.equal(stompBounce(hargold, hargoldAction, true).type, 'strong-stomp-bounce');
assert.ok(hargold.velocityY < 0);
assert.equal(applyHurt(hargold, hargoldAction, 1), true);
assert.equal(applyHurt(hargold, hargoldAction, 1), false);

const mebble = createMotionState({ hero: 'Mebble', grounded: false, footY: 0 });
const swimEvent = stepWater(mebble, { ...input, jumpPressed: true }, { surfaceY: 0, currentX: 1 }, dt);
assert.equal(swimEvent.type, 'surface-breach');
attachClimb(hargoldAction, 'ladder', 'ladder-a');
assert.equal(stepClimb(hargold, hargoldAction, { ...input, jumpPressed: true }, dt).type, 'climb-detach');
hargoldAction.rope = createRopeState({ anchorX: 0, anchorY: 0, length: 3 });
assert.equal(stepRope(hargold, hargoldAction, { ...input, jumpPressed: true }, dt).type, 'rope-release');
assert.deepEqual(Object.keys(SURFACE_MATERIALS), ['normal', 'ice', 'low-slip', 'mud', 'sand', 'conveyor']);

assert.equal(pickUp(hargoldAction, { id: 'rock', weight: 'heavy' }), true);
hargold.velocityX = 4; hargold.facing = 1;
const thrown = releaseCarried(hargold, hargoldAction, { throwObject: true });
assert.equal(thrown.id, 'rock');
assert.ok(thrown.velocityX > hargold.velocityX);

const platform = createKinematicSolid({ id: 'p', x: 0, y: 0, width: 2, height: 0.2 });
const delta = moveSolid(platform, 1, 0);
transportRider(hargold, delta);
assert.equal(inheritedPlatformVelocity(delta, dt).x, 120);
assert.equal(sweptSolidHit(platform, { x: 0.5, y: 0, width: 0.2, height: 0.2 }), true);

const gate = createCourseFatalGate();
const fatal = fatalHazardEvent('lava', 'pool-a');
assert.equal(gate.accept(fatal), true);
assert.equal(gate.accept(fatal), false);
assert.deepEqual(fatal.bypasses, ['hearts', 'invulnerability', 'activePowerUp']);

const intent = animationIntent(hargold, hargoldAction, { material: 'ice', slope: 0.1 });
assert.equal(intent.hero, 'Hargold');
assert.equal(intent.surfaceMaterial, 'ice');
assert.ok(Object.isFrozen(intent));

console.log('Reusable physics-system checks passed.');
