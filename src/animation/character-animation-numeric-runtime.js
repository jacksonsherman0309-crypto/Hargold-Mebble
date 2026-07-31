import NUMERIC_SPEC from '../../data/character-animation-numeric-spec.json' with { type: 'json' };

export const CHARACTER_ANIMATION_NUMERIC_SPEC = Object.freeze(NUMERIC_SPEC);

export const LOCKED_RIG_BONES = Object.freeze({
  hips: 'Hips',
  spineLower: 'Spine02',
  spineMiddle: 'Spine01',
  chest: 'Spine',
  neck: 'neck',
  head: 'Head',
  headEnd: 'head_end',
  headFront: 'headfront',
  shoulderL: 'LeftShoulder',
  upperArmL: 'LeftArm',
  forearmL: 'LeftForeArm',
  handL: 'LeftHand',
  shoulderR: 'RightShoulder',
  upperArmR: 'RightArm',
  forearmR: 'RightForeArm',
  handR: 'RightHand',
  thighL: 'LeftUpLeg',
  shinL: 'LeftLeg',
  footL: 'LeftFoot',
  toeL: 'LeftToeBase',
  thighR: 'RightUpLeg',
  shinR: 'RightLeg',
  footR: 'RightFoot',
  toeR: 'RightToeBase'
});

/*
 * This is the only rig-axis/sign table used by live project-authored motion.
 * Semantic values stay human-readable everywhere else. Rotation values are
 * converted from degrees to radians only by semanticPoseToLockedRigDeltas().
 */
export const LOCKED_RIG_SEMANTIC_AXIS_TABLE = Object.freeze({
  torsoForwardLeanDeg: Object.freeze({ bone: LOCKED_RIG_BONES.spineLower, axis: 'x', sign: 1 }),
  torsoBackwardLeanDeg: Object.freeze({ bone: LOCKED_RIG_BONES.spineLower, axis: 'x', sign: -1 }),
  torsoTwistDeg: Object.freeze({ bone: LOCKED_RIG_BONES.spineLower, axis: 'y', sign: 1 }),
  torsoRollDeg: Object.freeze({ bone: LOCKED_RIG_BONES.spineLower, axis: 'z', sign: 1 }),
  pelvisYawDeg: Object.freeze({ bone: LOCKED_RIG_BONES.hips, axis: 'y', sign: 1 }),
  pelvisRollDeg: Object.freeze({ bone: LOCKED_RIG_BONES.hips, axis: 'z', sign: 1 }),
  chestForwardLeanDeg: Object.freeze({ bone: LOCKED_RIG_BONES.chest, axis: 'x', sign: 1 }),
  chestBackwardLeanDeg: Object.freeze({ bone: LOCKED_RIG_BONES.chest, axis: 'x', sign: -1 }),
  chestYawDeg: Object.freeze({ bone: LOCKED_RIG_BONES.chest, axis: 'y', sign: 1 }),
  chestRollDeg: Object.freeze({ bone: LOCKED_RIG_BONES.chest, axis: 'z', sign: 1 }),
  neckForwardLeanDeg: Object.freeze({ bone: LOCKED_RIG_BONES.neck, axis: 'x', sign: 1 }),
  neckBackwardLeanDeg: Object.freeze({ bone: LOCKED_RIG_BONES.neck, axis: 'x', sign: -1 }),
  neckRollDeg: Object.freeze({ bone: LOCKED_RIG_BONES.neck, axis: 'z', sign: 1 }),
  headForwardLeanDeg: Object.freeze({ bone: LOCKED_RIG_BONES.head, axis: 'x', sign: 1 }),
  headBackwardLeanDeg: Object.freeze({ bone: LOCKED_RIG_BONES.head, axis: 'x', sign: -1 }),
  headYawDeg: Object.freeze({ bone: LOCKED_RIG_BONES.head, axis: 'y', sign: 1 }),
  headRollDeg: Object.freeze({ bone: LOCKED_RIG_BONES.head, axis: 'z', sign: 1 }),
  leftShoulderRaiseDeg: Object.freeze({ bone: LOCKED_RIG_BONES.shoulderL, axis: 'z', sign: 1 }),
  rightShoulderRaiseDeg: Object.freeze({ bone: LOCKED_RIG_BONES.shoulderR, axis: 'z', sign: -1 }),
  leftArmForwardDeg: Object.freeze({ bone: LOCKED_RIG_BONES.upperArmL, axis: 'x', sign: 1 }),
  leftArmBackDeg: Object.freeze({ bone: LOCKED_RIG_BONES.upperArmL, axis: 'x', sign: -1 }),
  rightArmForwardDeg: Object.freeze({ bone: LOCKED_RIG_BONES.upperArmR, axis: 'x', sign: -1 }),
  rightArmBackDeg: Object.freeze({ bone: LOCKED_RIG_BONES.upperArmR, axis: 'x', sign: 1 }),
  leftArmOutDeg: Object.freeze({ bone: LOCKED_RIG_BONES.upperArmL, axis: 'z', sign: 1 }),
  rightArmOutDeg: Object.freeze({ bone: LOCKED_RIG_BONES.upperArmR, axis: 'z', sign: -1 }),
  leftElbowFlexionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.forearmL, axis: 'x', sign: 1 }),
  rightElbowFlexionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.forearmR, axis: 'x', sign: -1 }),
  leftWristFlexionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.handL, axis: 'x', sign: 1 }),
  rightWristFlexionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.handR, axis: 'x', sign: -1 }),
  leftHipFlexionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.thighL, axis: 'x', sign: -1 }),
  leftHipExtensionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.thighL, axis: 'x', sign: 1 }),
  rightHipFlexionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.thighR, axis: 'x', sign: -1 }),
  rightHipExtensionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.thighR, axis: 'x', sign: 1 }),
  leftHipOutDeg: Object.freeze({ bone: LOCKED_RIG_BONES.thighL, axis: 'z', sign: 1 }),
  rightHipOutDeg: Object.freeze({ bone: LOCKED_RIG_BONES.thighR, axis: 'z', sign: -1 }),
  leftKneeFlexionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.shinL, axis: 'x', sign: 1 }),
  rightKneeFlexionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.shinR, axis: 'x', sign: 1 }),
  leftAnkleDorsiflexionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.footL, axis: 'x', sign: 1 }),
  leftAnklePlantarflexionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.footL, axis: 'x', sign: -1 }),
  rightAnkleDorsiflexionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.footR, axis: 'x', sign: 1 }),
  rightAnklePlantarflexionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.footR, axis: 'x', sign: -1 }),
  leftToeFlexionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.toeL, axis: 'x', sign: 1 }),
  rightToeFlexionDeg: Object.freeze({ bone: LOCKED_RIG_BONES.toeR, axis: 'x', sign: 1 })
});

const ROTATION_AXES = Object.freeze({ x: 0, y: 1, z: 2 });
const LOCOMOTION_STATES = Object.freeze({
  walk: 'walk',
  run: 'run',
  sprint: 'fullSpeed',
  crawl: 'crawl'
});
const RIG_LIMITED_STATUS = Object.freeze([
  'facial-controls-unavailable',
  'finger-articulation-unavailable',
  'independent-cape-and-scarf-controls-unavailable',
  'hat-feather-glasses-and-follow-controls-unavailable',
  'pose-space-correctives-unavailable'
]);

