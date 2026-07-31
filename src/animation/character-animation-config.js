import { authoredLockedMeshyMotions } from './locked-meshy-animation-library.js';
import { CHARACTER_ANIMATION_NUMERIC_SPEC } from './character-animation-numeric-runtime.js';

const NUMERIC = CHARACTER_ANIMATION_NUMERIC_SPEC;
const ANIMATION_FPS = NUMERIC.timing.animationAuthoringFps;

const SUPPLIED_CLIPS = Object.freeze({
  Hargold: Object.freeze([
    Object.freeze({
      id: 'hargold_walk',
      label: 'Walk · supplied Meshy reference take',
      durationSeconds: 1.03333343,
      loop: true,
      footLock: true,
      authoredSpeedMetresPerSecond: 3.2,
      source: 'supplied-meshy-reference'
    }),
    Object.freeze({
      id: 'hargold_run',
      label: 'Run · supplied Meshy reference take',
      durationSeconds: 0.63333333,
      loop: true,
      footLock: true,
      authoredSpeedMetresPerSecond: 5.7,
      source: 'supplied-meshy-reference'
    })
  ]),
  Mebble: Object.freeze([
    Object.freeze({
      id: 'mebble_walk',
      label: 'Walk · supplied Meshy reference take',
      durationSeconds: 1.03333343,
      loop: true,
      footLock: true,
      authoredSpeedMetresPerSecond: 3.2,
      source: 'supplied-meshy-reference'
    }),
    Object.freeze({
      id: 'mebble_run',
      label: 'Run · supplied Meshy reference take',
      durationSeconds: 0.63333333,
      loop: true,
      footLock: true,
      authoredSpeedMetresPerSecond: 5.7,
      source: 'supplied-meshy-reference'
    })
  ])
});

function generatedClipMetadata(hero) {
  return authoredLockedMeshyMotions(hero).map(clip => Object.freeze({
    id: clip.id,
    label: `${clip.id.replace(`${hero.toLowerCase()}_`, '').replaceAll('_', ' ')} · locked-rig authored`,
    durationSeconds: clip.duration,
    loop: clip.loop,
    footLock: clip.footLock,
    footLockAxes: clip.footLockAxes,
    markers: clip.markers,
    parameterization: clip.parameterization,
    numericAuthority: clip.numericAuthority,
    authoredSpeedMetresPerSecond: clip.authoredSpeedMetresPerSecond,
    source: clip.source
  }));
}

export const IMPORTED_CHARACTER_ANIMATIONS = Object.freeze(
  Object.fromEntries(['Hargold', 'Mebble'].map(hero => [
    hero,
    Object.freeze({
      restPose: 'rest-pose',
      walk: `${hero.toLowerCase()}_walk_refined`,
      run: `${hero.toLowerCase()}_run_refined`,
      sprint: `${hero.toLowerCase()}_sprint_refined`,
      clips: Object.freeze([
        ...SUPPLIED_CLIPS[hero],
        ...generatedClipMetadata(hero)
      ])
    })
  ]))
);

export const LIVE_ANIMATION_STATES = Object.freeze([
  'NeutralIdle',
  'SecondaryIdle',
  'MoveStart',
  'Walk',
  'WalkRunAcceleration',
  'Run',
  'Sprint',
  'MoveStop',
  'Turn',
  'Skid',
  'Crouch',
  'Crawl',
  'Slide',
  'JumpAnticipation',
  'JumpStart',
  'JumpRise',
  'RunningJump',
  'JumpApex',
  'Fall',
  'AirAdjust',
  'Twirl',
  'StompBounce',
  'Land',
  'HeavyLand',
  'GroundSlamStart',
  'GroundSlamFall',
  'GroundSlamImpact',
  'GroundSlamRecovery',
  'Damage',
  'Knockback',
  'Defeat',
  'Victory',
  'SwapOut',
  'SwapIn',
  'HargoldDoubleJump',
  'MebbleGlideOpen',
  'MebbleGlideSustain',
  'MebbleGlideClose'
]);

const CUE_SUFFIX = Object.freeze({
  'block-hit': 'block_hit',
  attack: 'block_hit',
  'power-up-collect': 'powerup_collect',
  'power-transform': 'power_transform',
  victory: 'victory',
  'swap-out': 'swap_out',
  'swap-in': 'swap_in'
});

function prefixFor(hero) {
  return hero?.toLowerCase?.() ?? '';
}

function clipFor(hero, suffix) {
  return `${prefixFor(hero)}_${suffix}`;
}

