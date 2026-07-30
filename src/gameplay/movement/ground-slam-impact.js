import { stompMob } from '../enemies/mob-simulation.js';

export const GROUND_SLAM_IMPACT_PROFILES = Object.freeze({
  Hargold: Object.freeze({
    contactRadius: 1.02,
    visualRadius: 1.72,
    verticalTolerance: 0.72,
    cameraShakeSeconds: 0.22,
    cameraShakePixels: 7.5,
    dustCount: 12
  }),
  Mebble: Object.freeze({
    contactRadius: 0.82,
    visualRadius: 1.42,
    verticalTolerance: 0.62,
    cameraShakeSeconds: 0.16,
    cameraShakePixels: 5,
    dustCount: 9
  })
});

export function groundSlamImpactProfile(hero) {
  const profile = GROUND_SLAM_IMPACT_PROFILES[hero];
  if (!profile) throw new RangeError(`unknown ground-slam hero: ${hero}`);
  return profile;
}

export function createGroundSlamImpactPresentation({
  hero,
  footX,
  footY,
  landingSpeed = 0,
  surfaceMaterial = 'normal',
  strength = 1
}) {
  const profile = groundSlamImpactProfile(hero);
  return Object.freeze({
    hero,
    footX,
    footY,
    landingSpeed: Math.max(0, Number(landingSpeed) || 0),
    surfaceMaterial,
    strength,
    visualRadius: profile.visualRadius,
    cameraShakeSeconds: profile.cameraShakeSeconds,
    cameraShakePixels: profile.cameraShakePixels,
    dustCount: profile.dustCount
  });
}

export function resolveGroundSlamMobImpacts({
  hero,
  footX,
  footY,
  mobs,
  impactMob = stompMob
}) {
  const profile = groundSlamImpactProfile(hero);
  const results = [];
  for (const mob of mobs) {
    if (!mob?.alive || mob.activated === false) continue;
    if (Math.abs(mob.x - footX) > profile.contactRadius) continue;
    if (Math.abs(mob.y - footY) > profile.verticalTolerance) continue;
    const result = impactMob(mob, { protectedStomp: false });
    results.push(Object.freeze({
      mobId: mob.id,
      mobType: mob.type,
      outcome: result.outcome,
      reason: result.reason ?? null
    }));
  }
  return Object.freeze(results);
}
