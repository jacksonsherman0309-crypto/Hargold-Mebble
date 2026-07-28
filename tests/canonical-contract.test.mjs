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
assert.deepEqual(GAME_RULES.movement.wallJump, {
  Hargold: false,
  Mebble: false,
  status: 'not-enabled-without-a-future-explicit-rule'
});
assert.equal(GAME_RULES.movement.allRequiredJumpsReachableByHargold, true);
assert.equal(GAME_RULES.movement.sharedHorizontalBaseTuning, true);
assert.deepEqual(GAME_RULES.movement.locomotionTargets, ['walk', 'run', 'sprint']);
assert.ok(GAME_RULES.movement.requiredCharacterStates.includes('crawl'));
assert.ok(GAME_RULES.movement.requiredCharacterStates.includes('victory'));
assert.deepEqual(GAME_RULES.movement.airTwirl, {
  universalBeforeHargoldDoubleJumpUnlock: true,
  input: 'fresh airborne jump press',
  oncePerAirborneSequence: true,
  boundedHangTime: true,
  grantsAdditionalJump: false
});
assert.deepEqual(
  GAME_RULES.movement.groundSlam.phases,
  ['startup', 'descent', 'impact', 'recovery']
);
assert.equal(GAME_RULES.heroGating.avoidRepeatedMainRouteBacktrackingSwaps, true);
assert.equal(GAME_RULES.characterPresentation.construction, 'complete-3d-skinned-models');
assert.equal(GAME_RULES.characterPresentation.classification, '2.75D');
assert.equal(
  GAME_RULES.characterPresentation.orientation.mode,
  'true-side-primary-with-small-action-reveal'
);
assert.equal(GAME_RULES.characterPresentation.orientation.cameraBiasDegrees, 6);
assert.equal(GAME_RULES.characterPresentation.orientation.revealDegreesByAction.sprint, 3);
assert.equal(GAME_RULES.characterPresentation.orientation.revealDegreesByAction['turn-low'], 12);
assert.equal(GAME_RULES.characterPresentation.orientation.turnTowardCameraForReadability, true);
assert.equal(
  GAME_RULES.characterPresentation.orientation.negativeScaleMirroringForbidden,
  true
);
assert.deepEqual(
  GAME_RULES.characterPresentation.gameplayScale.heroHeightMetres,
  { Hargold: 1.82, Mebble: 2.2932 }
);
assert.equal(GAME_RULES.characterPresentation.gameplayScale.gamePixelsPerMetre, 70);
assert.equal(GAME_RULES.characterPresentation.gameplayScale.finalBlenderAssetsMustUseGameplayMetres, true);
assert.equal(GAME_RULES.characterPresentation.animationFrames.authority, 'compact-tall-locked-animation-frames-v2');
assert.equal(GAME_RULES.characterPresentation.animationFrames.panelContract.fixedCameraAcrossHeroesAndRows, true);
assert.equal(GAME_RULES.characterPresentation.animationFrames.panelContract.fittedOverlayOpacity, 0.4);
assert.equal(GAME_RULES.characterPresentation.animationFrames.panelContract.maximumJointErrorFractionOfHeight, 0.03);
assert.equal(GAME_RULES.characterPresentation.animationFrames.panelContract.tallHeightRelativeToCompact, 1.26);
assert.equal(GAME_RULES.characterPresentation.animationFrames.approvalRows.length, 20);
assert.equal(GAME_RULES.characterPresentation.animationFrames.Hargold.frame, 'compact');
assert.equal(GAME_RULES.characterPresentation.animationFrames.Mebble.frame, 'tall');
assert.deepEqual(
  GAME_RULES.characterPresentation.animation.distinctJumpStages,
  ['anticipation', 'takeoff', 'ascent', 'apex', 'descent', 'contact', 'compression', 'recovery']
);
assert.equal(GAME_RULES.movement.hargoldDoubleJump.learnedSkill, true);
assert.equal('mebbleDoubleJump' in GAME_RULES.movement, false);
assert.deepEqual(GAME_RULES.levelConstruction.supportedTerrainRatio, { minimum: 0.8, maximum: 0.9 });
assert.deepEqual(GAME_RULES.levelConstruction.pitRatio, { minimum: 0.1, maximum: 0.2 });
assert.equal(GAME_RULES.levelConstruction.individuallyAuthoredCourses, true);
assert.ok(GAME_RULES.levelConstruction.mechanismTypes.includes('seesaw'));
assert.equal(
  GAME_RULES.levelConstruction.environmentPresentation.minimumVisualBenchmark,
  'approved-Meadow-Wake-reference-image'
);
assert.equal(
  GAME_RULES.levelConstruction.environmentPresentation.wholeCourseConsistencyRequired,
  true
);
assert.equal(
  GAME_RULES.levelConstruction.environmentPresentation.proceduralReplacementForbidden,
  true
);
assert.equal(
  GAME_RULES.levelConstruction.environmentPresentation.outdoorGameplayRoomsRequired,
  true
);
assert.equal(
  GAME_RULES.levelConstruction.environmentPresentation.heroLandmarkPerRoomRequired,
  true
);
assert.equal(
  GAME_RULES.levelConstruction.environmentPresentation.landmarksMustConnectToCollisionBearingTraversal,
  true
);
assert.equal(
  GAME_RULES.levelConstruction.environmentPresentation.blocksMustBelongToNamedGameplayPhrases,
  true
);
assert.equal(getLevel('1-1').foregroundDirective.targetSupportedTerrainRatio, 0.85);
assert.equal(getLevel('1-1').foregroundDirective.authoredVisualBeatCount, 7);
assert.deepEqual(
  getLevel('1-1').foregroundDirective.connectedGroundProgressionRatio,
  { minimum: 0.65, maximum: 0.75 }
);
assert.deepEqual(
  getLevel('1-1').foregroundDirective.authoredRouteComposition,
  {
    connectedGround: 0.7,
    optionalElevated: 0.2,
    dedicatedPlatformSequences: 0.1
  }
);
assert.ok(
  Math.abs(
    Object.values(getLevel('1-1').foregroundDirective.authoredRouteComposition)
      .reduce((total, ratio) => total + ratio, 0) - 1
  ) < 1e-9
);
assert.equal(getLevel('1-1').foregroundDirective.authoredTraversalPhaseCount, 9);
assert.equal(getLevel('1-1').foregroundDirective.authoredOutdoorRoomCount, 12);
assert.deepEqual(
  getLevel('1-1').foregroundDirective.heroLandmarkCadenceSeconds,
  { minimum: 8, maximum: 10 }
);
assert.equal(getLevel('1-1').foregroundDirective.outdoorRooms.length, 12);
assert.equal(getLevel('1-1').foregroundDirective.landmarkDrivenTraversal, true);
assert.equal(getLevel('1-1').foregroundDirective.blocksUseNamedGameplayPhrases, true);
assert.equal(getLevel('1-1').foregroundDirective.trueGapClusters.length, 3);
assert.equal(getLevel('1-1').foregroundDirective.finishAllSectionsToSharedQualityFloor, true);
assert.deepEqual(
  GAME_RULES.platform.gameplayReadabilityScale.hargoldApproximateCommonEnemyHeights,
  { minimum: 2, maximum: 3 }
);
assert.equal(GAME_RULES.platform.gameplayReadabilityScale.terrainBlocksAreCollisionBearing, true);
assert.equal(GAME_RULES.platform.gameplayReadabilityScale.visiblePlatformsAreCollisionBearing, true);
assert.equal(GAME_RULES.movement.architecture.simulationAuthority, 'deterministic-fixed-step-velocity-controller');
assert.deepEqual(
  GAME_RULES.movement.architecture.collisionProbes.foot,
  ['left-heel', 'center-foot', 'right-toe']
);
assert.equal(GAME_RULES.movement.architecture.collisionProbes.wall.length, 6);
assert.ok(GAME_RULES.movement.architecture.hierarchy.airborne.includes('hargold-double-jump'));
assert.ok(GAME_RULES.movement.architecture.hierarchy.airborne.includes('mebble-cape-glide'));
assert.equal(GAME_RULES.levelConstruction.cameraAwareActorActivation, true);
assert.equal(GAME_RULES.levelConstruction.nodeBasedPaths, true);
assert.deepEqual(GAME_RULES.levelConstruction.runtimeDataLayers, [
  'terrain-geometry',
  'visual-environment',
  'gameplay-areas',
  'actors',
  'entrances-and-exits',
  'trigger-ranges',
  'rails-and-paths',
  'camera-settings',
  'persistent-state'
]);

