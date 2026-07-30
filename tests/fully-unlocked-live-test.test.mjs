import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GAME_RULES } from '../src/canonical-data.js';
import {
  FULLY_UNLOCKED_LIVE_TEST_PROFILE,
  applyFullyUnlockedLiveTestProfile,
  fullyUnlockedLiveTestEnabled
} from '../src/runtime/fully-unlocked-live-test.js';

assert.equal(fullyUnlockedLiveTestEnabled(new URLSearchParams()), false);
assert.equal(
  fullyUnlockedLiveTestEnabled(new URLSearchParams('fullyUnlocked=0')),
  false
);
for (const query of [
  'fullyUnlocked',
  'fullyUnlocked=1',
  'fullyUnlocked=true',
  'fullyUnlocked=yes',
  'fullyUnlocked=on'
]) {
  assert.equal(
    fullyUnlockedLiveTestEnabled(new URLSearchParams(query)),
    true,
    `${query} should activate the explicit test profile`
  );
}

const normalSession = {
  healthLayers: 1,
  maximumHealthLayers: 1,
  lives: GAME_RULES.health.defaultStartingLives,
  doubleJumpUnlocked: false
};
const unlockedSession = applyFullyUnlockedLiveTestProfile(
  { ...normalSession },
  {
    maximumHealthLayers: GAME_RULES.health.maximumSurvivableHealthLayers,
    maximumLives: GAME_RULES.health.maximumLives
  }
);

assert.deepEqual(normalSession, {
  healthLayers: 1,
  maximumHealthLayers: 1,
  lives: 3,
  doubleJumpUnlocked: false
});
assert.equal(
  unlockedSession.healthLayers,
  GAME_RULES.health.maximumSurvivableHealthLayers
);
assert.equal(
  unlockedSession.maximumHealthLayers,
  GAME_RULES.health.maximumSurvivableHealthLayers
);
assert.equal(unlockedSession.lives, GAME_RULES.health.maximumLives);
assert.equal(unlockedSession.doubleJumpUnlocked, true);
assert.equal(unlockedSession.testProfile, FULLY_UNLOCKED_LIVE_TEST_PROFILE.id);
assert.ok(FULLY_UNLOCKED_LIVE_TEST_PROFILE.abilities.includes('Mebble glide'));
assert.ok(FULLY_UNLOCKED_LIVE_TEST_PROFILE.abilities.includes('ground slam'));

const gameSource = await readFile(new URL('../src/game.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(gameSource, /fullyUnlockedLiveTestEnabled\(runtimeParameters\)/);
assert.match(gameSource, /doubleJumpUnlocked: session\.doubleJumpUnlocked/);
assert.match(gameSource, /maximumSurvivableHealthLayers/);
assert.match(gameSource, /maximumLives/);
assert.match(html, /id="test-mode-badge" hidden/);
assert.match(html, /FULLY UNLOCKED TEST/);

console.log('Fully unlocked live test-mode checks passed.');
