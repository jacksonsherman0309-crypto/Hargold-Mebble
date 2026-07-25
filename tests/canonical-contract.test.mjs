import assert from 'node:assert/strict';
import { CAMPAIGN, GAME_RULES, LOCKED_HERO_DESIGN, getLevel, getWorld } from '../src/canonical-data.js';

const sum = values => values.reduce((total, value) => total + value, 0);

assert.equal(CAMPAIGN.length, 10, 'campaign must contain 10 worlds');
assert.equal(sum(CAMPAIGN.map(world => world.levels.length)), 90, 'campaign must contain 90 completion slots');
assert.equal(
  sum(CAMPAIGN.flatMap(world => world.levels).map(() => GAME_RULES.collectibles.perLevel)),
  270,
  'campaign must contain 270 Compass Coin slots'
);

assert.deepEqual(GAME_RULES.campaign.difficultyModes, ['Easy', 'Normal', 'Hard', 'Nightmare']);
assert.deepEqual(GAME_RULES.movement.wallJump, { Hargold: true, Mebble: true });
assert.equal(GAME_RULES.movement.allRequiredJumpsReachableByHargold, true);
assert.equal(GAME_RULES.movement.sharedHorizontalBaseTuning, true);
assert.deepEqual(GAME_RULES.movement.locomotionTargets, ['walk', 'run', 'sprint']);
assert.ok(GAME_RULES.movement.requiredCharacterStates.includes('crawl'));
assert.ok(GAME_RULES.movement.requiredCharacterStates.includes('victory'));
assert.equal(GAME_RULES.heroGating.avoidRepeatedMainRouteBacktrackingSwaps, true);
assert.deepEqual(GAME_RULES.levelConstruction.supportedTerrainRatio, { minimum: 0.8, maximum: 0.9 });
assert.deepEqual(GAME_RULES.levelConstruction.pitRatio, { minimum: 0.1, maximum: 0.2 });
assert.equal(GAME_RULES.levelConstruction.individuallyAuthoredCourses, true);
assert.ok(GAME_RULES.levelConstruction.mechanismTypes.includes('seesaw'));
assert.equal(getLevel('1-1').foregroundDirective.targetSupportedTerrainRatio, 0.85);
assert.deepEqual(
  GAME_RULES.platform.gameplayReadabilityScale.hargoldApproximateCommonEnemyHeights,
  { minimum: 2, maximum: 3 }
);
assert.equal(GAME_RULES.platform.gameplayReadabilityScale.terrainBlocksAreCollisionBearing, true);
assert.equal(GAME_RULES.platform.gameplayReadabilityScale.visiblePlatformsAreCollisionBearing, true);

assert.equal(GAME_RULES.health.heartsAndLivesSeparate, true);
assert.equal(GAME_RULES.health.maximumSurvivableHealthLayers, 3);
assert.equal(GAME_RULES.health.maximumLives, 99);
assert.equal(GAME_RULES.health.coinsPerExtraLife, 100);
assert.deepEqual(GAME_RULES.health.instantDeathHazards, ['pit', 'lava', 'poison']);

assert.equal(GAME_RULES.blocks.exactStandardTypeCount, 4);
assert.equal(GAME_RULES.blocks.types.length, 4);
assert.equal(sum(Object.values(GAME_RULES.blocks.coinRewardPercentages)), 100);
assert.deepEqual(GAME_RULES.blocks.coinRewardPercentages, { 1: 78, 5: 14, 10: 7, 100: 1 });

assert.equal(GAME_RULES.bosses.requiredDamageEvents, 5);
assert.equal(GAME_RULES.bosses.ultraRarePowerUpAllowed, false);
assert.equal(GAME_RULES.combat.campChipperOneHit, true);
assert.equal(GAME_RULES.combat.heavyRockEnemiesRequireHargoldGroundSlam, true);

assert.equal(getWorld(1)?.name, 'Verdant Vale');
assert.equal(getWorld(6)?.name, 'Overgrown Grove');
assert.equal(getWorld(7)?.boss, 'Fen Phantasm');
assert.equal(getLevel('1-1')?.name, 'Meadow Wake');
assert.equal(getLevel('1-8')?.boss, 'Verdant Wyrm');
assert.equal(getLevel('1-9')?.secret, true);

assert.match(LOCKED_HERO_DESIGN.Mebble.definingFeatures.join(' '), /Adam/);
assert.match(LOCKED_HERO_DESIGN.Hargold.build, /very short/);
assert.equal(LOCKED_HERO_DESIGN.Hargold.reference, 'assets/references/Hargold locked production character sheet.png');
assert.equal(LOCKED_HERO_DESIGN.Mebble.reference, 'assets/references/Mebble locked production character sheet.png');
assert.match(LOCKED_HERO_DESIGN.Hargold.clothing.join(' '), /backpack/);
assert.match(LOCKED_HERO_DESIGN.Mebble.clothing.join(' '), /double belts/);
assert.match(LOCKED_HERO_DESIGN.Hargold.productionModel.join(' '), /new geometry/);
assert.match(LOCKED_HERO_DESIGN.Hargold.productionModel.join(' '), /continuous skinned/);
assert.match(LOCKED_HERO_DESIGN.Mebble.productionModel.join(' '), /no rigid segmented limbs/);
assert.match(LOCKED_HERO_DESIGN.Mebble.productionAnimation.join(' '), /new gameplay clips/);
assert.match(LOCKED_HERO_DESIGN.Hargold.gameplay.join(' '), /exclusive learned double jump/);

for (const world of CAMPAIGN) {
  assert.equal(world.routeStructure.mainCompletionSlots, 8);
  assert.equal(world.routeStructure.forkSlotHasTwoAlternativeRoutes, true);
  assert.equal(world.routeStructure.secretNinthSlot, true);
  assert.equal(world.routeStructure.hiddenExitCount, 1);
  assert.equal(world.routeStructure.compassCoinsPerCompletionSlot, 3);

  for (const level of world.levels) {
    if (world.number !== 1) {
      assert.equal(level.strictSideScrollingPlane, true);
      assert.equal(level.wallJumpAvailableToBothHeroes, true);
      assert.equal(level.hargoldRequiredJumpReachability, true);
      assert.equal(level.avoidRepeatedMainRouteSwapping, true);
    }
  }
}

console.log('Canonical Hargold & Mebble contract checks passed.');