function oneShot(clipId, {
  blendSeconds = 0.07,
  footLock = false,
  playbackRate = 1
} = {}) {
  return Object.freeze({
    clipId,
    loop: false,
    blendSeconds,
    footLock,
    playbackRate,
    phaseSync: false,
    controllerDriven: true
  });
}

function looped(clipId, {
  blendSeconds = 0.1,
  footLock = false,
  playbackRate = 1,
  phaseSync = false
} = {}) {
  return Object.freeze({
    clipId,
    loop: true,
    blendSeconds,
    footLock,
    playbackRate,
    phaseSync,
    controllerDriven: true
  });
}

export function animationIntentFor({
  hero,
  movementState = 'idle',
  previousMovementState = movementState,
  stateSeconds = 0,
  airborneSeconds = 0,
  horizontalSpeed = 0,
  verticalSpeed = 0,
  grounded = true,
  animationCue = null
}) {
  const config = IMPORTED_CHARACTER_ANIMATIONS[hero];
  if (!config) return looped('rest-pose', { footLock: grounded });
  const prefix = prefixFor(hero);
  const speed = Math.abs(horizontalSpeed);
  const cueSuffix = CUE_SUFFIX[animationCue?.type ?? animationCue];
  if (cueSuffix) {
    return oneShot(`${prefix}_${cueSuffix}`, {
      blendSeconds: 0.045,
      footLock: grounded
    });
  }

  switch (movementState) {
    case 'idle':
      if (stateSeconds >= 4.2 && stateSeconds % 7.2 < 2.9) {
        return looped(`${prefix}_idle_secondary`, {
          footLock: true,
          blendSeconds: NUMERIC.blendSeconds.idleToWalk
        });
      }
      return looped(`${prefix}_idle`, {
        footLock: true,
        blendSeconds: NUMERIC.blendSeconds.idleToWalk
      });
    case 'walk':
      if (
        previousMovementState === 'idle' &&
        stateSeconds < NUMERIC.actions.moveStart[hero].frames / ANIMATION_FPS
      ) {
        return oneShot(`${prefix}_walk_start`, {
          footLock: true,
          blendSeconds: NUMERIC.blendSeconds.idleToWalk
        });
      }
      return looped(config.walk, {
        footLock: true,
        phaseSync: true,
        blendSeconds: NUMERIC.blendSeconds.gaitToGait
      });
    case 'run':
      if (
        ['idle', 'walk'].includes(previousMovementState) &&
        stateSeconds <
          (hero === 'Hargold'
            ? NUMERIC.actions.walkToRun.HargoldFrames
            : NUMERIC.actions.walkToRun.MebbleFrames) / ANIMATION_FPS
      ) {
        return oneShot(`${prefix}_walk_run_accel`, {
          footLock: true,
          blendSeconds: NUMERIC.blendSeconds.gaitToGait
        });
      }
      return looped(config.run, {
        footLock: true,
        phaseSync: true,
        blendSeconds: NUMERIC.blendSeconds.gaitToGait
      });
    case 'sprint':
      return looped(config.sprint, {
        footLock: true,
        phaseSync: true,
        blendSeconds: NUMERIC.blendSeconds.gaitToGait
      });
    case 'brake':
      return oneShot(`${prefix}_run_decelerate`, {
        footLock: true,
        blendSeconds: NUMERIC.blendSeconds.brake
      });
    case 'turn':
      return oneShot(`${prefix}_turnaround`, {
        footLock: true,
        blendSeconds: NUMERIC.blendSeconds.turn
      });
    case 'skid':
      return oneShot(`${prefix}_skid`, {
        footLock: true,
        blendSeconds: NUMERIC.blendSeconds.skid
      });
    case 'crouch':
      return oneShot(`${prefix}_crouch`, {
        footLock: true,
        blendSeconds: NUMERIC.blendSeconds.crouch
      });
    case 'crawl':
      return looped(`${prefix}_crawl`, {
        footLock: true,
        blendSeconds: NUMERIC.blendSeconds.crouch,
        phaseSync: true
      });
    case 'duck-slide':
      return oneShot(`${prefix}_slide`, {
        footLock: true,
        blendSeconds: NUMERIC.blendSeconds.slide
      });
    case 'jump-startup':
      return oneShot(`${prefix}_jump_anticipation`, {
        footLock: true,
        blendSeconds: NUMERIC.blendSeconds.jump
      });
    case 'rise':
      if (speed >= 4.1) {
        return looped(`${prefix}_running_jump`, {
          blendSeconds: NUMERIC.blendSeconds.airPose
        });
      }
      return looped(`${prefix}_jump_rise`, {
        blendSeconds: NUMERIC.blendSeconds.airPose,
        playbackRate: Math.min(1.22, Math.max(0.82, Math.abs(verticalSpeed) / 8.5))
      });
    case 'apex':
      return looped(`${prefix}_jump_apex`, {
        blendSeconds: NUMERIC.blendSeconds.airPose
      });
    case 'fall':
    case 'fast-fall':
      return looped(
        speed >= 4.5 ? `${prefix}_air_adjust` : `${prefix}_jump_fall`,
        {
          blendSeconds: NUMERIC.blendSeconds.airPose,
          playbackRate: movementState === 'fast-fall' ? 1.2 : 1
        }
      );
    case 'twirl':
      return oneShot(`${prefix}_air_spin`, { blendSeconds: NUMERIC.blendSeconds.turn });
    case 'double-jump':
      return oneShot(
        hero === 'Hargold' ? `${prefix}_double_jump` : `${prefix}_air_spin`,
        { blendSeconds: NUMERIC.blendSeconds.turn }
      );
    case 'glide-opening':
      return oneShot(
        hero === 'Mebble' ? `${prefix}_glide_open` : `${prefix}_jump_fall`,
        { blendSeconds: NUMERIC.blendSeconds.airPose }
      );
    case 'glide':
      return looped(
        hero === 'Mebble' ? `${prefix}_glide_sustain` : `${prefix}_jump_fall`,
        { blendSeconds: NUMERIC.blendSeconds.airPose }
      );
    case 'glide-closing':
      return oneShot(
        hero === 'Mebble' ? `${prefix}_glide_close` : `${prefix}_jump_fall`,
        { blendSeconds: NUMERIC.blendSeconds.airPose }
      );
    case 'stomp':
    case 'stomp-bounce':
    case 'spring-bounce':
      return oneShot(`${prefix}_stomp_bounce`, { blendSeconds: NUMERIC.blendSeconds.landing });
    case 'soft-land':
    case 'landing':
      return oneShot(`${prefix}_land_soft`, {
        footLock: true,
        blendSeconds: NUMERIC.blendSeconds.landing
      });
    case 'hard-land':
      return oneShot(`${prefix}_land_heavy`, {
        footLock: true,
        blendSeconds: NUMERIC.blendSeconds.landing
      });
    case 'ground-slam-startup':
      return oneShot(`${prefix}_ground_slam_start`, {
        blendSeconds: NUMERIC.blendSeconds.groundSlamStartup
      });
    case 'ground-slam-fall':
      return looped(`${prefix}_ground_slam_fall`, {
        blendSeconds: NUMERIC.blendSeconds.groundSlamStartup
      });
    case 'ground-slam-impact':
      return oneShot(`${prefix}_ground_slam_impact`, {
        footLock: true,
        blendSeconds: NUMERIC.blendSeconds.groundSlamImpact
      });
    case 'ground-slam-recovery':
      return oneShot(`${prefix}_ground_slam_recover`, {
        footLock: true,
        blendSeconds: NUMERIC.blendSeconds.groundSlamStartup
      });
    case 'wall-contact':
    case 'ledge-grab':
      return oneShot(`${prefix}_ledge_stop`, { footLock: grounded, blendSeconds: 0.04 });
    case 'ground-action':
      return oneShot(`${prefix}_block_hit`, { footLock: grounded, blendSeconds: 0.04 });
    case 'damage':
      return oneShot(`${prefix}_hurt`, { blendSeconds: 0.025 });
    case 'knockback':
      return oneShot(`${prefix}_knockback`, { blendSeconds: 0.025 });
    case 'dead':
      return oneShot(`${prefix}_defeat`, { blendSeconds: 0.04 });
    case 'respawning':
    case 'swap-in':
      return oneShot(`${prefix}_swap_in`, { footLock: grounded, blendSeconds: 0.04 });
    case 'swap-out':
      return oneShot(`${prefix}_swap_out`, { footLock: grounded, blendSeconds: 0.04 });
    case 'victory':
      return looped(`${prefix}_victory`, { footLock: true, blendSeconds: 0.08 });
    default:
      return grounded
        ? looped(`${prefix}_idle`, { footLock: true })
        : looped(`${prefix}_jump_fall`);
  }
}

export function importedAnimationFor(options) {
  return animationIntentFor(options).clipId;
}

export function importedClipMetadata(hero, clipId) {
  return IMPORTED_CHARACTER_ANIMATIONS[hero]?.clips.find(clip => clip.id === clipId) ?? null;
}

export function availableAnimationClips(hero) {
  return IMPORTED_CHARACTER_ANIMATIONS[hero]?.clips ?? Object.freeze([]);
}
