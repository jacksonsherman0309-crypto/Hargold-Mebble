import { HERO_PROFILES, heroProfile } from './hero-profiles.js';
import { MOVEMENT_TUNING } from './movement-tuning.js';

export const MOVEMENT_SENSOR_LAYOUT = Object.freeze({
  foot: Object.freeze([
    Object.freeze({ id: 'left-heel', x: -0.42, y: 0 }),
    Object.freeze({ id: 'center-foot', x: 0, y: 0 }),
    Object.freeze({ id: 'right-toe', x: 0.42, y: 0 })
  ]),
  wall: Object.freeze([
    Object.freeze({ id: 'left-lower', side: 'left', x: -0.51, y: -0.2 }),
    Object.freeze({ id: 'left-middle', side: 'left', x: -0.51, y: -0.52 }),
    Object.freeze({ id: 'left-upper', side: 'left', x: -0.51, y: -0.82 }),
    Object.freeze({ id: 'right-lower', side: 'right', x: 0.51, y: -0.2 }),
    Object.freeze({ id: 'right-middle', side: 'right', x: 0.51, y: -0.52 }),
    Object.freeze({ id: 'right-upper', side: 'right', x: 0.51, y: -0.82 })
  ]),
  head: Object.freeze([
    Object.freeze({ id: 'head-left', x: -0.38, y: -1 }),
    Object.freeze({ id: 'head-center', x: 0, y: -1 }),
    Object.freeze({ id: 'head-right', x: 0.38, y: -1 })
  ]),
  ledge: Object.freeze({ id: 'forward-ledge', x: 0.58, y: 0.08 }),
  slope: Object.freeze({ id: 'slope-normal', x: 0, y: 0 }),
  semisolid: Object.freeze({ id: 'semisolid', x: 0, y: 0 }),
  movingPlatform: Object.freeze({ id: 'moving-platform-anchor', x: 0, y: 0 })
});

export const MOVEMENT_SENSOR_DEFAULTS = Object.freeze({
  groundSnapDistance: 0.12,
  landingSweepTolerance: 0.04,
  wallSkin: 0.035,
  headSkin: 0.035,
  ledgeLookAhead: 0.16
});

function freezePoint(point) {
  return Object.freeze({ ...point });
}

export function movementSensorPoints(
  state,
  {
    profiles = HERO_PROFILES,
    tuning = MOVEMENT_TUNING,
    layout = MOVEMENT_SENSOR_LAYOUT
  } = {}
) {
  const profile = heroProfile(state.hero, profiles);
  const height = state.stance === 'standing'
    ? profile.height
    : profile.height * tuning.crouchHeightMultiplier;
  const halfWidth = profile.width / 2;
  const direction = state.facing < 0 ? -1 : 1;

  return Object.freeze({
    foot: Object.freeze(layout.foot.map(sensor => freezePoint({
      ...sensor,
      x: state.footX + sensor.x * profile.width,
      y: state.footY + sensor.y
    }))),
    wall: Object.freeze(layout.wall.map(sensor => freezePoint({
      ...sensor,
      x: state.footX + sensor.x * profile.width,
      y: state.footY + sensor.y * height
    }))),
    head: Object.freeze(layout.head.map(sensor => freezePoint({
      ...sensor,
      x: state.footX + sensor.x * profile.width,
      y: state.footY + sensor.y * height
    }))),
    ledge: freezePoint({
      ...layout.ledge,
      x: state.footX + direction * (halfWidth + layout.ledge.x * profile.width),
      y: state.footY + layout.ledge.y
    }),
    slope: freezePoint({
      ...layout.slope,
      x: state.footX,
      y: state.footY
    }),
    semisolid: freezePoint({
      ...layout.semisolid,
      x: state.footX,
      y: state.footY
    }),
    movingPlatform: freezePoint({
      ...layout.movingPlatform,
      x: state.footX,
      y: state.footY
    })
  });
}

function normalizeHit(hit, fallback = {}) {
  if (!hit) return null;
  if (hit === true) return Object.freeze({ hit: true, ...fallback });
  return Object.freeze({ hit: true, ...fallback, ...hit });
}

