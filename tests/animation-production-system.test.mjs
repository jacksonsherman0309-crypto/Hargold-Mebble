import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  IMPORTED_CHARACTER_ANIMATIONS,
  animationIntentFor,
  availableAnimationClips
} from '../src/animation/character-animation-config.js';
import {
  authoredLockedMeshyMotions
} from '../src/animation/locked-meshy-animation-library.js';
import {
  ANIMATION_VALIDATION_STATIONS,
  animationValidationStation
} from '../src/content/animation-validation-course.js';

const root = new URL('../', import.meta.url);
const capabilities = JSON.parse(await readFile(
  new URL('data/locked-meshy-animation-capabilities.json', root)
));
const mapping = JSON.parse(await readFile(
  new URL('data/animation-state-mapping.json', root)
));
const retarget = JSON.parse(await readFile(
  new URL('data/animation-retarget-map.json', root)
));
const rendererSource = await readFile(
  new URL('src/character-renderer.js', root),
  'utf8'
);

assert.equal(capabilities.visibleMeshReplacementAllowed, false);
assert.equal(capabilities.runtimeRootMotion, false);
assert.equal(capabilities.controllerOwnsWorldTranslation, true);
assert.equal(capabilities.heroes.Hargold.runtimePresentationClipCount, 37);
assert.equal(capabilities.heroes.Mebble.runtimePresentationClipCount, 39);
assert.equal(capabilities.heroes.Hargold.deformBoneCount, 24);
assert.equal(capabilities.heroes.Mebble.deformBoneCount, 24);
assert.equal(capabilities.heroes.Hargold.morphTargetCount, 0);
assert.equal(capabilities.heroes.Mebble.morphTargetCount, 0);
assert.ok(capabilities.missingFromLockedRig.facial.includes('mouth opening'));
assert.ok(capabilities.missingFromLockedRig.hands.includes('finger bones'));
assert.ok(capabilities.missingFromLockedRig.secondary.includes('cape-opening morph'));

for (const hero of ['Hargold', 'Mebble']) {
  const authored = authoredLockedMeshyMotions(hero);
  const clips = availableAnimationClips(hero);
  const expectedCount = hero === 'Hargold' ? 37 : 39;
  assert.equal(clips.length, expectedCount);
  assert.equal(
    authored.length,
    hero === 'Hargold' ? 35 : 37,
    `${hero} keeps two supplied locomotion clips plus its authored body package`
  );
  assert.equal(new Set(clips.map(clip => clip.id)).size, expectedCount);
  assert.ok(clips.some(clip => clip.id === `${hero.toLowerCase()}_walk` && clip.source === 'supplied-meshy'));
  assert.ok(clips.some(clip => clip.id === `${hero.toLowerCase()}_run` && clip.source === 'supplied-meshy'));
  assert.ok(authored.every(clip => clip.source === 'project-authored-additive-locked-meshy-rig'));
  assert.ok(authored.every(clip => clip.frames.length >= 2));
  assert.ok(authored.every(clip => clip.frames[0].time === 0));
  assert.ok(authored.every(clip => clip.frames.at(-1).time === 1));
}

assert.ok(IMPORTED_CHARACTER_ANIMATIONS.Hargold.clips.some(
  clip => clip.id === 'hargold_double_jump'
));
assert.ok(!IMPORTED_CHARACTER_ANIMATIONS.Mebble.clips.some(
  clip => clip.id === 'mebble_double_jump'
));
for (const clip of ['mebble_glide_open', 'mebble_glide_sustain', 'mebble_glide_close']) {
  assert.ok(IMPORTED_CHARACTER_ANIMATIONS.Mebble.clips.some(entry => entry.id === clip));
  assert.ok(!IMPORTED_CHARACTER_ANIMATIONS.Hargold.clips.some(entry => entry.id === clip));
}

const stateScenarios = [
  ['idle', 'hargold_idle'],
  ['walk', 'hargold_walk'],
  ['run', 'hargold_run'],
  ['skid', 'hargold_skid'],
  ['jump-startup', 'hargold_jump_anticipation'],
  ['rise', 'hargold_jump_rise'],
  ['apex', 'hargold_jump_apex'],
  ['fall', 'hargold_jump_fall'],
  ['twirl', 'hargold_air_spin'],
  ['double-jump', 'hargold_double_jump'],
  ['ground-slam-startup', 'hargold_ground_slam_start'],
  ['ground-slam-fall', 'hargold_ground_slam_fall'],
  ['ground-slam-impact', 'hargold_ground_slam_impact'],
  ['soft-land', 'hargold_land_soft'],
  ['hard-land', 'hargold_land_heavy'],
  ['damage', 'hargold_hurt'],
  ['dead', 'hargold_defeat'],
  ['victory', 'hargold_victory']
];
for (const [movementState, expectedClip] of stateScenarios) {
  assert.equal(animationIntentFor({
    hero: 'Hargold',
    movementState,
    stateSeconds: 1,
    airborneSeconds: 1,
    grounded: !['rise', 'apex', 'fall', 'twirl', 'double-jump'].includes(movementState)
  }).clipId, expectedClip);
}
assert.equal(animationIntentFor({
  hero: 'Hargold',
  movementState: 'rise',
  airborneSeconds: 0.08,
  verticalSpeed: -8,
  grounded: false
}).clipId, 'hargold_jump_takeoff');
assert.equal(animationIntentFor({
  hero: 'Mebble',
  movementState: 'glide'
}).clipId, 'mebble_glide_sustain');

assert.equal(mapping.controllerPolicy.manualSprintAction, false);
assert.equal(mapping.controllerPolicy.rootMotion, false);
assert.equal(mapping.controllerPolicy.locomotionPhaseSynchronization, true);
assert.match(mapping.requiredLiveStates.HargoldDoubleJump.status, /progression-gated/);
assert.match(mapping.requiredLiveStates.MebbleGlideOpen.status, /cape-deformation-blocked/);
assert.equal(retarget.rejectedProceduralCharacterPolicy.visibleMeshRuntimeUse, false);
assert.equal(retarget.rejectedProceduralCharacterPolicy.actionRetargetRuntimeUse, false);

assert.equal(ANIMATION_VALIDATION_STATIONS.length, 10);
assert.equal(animationValidationStation('missing').id, 'acceleration-skid-lane');
assert.ok(ANIMATION_VALIDATION_STATIONS.some(station => station.validates.includes('moving-platform')));
assert.ok(ANIMATION_VALIDATION_STATIONS.some(station => station.validates.includes('Hargold-double-jump')));
assert.ok(ANIMATION_VALIDATION_STATIONS.some(station => station.validates.includes('Mebble-glide')));
assert.ok(ANIMATION_VALIDATION_STATIONS.some(station => station.validates.includes('damage')));
assert.ok(ANIMATION_VALIDATION_STATIONS.every(
  station => station.spawnX >= 0 && station.spawnX <= 112
));

assert.match(rendererSource, /phaseSync/);
assert.match(rendererSource, /applyGroundContact/);
assert.match(rendererSource, /bindFootOffset/);
assert.match(rendererSource, /surfaceAngle/);
assert.doesNotMatch(rendererSource, /hargold_character\.glb/);
assert.doesNotMatch(rendererSource, /mebble_character\.glb/);

console.log('Locked Meshy animation production-system checks passed.');