const POSE_DETAIL = Object.freeze({
  Hargold: Object.freeze({
    walk: Object.freeze({
      pelvis: Object.freeze([-0.8, -1.8, 0.2, 1.2]),
      pelvisYaw: 5,
      pelvisRoll: 3,
      ankle: Object.freeze([8, 4, 6, 16]),
      elbow: Object.freeze([28, 30, 26, 28])
    }),
    run: Object.freeze({
      pelvis: Object.freeze([-1.4, -2.8, 0.5, 2.2]),
      compression: Object.freeze([2.6, 4.2, 1, 0]),
      ankle: Object.freeze([8, 2, 8, 18]),
      elbow: Object.freeze([58, 62, 56, 58])
    }),
    fullSpeed: Object.freeze({
      pelvis: Object.freeze([-2, -3.2, 0.9, 3.2]),
      compression: Object.freeze([5.5, 7, 1.5, 0]),
      ankle: Object.freeze([8, 2, 10, 22]),
      elbow: Object.freeze([78, 82, 72, 78])
    })
  }),
  Mebble: Object.freeze({
    walk: Object.freeze({
      pelvis: Object.freeze([-0.6, -1.5, 0.3, 1.5]),
      pelvisYaw: 6,
      pelvisRoll: 4,
      ankle: Object.freeze([10, 5, 7, 18]),
      elbow: Object.freeze([24, 26, 24, 24])
    }),
    run: Object.freeze({
      pelvis: Object.freeze([-1.1, -2.2, 0.7, 2.8]),
      compression: Object.freeze([2, 3.5, 0.8, 0]),
      ankle: Object.freeze([10, 3, 9, 20]),
      elbow: Object.freeze([52, 56, 50, 52])
    }),
    fullSpeed: Object.freeze({
      pelvis: Object.freeze([-1.7, -2.7, 1.1, 4]),
      compression: Object.freeze([4.5, 6, 1.2, 0]),
      ankle: Object.freeze([10, 3, 11, 24]),
      elbow: Object.freeze([72, 76, 66, 72])
    })
  })
});

export function degreesToRadians(degrees) {
  return Number(degrees || 0) * Math.PI / 180;
}

export function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function positiveModulo(value, modulus = 1) {
  return ((value % modulus) + modulus) % modulus;
}

