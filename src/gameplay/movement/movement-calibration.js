import { applyMovementBounce, createUnifiedCharacterState, stepUnifiedCharacterController } from './unified-character-controller.js';
import { MOVEMENT_TUNING } from './movement-tuning.js';

const DT = 1 / MOVEMENT_TUNING.simulationHz;
const NO_INPUT = Object.freeze({
  left: false,
  right: false,
  run: false,
  sprint: false,
  jumpPressed: false,
  jumpHeld: false,
  jumpReleased: false,
  downPressed: false,
  downHeld: false,
  groundSlamPressed: false,
  fastFallHeld: false
});
const FLAT = Object.freeze({
  groundHeightAt: () => 0,
  hasGroundAt: () => true,
  surfaceAt: () => ({ angle: 0, normal: { x: 0, y: -1 }, material: 'normal' })
});

function run(state, seconds, inputAt = () => NO_INPUT, options = FLAT) {
  const steps = Math.ceil(seconds / DT);
  for (let step = 0; step < steps; step += 1) {
    stepUnifiedCharacterController(state, inputAt(step, step * DT), DT, options);
  }
  return state;
}

function timeToTarget(input, target) {
  const state = createUnifiedCharacterState();
  for (let step = 0; step < 1200; step += 1) {
    stepUnifiedCharacterController(state, input, DT, FLAT);
    if (state.velocityX >= target * 0.98) return (step + 1) * DT;
  }
  return null;
}

function jumpMeasurement({ hero = 'Hargold', holdSeconds = 0.5, running = false } = {}) {
  const state = createUnifiedCharacterState({ hero });
  if (running) run(state, 1, () => ({ ...NO_INPUT, right: true, run: true }));
  const startX = state.footX;
  let minimumY = state.footY;
  let apexSeconds = null;
  let previousVelocityY = state.velocityY;
  for (let step = 0; step < 600; step += 1) {
    const elapsed = step * DT;
    const held = elapsed < holdSeconds;
    stepUnifiedCharacterController(state, {
      ...NO_INPUT,
      right: running,
      run: running,
      jumpPressed: step === 0,
      jumpHeld: held,
      jumpReleased: step > 0 && elapsed >= holdSeconds && elapsed - DT < holdSeconds
    }, DT, FLAT);
    minimumY = Math.min(minimumY, state.footY);
    if (apexSeconds === null && previousVelocityY < 0 && state.velocityY >= 0) {
      apexSeconds = (step + 1) * DT;
    }
    previousVelocityY = state.velocityY;
    if (step > 1 && state.grounded) {
      return Object.freeze({
        height: -minimumY,
        apexSeconds,
        airtimeSeconds: (step + 1) * DT,
        horizontalDistance: state.footX - startX
      });
    }
  }
  throw new Error('calibration jump did not land');
}

function airtimeWithTwirl(useTwirl) {
  const state = createUnifiedCharacterState();
  for (let step = 0; step < 600; step += 1) {
    const elapsed = step * DT;
    stepUnifiedCharacterController(state, {
      ...NO_INPUT,
      jumpPressed: step === 0 || (useTwirl && elapsed >= 0.3 && elapsed < 0.3 + DT),
      jumpHeld: elapsed < 0.42
    }, DT, FLAT);
    if (step > 1 && state.grounded) return (step + 1) * DT;
  }
  throw new Error('twirl calibration did not land');
}

function slopeSpeed(angle) {
  const state = createUnifiedCharacterState();
  run(
    state,
    2,
    () => ({ ...NO_INPUT, right: true, run: true }),
    {
      ...FLAT,
      surfaceAt: () => ({
        angle,
        normal: { x: Math.sin(angle), y: -Math.cos(angle) },
        material: 'normal'
      })
    }
  );
  return state.velocityX;
}

