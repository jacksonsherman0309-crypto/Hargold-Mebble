export const CAMPAIGN_LEVEL_COUNT_VERSION = '2026-07-29-main-worlds-eight-total';

export const LEVEL_COUNT_BY_WORLD = Object.freeze({
  1: 8,
  2: 8,
  3: 8,
  4: 8,
  5: 8,
  6: 8,
  7: 8,
  8: 9,
  9: 9,
  10: 9
});

export const MAIN_WORLD_LEVELS_INCLUDE_SECRET = true;
export const MAIN_WORLD_SECRET_IS_ADDITIONAL_NINTH_LEVEL = false;

export const TOTAL_COMPLETION_SLOTS = Object.values(LEVEL_COUNT_BY_WORLD)
  .reduce((total, count) => total + count, 0);

export const COMPASS_COINS_PER_LEVEL = 3;
export const TOTAL_COMPASS_COIN_SLOTS = TOTAL_COMPLETION_SLOTS * COMPASS_COINS_PER_LEVEL;

if (TOTAL_COMPLETION_SLOTS !== 83) {
  throw new Error(`Campaign slot invariant failed: expected 83, received ${TOTAL_COMPLETION_SLOTS}`);
}

if (TOTAL_COMPASS_COIN_SLOTS !== 249) {
  throw new Error(`Compass Coin invariant failed: expected 249, received ${TOTAL_COMPASS_COIN_SLOTS}`);
}