assert.equal(GAME_RULES.health.heartsAndLivesSeparate, true);
assert.equal(GAME_RULES.health.maximumSurvivableHealthLayers, 3);
assert.equal(GAME_RULES.health.maximumLives, 99);
assert.equal(GAME_RULES.health.coinsPerExtraLife, 100);
assert.deepEqual(GAME_RULES.health.instantDeathHazards, ['pit', 'lava', 'poison']);

assert.equal(GAME_RULES.blocks.exactStandardTypeCount, 4);
assert.equal(GAME_RULES.blocks.types.length, 4);
assert.equal(GAME_RULES.blocks.standardBreakRequiresApprovedStrengthOrAction, true);
assert.equal(GAME_RULES.blocks.hargoldOnlyRejectsMebble, true);
assert.equal(GAME_RULES.blocks.rollingShellBreaksStandardOnly, true);
assert.equal(GAME_RULES.blocks.spentRewardBlocksRemainSolid, true);
assert.equal(GAME_RULES.blocks.hiddenBlocksBecomeSolidOnReveal, true);
assert.deepEqual(GAME_RULES.blocks.requiredFeedback, [
  'bump-displacement',
  'squash-recovery',
  'impact-response',
  'outcome-specific-reward-or-debris'
]);
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
assert.equal(
  LOCKED_HERO_DESIGN.Hargold.approvedProductionTarget,
  'assets/references/Hargold and Mebble approved production target.png'
);
assert.equal(
  LOCKED_HERO_DESIGN.Hargold.approvedProductionTargetSha256,
  LOCKED_HERO_DESIGN.Mebble.approvedProductionTargetSha256
);
assert.match(LOCKED_HERO_DESIGN.Hargold.clothing.join(' '), /backpack/);
assert.match(LOCKED_HERO_DESIGN.Mebble.clothing.join(' '), /double belts/);
assert.match(LOCKED_HERO_DESIGN.Hargold.productionModel.join(' '), /new original artist-authored geometry/);
assert.match(LOCKED_HERO_DESIGN.Hargold.productionModel.join(' '), /continuous skinned/);
assert.match(LOCKED_HERO_DESIGN.Mebble.productionModel.join(' '), /no rigid segmented limbs/);
assert.match(LOCKED_HERO_DESIGN.Mebble.productionModel.join(' '), /empty Blender scene/);
assert.ok(LOCKED_HERO_DESIGN.Hargold.productionModel.includes('100–150 pixel silhouette approval'));
assert.ok(LOCKED_HERO_DESIGN.Hargold.productionModel.includes('deformable shoulder volume with separated arms'));
assert.ok(LOCKED_HERO_DESIGN.Mebble.productionModel.includes('100–150 pixel silhouette approval'));
assert.ok(LOCKED_HERO_DESIGN.Mebble.productionModel.includes('glasses offset from the face and curved cape shoulder yoke'));
assert.match(LOCKED_HERO_DESIGN.Mebble.productionAnimation.join(' '), /new original gameplay clips/);
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
      assert.equal(level.wallJumpAvailableToBothHeroes, false);
      assert.equal(level.hargoldRequiredJumpReachability, true);
      assert.equal(level.avoidRepeatedMainRouteSwapping, true);
    }
  }
}

console.log('Canonical Hargold & Mebble contract checks passed.');
