/*
 * Current-canon enemy ownership.
 *
 * This is intentionally separate from the imported historical encounter
 * manifests. Archived rosters remain useful source evidence, but they cannot
 * move an enemy into a different current world or introduce it in an earlier
 * course than the canonical production plan.
 */
const CURRENT_WORLD_ENEMY_ROSTERS = Object.freeze({
  1: Object.freeze({
    worldName: 'Verdant Vale',
    source: 'current-canon',
    courses: Object.freeze({
      '1-1': Object.freeze(['camp_critter', 'shellback']),
      '1-2': Object.freeze(['acorn_bomber', 'shellback']),
      '1-3': Object.freeze(['dirt_squirt', 'spike_beetle']),
      '1-4': Object.freeze(['camp_sentry'])
    })
  }),
  2: Object.freeze({
    worldName: 'Tideglass Coast',
    source: 'current-canon-named-enemies-only',
    courses: Object.freeze({}),
    namedWorldEnemies: Object.freeze(['tidebiter'])
  }),
  5: Object.freeze({
    worldName: 'Ember Rift',
    source: 'current-canon-named-enemies-only',
    courses: Object.freeze({}),
    namedWorldEnemies: Object.freeze(['steamgor'])
  }),
  6: Object.freeze({
    worldName: 'Overgrown Grove',
    source: 'current-canon-named-enemies-only',
    courses: Object.freeze({}),
    namedWorldEnemies: Object.freeze(['camp_chipper'])
  })
});

export function getWorldEnemyRoster(worldNumber) {
  return CURRENT_WORLD_ENEMY_ROSTERS[worldNumber] ?? null;
}

export function getCourseEnemyRoster(levelId) {
  const worldNumber = Number(String(levelId).split('-')[0]);
  const world = getWorldEnemyRoster(worldNumber);
  return world?.courses?.[levelId] ?? Object.freeze([]);
}

export function enemyBelongsToCourse(enemyId, levelId) {
  return getCourseEnemyRoster(levelId).includes(enemyId);
}

export { CURRENT_WORLD_ENEMY_ROSTERS };
