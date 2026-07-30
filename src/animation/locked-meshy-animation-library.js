import * as THREE from '../../vendor/three/three.module.js';

/*
 * Animation authored specifically for the locked 24-bone Meshy skins.
 *
 * These clips never replace or reshape the approved visible meshes. They are
 * generated from each loaded rig's own bind transforms, so every key is an
 * additive local-space delta over the approved neutral pose. Imported Meshy
 * takes remain available as source references, but the visible models and
 * matching rigs are the only locked assets. Runtime locomotion is authored
 * here so gait design can be refined without replacing either character.
 */

const B = Object.freeze({
  hips: 'Hips',
  spineLower: 'Spine02',
  spineMiddle: 'Spine01',
  chest: 'Spine',
  neck: 'neck',
  head: 'Head',
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

const LOOP = Object.freeze({ loop: true });
const ONCE = Object.freeze({ loop: false });

function frame(time, rotations = {}, positions = {}) {
  return Object.freeze({ time, rotations: Object.freeze(rotations), positions: Object.freeze(positions) });
}

function motion(id, duration, frames, options = ONCE) {
  return Object.freeze({
    id,
    duration,
    frames: Object.freeze(frames),
    loop: options.loop,
    authoredSpeedMetresPerSecond: options.authoredSpeedMetresPerSecond ?? 0,
    footLock: options.footLock ?? false,
    source: 'project-authored-additive-locked-meshy-rig'
  });
}

function symmetricArms(amount, bend = 0.22, hands = 0) {
  return {
    [B.upperArmL]: [amount, 0, -amount * 0.2],
    [B.upperArmR]: [-amount, 0, -amount * 0.2],
    [B.forearmL]: [bend, 0, 0],
    [B.forearmR]: [-bend, 0, 0],
    [B.handL]: [hands, 0, -hands * 0.35],
    [B.handR]: [-hands, 0, -hands * 0.35]
  };
}

function crouchedPose(depth = 1, lean = 0.18) {
  return {
    [B.spineLower]: [lean, 0, 0],
    [B.chest]: [-lean * 0.42, 0, 0],
    [B.thighL]: [-0.76 * depth, 0, 0.08],
    [B.thighR]: [-0.76 * depth, 0, -0.08],
    [B.shinL]: [1.18 * depth, 0, 0],
    [B.shinR]: [1.18 * depth, 0, 0],
    [B.footL]: [-0.42 * depth, 0, 0],
    [B.footR]: [-0.42 * depth, 0, 0],
    ...symmetricArms(-0.34 * depth, 0.5 * depth, 0.14 * depth)
  };
}

function airbornePose(rise = true, running = false) {
  const direction = rise ? 1 : -1;
  return {
    [B.spineLower]: [-0.14 * direction, 0, 0],
    [B.chest]: [0.18 * direction, 0, 0],
    [B.neck]: [-0.08 * direction, 0, 0],
    [B.head]: [0.08 * direction, 0, 0],
    [B.thighL]: [running ? -0.62 : -0.38, 0, 0.05],
    [B.shinL]: [running ? 0.82 : 0.7, 0, 0],
    [B.thighR]: [running ? 0.42 : -0.34, 0, -0.05],
    [B.shinR]: [running ? 0.34 : 0.66, 0, 0],
    [B.footL]: [-0.18, 0, 0],
    [B.footR]: [-0.16, 0, 0],
    ...symmetricArms(running ? 0.82 : 0.58, running ? 0.44 : 0.38, 0.24)
  };
}

function recoilPose(amount = 1) {
  return {
    [B.spineLower]: [-0.34 * amount, 0, 0.1 * amount],
    [B.chest]: [-0.4 * amount, 0, -0.08 * amount],
    [B.neck]: [0.24 * amount, 0, 0],
    [B.head]: [0.32 * amount, 0, 0.12 * amount],
    [B.thighL]: [-0.28 * amount, 0, 0.12],
    [B.thighR]: [0.2 * amount, 0, -0.12],
    [B.shinL]: [0.42 * amount, 0, 0],
    [B.shinR]: [0.22 * amount, 0, 0],
    ...symmetricArms(-0.92 * amount, 0.3, 0.25)
  };
}

function gaitContactPose({
  heavy,
  stride,
  armDrive,
  lean,
  leftLead,
  compression
}) {
  const direction = leftLead ? 1 : -1;
  const roll = (heavy ? 0.035 : 0.055) * direction;
  return {
    [B.spineLower]: [lean + compression * 0.08, 0, roll],
    [B.spineMiddle]: [-lean * 0.18, 0, -roll * 0.36],
    [B.chest]: [-lean * 0.34, 0, -roll * 0.72],
    [B.neck]: [lean * 0.16, 0, roll * 0.42],
    [B.head]: [-lean * 0.12, 0, -roll * 0.34],
    [B.shoulderL]: [0, 0, -roll * 0.7],
    [B.shoulderR]: [0, 0, -roll * 0.7],
    [B.upperArmL]: [armDrive * direction, 0, -0.08],
    [B.upperArmR]: [-armDrive * direction, 0, -0.08],
    [B.forearmL]: [0.3 + Math.max(0, armDrive * -direction) * 0.22, 0, 0],
    [B.forearmR]: [-0.3 - Math.max(0, armDrive * direction) * 0.22, 0, 0],
    [B.handL]: [0.08 * direction, 0, -0.04],
    [B.handR]: [-0.08 * direction, 0, -0.04],
    [B.thighL]: [-stride * direction, 0, 0.035],
    [B.thighR]: [stride * direction, 0, -0.035],
    [B.shinL]: [leftLead ? 0.13 : 0.48 + stride * 0.26, 0, 0],
    [B.shinR]: [leftLead ? 0.48 + stride * 0.26 : 0.13, 0, 0],
    [B.footL]: [leftLead ? 0.12 : -0.24, 0, 0],
    [B.footR]: [leftLead ? -0.24 : 0.12, 0, 0],
    [B.toeL]: [leftLead ? -0.08 : 0.2, 0, 0],
    [B.toeR]: [leftLead ? 0.2 : -0.08, 0, 0]
  };
}

function gaitPassingPose({
  heavy,
  stride,
  armDrive,
  lean,
  leftPassing,
  lift
}) {
  const direction = leftPassing ? 1 : -1;
  const roll = (heavy ? 0.02 : 0.04) * direction;
  return {
    [B.spineLower]: [lean - lift * 0.02, 0, roll],
    [B.spineMiddle]: [-lean * 0.14, 0, -roll * 0.4],
    [B.chest]: [-lean * 0.3, 0, -roll * 0.64],
    [B.neck]: [lean * 0.15, 0, roll * 0.3],
    [B.head]: [-lean * 0.11, 0, -roll * 0.28],
    [B.upperArmL]: [armDrive * 0.2 * direction, 0, -0.07],
    [B.upperArmR]: [-armDrive * 0.2 * direction, 0, -0.07],
    [B.forearmL]: [0.34, 0, 0],
    [B.forearmR]: [-0.34, 0, 0],
    [B.thighL]: [leftPassing ? 0.16 * stride : -0.2 * stride, 0, 0.025],
    [B.thighR]: [leftPassing ? -0.2 * stride : 0.16 * stride, 0, -0.025],
    [B.shinL]: [leftPassing ? 0.74 + stride * 0.2 : 0.18, 0, 0],
    [B.shinR]: [leftPassing ? 0.18 : 0.74 + stride * 0.2, 0, 0],
    [B.footL]: [leftPassing ? -0.3 : 0.04, 0, 0],
    [B.footR]: [leftPassing ? 0.04 : -0.3, 0, 0],
    [B.toeL]: [leftPassing ? 0.12 : -0.04, 0, 0],
    [B.toeR]: [leftPassing ? -0.04 : 0.12, 0, 0]
  };
}

function refinedLocomotionMotions(hero) {
  const prefix = hero.toLowerCase();
  const heavy = hero === 'Hargold';
  const definitions = [
    {
      id: 'walk_refined',
      duration: heavy ? 0.74 : 0.78,
      speed: 2.55,
      stride: heavy ? 0.42 : 0.48,
      armDrive: heavy ? 0.48 : 0.55,
      lean: heavy ? 0.055 : 0.045,
      lift: heavy ? 2.2 : 2.8,
      compression: heavy ? 1.5 : 1.15
    },
    {
      id: 'run_refined',
      duration: heavy ? 0.52 : 0.56,
      speed: 4.8,
      stride: heavy ? 0.68 : 0.78,
      armDrive: heavy ? 0.82 : 0.9,
      lean: heavy ? 0.14 : 0.12,
      lift: heavy ? 3.3 : 4.2,
      compression: heavy ? 2.6 : 2
    },
    {
      id: 'sprint_refined',
      duration: heavy ? 0.43 : 0.46,
      speed: 7.15,
      stride: heavy ? 0.88 : 1.02,
      armDrive: heavy ? 1.05 : 1.12,
      lean: heavy ? 0.24 : 0.21,
      lift: heavy ? 4.2 : 5.3,
      compression: heavy ? 3.4 : 2.65
    }
  ];

  return definitions.map(definition => motion(
    `${prefix}_${definition.id}`,
    definition.duration,
    [
      frame(
        0,
        gaitContactPose({ ...definition, heavy, leftLead: true }),
        { [B.hips]: [0, -definition.compression, 0] }
      ),
      frame(
        0.24,
        gaitPassingPose({ ...definition, heavy, leftPassing: true }),
        { [B.hips]: [0, definition.lift, 0] }
      ),
      frame(
        0.5,
        gaitContactPose({ ...definition, heavy, leftLead: false }),
        { [B.hips]: [0, -definition.compression, 0] }
      ),
      frame(
        0.74,
        gaitPassingPose({ ...definition, heavy, leftPassing: false }),
        { [B.hips]: [0, definition.lift, 0] }
      ),
      frame(
        1,
        gaitContactPose({ ...definition, heavy, leftLead: true }),
        { [B.hips]: [0, -definition.compression, 0] }
      )
    ],
    {
      ...LOOP,
      footLock: true,
      authoredSpeedMetresPerSecond: definition.speed
    }
  ));
}

function sharedMotions(hero) {
  const prefix = hero.toLowerCase();
  const heavy = hero === 'Hargold';
  const idleAmplitude = heavy ? 0.035 : 0.05;
  const compression = heavy ? 1.12 : 0.9;
  const landingDepth = heavy ? 1.18 : 0.86;
  const hipDrop = heavy ? -9 : -6;

  return [
    ...refinedLocomotionMotions(hero),
    motion(`${prefix}_idle`, 2.8, [
      frame(0, {}),
      frame(0.5, {
        [B.spineLower]: [-idleAmplitude, 0, 0],
        [B.chest]: [idleAmplitude * 1.35, 0, 0],
        [B.neck]: [-idleAmplitude * 0.55, 0, 0],
        [B.head]: [idleAmplitude * 0.45, 0, 0],
        ...symmetricArms(0.025, 0.03, 0.02)
      }),
      frame(1, {})
    ], { ...LOOP, footLock: true }),
    motion(`${prefix}_idle_secondary`, 3.2, [
      frame(0, {}),
      frame(0.34, {
        [B.chest]: [0.05, 0.12, 0],
        [B.neck]: [-0.03, -0.16, 0],
        [B.head]: [0.02, -0.18, 0.04],
        ...symmetricArms(0.05, 0.08, 0.04)
      }),
      frame(0.68, {
        [B.chest]: [0.03, -0.1, 0],
        [B.neck]: [-0.02, 0.14, 0],
        [B.head]: [0.01, 0.16, -0.03],
        ...symmetricArms(0.03, 0.06, 0.03)
      }),
      frame(1, {})
    ], { ...LOOP, footLock: true }),
    motion(`${prefix}_walk_start`, 0.24, [
      frame(0, {}),
      frame(0.45, {
        [B.spineLower]: [0.12, 0, 0],
        [B.chest]: [-0.1, 0, 0],
        [B.thighL]: [-0.28, 0, 0.06],
        [B.thighR]: [0.18, 0, -0.06],
        ...symmetricArms(-0.22, 0.14)
      }),
      frame(1, {
        [B.spineLower]: [0.05, 0, 0],
        [B.thighL]: [-0.12, 0, 0],
        [B.thighR]: [0.1, 0, 0]
      })
    ], { ...ONCE, footLock: true }),
    motion(`${prefix}_walk_run_accel`, 0.3, [
      frame(0, {
        [B.spineLower]: [0.04, 0, 0],
        ...symmetricArms(-0.18, 0.16)
      }),
      frame(0.5, {
        [B.spineLower]: [0.16, 0, 0],
        [B.chest]: [-0.08, 0, 0],
        [B.thighL]: [-0.44, 0, 0],
        [B.thighR]: [0.32, 0, 0],
        ...symmetricArms(-0.52, 0.3)
      }),
      frame(1, {})
    ], { ...ONCE, footLock: true }),
    motion(`${prefix}_run_decelerate`, heavy ? 0.36 : 0.3, [
      frame(0, {}),
      frame(0.42, {
        [B.spineLower]: [-0.22 * compression, 0, 0],
        [B.chest]: [0.2 * compression, 0, 0],
        [B.thighL]: [-0.32, 0, 0.08],
        [B.thighR]: [-0.18, 0, -0.08],
        [B.shinL]: [0.62, 0, 0],
        [B.shinR]: [0.42, 0, 0],
        ...symmetricArms(0.4, 0.22)
      }),
      frame(1, {})
    ], { ...ONCE, footLock: true }),
    motion(`${prefix}_turnaround`, 0.26, [
      frame(0, {}),
      frame(0.42, {
        [B.spineLower]: [-0.32, 0, 0.18],
        [B.chest]: [0.18, 0, -0.34],
        [B.neck]: [0.06, 0, 0.26],
        [B.head]: [0.03, 0, 0.34],
        [B.thighL]: [-0.34, 0, 0.1],
        [B.thighR]: [-0.16, 0, -0.1],
        [B.shinL]: [0.72, 0, 0],
        [B.shinR]: [0.42, 0, 0],
        ...symmetricArms(0.44, 0.32, 0.14)
      }),
      frame(1, {})
    ], { ...ONCE, footLock: true }),
    motion(`${prefix}_skid`, heavy ? 0.42 : 0.34, [
      frame(0, {
        [B.spineLower]: [-0.1, 0, 0]
      }),
      frame(0.36, {
        [B.spineLower]: [-0.46 * compression, 0, 0],
        [B.chest]: [0.34 * compression, 0, 0],
        [B.neck]: [-0.12, 0, 0],
        [B.thighL]: [-0.62, 0, 0.1],
        [B.thighR]: [-0.18, 0, -0.1],
        [B.shinL]: [0.9, 0, 0],
        [B.shinR]: [0.42, 0, 0],
        [B.footL]: [-0.32, 0, 0],
        [B.footR]: [-0.12, 0, 0],
        ...symmetricArms(0.92, 0.38, 0.24)
      }, { [B.hips]: [0, hipDrop * 0.55, 0] }),
      frame(0.76, {
        [B.spineLower]: [-0.28, 0, 0],
        [B.thighL]: [-0.38, 0, 0],
        [B.shinL]: [0.55, 0, 0],
        ...symmetricArms(0.45, 0.24)
      }, { [B.hips]: [0, hipDrop * 0.25, 0] }),
      frame(1, {})
    ], { ...ONCE, footLock: true }),
    motion(`${prefix}_crouch`, 0.34, [
      frame(0, {}),
      frame(1, crouchedPose(compression, 0.22), {
        [B.hips]: [0, hipDrop * 1.1, 0]
      })
    ], { ...ONCE, footLock: true }),
    motion(`${prefix}_crawl`, 0.72, [
      frame(0, {
        ...crouchedPose(compression, 0.36),
        [B.upperArmL]: [-0.46, 0, 0],
        [B.upperArmR]: [0.42, 0, 0],
        [B.thighL]: [-0.82, 0, 0],
        [B.thighR]: [-0.42, 0, 0]
      }, { [B.hips]: [0, hipDrop, 0] }),
      frame(0.5, {
        ...crouchedPose(compression, 0.36),
        [B.upperArmL]: [0.42, 0, 0],
        [B.upperArmR]: [-0.46, 0, 0],
        [B.thighL]: [-0.42, 0, 0],
        [B.thighR]: [-0.82, 0, 0]
      }, { [B.hips]: [0, hipDrop, 0] }),
      frame(1, {
        ...crouchedPose(compression, 0.36),
        [B.upperArmL]: [-0.46, 0, 0],
        [B.upperArmR]: [0.42, 0, 0],
        [B.thighL]: [-0.82, 0, 0],
        [B.thighR]: [-0.42, 0, 0]
      }, { [B.hips]: [0, hipDrop, 0] })
    ], { ...LOOP, footLock: true, authoredSpeedMetresPerSecond: 1.35 }),
    motion(`${prefix}_slide`, 0.54, [
      frame(0, crouchedPose(compression, 0.28), { [B.hips]: [0, hipDrop, 0] }),
      frame(0.55, {
        ...crouchedPose(compression * 0.92, 0.48),
        [B.thighL]: [-0.95, 0, 0.08],
        [B.shinL]: [0.42, 0, 0],
        [B.thighR]: [-0.28, 0, -0.08],
        [B.shinR]: [0.96, 0, 0],
        ...symmetricArms(0.74, 0.28, 0.18)
      }, { [B.hips]: [0, hipDrop * 1.05, 0] }),
      frame(1, crouchedPose(compression * 0.9, 0.35), { [B.hips]: [0, hipDrop * 0.8, 0] })
    ], { ...ONCE, footLock: true }),
    motion(`${prefix}_jump_anticipation`, heavy ? 0.16 : 0.13, [
      frame(0, {}),
      frame(0.72, crouchedPose(compression, 0.3), {
        [B.hips]: [0, hipDrop, 0]
      }),
      frame(1, crouchedPose(compression * 0.7, 0.2), {
        [B.hips]: [0, hipDrop * 0.55, 0]
      })
    ], { ...ONCE, footLock: true }),
    motion(`${prefix}_jump_takeoff`, 0.2, [
      frame(0, crouchedPose(compression * 0.7, 0.18), {
        [B.hips]: [0, hipDrop * 0.5, 0]
      }),
      frame(0.45, {
        ...airbornePose(true, false),
        [B.thighL]: [-0.18, 0, 0.05],
        [B.thighR]: [-0.18, 0, -0.05],
        [B.shinL]: [0.2, 0, 0],
        [B.shinR]: [0.2, 0, 0],
        ...symmetricArms(0.96, 0.25, 0.2)
      }, { [B.hips]: [0, 2, 0] }),
      frame(1, airbornePose(true, false))
    ]),
    motion(`${prefix}_jump_rise`, 0.34, [
      frame(0, airbornePose(true, false)),
      frame(0.55, {
        ...airbornePose(true, false),
        [B.thighL]: [-0.52, 0, 0.08],
        [B.thighR]: [-0.34, 0, -0.08],
        [B.shinL]: [0.78, 0, 0],
        [B.shinR]: [0.66, 0, 0],
        ...symmetricArms(0.72, 0.35, 0.22)
      }),
      frame(1, airbornePose(true, false))
    ], LOOP),
    motion(`${prefix}_jump_apex`, 0.28, [
      frame(0, airbornePose(true, false)),
      frame(0.5, {
        [B.spineLower]: [0.02, 0, 0],
        [B.chest]: [0.08, 0, 0],
        [B.neck]: [-0.03, 0, 0],
        [B.thighL]: [-0.56, 0, 0.08],
        [B.thighR]: [-0.5, 0, -0.08],
        [B.shinL]: [0.9, 0, 0],
        [B.shinR]: [0.86, 0, 0],
        ...symmetricArms(0.45, 0.46, 0.22)
      }),
      frame(1, airbornePose(false, false))
    ], LOOP),
    motion(`${prefix}_jump_fall`, 0.38, [
      frame(0, airbornePose(false, false)),
      frame(0.55, {
        ...airbornePose(false, false),
        [B.spineLower]: [0.22, 0, 0],
        [B.thighL]: [-0.28, 0, 0.07],
        [B.thighR]: [-0.42, 0, -0.07],
        [B.shinL]: [0.56, 0, 0],
        [B.shinR]: [0.72, 0, 0],
        ...symmetricArms(0.3, 0.5, 0.18)
      }),
      frame(1, airbornePose(false, false))
    ], LOOP),
    motion(`${prefix}_running_jump`, 0.42, [
      frame(0, airbornePose(true, true)),
      frame(0.5, {
        ...airbornePose(true, true),
        [B.thighL]: [0.62, 0, 0.08],
        [B.shinL]: [0.28, 0, 0],
        [B.thighR]: [-0.75, 0, -0.08],
        [B.shinR]: [0.82, 0, 0],
        ...symmetricArms(-0.78, 0.48, 0.22)
      }),
      frame(1, airbornePose(true, true))
    ], LOOP),
    motion(`${prefix}_air_adjust`, 0.3, [
      frame(0, airbornePose(false, true)),
      frame(0.5, {
        ...airbornePose(false, true),
        [B.chest]: [0.08, 0, 0.22],
        [B.head]: [-0.04, 0, -0.2],
        ...symmetricArms(0.25, 0.42, 0.18)
      }),
      frame(1, airbornePose(false, true))
    ], LOOP),
    motion(`${prefix}_air_spin`, heavy ? 0.42 : 0.36, [
      frame(0, airbornePose(true, false)),
      frame(0.25, {
        ...airbornePose(true, false),
        [B.spineLower]: [-0.22, 0, 0.55],
        [B.chest]: [0.16, 0, 0.65],
        ...symmetricArms(0.84, 0.32, 0.2)
      }),
      frame(0.5, {
        ...airbornePose(true, false),
        [B.spineLower]: [-0.18, 0, 1.1],
        [B.chest]: [0.15, 0, 1.2],
        ...symmetricArms(0.75, 0.34, 0.2)
      }),
      frame(0.75, {
        ...airbornePose(true, false),
        [B.spineLower]: [-0.16, 0, -0.55],
        [B.chest]: [0.12, 0, -0.65],
        ...symmetricArms(0.66, 0.36, 0.2)
      }),
      frame(1, airbornePose(false, false))
    ]),
    motion(`${prefix}_stomp_bounce`, 0.32, [
      frame(0, crouchedPose(compression * 0.7, 0.18)),
      frame(0.34, {
        ...airbornePose(true, false),
        [B.thighL]: [-0.2, 0, 0.06],
        [B.thighR]: [-0.2, 0, -0.06],
        [B.shinL]: [0.3, 0, 0],
        [B.shinR]: [0.3, 0, 0],
        ...symmetricArms(0.92, 0.28, 0.22)
      }),
      frame(1, airbornePose(true, false))
    ]),
    motion(`${prefix}_land_soft`, 0.26, [
      frame(0, airbornePose(false, false)),
      frame(0.36, crouchedPose(landingDepth * 0.62, 0.25), {
        [B.hips]: [0, hipDrop * 0.72, 0]
      }),
      frame(1, {})
    ], { ...ONCE, footLock: true }),
    motion(`${prefix}_land_heavy`, heavy ? 0.46 : 0.38, [
      frame(0, airbornePose(false, false)),
      frame(0.3, crouchedPose(landingDepth, 0.42), {
        [B.hips]: [0, hipDrop * 1.25, 0]
      }),
      frame(0.67, crouchedPose(landingDepth * 0.72, 0.24), {
        [B.hips]: [0, hipDrop * 0.64, 0]
      }),
      frame(1, {})
    ], { ...ONCE, footLock: true }),
    motion(`${prefix}_ground_slam_start`, 0.13, [
      frame(0, airbornePose(false, false)),
      frame(0.7, {
        [B.spineLower]: [-0.28, 0, 0],
        [B.chest]: [0.22, 0, 0],
        [B.thighL]: [-0.86, 0, 0.08],
        [B.thighR]: [-0.86, 0, -0.08],
        [B.shinL]: [1.22, 0, 0],
        [B.shinR]: [1.22, 0, 0],
        ...symmetricArms(-0.82, 0.72, 0.22)
      }),
      frame(1, crouchedPose(0.8, -0.14))
    ]),
    motion(`${prefix}_ground_slam_fall`, 0.28, [
      frame(0, crouchedPose(0.72, -0.16)),
      frame(0.5, {
        [B.spineLower]: [0.2, 0, 0],
        [B.chest]: [-0.16, 0, 0],
        [B.thighL]: [-0.24, 0, 0.08],
        [B.thighR]: [-0.24, 0, -0.08],
        [B.shinL]: [0.18, 0, 0],
        [B.shinR]: [0.18, 0, 0],
        ...symmetricArms(0.34, 0.18, 0.12)
      }),
      frame(1, crouchedPose(0.72, -0.16))
    ], LOOP),
    motion(`${prefix}_ground_slam_impact`, heavy ? 0.48 : 0.4, [
      frame(0, crouchedPose(0.72, -0.16)),
      frame(0.18, {
        ...crouchedPose(landingDepth * 1.18, 0.52),
        [B.shoulderL]: [0.08, 0, -0.14],
        [B.shoulderR]: [-0.08, 0, 0.14],
        [B.neck]: [-0.12, 0, 0],
        [B.head]: [0.1, 0, 0]
      }, {
        [B.hips]: [0, hipDrop * 1.45, 0]
      }),
      frame(0.62, crouchedPose(landingDepth * 0.82, 0.28), {
        [B.hips]: [0, hipDrop * 0.76, 0]
      }),
      frame(1, crouchedPose(landingDepth * 0.68, 0.18), {
        [B.hips]: [0, hipDrop * 0.48, 0]
      })
    ], { ...ONCE, footLock: true }),
    motion(`${prefix}_ground_slam_recover`, heavy ? 0.24 : 0.2, [
      frame(0, crouchedPose(landingDepth * 0.68, 0.18), {
        [B.hips]: [0, hipDrop * 0.48, 0]
      }),
      frame(0.58, {
        [B.spineLower]: [-0.08, 0, 0],
        [B.chest]: [0.1, 0, 0],
        [B.neck]: [-0.04, 0, 0],
        [B.thighL]: [-0.18, 0, 0.04],
        [B.thighR]: [-0.18, 0, -0.04],
        [B.shinL]: [0.3, 0, 0],
        [B.shinR]: [0.3, 0, 0],
        ...symmetricArms(0.18, 0.18, 0.08)
      }, {
        [B.hips]: [0, hipDrop * 0.12, 0]
      }),
      frame(1, {})
    ], { ...ONCE, footLock: true }),
    motion(`${prefix}_block_hit`, 0.28, [
      frame(0, {}),
      frame(0.35, {
        [B.spineLower]: [-0.26, 0, 0],
        [B.chest]: [0.32, 0, 0],
        [B.head]: [-0.14, 0, 0],
        [B.upperArmL]: [1.12, 0, 0],
        [B.upperArmR]: [-1.12, 0, 0],
        [B.forearmL]: [0.28, 0, 0],
        [B.forearmR]: [-0.28, 0, 0]
      }),
      frame(1, {})
    ]),
    motion(`${prefix}_hurt`, 0.34, [
      frame(0, {}),
      frame(0.32, recoilPose(1)),
      frame(0.72, recoilPose(0.55)),
      frame(1, {})
    ]),
    motion(`${prefix}_knockback`, 0.52, [
      frame(0, recoilPose(0.75)),
      frame(0.45, {
        ...recoilPose(1.15),
        [B.thighL]: [0.45, 0, 0.12],
        [B.thighR]: [-0.62, 0, -0.12],
        [B.shinL]: [0.28, 0, 0],
        [B.shinR]: [0.82, 0, 0]
      }),
      frame(1, recoilPose(0.45))
    ]),
    motion(`${prefix}_defeat`, 1.2, [
      frame(0, {}),
      frame(0.28, recoilPose(0.7)),
      frame(0.62, {
        [B.spineLower]: [0.72, 0, 0.18],
        [B.chest]: [0.38, 0, -0.15],
        [B.neck]: [0.32, 0, 0],
        [B.head]: [0.4, 0, 0.1],
        [B.thighL]: [-0.72, 0, 0.12],
        [B.thighR]: [-0.68, 0, -0.12],
        [B.shinL]: [1.08, 0, 0],
        [B.shinR]: [1.04, 0, 0],
        ...symmetricArms(-0.62, 0.72, 0.25)
      }, { [B.hips]: [0, hipDrop * 1.4, 0] }),
      frame(1, {
        ...crouchedPose(1.05, 0.62),
        [B.head]: [0.38, 0, 0.08]
      }, { [B.hips]: [0, hipDrop * 1.5, 0] })
    ]),
    motion(`${prefix}_ledge_stop`, 0.3, [
      frame(0, {}),
      frame(0.35, {
        [B.spineLower]: [-0.34, 0, 0],
        [B.chest]: [0.28, 0, 0],
        [B.neck]: [-0.12, 0, 0],
        [B.thighL]: [-0.42, 0, 0.08],
        [B.thighR]: [-0.16, 0, -0.08],
        [B.shinL]: [0.78, 0, 0],
        [B.shinR]: [0.38, 0, 0],
        ...symmetricArms(0.86, 0.32, 0.2)
      }),
      frame(1, {})
    ], { ...ONCE, footLock: true }),
    motion(`${prefix}_powerup_collect`, 0.62, [
      frame(0, {}),
      frame(0.35, {
        [B.spineLower]: [-0.18, 0, 0],
        [B.chest]: [0.26, 0, 0],
        [B.neck]: [-0.1, 0, 0],
        [B.head]: [-0.12, 0, 0],
        ...symmetricArms(1.02, 0.18, 0.22)
      }),
      frame(0.72, {
        [B.spineLower]: [0.08, 0, 0],
        [B.chest]: [0.14, 0, 0],
        ...symmetricArms(0.74, 0.32, 0.18)
      }),
      frame(1, {})
    ], { ...ONCE, footLock: true }),
    motion(`${prefix}_power_transform`, 0.74, [
      frame(0, {}),
      frame(0.25, crouchedPose(0.46, 0.16), { [B.hips]: [0, hipDrop * 0.35, 0] }),
      frame(0.52, {
        [B.spineLower]: [-0.24, 0, 0],
        [B.chest]: [0.32, 0, 0],
        [B.head]: [-0.12, 0, 0],
        ...symmetricArms(1.14, 0.2, 0.2)
      }, { [B.hips]: [0, 2, 0] }),
      frame(1, {})
    ], { ...ONCE, footLock: true }),
    motion(`${prefix}_victory`, heavy ? 1.5 : 1.35, [
      frame(0, {}),
      frame(0.22, crouchedPose(0.48, 0.14), { [B.hips]: [0, hipDrop * 0.35, 0] }),
      frame(0.48, {
        [B.spineLower]: [-0.2, 0, -0.08],
        [B.chest]: [0.28, 0, 0.16],
        [B.neck]: [-0.1, 0, -0.12],
        [B.head]: [-0.14, 0, -0.18],
        [B.thighL]: [-0.42, 0, 0.08],
        [B.shinL]: [0.72, 0, 0],
        [B.upperArmL]: [1.3, 0, 0.18],
        [B.forearmL]: [0.18, 0, 0],
        [B.upperArmR]: [-0.42, 0, -0.08],
        [B.forearmR]: [-0.58, 0, 0],
        [B.handL]: [0.28, 0, 0],
        [B.handR]: [-0.16, 0, 0]
      }, { [B.hips]: [0, 3, 0] }),
      frame(0.72, {
        [B.spineLower]: [-0.14, 0, -0.06],
        [B.chest]: [0.22, 0, 0.12],
        [B.head]: [-0.12, 0, -0.14],
        [B.upperArmL]: [1.18, 0, 0.14],
        [B.forearmL]: [0.22, 0, 0],
        [B.upperArmR]: [-0.36, 0, -0.06],
        [B.forearmR]: [-0.5, 0, 0]
      }),
      frame(1, {})
    ], { ...LOOP, footLock: true }),
    motion(`${prefix}_swap_out`, 0.4, [
      frame(0, {}),
      frame(0.5, {
        [B.spineLower]: [0.3, 0, 0.2],
        [B.chest]: [-0.18, 0, -0.28],
        [B.thighL]: [-0.48, 0, 0.08],
        [B.shinL]: [0.78, 0, 0],
        ...symmetricArms(-0.62, 0.3, 0.18)
      }),
      frame(1, recoilPose(0.35))
    ]),
    motion(`${prefix}_swap_in`, 0.42, [
      frame(0, recoilPose(0.35)),
      frame(0.48, {
        [B.spineLower]: [-0.18, 0, -0.16],
        [B.chest]: [0.24, 0, 0.22],
        [B.thighR]: [-0.46, 0, -0.08],
        [B.shinR]: [0.76, 0, 0],
        ...symmetricArms(0.72, 0.28, 0.18)
      }),
      frame(1, {})
    ], { ...ONCE, footLock: true })
  ];
}

function heroSpecificMotions(hero) {
  const prefix = hero.toLowerCase();
  if (hero === 'Hargold') {
    return [
      motion(`${prefix}_double_jump`, 0.46, [
        frame(0, airbornePose(false, false)),
        frame(0.22, {
          [B.spineLower]: [0.34, 0, 0],
          [B.chest]: [-0.24, 0, 0],
          [B.thighL]: [-0.92, 0, 0.1],
          [B.thighR]: [-0.92, 0, -0.1],
          [B.shinL]: [1.24, 0, 0],
          [B.shinR]: [1.24, 0, 0],
          ...symmetricArms(-0.9, 0.72, 0.25)
        }, { [B.hips]: [0, -8, 0] }),
        frame(0.5, {
          [B.spineLower]: [-0.36, 0, 0.48],
          [B.chest]: [0.3, 0, 0.58],
          [B.thighL]: [-0.18, 0, 0.08],
          [B.thighR]: [-0.18, 0, -0.08],
          [B.shinL]: [0.28, 0, 0],
          [B.shinR]: [0.28, 0, 0],
          ...symmetricArms(1.08, 0.28, 0.26)
        }, { [B.hips]: [0, 3, 0] }),
        frame(0.76, {
          ...airbornePose(true, false),
          [B.spineLower]: [-0.18, 0, -0.42],
          [B.chest]: [0.16, 0, -0.48],
          ...symmetricArms(0.78, 0.34, 0.22)
        }),
        frame(1, airbornePose(true, false))
      ])
    ];
  }

  return [
    motion(`${prefix}_glide_open`, 0.3, [
      frame(0, airbornePose(false, false)),
      frame(0.45, {
        [B.spineLower]: [-0.1, 0, 0],
        [B.chest]: [0.18, 0, 0],
        [B.neck]: [-0.06, 0, 0],
        [B.head]: [0.04, 0, 0],
        [B.thighL]: [-0.28, 0, 0.06],
        [B.thighR]: [-0.34, 0, -0.06],
        [B.shinL]: [0.48, 0, 0],
        [B.shinR]: [0.54, 0, 0],
        ...symmetricArms(1.12, 0.18, 0.2)
      }),
      frame(1, {
        [B.spineLower]: [-0.08, 0, 0],
        [B.chest]: [0.14, 0, 0],
        [B.neck]: [-0.04, 0, 0],
        [B.thighL]: [-0.24, 0, 0.06],
        [B.thighR]: [-0.3, 0, -0.06],
        [B.shinL]: [0.44, 0, 0],
        [B.shinR]: [0.5, 0, 0],
        ...symmetricArms(1.28, 0.12, 0.18)
      })
    ]),
    motion(`${prefix}_glide_sustain`, 1.1, [
      frame(0, {
        [B.spineLower]: [-0.08, 0, 0],
        [B.chest]: [0.14, 0, 0],
        [B.neck]: [-0.04, 0, 0],
        [B.thighL]: [-0.24, 0, 0.06],
        [B.thighR]: [-0.3, 0, -0.06],
        [B.shinL]: [0.44, 0, 0],
        [B.shinR]: [0.5, 0, 0],
        ...symmetricArms(1.28, 0.12, 0.18)
      }),
      frame(0.5, {
        [B.spineLower]: [-0.12, 0, 0.04],
        [B.chest]: [0.18, 0, -0.04],
        [B.neck]: [-0.05, 0, 0.03],
        [B.head]: [0.03, 0, -0.03],
        [B.thighL]: [-0.3, 0, 0.06],
        [B.thighR]: [-0.26, 0, -0.06],
        [B.shinL]: [0.5, 0, 0],
        [B.shinR]: [0.46, 0, 0],
        ...symmetricArms(1.24, 0.15, 0.18)
      }),
      frame(1, {
        [B.spineLower]: [-0.08, 0, 0],
        [B.chest]: [0.14, 0, 0],
        [B.neck]: [-0.04, 0, 0],
        [B.thighL]: [-0.24, 0, 0.06],
        [B.thighR]: [-0.3, 0, -0.06],
        [B.shinL]: [0.44, 0, 0],
        [B.shinR]: [0.5, 0, 0],
        ...symmetricArms(1.28, 0.12, 0.18)
      })
    ], LOOP),
    motion(`${prefix}_glide_close`, 0.28, [
      frame(0, {
        [B.spineLower]: [-0.08, 0, 0],
        [B.chest]: [0.14, 0, 0],
        [B.thighL]: [-0.24, 0, 0.06],
        [B.thighR]: [-0.3, 0, -0.06],
        [B.shinL]: [0.44, 0, 0],
        [B.shinR]: [0.5, 0, 0],
        ...symmetricArms(1.28, 0.12, 0.18)
      }),
      frame(0.55, {
        ...airbornePose(false, false),
        ...symmetricArms(0.5, 0.38, 0.16)
      }),
      frame(1, airbornePose(false, false))
    ])
  ];
}

export function authoredLockedMeshyMotions(hero) {
  if (!['Hargold', 'Mebble'].includes(hero)) {
    throw new RangeError(`unknown locked Meshy hero: ${hero}`);
  }
  return Object.freeze([...sharedMotions(hero), ...heroSpecificMotions(hero)]);
}

function quaternionValues(bindQuaternion, rotation) {
  const delta = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(rotation[0] ?? 0, rotation[1] ?? 0, rotation[2] ?? 0, 'XYZ')
  );
  const value = bindQuaternion.clone().multiply(delta).normalize();
  return [value.x, value.y, value.z, value.w];
}

export function buildLockedMeshyAnimationClips(root, hero) {
  const bones = new Map();
  root.traverse(object => {
    if (object.isBone) bones.set(object.name, object);
  });
  const motions = authoredLockedMeshyMotions(hero);
  const clips = [];

  for (const definition of motions) {
    const rotations = new Set();
    const positions = new Set();
    for (const key of definition.frames) {
      for (const boneName of Object.keys(key.rotations)) rotations.add(boneName);
      for (const boneName of Object.keys(key.positions)) positions.add(boneName);
    }
    const tracks = [];
    const times = definition.frames.map(key => key.time * definition.duration);
    for (const boneName of rotations) {
      const bone = bones.get(boneName);
      if (!bone) continue;
      const values = [];
      for (const key of definition.frames) {
        values.push(...quaternionValues(
          bone.quaternion,
          key.rotations[boneName] ?? [0, 0, 0]
        ));
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(
        `${boneName}.quaternion`,
        times,
        values
      ));
    }
    for (const boneName of positions) {
      const bone = bones.get(boneName);
      if (!bone) continue;
      const values = [];
      for (const key of definition.frames) {
        const delta = key.positions[boneName] ?? [0, 0, 0];
        values.push(
          bone.position.x + delta[0],
          bone.position.y + delta[1],
          bone.position.z + delta[2]
        );
      }
      tracks.push(new THREE.VectorKeyframeTrack(
        `${boneName}.position`,
        times,
        values
      ));
    }
    const clip = new THREE.AnimationClip(definition.id, definition.duration, tracks);
    clip.userData = {
      loop: definition.loop,
      footLock: definition.footLock,
      authoredSpeedMetresPerSecond: definition.authoredSpeedMetresPerSecond,
      source: definition.source
    };
    clips.push(clip);
  }
  return clips;
}

export const LOCKED_MESHY_ANIMATION_BONES = B;
