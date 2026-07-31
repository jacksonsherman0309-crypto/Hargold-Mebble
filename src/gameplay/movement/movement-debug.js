export function updateMovementTelemetry(state, input, contacts = {}) {
  const presentation = state.animationPresentation ?? {};
  state.telemetry = Object.freeze({
    currentState: state.movementState,
    currentBranch: state.movementBranch,
    previousState: state.previousMovementState,
    stateDurationSeconds: state.stateSeconds,
    position: Object.freeze({ x: state.footX, y: state.footY }),
    velocity: Object.freeze({ x: state.velocityX, y: state.velocityY }),
    acceleration: Object.freeze({ x: state.accelerationX, y: state.accelerationY }),
    grounded: state.grounded,
    surfaceNormal: Object.freeze({ ...(state.surfaceNormal ?? { x: 0, y: -1 }) }),
    surfaceAngle: state.surfaceAngle ?? 0,
    surfaceMaterial: state.surfaceMaterial ?? 'normal',
    terrainResponseId: state.terrainResponseId ?? 'normal',
    horizontalResponseCase: state.horizontalResponseCase,
    supportPlatformId: state.supportPlatformId,
    jumpBufferSeconds: state.jumpBufferSeconds,
    coyoteSeconds: state.coyoteSeconds,
    airborneSeconds: state.airborneSeconds,
    twirlAvailable: !state.airTwirlUsed,
    doubleJumpAvailable: state.hero === 'Hargold' &&
      state.doubleJumpUnlocked &&
      !state.doubleJumpUsed,
    glideState: state.glide,
    glideSeconds: state.glideSeconds,
    glideExhausted: state.glideExhausted,
    groundSlamPhase: state.groundSlamPhase,
    groundSlamBufferSeconds: state.groundSlamBufferSeconds,
    presentationSubphase: presentation.presentationSubphase ?? 'neutral',
    locomotionPhase: presentation.locomotionPhase ?? 0,
    leftFootContact: Boolean(presentation.leftFootContact),
    rightFootContact: Boolean(presentation.rightFootContact),
    selectedPoseState: presentation.selectedPoseState ?? null,
    predictedGroundSeconds: presentation.predictedGroundSeconds ?? Infinity,
    animationBlendSeconds: presentation.blendSeconds ?? 0,
    facingFlipMarker: Boolean(presentation.facingFlipMarker),
    rigLimitedStatus: Object.freeze([...(presentation.rigLimitedStatus ?? [])]),
    contacts: Object.freeze({ ...contacts }),
    sensorSummary: Object.freeze({
      foot: state.sensors?.foot?.length ?? 0,
      wall: state.sensors?.wall?.length ?? 0,
      head: state.sensors?.head?.length ?? 0,
      ledge: Boolean(state.sensors?.ledge),
      semisolid: Boolean(state.sensors?.semisolid),
      movingPlatform: Boolean(state.sensors?.movingPlatform)
    }),
    input: Object.freeze({
      left: Boolean(input.left),
      right: Boolean(input.right),
      jumpPressed: Boolean(input.jumpPressed),
      jumpHeld: Boolean(input.jumpHeld),
      downPressed: Boolean(input.downPressed ?? input.groundSlamPressed),
      downHeld: Boolean(input.downHeld)
    })
  });
  return state.telemetry;
}
