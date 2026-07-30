import assert from 'node:assert/strict';

import { createMob } from '../src/gameplay/enemies/mob-simulation.js';
import {
  createGroundSlamImpactPresentation,
  groundSlamImpactProfile,
  resolveGroundSlamMobImpacts
} from '../src/gameplay/movement/ground-slam-impact.js';

const presentation = createGroundSlamImpactPresentation({
  hero: 'Hargold',
  footX: 8,
  footY: 0,
  landingSpeed: 22,
  surfaceMaterial: 'grass',
  strength: 'heavy'
});
assert.equal(presentation.hero, 'Hargold');
assert.equal(presentation.surfaceMaterial, 'grass');
assert.ok(presentation.visualRadius > groundSlamImpactProfile('Mebble').visualRadius);
assert.ok(presentation.cameraShakePixels > 0);

const critter = createMob({ id: 'slam-critter', type: 'camp_critter', x: 8.45 });
const shellback = createMob({ id: 'slam-shellback', type: 'shellback', x: 8.92 });
const farCritter = createMob({ id: 'far-critter', type: 'camp_critter', x: 10 });
const results = resolveGroundSlamMobImpacts({
  hero: 'Hargold',
  footX: 8,
  footY: 0,
  mobs: [critter, shellback, farCritter]
});
assert.deepEqual(results.map(result => result.outcome), ['defeat', 'shell-retracted']);
assert.equal(critter.alive, false);
assert.equal(shellback.state, 'shell-idle');
assert.equal(farCritter.alive, true);

const mebbleNear = createMob({ id: 'mebble-near', type: 'camp_critter', x: 4.75 });
const mebbleFar = createMob({ id: 'mebble-far', type: 'camp_critter', x: 4.9 });
const mebbleResults = resolveGroundSlamMobImpacts({
  hero: 'Mebble',
  footX: 4,
  footY: 0,
  mobs: [mebbleNear, mebbleFar]
});
assert.deepEqual(mebbleResults.map(result => result.mobId), ['mebble-near']);

const spike = createMob({ id: 'slam-spike', type: 'spike_beetle', x: 2.1 });
assert.equal(resolveGroundSlamMobImpacts({
  hero: 'Hargold',
  footX: 2,
  footY: 0,
  mobs: [spike]
})[0].outcome, 'damage-player');

console.log('Ground-slam impact presentation and world-specific mob contact checks passed.');
