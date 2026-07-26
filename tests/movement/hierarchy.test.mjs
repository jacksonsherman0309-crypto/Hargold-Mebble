import assert from 'node:assert/strict';
import {
  executeMovementState,
  MOVEMENT_BRANCHES,
  MOVEMENT_STATE_DEFINITIONS,
  MOVEMENT_STATE_GRAPH,
  MOVEMENT_STATES,
  transitionMovementState
} from '../../src/gameplay/movement/movement-state-machine.js';
import {
  MOVEMENT_PARAMETER_SCHEMA,
  selectHorizontalResponse,
  TERRAIN_RESPONSE_PROFILES
} from '../../src/gameplay/movement/movement-parameters.js';
import {
  buildMovementContactSnapshot,
  MOVEMENT_SENSOR_LAYOUT
} from '../../src/gameplay/movement/movement-sensors.js';
import { MOVEMENT_TUNING } from '../../src/gameplay/movement/movement-tuning.js';
import { createUnifiedCharacterState } from '../../src/gameplay/movement/unified-character-controller.js';

assert.ok(MOVEMENT_STATE_GRAPH[MOVEMENT_BRANCHES.GROUNDED].includes(MOVEMENT_STATES.IDLE));
assert.ok(MOVEMENT_STATE_GRAPH[MOVEMENT_BRANCHES.GROUNDED].includes(MOVEMENT_STATES.DUCK_SLIDE));
assert.ok(MOVEMENT_STATE_GRAPH[MOVEMENT_BRANCHES.AIRBORNE].includes(MOVEMENT_STATES.DOUBLE_JUMP));
assert.ok(MOVEMENT_STATE_GRAPH[MOVEMENT_BRANCHES.AIRBORNE].includes(MOVEMENT_STATES.GLIDE));
assert.ok(MOVEMENT_STATE_GRAPH[MOVEMENT_BRANCHES.SPECIAL].includes(MOVEMENT_STATES.WALL_CONTACT));
assert.ok(MOVEMENT_STATE_GRAPH[MOVEMENT_BRANCHES.SPECIAL].includes(MOVEMENT_STATES.TRANSITION));

for (const definition of Object.values(MOVEMENT_STATE_DEFINITIONS)) {
  assert.equal(typeof definition.enter, 'function');
  assert.equal(typeof definition.update, 'function');
  assert.equal(typeof definition.exit, 'function');
  assert.ok(definition.transitions.length > 0);
  assert.equal(typeof definition.animation.clip, 'string');
  assert.equal(typeof definition.collision.feet, 'string');
  assert.equal(typeof definition.inputs.pause, 'boolean');
  assert.ok(Array.isArray(definition.soundHooks));
  assert.ok(Array.isArray(definition.effectHooks));
}

const lifecycleState = createUnifiedCharacterState();
const lifecycleEvents = [];
transitionMovementState(lifecycleState, MOVEMENT_STATES.WALK, (type, detail) => {
  lifecycleEvents.push({ type, detail });
});
executeMovementState(lifecycleState);
assert.equal(lifecycleState.movementBranch, MOVEMENT_BRANCHES.GROUNDED);
assert.equal(lifecycleState.animationSelection, 'walk');
assert.ok(lifecycleEvents.some(event => event.type === 'state-exited'));
assert.ok(lifecycleEvents.some(event => event.type === 'state-entered'));
assert.ok(lifecycleEvents.some(event => event.type === 'state-changed'));

assert.deepEqual(MOVEMENT_PARAMETER_SCHEMA.speedTiers, ['walkSpeed', 'runSpeed', 'sprintSpeed']);
for (const id of [
  'normal',
  'dirt',
  'sand',
  'snow',
  'ice',
  'low-slip',
  'wood',
  'conveyor',
  'shallow-water',
  'sinking-terrain'
]) {
  assert.ok(TERRAIN_RESPONSE_PROFILES[id], `missing terrain response ${id}`);
}
const iceRelease = selectHorizontalResponse({
  velocityX: 4,
  direction: 0,
  targetSpeed: MOVEMENT_TUNING.runSpeed,
  terrain: TERRAIN_RESPONSE_PROFILES.ice
});
const normalRelease = selectHorizontalResponse({
  velocityX: 4,
  direction: 0,
  targetSpeed: MOVEMENT_TUNING.runSpeed,
  terrain: TERRAIN_RESPONSE_PROFILES.normal
});
assert.equal(iceRelease.case, 'no-input');
assert.ok(iceRelease.acceleration < normalRelease.acceleration);

assert.equal(MOVEMENT_SENSOR_LAYOUT.foot.length, 3);
assert.equal(MOVEMENT_SENSOR_LAYOUT.wall.length, 6);
assert.equal(MOVEMENT_SENSOR_LAYOUT.head.length, 3);
const sensorState = createUnifiedCharacterState({ footX: 2, footY: 0 });
const sensorResult = buildMovementContactSnapshot(sensorState, {
  groundHeightAt: () => 0,
  hasGroundAt: () => true,
  surfaceAt: () => ({
    id: 'dirt-ground',
    angle: 0.1,
    normal: { x: 0.1, y: -0.995 },
    material: 'dirt'
  }),
  wallAt: point => point.side === 'right' && point.id === 'right-middle'
    ? { id: 'wall-a' }
    : null,
  headAt: point => point.id === 'head-center' ? { id: 'ceiling-a' } : null,
  movingPlatformAt: () => ({ id: 'lift-a', velocityX: 1.2, velocityY: -0.4 })
});
assert.equal(sensorResult.contacts.grounded, true);
assert.equal(sensorResult.contacts.terrainMaterial, 'dirt');
assert.equal(sensorResult.contacts.wallContact.right, true);
assert.equal(sensorResult.contacts.ceilingContact, true);
assert.deepEqual(sensorResult.contacts.movingPlatformVelocity, { x: 1.2, y: -0.4 });

console.log('Hierarchical movement, terrain-response, and multi-probe sensor checks passed.');