export function measureMovementCalibration() {
  const walkTime = timeToTarget({ ...NO_INPUT, right: true }, MOVEMENT_TUNING.walkSpeed);
  const runTime = timeToTarget(
    { ...NO_INPUT, right: true, run: true },
    MOVEMENT_TUNING.runSpeed
  );
  const sprintTime = timeToTarget(
    { ...NO_INPUT, right: true, run: true, sprint: true },
    MOVEMENT_TUNING.sprintSpeed
  );

  const stopping = createUnifiedCharacterState();
  run(stopping, 1.5, () => ({ ...NO_INPUT, right: true, run: true, sprint: true }));
  const stopStartX = stopping.footX;
  let stopSeconds = 0;
  while (Math.abs(stopping.velocityX) > 0.001 && stopSeconds < 3) {
    stepUnifiedCharacterController(stopping, NO_INPUT, DT, FLAT);
    stopSeconds += DT;
  }

  const reversal = createUnifiedCharacterState();
  run(reversal, 1.5, () => ({ ...NO_INPUT, right: true, run: true, sprint: true }));
  const reversalStartX = reversal.footX;
  let reversalSeconds = 0;
  while (reversal.velocityX > 0 && reversalSeconds < 3) {
    stepUnifiedCharacterController(
      reversal,
      { ...NO_INPUT, left: true, run: true, sprint: true },
      DT,
      FLAT
    );
    reversalSeconds += DT;
  }

  const tapJump = jumpMeasurement({ holdSeconds: DT });
  const fullJump = jumpMeasurement({ holdSeconds: 0.5 });
  const runningJump = jumpMeasurement({ holdSeconds: 0.5, running: true });

  const doubleJump = createUnifiedCharacterState({
    hero: 'Hargold',
    doubleJumpUnlocked: true
  });
  let doubleJumpMinimumY = 0;
  for (let step = 0; step < Math.ceil(1.6 / DT); step += 1) {
    const elapsed = step * DT;
    stepUnifiedCharacterController(doubleJump, {
      ...NO_INPUT,
      jumpPressed: step === 0 || (elapsed >= 0.32 && elapsed < 0.32 + DT),
      jumpHeld: elapsed < 0.7
    }, DT, FLAT);
    doubleJumpMinimumY = Math.min(doubleJumpMinimumY, doubleJump.footY);
  }

  const glide = createUnifiedCharacterState({ hero: 'Mebble', grounded: false, footY: -10 });
  glide.velocityY = 5;
  const glideStartY = glide.footY;
  run(glide, 0.8, () => ({ ...NO_INPUT, jumpHeld: true }), {
    ...FLAT,
    groundHeightAt: () => 100
  });

  const slam = createUnifiedCharacterState({ grounded: false, footY: -4 });
  slam.airborneSeconds = MOVEMENT_TUNING.minimumGroundSlamAirSeconds;
  stepUnifiedCharacterController(
    slam,
    { ...NO_INPUT, downPressed: true, downHeld: true, groundSlamPressed: true },
    DT,
    FLAT
  );
  let slamStartupSeconds = 0;
  let slamMaximumDescentSpeed = 0;
  while (!slam.grounded && slamStartupSeconds < 2) {
    stepUnifiedCharacterController(slam, NO_INPUT, DT, FLAT);
    slamStartupSeconds += DT;
    slamMaximumDescentSpeed = Math.max(slamMaximumDescentSpeed, slam.velocityY);
  }

  const bounce = createUnifiedCharacterState({ grounded: false, footY: 0 });
  applyMovementBounce(bounce);
  let bounceMinimumY = bounce.footY;
  for (let step = 0; step < Math.ceil(1.5 / DT); step += 1) {
    stepUnifiedCharacterController(bounce, NO_INPUT, DT, FLAT);
    bounceMinimumY = Math.min(bounceMinimumY, bounce.footY);
  }

  return Object.freeze({
    fixedStepHz: MOVEMENT_TUNING.simulationHz,
    timeToWalkingSpeedSeconds: walkTime,
    timeToRunningSpeedSeconds: runTime,
    timeToSprintSpeedSeconds: sprintTime,
    releaseStoppingDistance: stopping.footX - stopStartX,
    releaseStoppingSeconds: stopSeconds,
    highSpeedReversalDistance: reversal.footX - reversalStartX,
    highSpeedReversalSeconds: reversalSeconds,
    tapJumpHeight: tapJump.height,
    fullJumpHeight: fullJump.height,
    runningJumpDistance: runningJump.horizontalDistance,
    apexTimeSeconds: fullJump.apexSeconds,
    totalAirtimeSeconds: fullJump.airtimeSeconds,
    twirlAirtimeExtensionSeconds: airtimeWithTwirl(true) - airtimeWithTwirl(false),
    hargoldDoubleJumpHeight: -doubleJumpMinimumY,
    mebbleGlideDescentRate: (glide.footY - glideStartY) / 0.8,
    groundSlamStartupSeconds: MOVEMENT_TUNING.groundSlamPrepareSeconds,
    groundSlamMaximumDescentSpeed: slamMaximumDescentSpeed,
    softLandingThreshold: MOVEMENT_TUNING.hardLandingSpeed,
    hardLandingThreshold: MOVEMENT_TUNING.hardLandingSpeed,
    stompReboundHeight: -bounceMinimumY,
    movingPlatformVelocityInheritance: MOVEMENT_TUNING.movingPlatformVelocityInheritance,
    slopeSpeedChanges: Object.freeze({
      uphill: slopeSpeed(-0.3),
      flat: slopeSpeed(0),
      downhill: slopeSpeed(0.3)
    })
  });
}
