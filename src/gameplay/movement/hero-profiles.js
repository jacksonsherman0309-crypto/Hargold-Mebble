export const HERO_PROFILES = Object.freeze({
  Hargold: Object.freeze({
    status: 'proxy-collider-pending-production-mesh',
    width: 1.02,
    height: 1.82,
    jumpSpeedAddition: 0,
    airControlMultiplier: 1,
    groundSlamStrength: 'heavy',
    canGlide: false
  }),
  Mebble: Object.freeze({
    status: 'proxy-collider-pending-production-mesh',
    width: 0.72,
    height: 2.18,
    jumpSpeedAddition: 1.16,
    airControlMultiplier: 1,
    groundSlamStrength: 'standard',
    canGlide: true
  })
});

export function heroProfile(hero, profiles = HERO_PROFILES) {
  const profile = profiles[hero];
  if (!profile) throw new RangeError(`unknown hero: ${hero}`);
  return profile;
}
