/** World 1-1 only: authored placements, never a density-based spawner.
 * Current canon admits Critter and Shellback here; the older archive's
 * Beetle/Sentry introductions belong to 1-3/1-4 and are not substituted.
 */
export const MEADOW_WAKE_MOB_PLACEMENTS = Object.freeze([
  { id: '1-1-critter-a', type: 'camp_critter', x: 28.2, patrolFrom: 27.7, patrolTo: 29.1, purpose: 'isolated first stomp after the protection block' },
  { id: '1-1-shellback-a', type: 'shellback', x: 30.75, patrolFrom: 30.15, patrolTo: 31.25, supportPlatformId: 'shellback-low-ledge', purpose: 'retract and kick into the adjacent quarry column' },
  { id: '1-1-critter-b', type: 'camp_critter', x: 42.65, patrolFrom: 41.9, patrolTo: 43.2, purpose: 'grounded approach to the timber climb' },
  { id: '1-1-critter-c', type: 'camp_critter', x: 55.05, patrolFrom: 54.65, patrolTo: 56.15, purpose: 'spacing test before the bramble clue and recovery block' },
  { id: '1-1-critter-d', type: 'camp_critter', x: 75, patrolFrom: 74.2, patrolTo: 75.65, purpose: 'resume pressure only after checkpoint recovery' },
  { id: '1-1-shellback-b', type: 'shellback', x: 80.1, patrolFrom: 79.2, patrolTo: 81, purpose: 'optional shell reuse beneath the visible paddle route' },
  { id: '1-1-critter-e', type: 'camp_critter', x: 89.15, patrolFrom: 88.45, patrolTo: 90.15, purpose: 'lower-route pressure beside the optional root terrace' },
  { id: '1-1-shellback-c', type: 'shellback', x: 96.1, patrolFrom: 95.5, patrolTo: 97.15, purpose: 'last shell decision below the rotating ruins' },
  { id: '1-1-critter-f', type: 'camp_critter', x: 105.6, patrolFrom: 104.95, patrolTo: 106.25, purpose: 'final enemy reading before the uninterrupted three-gap approach' }
].map(Object.freeze));

export const MEADOW_WAKE_SAFE_RANGES = Object.freeze([
  { id: 'opening-and-safe-demonstration', from: 0, to: 24.4 },
  { id: 'secret-entry-and-return', from: 58.9, to: 64.85 },
  { id: 'bridge-and-checkpoint-recovery', from: 64.9, to: 73.5 },
  { id: 'panorama-takeoff-landings-and-goal', from: 109.8, to: 124 }
].map(Object.freeze));