export function smoothstep(edge0, edge1, value) {
  const t = clamp01((value - edge0) / Math.max(0.000001, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function freezePose(pose) {
  return Object.freeze({ ...pose });
}

export function createSemanticPose(values = {}) {
  return freezePose(values);
}

function addRotation(rotations, bone, axis, radians) {
  const value = rotations[bone] ?? [0, 0, 0];
  value[ROTATION_AXES[axis]] += radians;
  rotations[bone] = value;
}

export function semanticPoseToLockedRigDeltas(
  semanticPose,
  { heroHeightUnits = 1 } = {}
) {
  const rotations = {};
  for (const [semanticName, mapping] of Object.entries(LOCKED_RIG_SEMANTIC_AXIS_TABLE)) {
    const value = Number(semanticPose[semanticName] ?? 0);
    if (!value) continue;
    addRotation(
      rotations,
      mapping.bone,
      mapping.axis,
      degreesToRadians(value * mapping.sign)
    );
  }
  const positions = {};
  const pelvisPercent =
    Number(semanticPose.pelvisVerticalOffsetPercent ?? 0) -
    Number(semanticPose.torsoCompressionPercent ?? 0);
  if (pelvisPercent) {
    positions[LOCKED_RIG_BONES.hips] = [
      0,
      heroHeightUnits * pelvisPercent / 100,
      0
    ];
  }
  return Object.freeze({
    rotations: Object.freeze(
      Object.fromEntries(
        Object.entries(rotations).map(([bone, value]) => [bone, Object.freeze(value)])
      )
    ),
    positions: Object.freeze(
      Object.fromEntries(
        Object.entries(positions).map(([bone, value]) => [bone, Object.freeze(value)])
      )
    )
  });
}

function mergePoses(...poses) {
  const result = {};
  for (const pose of poses) {
    for (const [name, value] of Object.entries(pose ?? {})) {
      result[name] = Number(result[name] ?? 0) + Number(value ?? 0);
    }
  }
  return result;
}

function scalePose(pose, scale) {
  return Object.fromEntries(
    Object.entries(pose).map(([name, value]) => [name, Number(value) * scale])
  );
}

export function interpolateSemanticPoses(from, to, alpha) {
  const amount = clamp01(alpha);
  const keys = new Set([...Object.keys(from ?? {}), ...Object.keys(to ?? {})]);
  const result = {};
  for (const key of keys) {
    const start = Number(from?.[key] ?? 0);
    const end = Number(to?.[key] ?? 0);
    result[key] = start + (end - start) * amount;
  }
  return freezePose(result);
}

function samplePoseKeys(keys, value) {
  const sorted = keys;
  if (value <= sorted[0][0]) return freezePose(sorted[0][1]);
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const [time, pose] = sorted[index];
    const [nextTime, nextPose] = sorted[index + 1];
    if (value <= nextTime) {
      return interpolateSemanticPoses(
        pose,
        nextPose,
        smoothstep(time, nextTime, value)
      );
    }
  }
  return freezePose(sorted.at(-1)[1]);
}

function sideFields(side) {
  const prefix = side === 'left' ? 'left' : 'right';
  return Object.freeze({
    hipFlex: `${prefix}HipFlexionDeg`,
    hipExtend: `${prefix}HipExtensionDeg`,
    hipOut: `${prefix}HipOutDeg`,
    knee: `${prefix}KneeFlexionDeg`,
    ankleDorsi: `${prefix}AnkleDorsiflexionDeg`,
    anklePlantar: `${prefix}AnklePlantarflexionDeg`,
    armForward: `${prefix}ArmForwardDeg`,
    armBack: `${prefix}ArmBackDeg`,
    armOut: `${prefix}ArmOutDeg`,
    elbow: `${prefix}ElbowFlexionDeg`,
    shoulder: `${prefix}ShoulderRaiseDeg`
  });
}

const SIDE = Object.freeze({
  left: sideFields('left'),
  right: sideFields('right')
});

function setLeg(pose, side, {
  hipFlex = 0,
  hipExtend = 0,
  hipOut = 0,
  knee = 0,
  ankleDorsi = 0,
  anklePlantar = 0
} = {}) {
  const fields = SIDE[side];
  pose[fields.hipFlex] = hipFlex;
  pose[fields.hipExtend] = hipExtend;
  pose[fields.hipOut] = hipOut;
  pose[fields.knee] = knee;
  pose[fields.ankleDorsi] = ankleDorsi;
  pose[fields.anklePlantar] = anklePlantar;
}

function setArm(pose, side, {
  forward = 0,
  back = 0,
  out = 0,
  elbow = 0,
  shoulder = 0
} = {}) {
  const fields = SIDE[side];
  pose[fields.armForward] = forward;
  pose[fields.armBack] = back;
  pose[fields.armOut] = out;
  pose[fields.elbow] = elbow;
  pose[fields.shoulder] = shoulder;
}

function gaitLandmarkPose(hero, gait, landmark, leftLead) {
  const cycle = NUMERIC_SPEC.locomotion.cycles[hero][gait];
  const detail = POSE_DETAIL[hero][gait];
  const lead = leftLead ? 'left' : 'right';
  const trail = leftLead ? 'right' : 'left';
  const pose = {
    torsoForwardLeanDeg: cycle.torsoLeanDeg,
    pelvisVerticalOffsetPercent: detail.pelvis[landmark],
    torsoCompressionPercent: detail.compression?.[landmark] ?? 0
  };
  const yaw = (detail.pelvisYaw ?? (gait === 'run' ? 7 : 9)) * (leftLead ? 1 : -1);
  const roll = (detail.pelvisRoll ?? (gait === 'run' ? 4 : 5)) * (leftLead ? 1 : -1);
  pose.pelvisYawDeg = yaw;
  pose.pelvisRollDeg = roll;
  pose.chestYawDeg = yaw * -0.65;
  if (hero === 'Mebble') pose.neckRollDeg = roll * -0.62;

  if (landmark === 0) {
    setLeg(pose, lead, {
      hipFlex: cycle.leadHipDeg,
      knee: cycle.leadKneeDeg,
      ankleDorsi: detail.ankle[0]
    });
    setLeg(pose, trail, {
      hipExtend: cycle.trailHipExtensionDeg,
      knee: cycle.trailKneeDeg,
      anklePlantar: gait === 'walk' ? (hero === 'Hargold' ? 18 : 20) : detail.ankle[3]
    });
    setArm(pose, lead, { back: cycle.armSwingDeg * 0.86, elbow: detail.elbow[0] });
    setArm(pose, trail, { forward: cycle.armSwingDeg, elbow: detail.elbow[0] });
  } else if (landmark === 1) {
    setLeg(pose, lead, {
      hipFlex: cycle.leadHipDeg * 0.78,
      knee: Math.min(125, cycle.leadKneeDeg * (gait === 'walk' ? 2.35 : 2.3)),
      ankleDorsi: detail.ankle[1]
    });
    setLeg(pose, trail, {
      hipExtend: cycle.trailHipExtensionDeg * 0.79,
      knee: Math.min(125, cycle.trailKneeDeg * 1.12),
      anklePlantar: detail.ankle[3] * 0.65
    });
    setArm(pose, lead, { back: cycle.armSwingDeg * 0.78, elbow: detail.elbow[1] });
    setArm(pose, trail, { forward: cycle.armSwingDeg * 0.83, elbow: detail.elbow[1] });
  } else if (landmark === 2) {
    setLeg(pose, lead, {
      hipExtend: cycle.leadHipDeg * 0.27,
      knee: Math.max(7, cycle.leadKneeDeg * 0.75),
      anklePlantar: detail.ankle[2]
    });
    setLeg(pose, trail, {
      hipFlex: cycle.leadHipDeg * 0.16,
      knee: Math.min(125, cycle.trailKneeDeg * 1.55),
      anklePlantar: detail.ankle[2] * 1.35
    });
    setArm(pose, lead, { back: cycle.armSwingDeg * 0.22, elbow: detail.elbow[2] });
    setArm(pose, trail, { forward: cycle.armSwingDeg * 0.22, elbow: detail.elbow[2] });
  } else {
    setLeg(pose, lead, {
      hipExtend: cycle.trailHipExtensionDeg * 0.9,
      knee: Math.max(7, cycle.leadKneeDeg * 0.55),
      anklePlantar: detail.ankle[3]
    });
    setLeg(pose, trail, {
      hipFlex: cycle.leadHipDeg * 1.08,
      knee: Math.min(125, cycle.trailKneeDeg * 1.35),
      ankleDorsi: gait === 'walk' ? 2 : 4
    });
    setArm(pose, lead, { forward: cycle.armSwingDeg, elbow: detail.elbow[3] });
    setArm(pose, trail, { back: cycle.armSwingDeg * 0.92, elbow: detail.elbow[3] });
  }
  return freezePose(pose);
}

export function sampleDistanceDrivenGaitPose(hero, gait, phase) {
  if (!NUMERIC_SPEC.locomotion.cycles[hero]?.[gait]) {
    throw new RangeError(`unknown numeric gait: ${hero} ${gait}`);
  }
  const markers = NUMERIC_SPEC.locomotion.phaseMarkers[gait];
  const keys = [
    [0, gaitLandmarkPose(hero, gait, 0, true)],
    [markers[1], gaitLandmarkPose(hero, gait, 1, true)],
    [markers[2], gaitLandmarkPose(hero, gait, 2, true)],
    [markers[3], gaitLandmarkPose(hero, gait, 3, true)],
    [0.5, gaitLandmarkPose(hero, gait, 0, false)],
    [markers[5], gaitLandmarkPose(hero, gait, 1, false)],
    [markers[6], gaitLandmarkPose(hero, gait, 2, false)],
    [markers[7], gaitLandmarkPose(hero, gait, 3, false)],
    [1, gaitLandmarkPose(hero, gait, 0, true)]
  ];
  return samplePoseKeys(keys, positiveModulo(phase, 1));
}

function isPhaseInWindow(phase, window) {
  const value = positiveModulo(phase, 1);
  const [start, end] = window;
  return start <= end
    ? value >= start && value <= end
    : value >= start || value <= end;
}

export function locomotionFootContacts(gait, phase) {
  const windows = NUMERIC_SPEC.locomotion.footLockWindows[gait];
  if (!windows) return Object.freeze({ left: false, right: false, axes: Object.freeze([]) });
  return Object.freeze({
    left: isPhaseInWindow(phase, windows.left),
    right: isPhaseInWindow(phase, windows.right),
    axes: Object.freeze([...windows.axes])
  });
}

function crossedPhase(previous, next, target) {
  const from = positiveModulo(previous, 1);
  const to = positiveModulo(next, 1);
  if (from === to) return false;
  if (to > from) return target > from && target <= to;
  return target > from || target <= to;
}

function contactEventsForAdvance(gait, previousPhase, nextPhase) {
  const windows = NUMERIC_SPEC.locomotion.footLockWindows[gait];
  if (!windows) return [];
  const events = [];
  for (const [type, phase] of [
    ['left-foot-contact', 0],
    ['left-toe-off', windows.left[1]],
    ['right-foot-contact', 0.5],
    ['right-toe-off', windows.right[1]]
  ]) {
    if (crossedPhase(previousPhase, nextPhase, phase)) events.push(type);
  }
  return events;
}

function nearestContactPhase(phase) {
  const value = positiveModulo(phase, 1);
  const distances = [0, 0.5].map(contact => ({
    contact,
    distance: Math.min(
      Math.abs(value - contact),
      1 - Math.abs(value - contact)
    )
  }));
  return distances.sort((a, b) => a.distance - b.distance)[0].contact;
}

export function createCharacterAnimationPresentationState(hero = 'Hargold') {
  if (!NUMERIC_SPEC.heroes[hero]) throw new RangeError(`unknown animation hero: ${hero}`);
  return {
    hero,
    locomotionPhase: 0,
    previousLocomotionPhase: 0,
    locomotionGait: null,
    leftFootContact: false,
    rightFootContact: false,
    contactAxes: [],
    presentationSubphase: 'neutral',
    selectedPoseState: `${hero.toLowerCase()}_idle`,
    predictedGroundSeconds: Infinity,
    blendSeconds: NUMERIC_SPEC.blendSeconds.idleToWalk,
    brakeEntrySpeed: 0,
    brakeProgress: 0,
    selectedPlantFoot: 'left',
    skidPlantEmitted: false,
    facingFlipMarker: false,
    turnProgress: 0,
    markerSerial: 0,
    effectDistance: { brake: 0, skid: 0, slide: 0 },
    lastFootX: 0,
    rigLimitedStatus: [...RIG_LIMITED_STATUS]
  };
}

function ensurePresentation(state) {
  if (!state.animationPresentation || state.animationPresentation.hero !== state.hero) {
    state.animationPresentation = createCharacterAnimationPresentationState(state.hero);
    state.animationPresentation.lastFootX = state.footX ?? 0;
  }
  return state.animationPresentation;
}

function gaitForState(movementState) {
  return LOCOMOTION_STATES[movementState] ?? null;
}

function blendForState(movementState) {
  const blends = NUMERIC_SPEC.blendSeconds;
  if (['walk', 'run', 'sprint'].includes(movementState)) return blends.gaitToGait;
  if (movementState === 'brake') return blends.brake;
  if (movementState === 'turn') return blends.turn;
  if (movementState === 'skid') return blends.skid;
  if (movementState === 'crouch' || movementState === 'crawl') return blends.crouch;
  if (movementState === 'duck-slide') return blends.slide;
  if (['jump-startup', 'rise', 'apex', 'fall', 'fast-fall'].includes(movementState)) {
    return movementState === 'jump-startup' ? blends.jump : blends.airPose;
  }
  if (movementState.startsWith?.('ground-slam')) {
    if (movementState === 'ground-slam-impact') return blends.groundSlamImpact;
    return blends.groundSlamStartup;
  }
  if (['damage', 'knockback'].includes(movementState)) return blends.damage;
  return Math.min(NUMERIC_SPEC.timing.maximumResponsiveBlendSeconds, blends.idleToWalk);
}

function poseIdForState(hero, state, presentation) {
  const prefix = hero.toLowerCase();
  const map = {
    idle: presentation.presentationSubphase === 'secondary-idle'
      ? `${prefix}_idle_secondary`
      : `${prefix}_idle`,
    walk: `${prefix}_walk_refined`,
    run: `${prefix}_run_refined`,
    sprint: `${prefix}_sprint_refined`,
    brake: `${prefix}_run_decelerate`,
    turn: `${prefix}_turnaround`,
    skid: `${prefix}_skid`,
    crouch: `${prefix}_crouch`,
    crawl: `${prefix}_crawl`,
    'duck-slide': `${prefix}_slide`,
    'jump-startup': `${prefix}_jump_takeoff`,
    rise: `${prefix}_jump_rise`,
    apex: `${prefix}_jump_apex`,
    fall: `${prefix}_jump_fall`,
    'fast-fall': `${prefix}_jump_fall`,
    twirl: `${prefix}_air_spin`,
    'double-jump': hero === 'Hargold' ? 'hargold_double_jump' : `${prefix}_air_spin`,
    'glide-opening': hero === 'Mebble' ? 'mebble_glide_open' : `${prefix}_jump_fall`,
    glide: hero === 'Mebble' ? 'mebble_glide_sustain' : `${prefix}_jump_fall`,
    'glide-closing': hero === 'Mebble' ? 'mebble_glide_close' : `${prefix}_jump_fall`,
    'stomp-bounce': `${prefix}_stomp_bounce`,
    'spring-bounce': `${prefix}_stomp_bounce`,
    'soft-land': `${prefix}_land_soft`,
    'hard-land': `${prefix}_land_heavy`,
    'ground-slam-startup': `${prefix}_ground_slam_start`,
    'ground-slam-fall': `${prefix}_ground_slam_fall`,
    'ground-slam-impact': `${prefix}_ground_slam_impact`,
    'ground-slam-recovery': `${prefix}_ground_slam_recover`,
    'wall-contact': `${prefix}_ledge_stop`,
    'ledge-grab': `${prefix}_ledge_stop`,
    'ground-action': `${prefix}_block_hit`,
    'powerup-collect': `${prefix}_powerup_collect`,
    'power-transform': `${prefix}_power_transform`,
    damage: `${prefix}_hurt`,
    knockback: `${prefix}_knockback`,
    dead: `${prefix}_defeat`,
    victory: `${prefix}_victory`,
    'swap-out': `${prefix}_swap_out`,
    'swap-in': `${prefix}_swap_in`,
    respawning: `${prefix}_swap_in`
  };
  return map[state] ?? `${prefix}_idle`;
}

function subphaseForState(state, presentation) {
  const fps = NUMERIC_SPEC.timing.animationAuthoringFps;
  const hero = state.hero;
  const seconds = state.stateSeconds ?? 0;
  if (state.movementState === 'idle') {
    const idle = NUMERIC_SPEC.actions.idle;
    const primarySeconds = idle.primaryFrames / fps;
    const secondarySeconds = idle.secondaryFrames / fps;
    const cycle = primarySeconds + secondarySeconds;
    return positiveModulo(seconds, cycle) >= primarySeconds ? 'secondary-idle' : 'primary-idle';
  }
  if (state.movementState === 'walk' && state.previousMovementState === 'idle') {
    const frames = NUMERIC_SPEC.actions.moveStart[hero].frames;
    if (seconds < frames / fps) return 'movement-start';
  }
  if (state.movementState === 'brake') {
    const entry = NUMERIC_SPEC.actions.releaseBrake.entryFrames[hero] / fps;
    if (seconds < entry) return 'entry';
    return Math.abs(state.velocityX ?? 0) > 0.05 ? 'braced-hold' : 'exit';
  }
  if (state.movementState === 'skid') {
    if (seconds < NUMERIC_SPEC.actions.skid.entryReactionFrames / fps) return 'reaction';
    if (seconds < NUMERIC_SPEC.actions.skid.plantPeakFrame / fps) return 'plant';
    return 'speed-driven-brace';
  }
  if (state.movementState === 'turn') {
    return state.turnPresentationPhase ?? 'pivot';
  }
  if (state.movementState === 'crouch') {
    const entry = NUMERIC_SPEC.actions.crouch.entryFrames[hero] / fps;
    return seconds < entry ? 'entry' : 'hold';
  }
  if (state.movementState === 'duck-slide') {
    const entry = NUMERIC_SPEC.actions.slide.entryFrames[hero] / fps;
    return seconds < entry ? 'entry' : 'speed-driven-sustain';
  }
  if (state.movementState === 'ground-slam-startup') return 'startup';
  if (state.movementState === 'ground-slam-fall') return 'velocity-driven-descent';
  if (state.movementState === 'ground-slam-impact') return 'impact';
  if (state.movementState === 'ground-slam-recovery') return 'recovery';
  if (state.movementState === 'glide-opening') return 'open';
  if (state.movementState === 'glide') return 'body-sustain';
  if (state.movementState === 'glide-closing') return 'close';
  if (['rise', 'apex', 'fall', 'fast-fall'].includes(state.movementState)) {
    return 'velocity-driven-air-pose';
  }
  return state.movementState;
}

export function updateCharacterAnimationPresentation(
  state,
  deltaSeconds,
  {
    groundHeightAt = () => state.footY,
    emit = () => {}
  } = {}
) {
  const presentation = ensurePresentation(state);
  const previousGait = presentation.locomotionGait;
  const gait = gaitForState(state.movementState);
  presentation.previousLocomotionPhase = presentation.locomotionPhase;

  if (gait && gait !== 'crawl') {
    const cycle = NUMERIC_SPEC.locomotion.cycles[state.hero][gait];
    if (!previousGait && state.previousMovementState !== state.movementState) {
      presentation.locomotionPhase = nearestContactPhase(presentation.locomotionPhase);
    }
    presentation.locomotionPhase = positiveModulo(
      presentation.locomotionPhase +
      Math.abs(state.velocityX ?? 0) * deltaSeconds / cycle.distanceMetres,
      1
    );
    for (const type of contactEventsForAdvance(
      gait,
      presentation.previousLocomotionPhase,
      presentation.locomotionPhase
    )) {
      presentation.markerSerial += 1;
      emit(type, {
        phase: presentation.locomotionPhase,
        markerSerial: presentation.markerSerial
      });
    }
    const contacts = locomotionFootContacts(gait, presentation.locomotionPhase);
    presentation.leftFootContact = contacts.left;
    presentation.rightFootContact = contacts.right;
    presentation.contactAxes = [...contacts.axes];
  } else if (gait === 'crawl') {
    const cycle = NUMERIC_SPEC.actions.crawl[state.hero];
    presentation.locomotionPhase = positiveModulo(
      presentation.locomotionPhase +
      Math.abs(state.velocityX ?? 0) * deltaSeconds / cycle.distance,
      1
    );
    presentation.leftFootContact = isPhaseInWindow(
      presentation.locomotionPhase,
      [0.94, 0.12]
    );
    presentation.rightFootContact = isPhaseInWindow(
      presentation.locomotionPhase,
      [0.44, 0.62]
    );
    presentation.contactAxes = ['vertical', 'forward'];
  } else {
    presentation.leftFootContact = false;
    presentation.rightFootContact = false;
    presentation.contactAxes = [];
  }
  presentation.locomotionGait = gait;

  const speed = Math.abs(state.velocityX ?? 0);
  if (state.movementState === 'brake') {
    if (state.previousMovementState !== 'brake' && presentation.brakeEntrySpeed <= 0) {
      presentation.brakeEntrySpeed = Math.max(speed, 0.001);
      presentation.selectedPlantFoot =
        presentation.locomotionPhase < 0.25 || presentation.locomotionPhase >= 0.75
          ? 'left'
          : 'right';
      emit('brake-plant', { foot: presentation.selectedPlantFoot });
    }
    presentation.brakeProgress = clamp01(
      1 - speed / Math.max(presentation.brakeEntrySpeed, 0.001)
    );
  } else {
    presentation.brakeEntrySpeed = 0;
    presentation.brakeProgress = 0;
  }

  if (state.movementState === 'skid' && state.previousMovementState !== 'skid') {
    if (!presentation.skidPlantEmitted) {
      presentation.selectedPlantFoot =
        presentation.locomotionPhase < 0.25 || presentation.locomotionPhase >= 0.75
          ? 'left'
          : 'right';
      presentation.skidPlantEmitted = true;
      emit('skid-plant', { foot: presentation.selectedPlantFoot });
    }
  } else if (state.movementState !== 'skid') {
    presentation.skidPlantEmitted = false;
  }
  if (
    state.movementState === 'duck-slide' &&
    state.previousMovementState !== 'duck-slide'
  ) {
    emit('slide-enter', {
      horizontalSpeed: speed
    });
  }
  presentation.facingFlipMarker = Boolean(state.facingFlipMarker);
  presentation.turnProgress = Number(state.turnPhaseSeconds ?? 0);

  if (state.grounded && state.movementState === 'idle') {
    presentation.leftFootContact = true;
    presentation.rightFootContact = true;
    presentation.contactAxes = ['vertical', 'forward'];
  } else if (state.grounded && state.movementState === 'crouch') {
    presentation.leftFootContact = true;
    presentation.rightFootContact = true;
    presentation.contactAxes = ['vertical', 'forward'];
  } else if (state.grounded && ['brake', 'skid'].includes(state.movementState)) {
    presentation.leftFootContact = presentation.selectedPlantFoot === 'left';
    presentation.rightFootContact = presentation.selectedPlantFoot === 'right';
    presentation.contactAxes = ['vertical'];
  } else if (state.grounded && state.movementState === 'duck-slide') {
    presentation.leftFootContact = true;
    presentation.rightFootContact = true;
    presentation.contactAxes = ['vertical'];
  } else if (
    state.grounded &&
    [
      'turn',
      'wall-contact',
      'soft-land',
      'hard-land',
      'ground-slam-impact',
      'ground-slam-recovery'
    ]
      .includes(state.movementState)
  ) {
    presentation.leftFootContact = true;
    presentation.rightFootContact = true;
    presentation.contactAxes = ['vertical'];
  }

  const travelled = Math.abs((state.footX ?? 0) - presentation.lastFootX);
  presentation.lastFootX = state.footX ?? presentation.lastFootX;
  const effectKind = state.movementState === 'brake'
    ? 'brake'
    : state.movementState === 'skid'
      ? 'skid'
      : state.movementState === 'duck-slide'
        ? 'slide'
        : null;
  for (const kind of Object.keys(presentation.effectDistance)) {
    if (kind !== effectKind) presentation.effectDistance[kind] = 0;
  }
  if (effectKind && speed > NUMERIC_SPEC.events.continuousEffectMinimumSpeed) {
    presentation.effectDistance[effectKind] += travelled;
    const spacing = NUMERIC_SPEC.events.effectSpacingMetres[effectKind];
    while (presentation.effectDistance[effectKind] >= spacing) {
      presentation.effectDistance[effectKind] -= spacing;
      emit(`${effectKind}-distance-effect`, { spacingMetres: spacing });
    }
  }

  const clearance = Math.max(0, groundHeightAt(state.footX) - state.footY);
  presentation.predictedGroundSeconds = state.velocityY > 0
    ? clearance / Math.max(state.velocityY, 0.001)
    : Infinity;
  presentation.presentationSubphase = subphaseForState(state, presentation);
  presentation.selectedPoseState = poseIdForState(
    state.hero,
    state.movementState,
    presentation
  );
  presentation.blendSeconds = Math.min(
    NUMERIC_SPEC.timing.maximumResponsiveBlendSeconds,
    blendForState(state.movementState)
  );
  return presentation;
}

export function airPoseWeights({
  verticalVelocity = 0,
  launchSpeed = 10.4,
  predictedGroundSeconds = Infinity
} = {}) {
  return Object.freeze({
    rise: clamp01(
      (-verticalVelocity - 0.84) / Math.max(launchSpeed - 0.84, 0.001)
    ),
    apex: 1 - smoothstep(0.84, 2.5, Math.abs(verticalVelocity)),
    fall: clamp01((verticalVelocity - 0.84) / (15.8 - 0.84)),
    landingPrep: Number.isFinite(predictedGroundSeconds)
      ? 1 - smoothstep(0.05, 0.18, predictedGroundSeconds)
      : 0
  });
}

function crouchPose(hero, amount = 1) {
  const action = NUMERIC_SPEC.actions.crouch;
  const values = action[hero];
  const pose = {
    torsoForwardLeanDeg: values.leanDeg * amount,
    pelvisVerticalOffsetPercent: -values.pelvisDropPercent * amount
  };
  setLeg(pose, 'left', {
    hipFlex: values.hipDeg * amount,
    knee: values.kneeDeg * amount,
    ankleDorsi: values.ankleDeg * amount
  });
  setLeg(pose, 'right', {
    hipFlex: values.hipDeg * amount,
    knee: values.kneeDeg * amount,
    ankleDorsi: values.ankleDeg * amount
  });
  setArm(pose, 'left', { back: 22 * amount, elbow: (hero === 'Hargold' ? 46 : 42) * amount });
  setArm(pose, 'right', { back: 22 * amount, elbow: (hero === 'Hargold' ? 46 : 42) * amount });
  if (hero === 'Mebble') pose.neckBackwardLeanDeg = 6 * amount;
  return freezePose(pose);
}

function slidePose(hero, speed) {
  const action = NUMERIC_SPEC.actions.slide;
  const values = action[hero];
  const scalar = clamp01(
    (speed - NUMERIC_SPEC.controller.thresholdMetresPerSecond.slideExit) /
    (
      NUMERIC_SPEC.controller.speedMetresPerSecond.fullSpeed -
      NUMERIC_SPEC.controller.thresholdMetresPerSecond.slideExit
    )
  );
  const pose = {
    torsoBackwardLeanDeg: (hero === 'Hargold' ? 16 : 22) + 8 * scalar,
    pelvisVerticalOffsetPercent: -(hero === 'Hargold' ? 21 : 23)
  };
  setLeg(pose, 'left', {
    hipFlex: hero === 'Hargold' ? 62 : 68,
    knee: values.frontKneeDeg,
    ankleDorsi: 8
  });
  setLeg(pose, 'right', {
    hipFlex: hero === 'Hargold' ? 28 : 34,
    knee: values.rearKneeDeg,
    anklePlantar: 12
  });
  setArm(pose, 'left', { forward: hero === 'Hargold' ? 48 : 56, elbow: 34 });
  setArm(pose, 'right', { back: hero === 'Hargold' ? 48 : 56, elbow: 34 });
  if (hero === 'Mebble') pose.neckBackwardLeanDeg = values.neckCounterDeg;
  return freezePose(pose);
}

function brakePose(hero, progress) {
  const peak = NUMERIC_SPEC.actions.releaseBrake.peak[hero];
  const amount = Math.sin(clamp01(progress) * Math.PI * 0.5);
  const pose = {
    torsoForwardLeanDeg: peak.leanDeg * amount,
    torsoCompressionPercent: peak.compressionPercent * amount
  };
  setLeg(pose, 'left', {
    hipFlex: 24 * amount,
    knee: peak.frontKneeDeg * amount,
    ankleDorsi: 10 * amount
  });
  setLeg(pose, 'right', {
    hipFlex: 10 * amount,
    knee: peak.rearKneeDeg * amount,
    ankleDorsi: 5 * amount
  });
  setArm(pose, 'left', { back: peak.armsBackDeg * amount, elbow: 42 * amount });
  setArm(pose, 'right', { back: peak.armsBackDeg * amount, elbow: 42 * amount });
  return freezePose(pose);
}

function skidPose(hero, stateSeconds, speed) {
  const action = NUMERIC_SPEC.actions.skid;
  const peak = action.peak[hero];
  const plantSeconds = action.plantPeakFrame / NUMERIC_SPEC.timing.animationAuthoringFps;
  const amount = clamp01(stateSeconds / plantSeconds);
  const hold = speed > NUMERIC_SPEC.controller.thresholdMetresPerSecond.skidExit ? 1 : amount;
  const pose = {
    torsoBackwardLeanDeg: peak.braceDeg * hold,
    torsoCompressionPercent: peak.compressionPercent * hold
  };
  setLeg(pose, 'left', {
    hipFlex: 38 * hold,
    knee: peak.frontKneeDeg * hold,
    ankleDorsi: 18 * hold
  });
  setLeg(pose, 'right', {
    hipFlex: 16 * hold,
    knee: peak.rearKneeDeg * hold,
    ankleDorsi: 8 * hold
  });
  setArm(pose, 'left', { forward: peak.armBraceDeg * hold, elbow: 52 * hold });
  setArm(pose, 'right', { forward: peak.armBraceDeg * hold, elbow: 52 * hold });
  if (hero === 'Mebble') pose.neckForwardLeanDeg = peak.neckCounterDeg * hold;
  return freezePose(pose);
}

function turnPose(hero, progress) {
  const amount = Math.sin(clamp01(progress) * Math.PI);
  const compression = hero === 'Hargold' ? 6 : 5;
  const twist = hero === 'Hargold' ? 12 : 14;
  const pose = {
    torsoTwistDeg: twist * amount,
    torsoCompressionPercent: compression * amount,
    headYawDeg: twist * 0.8 * Math.sin(clamp01(progress + 0.2) * Math.PI)
  };
  setLeg(pose, 'left', { hipFlex: 18 * amount, knee: 38 * amount, ankleDorsi: 8 * amount });
  setLeg(pose, 'right', { hipExtend: 12 * amount, knee: 26 * amount, anklePlantar: 6 * amount });
  setArm(pose, 'left', { forward: 34 * amount, elbow: 34 * amount });
  setArm(pose, 'right', { back: 34 * amount, elbow: 34 * amount });
  return freezePose(pose);
}

function airPose(hero, movementState, verticalVelocity, horizontalSpeed, predictedGroundSeconds) {
  const jump = NUMERIC_SPEC.actions.jump;
  const launchSpeed = jump.launchSpeedRange[hero][horizontalSpeed >= 4.65 ? 1 : 0];
  const weights = airPoseWeights({ verticalVelocity, launchSpeed, predictedGroundSeconds });
  const rise = {};
  const riseData = jump.rise[hero];
  rise.torsoBackwardLeanDeg = riseData.backLeanDeg;
  setLeg(rise, 'left', { hipFlex: 24, knee: riseData.kneeDeg, anklePlantar: 8 });
  setLeg(rise, 'right', { hipFlex: 20, knee: riseData.kneeDeg, anklePlantar: 8 });
  setArm(rise, 'left', { forward: riseData.armDeg, out: 10, elbow: 28 });
  setArm(rise, 'right', { forward: riseData.armDeg, out: 10, elbow: 28 });
  if (hero === 'Mebble') rise.neckBackwardLeanDeg = riseData.neckCounterDeg;

  const apex = {};
  const apexData = jump.apex[hero];
  setLeg(apex, 'left', { hipFlex: 28, knee: apexData.kneeDeg, anklePlantar: 5 });
  setLeg(apex, 'right', { hipFlex: 24, knee: apexData.kneeDeg, anklePlantar: 5 });
  setArm(apex, 'left', { out: apexData.armSpreadDeg, forward: 20, elbow: 30 });
  setArm(apex, 'right', { out: apexData.armSpreadDeg, forward: 20, elbow: 30 });

  const fall = {};
  const fallData = jump.fall[hero];
  fall.torsoForwardLeanDeg = fallData.forwardLeanDeg;
  setLeg(fall, 'left', { hipFlex: 16, knee: fallData.kneeDeg, ankleDorsi: fallData.ankleDeg });
  setLeg(fall, 'right', { hipFlex: 20, knee: fallData.kneeDeg, ankleDorsi: fallData.ankleDeg });
  setArm(fall, 'left', { out: fallData.armSpreadDeg, back: 12, elbow: 42 });
  setArm(fall, 'right', { out: fallData.armSpreadDeg, back: 12, elbow: 42 });
  if (hero === 'Mebble') fall.neckBackwardLeanDeg = Math.abs(fallData.neckCounterDeg);

  const total = Math.max(0.001, weights.rise + weights.apex + weights.fall);
  let pose = mergePoses(
    scalePose(rise, weights.rise / total),
    scalePose(apex, weights.apex / total),
    scalePose(fall, weights.fall / total)
  );
  if (horizontalSpeed >= NUMERIC_SPEC.controller.speedMetresPerSecond.walk) {
    const speedRatio = clamp01(
      (horizontalSpeed - NUMERIC_SPEC.controller.speedMetresPerSecond.walk) /
      (
        NUMERIC_SPEC.controller.speedMetresPerSecond.fullSpeed -
        NUMERIC_SPEC.controller.speedMetresPerSecond.walk
      )
    );
    pose.torsoForwardLeanDeg =
      Number(pose.torsoForwardLeanDeg ?? 0) + 8 + speedRatio * 10;
    setLeg(pose, 'left', {
      hipFlex: 38 + speedRatio * 14,
      knee: 50 + speedRatio * 12,
      anklePlantar: 10
    });
    setLeg(pose, 'right', {
      hipExtend: 32 + speedRatio * 18,
      knee: 34 + speedRatio * 10,
      anklePlantar: 16
    });
  }
  if (weights.landingPrep > 0) {
    const prep = crouchPose(hero, weights.landingPrep * 0.35);
    pose = mergePoses(pose, prep);
  }
  if (movementState === 'fast-fall') {
    pose = mergePoses(pose, {
      torsoForwardLeanDeg: 5,
      leftAnklePlantarflexionDeg: 10,
      rightAnklePlantarflexionDeg: 10
    });
  }
  return freezePose(pose);
}

function landingPose(hero, stateSeconds, heavy) {
  const action = NUMERIC_SPEC.actions.landing[heavy ? 'heavy' : 'soft'];
  const frames = hero === 'Hargold' ? action.HargoldFrames : action.MebbleFrames;
  const frame = stateSeconds * NUMERIC_SPEC.timing.animationAuthoringFps;
  const compression = hero === 'Hargold'
    ? action.HargoldCompressionPercent
    : action.MebbleCompressionPercent;
  const peak = action.compressionFrame;
  const amount = frame <= peak
    ? clamp01(frame / Math.max(1, peak))
    : 1 - clamp01((frame - peak) / Math.max(1, frames - peak));
  const pose = crouchPose(hero, amount * (heavy ? 1 : 0.7));
  return freezePose(mergePoses(pose, {
    torsoCompressionPercent: compression * amount
  }));
}

function groundSlamPose(hero, movementState, stateSeconds, velocityY) {
  const slam = NUMERIC_SPEC.actions.groundSlam;
  if (movementState === 'ground-slam-startup') {
    const frame = Math.min(slam.startupFrames, stateSeconds * 60);
    const tuck = smoothstep(0, 2, frame) * (1 - smoothstep(4, 6, frame));
    const align = smoothstep(2, 6, frame);
    const pose = crouchPose(hero, tuck * 0.72);
    return freezePose(mergePoses(pose, {
      torsoForwardLeanDeg: (hero === 'Hargold' ? 4 : 2) * align,
      leftArmBackDeg: 52 * tuck,
      rightArmBackDeg: 52 * tuck
    }));
  }
  if (movementState === 'ground-slam-fall') {
    const data = slam.descent[hero];
    const speedAmount = clamp01(
      (Math.abs(velocityY) - slam.physics.initialSpeed * 0.35) /
      (slam.physics.maximumSpeed - slam.physics.initialSpeed * 0.35)
    );
    const pose = {
      torsoForwardLeanDeg: data.leanDeg,
      leftHipFlexionDeg: data.hipDeg,
      rightHipFlexionDeg: data.hipDeg,
      leftKneeFlexionDeg: data.kneeDeg,
      rightKneeFlexionDeg: data.kneeDeg,
      leftAnklePlantarflexionDeg: data.ankleDeg,
      rightAnklePlantarflexionDeg: data.ankleDeg,
      leftHipOutDeg: data.footSeparationPercent * 0.55,
      rightHipOutDeg: data.footSeparationPercent * 0.55,
      leftArmBackDeg: 18 + speedAmount * 8,
      rightArmBackDeg: 18 + speedAmount * 8,
      leftElbowFlexionDeg: 25,
      rightElbowFlexionDeg: 25
    };
    if (hero === 'Mebble') pose.neckBackwardLeanDeg = data.neckCounterDeg;
    return freezePose(pose);
  }
  if (movementState === 'ground-slam-impact') {
    const data = slam.impact[hero];
    const frame = stateSeconds * 60;
    const amount = frame <= slam.maximumCompressionFrame
      ? clamp01(frame / slam.maximumCompressionFrame)
      : 1 - clamp01(
          (frame - slam.maximumCompressionFrame) /
          Math.max(1, slam.impactFrames - slam.maximumCompressionFrame)
        ) * 0.18;
    const pose = {
      torsoForwardLeanDeg: data.leanDeg * amount,
      torsoCompressionPercent: data.compressionPercent * amount,
      leftHipFlexionDeg: data.hipDeg * amount,
      rightHipFlexionDeg: data.hipDeg * amount,
      leftKneeFlexionDeg: data.kneeDeg * amount,
      rightKneeFlexionDeg: data.kneeDeg * amount,
      leftAnkleDorsiflexionDeg: data.ankleDeg * amount,
      rightAnkleDorsiflexionDeg: data.ankleDeg * amount,
      leftArmForwardDeg: data.armBraceDeg * amount,
      rightArmForwardDeg: data.armBraceDeg * amount,
      leftElbowFlexionDeg: 50 * amount,
      rightElbowFlexionDeg: 50 * amount
    };
    if (hero === 'Mebble') pose.neckBackwardLeanDeg = Math.abs(data.neckCounterDeg) * amount;
    return freezePose(pose);
  }
  const recoveryFrame = Math.min(slam.recoveryFrames, stateSeconds * 60);
  const amount = 1 - smoothstep(0, slam.recoveryFrames, recoveryFrame);
  return crouchPose(hero, amount * 0.82);
}

function doubleJumpPose(stateSeconds) {
  const action = NUMERIC_SPEC.actions.HargoldDoubleJump;
  const frame = Math.min(action.frames, stateSeconds * 60);
  const tuck = Math.sin(clamp01(frame / action.extensionFrame) * Math.PI);
  const twist = Math.sin(
    clamp01(frame / action.frames) * Math.PI
  );
  const pose = {
    torsoTwistDeg: action.twistDeg * twist,
    pelvisYawDeg: action.pelvisCounterDeg * twist,
    torsoCompressionPercent: 12 * tuck
  };
  setLeg(pose, 'left', {
    hipFlex: 42 + 18 * tuck,
    knee: action.raisedKneeDeg,
    anklePlantar: 8
  });
  setLeg(pose, 'right', {
    hipFlex: 12,
    knee: action.drivingKneeDeg,
    anklePlantar: 18
  });
  setArm(pose, 'left', { forward: 62, out: 18, elbow: 34 });
  setArm(pose, 'right', { back: 56, out: 14, elbow: 38 });
  return freezePose(pose);
}

function twirlPose(hero, stateSeconds) {
  const action = NUMERIC_SPEC.actions.twirl;
  const frame = Math.min(action.frames, stateSeconds * 60);
  const arm = hero === 'Hargold' ? 64 : 70;
  const pose = airPose(hero, 'apex', 0, 0, Infinity);
  return Object.freeze({
    semantic: freezePose(mergePoses(pose, {
      leftArmOutDeg: arm,
      rightArmOutDeg: arm
    })),
    visualSpinDegrees: sampleScalarKeys(
      Object.entries(action.spinDegreesByFrame)
        .map(([key, value]) => [Number(key), Number(value)])
        .sort((a, b) => a[0] - b[0]),
      frame
    )
  });
}

function sampleScalarKeys(keys, value) {
  if (value <= keys[0][0]) return keys[0][1];
  for (let index = 0; index < keys.length - 1; index += 1) {
    const [time, number] = keys[index];
    const [nextTime, nextNumber] = keys[index + 1];
    if (value <= nextTime) {
      const alpha = smoothstep(time, nextTime, value);
      return number + (nextNumber - number) * alpha;
    }
  }
  return keys.at(-1)[1];
}

function glidePose(movementState, stateSeconds) {
  const glide = NUMERIC_SPEC.actions.MebbleGlide;
  const target = {
    torsoForwardLeanDeg: glide.torsoDeg,
    chestBackwardLeanDeg: glide.chestDeg,
    neckBackwardLeanDeg: Math.abs(glide.headNeckCounterDeg),
    headBackwardLeanDeg: Math.abs(glide.headNeckCounterDeg) * 0.35,
    leftArmOutDeg: glide.armSpreadDeg,
    rightArmOutDeg: glide.armSpreadDeg,
    leftElbowFlexionDeg: glide.elbowDeg,
    rightElbowFlexionDeg: glide.elbowDeg,
    leftHipExtensionDeg: 20,
    rightHipExtensionDeg: 35,
    leftKneeFlexionDeg: 24,
    rightKneeFlexionDeg: 30
  };
  if (movementState === 'glide-opening') {
    return interpolateSemanticPoses(
      airPose('Mebble', 'fall', 4, 0, Infinity),
      target,
      clamp01(stateSeconds * 60 / glide.openFrames)
    );
  }
  if (movementState === 'glide-closing') {
    return interpolateSemanticPoses(
      target,
      airPose('Mebble', 'fall', 4, 0, Infinity),
      clamp01(stateSeconds * 60 / glide.closeFrames)
    );
  }
  const bob = Math.sin(stateSeconds / (glide.sustainFrames / 60) * Math.PI * 2);
  return freezePose({
    ...target,
    pelvisVerticalOffsetPercent: bob * glide.maximumBobPercent,
    torsoRollDeg: bob * glide.maximumRollDeg
  });
}

function damagePose(hero, stateSeconds, knockback) {
  const action = NUMERIC_SPEC.actions.damage;
  const data = action[hero];
  const frame = stateSeconds * 60;
  const amount = frame <= action.peakFrame
    ? clamp01(frame / action.peakFrame)
    : 1 - clamp01((frame - action.peakFrame) / Math.max(1, action.frames - action.peakFrame));
  const pose = {
    torsoBackwardLeanDeg: data.recoilDeg * amount,
    torsoTwistDeg: data.twistDeg * amount,
    headBackwardLeanDeg: data.recoilDeg * 0.42 * amount
  };
  setArm(pose, 'left', { back: data.armDeg * amount, out: 18 * amount, elbow: 24 * amount });
  setArm(pose, 'right', { back: data.armDeg * amount, out: 18 * amount, elbow: 24 * amount });
  setLeg(pose, 'left', { hipFlex: 20 * amount, knee: 34 * amount });
  setLeg(pose, 'right', { hipExtend: 18 * amount, knee: 26 * amount });
  if (hero === 'Mebble') pose.neckForwardLeanDeg = data.neckLagDeg * amount;
  if (knockback) pose.torsoBackwardLeanDeg += 8 * amount;
  return freezePose(pose);
}

function idlePose(hero, stateSeconds, secondary) {
  const idle = NUMERIC_SPEC.actions.idle[hero];
  const frames = secondary
    ? NUMERIC_SPEC.actions.idle.secondaryFrames
    : NUMERIC_SPEC.actions.idle.primaryFrames;
  const wave = Math.sin(stateSeconds * 60 / frames * Math.PI * 2);
  const look = secondary ? Math.sin(stateSeconds * 1.35) : 0;
  const pose = {
    chestForwardLeanDeg: idle.chestDeg * wave,
    pelvisVerticalOffsetPercent: idle.pelvisPercent * wave,
    headRollDeg: idle.headDeg * wave + look * (hero === 'Hargold' ? 3 : 4.5),
    headYawDeg: look * (hero === 'Hargold' ? 6 : 9),
    leftElbowFlexionDeg: 12,
    rightElbowFlexionDeg: 12,
    leftArmOutDeg: 4,
    rightArmOutDeg: 4,
    leftKneeFlexionDeg: 6,
    rightKneeFlexionDeg: 6
  };
  if (hero === 'Mebble') pose.neckRollDeg = idle.neckDeg * wave;
  return freezePose(pose);
}

function genericActionPose(hero, movementState, stateSeconds) {
  const pulse = Math.sin(clamp01(stateSeconds / 0.4) * Math.PI);
  if (movementState === 'ground-action') {
    const pose = {
      torsoBackwardLeanDeg: 10 * pulse,
      chestForwardLeanDeg: 14 * pulse,
      headBackwardLeanDeg: 8 * pulse
    };
    setArm(pose, 'left', { forward: 64 * pulse, elbow: 22 * pulse });
    setArm(pose, 'right', { forward: 64 * pulse, elbow: 22 * pulse });
    return freezePose(pose);
  }
  if (movementState === 'powerup-collect' || movementState === 'power-transform') {
    const transform = movementState === 'power-transform';
    const pose = {
      torsoBackwardLeanDeg: (transform ? 14 : 9) * pulse,
      chestForwardLeanDeg: (transform ? 16 : 10) * pulse,
      pelvisVerticalOffsetPercent: (transform ? 1.8 : 0.8) * pulse,
      leftKneeFlexionDeg: (transform ? 36 : 18) * (1 - pulse),
      rightKneeFlexionDeg: (transform ? 36 : 18) * (1 - pulse)
    };
    setArm(pose, 'left', { forward: 68 * pulse, out: 34 * pulse, elbow: 20 });
    setArm(pose, 'right', { forward: 68 * pulse, out: 34 * pulse, elbow: 20 });
    return freezePose(pose);
  }
  if (movementState === 'swap-out' || movementState === 'swap-in' || movementState === 'respawning') {
    const direction = movementState === 'swap-out' ? 1 : -1;
    const pose = {
      torsoTwistDeg: direction * 18 * pulse,
      torsoCompressionPercent: 5 * pulse,
      headYawDeg: direction * -14 * pulse
    };
    setArm(pose, 'left', { back: 42 * pulse, out: 16 * pulse, elbow: 30 });
    setArm(pose, 'right', { forward: 42 * pulse, out: 16 * pulse, elbow: 30 });
    setLeg(pose, 'left', { hipFlex: 26 * pulse, knee: 44 * pulse });
    setLeg(pose, 'right', { hipExtend: 18 * pulse, knee: 28 * pulse });
    return freezePose(pose);
  }
  if (movementState === 'victory') {
    const pose = {
      torsoBackwardLeanDeg: 10 * pulse,
      torsoTwistDeg: 8 * pulse,
      pelvisVerticalOffsetPercent: 1.5 * pulse,
      leftKneeFlexionDeg: 38 * pulse
    };
    setArm(pose, 'left', { forward: 75 * pulse, out: 35 * pulse, elbow: 16 });
    setArm(pose, 'right', { back: 28 * pulse, out: 15 * pulse, elbow: 40 });
    return freezePose(pose);
  }
  if (movementState === 'dead') {
    return crouchPose(hero, clamp01(stateSeconds / (hero === 'Hargold' ? 1.2 : 1.1)));
  }
  return idlePose(hero, stateSeconds, false);
}

export function sampleNumericCharacterPose({
  hero,
  movementState = 'idle',
  stateSeconds = 0,
  horizontalSpeed = 0,
  verticalSpeed = 0,
  locomotionPhase = 0,
  predictedGroundSeconds = Infinity,
  brakeProgress = 0,
  turnProgress = 0,
  presentationSubphase = 'neutral'
}) {
  if (!NUMERIC_SPEC.heroes[hero]) throw new RangeError(`unknown animation hero: ${hero}`);
  const gait = gaitForState(movementState);
  let semantic;
  let visualSpinDegrees = 0;
  if (gait && gait !== 'crawl') {
    semantic = sampleDistanceDrivenGaitPose(hero, gait, locomotionPhase);
  } else if (movementState === 'crawl') {
    const data = NUMERIC_SPEC.actions.crawl[hero];
    const wave = Math.sin(positiveModulo(locomotionPhase, 1) * Math.PI * 2);
    semantic = crouchPose(hero, 0.9);
    semantic = freezePose(mergePoses(semantic, {
      torsoForwardLeanDeg: data.leanDeg,
      leftKneeFlexionDeg: wave >= 0 ? data.leadKneeDeg : data.trailKneeDeg,
      rightKneeFlexionDeg: wave >= 0 ? data.trailKneeDeg : data.leadKneeDeg,
      leftArmForwardDeg: Math.max(0, wave) * data.armSwingDeg,
      leftArmBackDeg: Math.max(0, -wave) * data.armSwingDeg,
      rightArmForwardDeg: Math.max(0, -wave) * data.armSwingDeg,
      rightArmBackDeg: Math.max(0, wave) * data.armSwingDeg
    }));
  } else if (movementState === 'idle') {
    semantic = idlePose(hero, stateSeconds, presentationSubphase === 'secondary-idle');
  } else if (movementState === 'brake') {
    semantic = brakePose(hero, brakeProgress);
  } else if (movementState === 'skid') {
    semantic = skidPose(hero, stateSeconds, Math.abs(horizontalSpeed));
  } else if (movementState === 'turn') {
    semantic = turnPose(hero, turnProgress);
  } else if (movementState === 'crouch') {
    const entryFrames = NUMERIC_SPEC.actions.crouch.entryFrames[hero];
    semantic = crouchPose(hero, clamp01(stateSeconds * 60 / entryFrames));
  } else if (movementState === 'duck-slide') {
    semantic = slidePose(hero, Math.abs(horizontalSpeed));
  } else if (['jump-startup', 'rise', 'apex', 'fall', 'fast-fall'].includes(movementState)) {
    if (movementState === 'jump-startup') {
      const frames = NUMERIC_SPEC.actions.jump.takeoffFrames[hero];
      const frame = Math.min(frames, stateSeconds * 60);
      const compression = frame <= 1
        ? frame
        : 1 - clamp01((frame - 1) / Math.max(1, frames - 1));
      semantic = interpolateSemanticPoses(
        crouchPose(hero, compression),
        airPose(hero, 'rise', verticalSpeed, horizontalSpeed, predictedGroundSeconds),
        smoothstep(1, frames, frame)
      );
    } else {
      semantic = airPose(
        hero,
        movementState,
        verticalSpeed,
        Math.abs(horizontalSpeed),
        predictedGroundSeconds
      );
    }
  } else if (movementState === 'twirl') {
    const twirl = twirlPose(hero, stateSeconds);
    semantic = twirl.semantic;
    visualSpinDegrees = twirl.visualSpinDegrees;
  } else if (movementState === 'double-jump' && hero === 'Hargold') {
    semantic = doubleJumpPose(stateSeconds);
  } else if (['glide-opening', 'glide', 'glide-closing'].includes(movementState) && hero === 'Mebble') {
    semantic = glidePose(movementState, stateSeconds);
  } else if (['soft-land', 'landing'].includes(movementState)) {
    semantic = landingPose(hero, stateSeconds, false);
  } else if (movementState === 'hard-land') {
    semantic = landingPose(hero, stateSeconds, true);
  } else if (movementState.startsWith('ground-slam')) {
    semantic = groundSlamPose(hero, movementState, stateSeconds, verticalSpeed);
  } else if (['stomp-bounce', 'spring-bounce'].includes(movementState)) {
    const strong = movementState === 'spring-bounce';
    const action = NUMERIC_SPEC.actions.stompBounce[strong ? 'strong' : 'normal'];
    const frame = Math.min(action.frames, stateSeconds * 60);
    const compression = frame <= action.compressionFrame
      ? frame / action.compressionFrame
      : 1 - clamp01(
          (frame - action.compressionFrame) /
          Math.max(1, action.extensionFrame - action.compressionFrame)
        );
    semantic = interpolateSemanticPoses(
      crouchPose(hero, compression * (strong ? 1.2 : 1)),
      airPose(hero, 'rise', verticalSpeed, horizontalSpeed, Infinity),
      smoothstep(action.reboundFrame, action.extensionFrame, frame)
    );
  } else if (movementState === 'damage' || movementState === 'knockback') {
    semantic = damagePose(hero, stateSeconds, movementState === 'knockback');
  } else {
    semantic = genericActionPose(hero, movementState, stateSeconds);
  }
  return Object.freeze({
    semantic,
    visualSpinDegrees,
    selectedPoseState: poseIdForState(hero, movementState, {
      presentationSubphase
    })
  });
}

export function numericAnimationRigLimitedStatus() {
  return RIG_LIMITED_STATUS;
}
