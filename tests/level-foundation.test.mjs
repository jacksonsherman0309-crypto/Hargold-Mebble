import assert from 'node:assert/strict';
import {
  MEADOW_WAKE_ENEMY_ACTORS,
  MEADOW_WAKE_LEVEL_DATA
} from '../src/content/meadow-wake-level-data.js';
import {
  createLevelDefinition,
  gameplayAreaAt,
  persistentStateIds,
  validateLevelDefinition
} from '../src/gameplay/levels/level-schema.js';
import {
  ACTOR_ACTIVATION_ENVELOPES,
  createActorActivationRuntime
} from '../src/gameplay/levels/actor-activation-runtime.js';
import {
  createRailFollower,
  stepRailFollower,
  validateRailDefinition
} from '../src/gameplay/levels/rail-runtime.js';

assert.equal(validateLevelDefinition(MEADOW_WAKE_LEVEL_DATA), true);
assert.equal(MEADOW_WAKE_LEVEL_DATA.strictSideScrollingPlane, true);
assert.equal(MEADOW_WAKE_LEVEL_DATA.gameplayAreas.length, 9);
assert.equal(MEADOW_WAKE_ENEMY_ACTORS.length, 5);
assert.ok(MEADOW_WAKE_LEVEL_DATA.actors.some(actor => actor.actorType === 'platform'));
assert.ok(MEADOW_WAKE_LEVEL_DATA.actors.some(actor => actor.actorType === 'collectible/compass-coin'));
assert.equal(MEADOW_WAKE_LEVEL_DATA.rails.length, 7);
assert.equal(gameplayAreaAt(MEADOW_WAKE_LEVEL_DATA, { x: 2, y: 0 }).id, 'camp-departure');
assert.ok(persistentStateIds(MEADOW_WAKE_LEVEL_DATA).includes('1-1-C1:collected'));
assert.equal(ACTOR_ACTIVATION_ENVELOPES.prewarmScreensAhead, 1.25);

const spawned = [];
const activated = [];
const slept = [];
const despawned = [];
const placements = [
  {
    id: 'near',
    actorType: 'enemy/test',
    position: { x: 15, y: 0, z: 0 },
    areaId: 'a',
    activationRules: { respawn: true }
  },
  {
    id: 'far',
    actorType: 'enemy/test',
    position: { x: 40, y: 0, z: 0 },
    areaId: 'b',
    activationRules: { respawn: true }
  },
  {
    id: 'collected',
    actorType: 'collectible/test',
    position: { x: 8, y: 0, z: 0 },
    areaId: 'a',
    persistentStateId: 'collected-state',
    activationRules: { respawn: false }
  }
];
const activation = createActorActivationRuntime(placements, {
  spawn: placement => {
    const instance = { id: placement.id };
    spawned.push(instance.id);
    return instance;
  },
  activate: instance => activated.push(instance.id),
  sleep: instance => slept.push(instance.id),
  despawn: instance => despawned.push(instance.id)
});

activation.update({
  cameraBounds: { minX: 0, maxX: 10 },
  scrollDirection: 1,
  persistentState: { 'collected-state': true }
});
assert.deepEqual(spawned, ['near']);
assert.deepEqual(activated, []);
assert.equal(activation.snapshot.find(actor => actor.actorId === 'near').status, 'prewarmed');
assert.equal(activation.snapshot.find(actor => actor.actorId === 'far').status, 'dormant');
assert.equal(activation.snapshot.find(actor => actor.actorId === 'collected').status, 'persistent-complete');

activation.update({ cameraBounds: { minX: 4, maxX: 14 }, scrollDirection: 1 });
assert.deepEqual(activated, ['near']);
activation.update({ cameraBounds: { minX: 25, maxX: 35 }, scrollDirection: 1 });
assert.ok(slept.includes('near'));
activation.update({ cameraBounds: { minX: 40, maxX: 50 }, scrollDirection: 1 });
assert.ok(despawned.includes('near'));

const testRail = validateRailDefinition({
  id: 'test-lift',
  loopMode: 'ping-pong',
  gameplayPlane: true,
  nodes: [
    { position: { x: 0, y: 0, z: 0 }, speed: 2, acceleration: 4, delay: 0, easing: 'linear' },
    { position: { x: 2, y: 0, z: 0 }, speed: 2, acceleration: 4, delay: 0, easing: 'linear' }
  ]
});
const followerA = createRailFollower(testRail);
const followerB = createRailFollower(testRail);
for (let index = 0; index < 120; index += 1) {
  stepRailFollower(followerA, 1 / 120);
  stepRailFollower(followerB, 1 / 120);
}
assert.deepEqual(followerA.position, followerB.position);
assert.equal(followerA.position.z, 0);
assert.ok(followerA.position.x > 0);

assert.throws(() => createLevelDefinition({
  id: 'invalid-depth',
  name: 'Invalid Depth',
  world: 1,
  terrainGeometry: { groundSurfaces: [] },
  visualEnvironment: { layers: [] },
  gameplayAreas: [{ id: 'a', bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 } }],
  actors: [{
    id: 'off-plane',
    actorType: 'test',
    position: { x: 0, y: 0, z: 1 },
    areaId: 'a'
  }],
  entrances: [],
  triggers: [],
  rails: [],
  cameraSettings: {},
  persistentState: {}
}), /strict side-scrolling gameplay plane/);

console.log('Level schema, camera-aware actor activation, and rail runtime checks passed.');
