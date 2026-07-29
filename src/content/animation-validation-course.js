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
    validates: Object.freeze(['idle', 'walk-start', 'walk', 'run', 'deceleration', 'turnaround', 'skid'])
  }),
  Object.freeze({
    id: 'gentle-slope-contact',
    label: 'Incline, decline, ledge stop',
    spawnX: 11,
    validates: Object.freeze(['foot-lock', 'slope-adaptation', 'ledge-stop', 'jump'])
  }),
  Object.freeze({
    id: 'uneven-stone-contact',
    label: 'Uneven stone and narrow platforms',
    spawnX: 29.2,
    validates: Object.freeze(['terrain-contact', 'narrow-platform', 'landing', 'running-jump'])
  }),
  Object.freeze({
    id: 'moving-platform-contact',
    label: 'Moving lift and platform transport',
    spawnX: 49.6,
    validates: Object.freeze(['moving-platform', 'idle-contact', 'jump-from-support', 'landing'])
  }),
  Object.freeze({
    id: 'double-jump-and-glide',
    label: 'Double jump and Mebble glide',
    spawnX: 56.8,
    validates: Object.freeze(['Hargold-double-jump', 'Mebble-glide', 'twirl', 'ground-slam'])
  }),
  Object.freeze({
    id: 'safe-pit-jump',
    label: 'Safe pit, rope bridge, recovery shelf',
    spawnX: 59.2,
    validates: Object.freeze(['pit-jump', 'fall', 'glide-landing', 'horizontal-momentum'])
  }),
  Object.freeze({
    id: 'stomp-and-damage',
    label: 'Enemy stomp, bounce, damage',
    spawnX: 73.4,
    validates: Object.freeze(['stomp', 'bounce', 'damage', 'knockback'])
  }),
  Object.freeze({
    id: 'orbit-and-falling-platforms',
    label: 'Orbiting and falling platform contacts',
    spawnX: 93.4,
    validates: Object.freeze(['moving-platform', 'edge-contact', 'heavy-landing'])
  }),
  Object.freeze({
    id: 'hargold-heavy-blocks',
    label: 'Hargold blocks and block-hit reaction',
    spawnX: 98.2,
    validates: Object.freeze(['block-hit', 'Hargold-only-block', 'power-up'])
  }),
  Object.freeze({
    id: 'final-gap-chain',
    label: 'Rapid gaps and recovery transitions',
    spawnX: 108.5,
    validates: Object.freeze(['running-jump', 'air-adjustment', 'landing-to-run', 'defeat'])
  })
]);

export function animationValidationStation(id) {
  return ANIMATION_VALIDATION_STATIONS.find(station => station.id === id) ??
    ANIMATION_VALIDATION_STATIONS[0];
}
