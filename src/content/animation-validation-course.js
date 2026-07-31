/*
 * Dedicated animation-validation stations use already-authored Meadow Wake
 * geometry. Coordinates are implementation data from the current course, not
 * historical coordinate-free design scaffolds.
 */
export const ANIMATION_VALIDATION_STATIONS = Object.freeze([
  Object.freeze({
    id: 'acceleration-skid-lane',
    label: 'Acceleration, stop, reversal, skid',
    spawnX: 2.2,
    instructions: 'Hold Right through full speed, release to zero, then hold Left for the planted skid and facing flip.',
    validates: Object.freeze(['idle', 'walk-start', 'walk', 'run', 'sprint', 'deceleration', 'turnaround', 'skid'])
  }),
  Object.freeze({
    id: 'gentle-slope-contact',
    label: 'Incline, decline, ledge stop',
    spawnX: 11,
    instructions: 'Traverse both directions, release before the edge, then jump from the incline.',
    validates: Object.freeze(['foot-lock', 'slope-adaptation', 'ledge-stop', 'jump'])
  }),
  Object.freeze({
    id: 'uneven-stone-contact',
    label: 'Uneven stone and narrow platforms',
    spawnX: 29.2,
    instructions: 'Walk and run across the stones, land on the narrow top, crouch, crawl, and enter a speed slide.',
    validates: Object.freeze(['terrain-contact', 'narrow-platform', 'landing', 'running-jump'])
  }),
  Object.freeze({
    id: 'moving-platform-contact',
    label: 'Moving lift and platform transport',
    spawnX: 49.6,
    instructions: 'Stand still for one platform cycle, walk on it, jump from it, and land while it is moving.',
    validates: Object.freeze(['moving-platform', 'idle-contact', 'jump-from-support', 'landing'])
  }),
  Object.freeze({
    id: 'double-jump-and-glide',
    label: 'Double jump and Mebble glide',
    spawnX: 56.8,
    instructions: 'Hargold: Jump, Jump for the distinct double jump. Mebble: jump and keep holding Jump during descent to open and sustain the glide. Tap Jump again for twirl. Press Down once while airborne for the feet-down ground slam.',
    validates: Object.freeze(['Hargold-double-jump', 'Mebble-glide', 'twirl', 'ground-slam'])
  }),
  Object.freeze({
    id: 'safe-pit-jump',
    label: 'Safe pit, rope bridge, recovery shelf',
    spawnX: 59.2,
    instructions: 'Run-jump across in both directions, steer in air, then repeat as Mebble and exit glide into landing.',
    validates: Object.freeze(['pit-jump', 'fall', 'glide-landing', 'horizontal-momentum'])
  }),
  Object.freeze({
    id: 'stomp-and-damage',
    label: 'Enemy stomp, bounce, damage',
    spawnX: 73.4,
    instructions: 'Land feet-first on the target, observe rebound, then make side contact for damage and recovery.',
    validates: Object.freeze(['stomp', 'bounce', 'damage', 'knockback'])
  }),
  Object.freeze({
    id: 'orbit-and-falling-platforms',
    label: 'Orbiting and falling platform contacts',
    spawnX: 93.4,
    instructions: 'Ride each support, reverse direction at an edge, and perform both soft and heavy landings.',
    validates: Object.freeze(['moving-platform', 'edge-contact', 'heavy-landing'])
  }),
  Object.freeze({
    id: 'hargold-heavy-blocks',
    label: 'Hargold blocks and block-hit reaction',
    spawnX: 98.2,
    instructions: 'Swap to Hargold, hit the heavy block, collect the power-up, and resume movement immediately.',
    validates: Object.freeze(['block-hit', 'Hargold-only-block', 'power-up'])
  }),
  Object.freeze({
    id: 'final-gap-chain',
    label: 'Rapid gaps and recovery transitions',
    spawnX: 108.5,
    instructions: 'Chain running jumps and immediate landing exits in both directions, then deliberately enter the defeat trigger.',
    validates: Object.freeze(['running-jump', 'air-adjustment', 'landing-to-run', 'defeat'])
  })
]);

export const ANIMATION_VALIDATION_MATRIX = Object.freeze({
  renderFps: Object.freeze([30, 60, 120]),
  directions: Object.freeze(['left', 'right']),
  terrain: Object.freeze([
    'flat',
    'uphill',
    'downhill',
    'uneven',
    'narrow-platform',
    'moving-platform'
  ]),
  maximumFootSlipPercentHeight: 1.5,
  maximumVerticalPenetrationPercentHeight: 0.5,
  maximumPhaseError: 0.08,
  maximumStateSettleFrames: 2
});

export function animationValidationStation(id) {
  return ANIMATION_VALIDATION_STATIONS.find(station => station.id === id) ??
    ANIMATION_VALIDATION_STATIONS[0];
}
