import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { MOVEMENT_TUNING } from '../src/gameplay/movement/movement-tuning.js';
import { HERO_PROFILES } from '../src/gameplay/movement/hero-profiles.js';

const root = new URL('../', import.meta.url);
const source = await readFile(
  new URL('data/character-animation-numeric-spec.json', root),
  'utf8'
);
const spec = JSON.parse(source);

assert.equal(spec.schemaVersion, 1);
assert.equal(spec.status, 'approved-original-project-authored-animation-contract');
assert.equal(spec.cleanRoomBoundary.externalAnimationAssetsAllowed, false);
assert.equal(spec.cleanRoomBoundary.externalClipInspectionRequired, false);
assert.equal(spec.cleanRoomBoundary.externalPoseMatchingRequired, false);
assert.equal(spec.cleanRoomBoundary.visibleMeshReplacementAllowed, false);
assert.equal(spec.cleanRoomBoundary.rigReplacementAllowed, false);
assert.equal(spec.cleanRoomBoundary.rootMotionAllowed, false);
assert.equal(spec.timing.controllerOwnsWorldTranslation, true);
assert.equal(spec.timing.simulationHz, MOVEMENT_TUNING.simulationHz);
assert.equal(spec.timing.animationAuthoringFps, 60);
assert.equal(spec.timing.simulationStepsPerAnimationFrame, 2);

assert.equal(spec.heroes.Hargold.heightMetres, HERO_PROFILES.Hargold.height);
assert.equal(spec.heroes.Mebble.heightMetres, HERO_PROFILES.Mebble.height);
assert.equal(
  spec.heroes.Mebble.jumpSpeedAdditionMetresPerSecond,
  HERO_PROFILES.Mebble.jumpSpeedAddition
);

const speeds = spec.controller.speedMetresPerSecond;
assert.equal(speeds.walk, MOVEMENT_TUNING.walkSpeed);
assert.equal(speeds.run, MOVEMENT_TUNING.runSpeed);
assert.equal(speeds.fullSpeed, MOVEMENT_TUNING.sprintSpeed);
assert.equal(speeds.fullSpeedEntry, MOVEMENT_TUNING.sprintEntrySpeed);
assert.equal(speeds.crawl, MOVEMENT_TUNING.crawlSpeed);

const response = spec.controller.responseMetresPerSecondSquared;
assert.equal(response.fromRest, MOVEMENT_TUNING.accelerationFromRest);
assert.equal(response.whileMoving, MOVEMENT_TUNING.accelerationWhileMoving);
assert.equal(response.fullSpeed, MOVEMENT_TUNING.groundAccelerationSprint);
assert.equal(response.release, MOVEMENT_TUNING.releaseDeceleration);
assert.equal(response.oppositeInput, MOVEMENT_TUNING.highSpeedSkidDeceleration);
assert.equal(response.slide, MOVEMENT_TUNING.slideFriction);

const thresholds = spec.controller.thresholdMetresPerSecond;
assert.equal(thresholds.skidEntry, MOVEMENT_TUNING.skidThreshold);
assert.equal(thresholds.skidExit, MOVEMENT_TUNING.skidExitSpeed);
assert.equal(thresholds.slideEntry, MOVEMENT_TUNING.slideMinimumSpeed);
assert.equal(thresholds.slideExit, MOVEMENT_TUNING.slideExitSpeed);
assert.equal(thresholds.hardLanding, MOVEMENT_TUNING.hardLandingSpeed);

for (const markers of Object.values(spec.locomotion.phaseMarkers)) {
  assert.equal(markers[0], 0);
  assert.equal(markers[4], 0.5);
  assert.equal(markers.at(-1), 1);
}

for (const hero of ['Hargold', 'Mebble']) {
  for (const gait of ['walk', 'run', 'fullSpeed']) {
    const definition = spec.locomotion.cycles[hero][gait];
    assert.ok(definition.frames > 0);
    assert.ok(definition.distanceMetres > 0);
    assert.ok(definition.authoredSpeed > 0);
    assert.ok(
      Math.abs(
        definition.distanceMetres -
        definition.seconds * definition.authoredSpeed
      ) < 0.00001,
      `${hero} ${gait} cycle distance matches authored speed and duration`
    );
  }
}

const slam = spec.actions.groundSlam;
assert.equal(slam.sharedFeetDown, true);
assert.ok(slam.forbidden.includes('belly-first'));
assert.ok(slam.forbidden.includes('fist-first'));
assert.equal(slam.physics.bufferSeconds, MOVEMENT_TUNING.groundSlamInputBufferSeconds);
assert.equal(slam.physics.minimumAirSeconds, MOVEMENT_TUNING.minimumGroundSlamAirSeconds);
assert.equal(slam.physics.clearanceMetres, MOVEMENT_TUNING.minimumGroundSlamClearance);
assert.equal(slam.physics.startupSeconds, MOVEMENT_TUNING.groundSlamPrepareSeconds);
assert.equal(slam.physics.acceleration, MOVEMENT_TUNING.groundSlamAcceleration);
assert.equal(slam.physics.initialSpeed, MOVEMENT_TUNING.groundSlamSpeed);
assert.equal(slam.physics.maximumSpeed, MOVEMENT_TUNING.groundSlamMaximumSpeed);
assert.equal(slam.physics.horizontalBrake, MOVEMENT_TUNING.groundSlamHorizontalBrake);
assert.equal(slam.physics.impactSeconds, MOVEMENT_TUNING.groundSlamImpactSeconds);
assert.equal(slam.physics.recoverySeconds, MOVEMENT_TUNING.groundSlamRecoverySeconds);

assert.equal(spec.actions.twirl.physicsSeconds, MOVEMENT_TUNING.airTwirlSeconds);
assert.equal(spec.actions.twirl.maxFallSpeed, MOVEMENT_TUNING.airTwirlMaximumFallSpeed);
assert.equal(spec.actions.HargoldDoubleJump.launchSpeed, MOVEMENT_TUNING.doubleJumpSpeed);
assert.equal(spec.actions.MebbleGlide.maximumSeconds, MOVEMENT_TUNING.maximumGlideSeconds);
assert.equal(spec.actions.MebbleGlide.gravity, MOVEMENT_TUNING.glideGravity);
assert.equal(spec.actions.MebbleGlide.maximumFallSpeed, MOVEMENT_TUNING.glideMaximumFallSpeed);

assert.deepEqual(spec.actions.skid.footLockAxes, ['vertical']);
assert.deepEqual(spec.actions.slide.footLockAxes, ['vertical']);
assert.ok(spec.events.required.includes('left-foot-contact'));
assert.ok(spec.events.required.includes('right-foot-contact'));
assert.ok(spec.events.required.includes('ground-slam-impact'));
assert.ok(spec.events.required.includes('facing-flip'));
assert.ok(spec.validation.maximumPhaseError <= 0.08);
assert.ok(spec.validation.maximumStateSettleFrames <= 2);
assert.ok(spec.timing.maximumResponsiveBlendSeconds <= 0.12);

assert.doesNotMatch(
  source,
  /\b(?:Mario|Luigi|Nintendo)\b/i,
  'the implementation contract must remain free of protected third-party identifiers'
);

console.log('Original numeric character-animation contract checks passed.');