export function sampleMovementSensors(
  state,
  {
    profiles = HERO_PROFILES,
    tuning = MOVEMENT_TUNING,
    layout = MOVEMENT_SENSOR_LAYOUT,
    defaults = MOVEMENT_SENSOR_DEFAULTS,
    groundHeightAt = () => Infinity,
    hasGroundAt = () => false,
    surfaceAt = () => null,
    wallAt = () => null,
    headAt = () => null,
    ledgeAt = () => null,
    semisolidAt = () => null,
    movingPlatformAt = () => null,
    previousFootY = state.footY
  } = {}
) {
  const points = movementSensorPoints(state, { profiles, tuning, layout });
  const feet = points.foot.map(point => {
    const groundPresent = Boolean(hasGroundAt(point.x));
    const surfaceY = groundPresent ? groundHeightAt(point.x) : Infinity;
    const gap = surfaceY - state.footY;
    const crossedFromAbove = groundPresent &&
      state.velocityY >= 0 &&
      previousFootY <= surfaceY + defaults.landingSweepTolerance &&
      state.footY >= surfaceY - defaults.landingSweepTolerance;
    const supported = groundPresent &&
      Math.abs(gap) <= defaults.groundSnapDistance;
    const surface = groundPresent ? (surfaceAt(point.x) ?? {}) : {};
    return Object.freeze({
      ...point,
      groundPresent,
      supported,
      landingCandidate: crossedFromAbove,
      surfaceY,
      gap,
      angle: surface.angle ?? 0,
      normal: Object.freeze({ ...(surface.normal ?? { x: 0, y: -1 }) }),
      material: surface.material ?? 'normal',
      surfaceId: surface.id ?? null
    });
  });

  const walls = points.wall.map(point => Object.freeze({
    ...point,
    contact: normalizeHit(wallAt(point), { side: point.side })
  }));
  const heads = points.head.map(point => Object.freeze({
    ...point,
    contact: normalizeHit(headAt(point))
  }));
  const ledge = Object.freeze({
    ...points.ledge,
    groundPresent: Boolean(hasGroundAt(points.ledge.x)),
    contact: normalizeHit(ledgeAt(points.ledge))
  });
  const semisolid = normalizeHit(semisolidAt(points.semisolid));
  const movingPlatform = normalizeHit(movingPlatformAt(points.movingPlatform), {
    velocityX: 0,
    velocityY: 0
  });

  return Object.freeze({
    points,
    foot: Object.freeze(feet),
    wall: Object.freeze(walls),
    head: Object.freeze(heads),
    ledge,
    slope: Object.freeze({
      ...points.slope,
      samples: Object.freeze(feet.map(sample => Object.freeze({
        id: sample.id,
        angle: sample.angle,
        normal: sample.normal
      })))
    }),
    semisolid,
    movingPlatform
  });
}

function nearestFootSample(samples, predicate) {
  const eligible = samples.filter(predicate);
  if (eligible.length === 0) return null;
  return eligible.sort((left, right) => {
    const leftCenter = left.id === 'center-foot' ? -1 : 0;
    const rightCenter = right.id === 'center-foot' ? -1 : 0;
    return Math.abs(left.gap) - Math.abs(right.gap) || leftCenter - rightCenter;
  })[0];
}

export function deriveMovementContacts(snapshot) {
  const support = nearestFootSample(snapshot.foot, sample => sample.supported);
  const landing = nearestFootSample(snapshot.foot, sample => sample.landingCandidate);
  const leftWalls = snapshot.wall.filter(sample => sample.side === 'left' && sample.contact);
  const rightWalls = snapshot.wall.filter(sample => sample.side === 'right' && sample.contact);
  const headContacts = snapshot.head.filter(sample => sample.contact);
  const safe = landing ?? support;

  return Object.freeze({
    grounded: Boolean(support),
    canLand: Boolean(landing),
    safeLandingY: safe?.surfaceY ?? null,
    groundSampleId: safe?.id ?? null,
    surfaceId: safe?.surfaceId ?? snapshot.movingPlatform?.id ?? null,
    surfaceAngle: safe?.angle ?? 0,
    surfaceNormal: safe?.normal ?? Object.freeze({ x: 0, y: -1 }),
    terrainMaterial: safe?.material ?? 'normal',
    wallContact: Object.freeze({
      left: leftWalls.length > 0,
      right: rightWalls.length > 0,
      leftSensors: Object.freeze(leftWalls.map(sample => sample.id)),
      rightSensors: Object.freeze(rightWalls.map(sample => sample.id))
    }),
    ceilingContact: headContacts.length > 0,
    headSensors: Object.freeze(headContacts.map(sample => sample.id)),
    exposedEdgeAhead: !snapshot.ledge.groundPresent,
    ledgeAvailable: Boolean(snapshot.ledge.contact?.grabbable),
    semisolid: snapshot.semisolid,
    movingPlatform: snapshot.movingPlatform,
    movingPlatformVelocity: Object.freeze({
      x: snapshot.movingPlatform?.velocityX ?? 0,
      y: snapshot.movingPlatform?.velocityY ?? 0
    })
  });
}

export function buildMovementContactSnapshot(state, options = {}) {
  const sensors = sampleMovementSensors(state, options);
  return Object.freeze({
    sensors,
    contacts: deriveMovementContacts(sensors)
  });
}
