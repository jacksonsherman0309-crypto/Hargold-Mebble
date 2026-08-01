import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { TOTAL_COMPLETION_SLOTS } from '../src/campaign-level-count.js';
import {
  MEADOW_WAKE_AUTHORED_TERRAIN_SHAPES,
  MEADOW_WAKE_BLOCK_DEFINITIONS,
  MEADOW_WAKE_COMPASS_COIN_DEFINITIONS,
  MEADOW_WAKE_GAMEPLAY_ROOMS,
  MEADOW_WAKE_PITS,
  MEADOW_WAKE_PLATFORMS,
  MEADOW_WAKE_TERRAIN_MODULES
} from '../src/content/meadow-wake-course.js';
import {
  MEADOW_WAKE_SCENERY_PROPS,
  MEADOW_WAKE_TERRAIN_ANCHORS
} from '../src/content/meadow-wake-scenery.js';
import { HERO_PROFILES } from '../src/gameplay/movement/hero-profiles.js';
import { MOVEMENT_TUNING } from '../src/gameplay/movement/movement-tuning.js';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../index.html');
const styles = read('../styles.css');
const game = read('../src/game.js');
const foreground = read('../src/environment/meadow-wake-foreground.js');
const terrainKit = read('../src/environment/verdant-vale-terrain-kit.js');
const campaignCounts = read('../src/campaign-level-count.js');

assert.equal(TOTAL_COMPLETION_SLOTS, 83);
assert.doesNotMatch(campaignCounts, /TOTAL_COMPLETION_SLOTS\s*=\s*90/);
assert.equal(MEADOW_WAKE_GAMEPLAY_ROOMS.length, 12);
assert.equal(MEADOW_WAKE_COMPASS_COIN_DEFINITIONS.length, 3);
const compassRouteLandings = new Map([
  ['fallen-log-upper-arc', 'fallen-log-launch'],
  ['shellback-breakable-upper-route', 'shellback-upper-route-b'],
  ['interrupted-low-trail-creek-shelf', 'concealed-creek-shelf']
]);
for (const compass of MEADOW_WAKE_COMPASS_COIN_DEFINITIONS) {
  const landing = MEADOW_WAKE_PLATFORMS.find(platform => platform.id === compassRouteLandings.get(compass.solution));
  assert.ok(landing, `${compass.id} must retain its authored route landing`);
  assert.ok(Math.abs(landing.x - compass.x) <= landing.width / 2, `${compass.id} must remain horizontally supported`);
}
assert.equal(Object.keys(MEADOW_WAKE_AUTHORED_TERRAIN_SHAPES).length, MEADOW_WAKE_TERRAIN_MODULES.length);
assert.ok(MEADOW_WAKE_TERRAIN_MODULES.every(module => (
  module.lowerProfile.length >= 5
  && Math.max(...module.lowerProfile) - Math.min(...module.lowerProfile) >= 0.14
)));
assert.match(terrainKit, /recessed-visible-subsoil-mass/);
assert.match(foreground, /recessed-irregular-subsoil-mass/);
assert.match(foreground, /lodge-tailored-draped-canvas-roof/);
assert.match(foreground, /lodge-fieldstone-foundation/);
assert.match(foreground, /lodge-forged-joint-fastener/);
assert.match(foreground, /lodge-grounded-entry-step/);

assert.ok(MEADOW_WAKE_SCENERY_PROPS.every(prop => (
  prop.assetStatus === 'authored-original-runtime-mesh'
  && prop.temporaryProxy === false
)));
assert.ok(MEADOW_WAKE_TERRAIN_ANCHORS.every(anchor => anchor.temporaryProxy === false));

assert.deepEqual(
  new Set(MEADOW_WAKE_BLOCK_DEFINITIONS.map(block => block.type)),
  new Set(['standard-breakable', 'coin', 'power-up', 'hargold-only'])
);
assert.ok(MEADOW_WAKE_BLOCK_DEFINITIONS.some(block => block.type === 'standard-breakable'));

const primaryControls = html.match(/<div class="controls"[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? '';
assert.match(primaryControls, /data-action="left"/);
assert.match(primaryControls, /data-action="right"/);
assert.match(primaryControls, /data-action="jump"/);
assert.doesNotMatch(primaryControls, /data-action="restart"/);
assert.match(html, /id="course-menu"[\s\S]*data-action="restart"/);
assert.doesNotMatch(html, /data-action="sprint"/);
assert.match(styles, /width: clamp\(48px, 4\.2vw, 64px\)/);
assert.match(styles, /width: clamp\(64px, 5\.3vw, 80px\)/);
assert.match(styles, /env\(safe-area-inset-bottom\)/);
assert.match(game, /presentationDebugEnabled/);
assert.match(game, /Debug roster:/);
assert.doesNotMatch(game, /Verdant Vale roster: Critter \+ Shellback/);
assert.match(game, /movementLookAhead/);
assert.match(game, /cameraSurfaceY \* SCALE - H \* 0\.66/);

const normalJumpSpeed = MOVEMENT_TUNING.baseJumpSpeed + MOVEMENT_TUNING.runningJumpBonus;
for (const [hero, profile] of Object.entries(HERO_PROFILES)) {
  const launchSpeed = normalJumpSpeed + profile.jumpSpeedAddition;
  const conservativeAirTime = launchSpeed / MOVEMENT_TUNING.fallGravity * 2;
  const conservativeHorizontalReach = MOVEMENT_TUNING.airMaximumSprintSpeed * conservativeAirTime;
  for (const pit of MEADOW_WAKE_PITS.filter(entry => !entry.bridged)) {
    assert.ok(
      pit.to - pit.from < conservativeHorizontalReach,
      `${hero} must retain a normal-jump solution across ${pit.id}`
    );
  }
}

console.log('Meadow Wake terrain-correction presentation and route checks passed.');
