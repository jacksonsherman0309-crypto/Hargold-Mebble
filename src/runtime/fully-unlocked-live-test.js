export const FULLY_UNLOCKED_LIVE_TEST_PROFILE = Object.freeze({
  id: 'fully-unlocked-live-test',
  label: 'FULLY UNLOCKED TEST',
  abilities: Object.freeze([
    'Hargold double jump',
    'Mebble glide',
    'air twirl',
    'ground slam',
    'hero swap',
    'combat'
  ])
});

const ENABLED_QUERY_VALUES = new Set(['', '1', 'true', 'yes', 'on']);

export function fullyUnlockedLiveTestEnabled(parameters) {
  if (!parameters?.has?.('fullyUnlocked')) return false;
  const value = String(parameters.get('fullyUnlocked') ?? '').trim().toLowerCase();
  return ENABLED_QUERY_VALUES.has(value);
}

export function applyFullyUnlockedLiveTestProfile(
  session,
  {
    maximumHealthLayers,
    maximumLives
  }
) {
  if (!session || typeof session !== 'object') {
    throw new TypeError('A mutable gameplay session is required.');
  }
  if (!Number.isInteger(maximumHealthLayers) || maximumHealthLayers < 1) {
    throw new RangeError('maximumHealthLayers must be a positive integer.');
  }
  if (!Number.isInteger(maximumLives) || maximumLives < 1) {
    throw new RangeError('maximumLives must be a positive integer.');
  }

  session.healthLayers = maximumHealthLayers;
  session.maximumHealthLayers = maximumHealthLayers;
  session.lives = maximumLives;
  session.doubleJumpUnlocked = true;
  session.testProfile = FULLY_UNLOCKED_LIVE_TEST_PROFILE.id;
  return session;
}
