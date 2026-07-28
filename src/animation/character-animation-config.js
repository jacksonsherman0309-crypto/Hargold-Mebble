export const IMPORTED_CHARACTER_ANIMATIONS = Object.freeze({
  Hargold: Object.freeze({
    restPose: 'rest-pose',
    walk: 'hargold_walk',
    run: 'hargold_run',
    clips: Object.freeze([
      Object.freeze({
        id: 'hargold_walk',
        label: 'Walk · supplied Meshy take',
        durationSeconds: 1.03333343,
        loop: true,
        authoredSpeedMetresPerSecond: 3.2
      }),
      Object.freeze({
        id: 'hargold_run',
        label: 'Run · supplied Meshy take',
        durationSeconds: 0.63333333,
        loop: true,
        authoredSpeedMetresPerSecond: 5.7
      })
    ])
  }),
  Mebble: Object.freeze({
    restPose: 'rest-pose',
    walk: 'mebble_walk',
    run: 'mebble_run',
    clips: Object.freeze([
      Object.freeze({
        id: 'mebble_walk',
        label: 'Walk · supplied Meshy take',
        durationSeconds: 1.03333343,
        loop: true,
        authoredSpeedMetresPerSecond: 3.2
      }),
      Object.freeze({
        id: 'mebble_run',
        label: 'Run · supplied Meshy take',
        durationSeconds: 0.63333333,
        loop: true,
        authoredSpeedMetresPerSecond: 5.7
      })
    ])
  })
});

export const LIVE_ANIMATION_STATES = Object.freeze([
  'Idle',
  'MoveStart',
  'Walk',
  'Run',
  'MoveStop',
  'Turn',
  'JumpStart',
  'JumpRise',
  'JumpApex',
  'Fall',
  'Land',
  'Crouch',
  'Damage',
  'Defeat',
  'Respawn'
]);

const REST_POSE_STATES = new Set([
  'idle',
  'crouch',
  'look-up',
  'duck',
  'damage',
  'hurt',
  'knockback',
  'dead',
  'respawning',
  'victory',
  'takeoff',
  'rise',
  'apex',
  'fall',
  'fast-fall',
  'land-soft',
  'land-hard',
  'landing',
  'ground-slam',
  'ground-slam-startup',
  'ground-slam-fall',
  'ground-slam-impact',
  'ground-slam-recovery',
  'double-jump',
  'air-spin',
  'glide-open',
  'glide-sustain',
  'glide-close'
]);

export function importedAnimationFor({
  hero,
  locomotion = 'idle',
  horizontalSpeed = 0,
  grounded = true
}) {
  const config = IMPORTED_CHARACTER_ANIMATIONS[hero];
  if (!config) return 'rest-pose';
  const speed = Math.abs(horizontalSpeed);
  if (!grounded || REST_POSE_STATES.has(locomotion)) return config.restPose;
  if (speed < 0.14) return config.restPose;
  if (speed < 4.15) return config.walk;
  return config.run;
}

export function importedClipMetadata(hero, clipId) {
  return IMPORTED_CHARACTER_ANIMATIONS[hero]?.clips.find(clip => clip.id === clipId) ?? null;
}
