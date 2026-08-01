import {
  MEADOW_WAKE_BLOCK_DEFINITIONS,
  MEADOW_WAKE_COIN_DEFINITIONS,
  MEADOW_WAKE_COMPASS_COIN_DEFINITIONS,
  MEADOW_WAKE_GAMEPLAY_ROOMS,
  MEADOW_WAKE_PITS,
  MEADOW_WAKE_PLATFORMS,
  MEADOW_WAKE_ROUTE_PHASES,
  MEADOW_WAKE_SECTIONS,
  MEADOW_WAKE_TERRAIN_POINTS,
  MEADOW_WAKE_WORLD_END
} from './meadow-wake-course.js?v=production-terrain-3';
import {
  MEADOW_WAKE_ROOM_FINISH_PROFILES,
  MEADOW_WAKE_TERRAIN_ANCHORS
} from './meadow-wake-scenery.js?v=production-terrain-3';
import { createLevelDefinition } from '../gameplay/levels/level-schema.js';

const MOB_PLACEMENTS = Object.freeze([
  Object.freeze({ id: '1-1-critter-a', type: 'camp_critter', x: 6.4, patrolFrom: 5.1, patrolTo: 7.6 }),
  Object.freeze({ id: '1-1-shellback-a', type: 'shellback', x: 8.7, patrolFrom: 8.05, patrolTo: 9.05 }),
  Object.freeze({ id: '1-1-critter-b', type: 'camp_critter', x: 13.1, patrolFrom: 11.5, patrolTo: 14.8 }),
  Object.freeze({ id: '1-1-shellback-b', type: 'shellback', x: 17.1, patrolFrom: 15.8, patrolTo: 19.4 }),
  Object.freeze({ id: '1-1-critter-c', type: 'camp_critter', x: 25.6, patrolFrom: 24.1, patrolTo: 27.4 })
]);

function areaIdAtX(x) {
  return MEADOW_WAKE_ROUTE_PHASES.find(phase => x >= phase.range[0] && x <= phase.range[1])?.id ??
    MEADOW_WAKE_ROUTE_PHASES.at(-1).id;
}

function bounds(from, to) {
  return Object.freeze({ minX: from, maxX: to, minY: -20, maxY: 20 });
}

function actorFromMob(mob) {
  return Object.freeze({
    id: mob.id,
    actorType: `enemy/${mob.type}`,
    position: Object.freeze({ x: mob.x, y: 0, z: 0 }),
    areaId: areaIdAtX(mob.x),
    visualLayer: 'gameplay',
    parameters: Object.freeze({
      enemyType: mob.type,
      patrolFrom: mob.patrolFrom,
      patrolTo: mob.patrolTo,
      placementMode: 'ground-relative'
    }),
    eventChannels: Object.freeze({ input: null, output: `${mob.id}:defeated` }),
    persistentStateId: null,
    activationBounds: bounds(mob.x - 0.5, mob.x + 0.5),
    activationRules: Object.freeze({
      cameraAware: true,
      respawn: true,
      keepLoaded: false
    })
  });
}

function passiveActor(id, actorType, x, parameters, persistentStateId = null) {
  return Object.freeze({
    id,
    actorType,
    position: Object.freeze({ x, y: 0, z: 0 }),
    areaId: areaIdAtX(x),
    visualLayer: 'gameplay',
    parameters: Object.freeze({ placementMode: 'ground-relative', ...parameters }),
    eventChannels: Object.freeze({ input: null, output: null }),
    persistentStateId,
    activationBounds: bounds(x - 0.25, x + 0.25),
    activationRules: Object.freeze({
      cameraAware: true,
      respawn: persistentStateId === null,
      keepLoaded: persistentStateId !== null
    })
  });
}

function railForPlatform(platform) {
  const motion = platform.motion;
  if (!motion) return null;
  const common = {
    id: `${platform.id}-rail`,
    purpose: motion.kind === 'falling' ? 'collapsing-platform' : 'moving-platform',
    gameplayPlane: true,
    loopMode: motion.kind === 'falling' ? 'once' : 'ping-pong'
  };
  if (motion.kind === 'vertical') {
    return Object.freeze({
      ...common,
      nodes: Object.freeze([
        Object.freeze({ position: Object.freeze({ x: platform.x, y: platform.y - motion.range, z: 0 }), speed: motion.speed, acceleration: motion.speed * 3, delay: 0.08, easing: 'smoothstep', loopMode: 'ping-pong' }),
        Object.freeze({ position: Object.freeze({ x: platform.x, y: platform.y + motion.range, z: 0 }), speed: motion.speed, acceleration: motion.speed * 3, delay: 0.08, easing: 'smoothstep', loopMode: 'ping-pong' })
      ])
    });
  }
  if (motion.kind === 'orbit') {
    return Object.freeze({
      ...common,
      loopMode: 'loop',
      nodes: Object.freeze([
        Object.freeze({ position: Object.freeze({ x: platform.x + motion.rangeX, y: platform.y, z: 0 }), speed: motion.speed * 4, acceleration: motion.speed * 8, delay: 0, easing: 'smoothstep', loopMode: 'loop' }),
        Object.freeze({ position: Object.freeze({ x: platform.x, y: platform.y + motion.rangeY, z: 0 }), speed: motion.speed * 4, acceleration: motion.speed * 8, delay: 0, easing: 'smoothstep', loopMode: 'loop' }),
        Object.freeze({ position: Object.freeze({ x: platform.x - motion.rangeX, y: platform.y, z: 0 }), speed: motion.speed * 4, acceleration: motion.speed * 8, delay: 0, easing: 'smoothstep', loopMode: 'loop' }),
        Object.freeze({ position: Object.freeze({ x: platform.x, y: platform.y - motion.rangeY, z: 0 }), speed: motion.speed * 4, acceleration: motion.speed * 8, delay: 0, easing: 'smoothstep', loopMode: 'loop' })
      ])
    });
  }
  if (motion.kind === 'falling') {
    return Object.freeze({
      ...common,
      nodes: Object.freeze([
        Object.freeze({ position: Object.freeze({ x: platform.x, y: platform.y, z: 0 }), speed: 0.1, acceleration: motion.gravity, delay: motion.triggerDelay, easing: 'linear', loopMode: 'once', triggerRequirement: `${platform.id}:armed` }),
        Object.freeze({ position: Object.freeze({ x: platform.x, y: platform.y + 6, z: 0 }), speed: 8, acceleration: motion.gravity, delay: motion.resetDelay, easing: 'ease-in', loopMode: 'once' })
      ])
    });
  }
  return null;
}

const RAILS = Object.freeze(MEADOW_WAKE_PLATFORMS.map(railForPlatform).filter(Boolean));

const GAMEPLAY_AREAS = Object.freeze(MEADOW_WAKE_ROUTE_PHASES.map((phase, index) => Object.freeze({
  id: phase.id,
  bounds: bounds(phase.range[0], phase.range[1]),
  camera: Object.freeze({
    mode: index === 0 ? 'safe-opening' : index === MEADOW_WAKE_ROUTE_PHASES.length - 1 ? 'goal-framing' : 'smooth-follow',
    lookAheadMetres: index >= 5 ? 2.6 : 2.1
  }),
  zoom: Object.freeze({ mode: 'profile-gameplay', value: index === 8 ? 0.94 : 1 }),
  verticalTracking: Object.freeze({ minimumY: 0, maximumY: 10.5, deadZone: 1.1 }),
  backgroundSet: 'verdant-vale-meadow-wake',
  music: Object.freeze({ cue: 'meadow-wake-original-cue', mode: index === 8 ? 'goal-build' : 'exploration' }),
  direction: 'right',
  activationRules: Object.freeze({ actorAreaPrewarm: true, retainPreviousArea: index > 0 })
})));

const ACTORS = Object.freeze([
  ...MOB_PLACEMENTS.map(actorFromMob),
  ...MEADOW_WAKE_PLATFORMS.map(platform => passiveActor(
    platform.id,
    'platform',
    platform.x,
    { definition: platform, railId: platform.motion ? `${platform.id}-rail` : null }
  )),
  ...MEADOW_WAKE_BLOCK_DEFINITIONS.map(block => passiveActor(
    block.id,
    `block/${block.type}`,
    block.x,
    { definition: block },
    `${block.id}:state`
  )),
  ...MEADOW_WAKE_COIN_DEFINITIONS.map(coin => passiveActor(
    coin.id,
    'collectible/trail-coin',
    coin.x,
    { definition: coin },
    `${coin.id}:collected`
  )),
  ...MEADOW_WAKE_COMPASS_COIN_DEFINITIONS.map(coin => passiveActor(
    coin.id,
    'collectible/compass-coin',
    coin.x,
    { definition: coin },
    `${coin.id}:collected`
  ))
]);

export const MEADOW_WAKE_LEVEL_DATA = createLevelDefinition({
  id: '1-1',
  name: 'Meadow Wake',
  world: 1,
  strictSideScrollingPlane: true,
  bounds: Object.freeze({ minX: 0, maxX: MEADOW_WAKE_WORLD_END, minY: -20, maxY: 20 }),
  terrainGeometry: Object.freeze({
    representation: 'simplified-gameplay-collision-only',
    visibleTerrainCollisionEnabled: false,
    groundSurfaces: Object.freeze([
      Object.freeze({
        id: 'meadow-wake-ground-profile',
        representation: 'deterministic-collision-profile',
        points: MEADOW_WAKE_TERRAIN_POINTS
      })
    ]),
    slopes: MEADOW_WAKE_TERRAIN_POINTS,
    cliffs: MEADOW_WAKE_PITS,
    semisolids: MEADOW_WAKE_PLATFORMS,
    hazardSurfaces: Object.freeze(MEADOW_WAKE_PITS.map(pit => Object.freeze({
      id: pit.id,
      type: 'pit',
      from: pit.from,
      to: pit.to,
      representation: 'dedicated-fatal-hazard-volume',
      artGeometryReference: null
    }))),
    materialRegions: Object.freeze([
      Object.freeze({ id: 'meadow-loam', from: 0, to: MEADOW_WAKE_WORLD_END, material: 'dirt' }),
      Object.freeze({ id: 'bridge-wood', from: 64.9, to: 69.1, material: 'wood' })
    ])
  }),
  visualEnvironment: Object.freeze({
    layers: Object.freeze([
      Object.freeze({ id: 'playable-foreground', depth: 0 }),
      Object.freeze({ id: 'authored-midground', depth: -1 }),
      Object.freeze({ id: 'far-background', depth: -2 })
    ]),
    backgroundSet: 'verdant-vale-meadow-wake',
    lighting: 'warm-daylight',
    visualRooms: MEADOW_WAKE_GAMEPLAY_ROOMS,
    terrainSystem: Object.freeze({
      id: 'verdant-vale-authored-terrain-kit',
      representation: 'independent-visible-3d-relief',
      collisionBearing: false,
      generatedCourseLayout: false,
      blenderSource: 'assets/blender/world-1/verdant_vale_terrain_kit.blend',
      runtimeAsset: 'assets/exports/world-1/verdant_vale_terrain_kit.glb',
      roomFinishProfiles: MEADOW_WAKE_ROOM_FINISH_PROFILES,
      terrainAnchors: MEADOW_WAKE_TERRAIN_ANCHORS
    })
  }),
  gameplayAreas: GAMEPLAY_AREAS,
  actors: ACTORS,
  entrances: Object.freeze([
    Object.freeze({ id: 'start', type: 'level-start', position: Object.freeze({ x: 1.8, y: 0, z: 0 }), areaId: 'camp-departure', destinationLevelId: null, destinationEntranceId: null, railId: null, isLevelExit: false }),
    Object.freeze({ id: 'checkpoint', type: 'checkpoint', position: Object.freeze({ x: 70.5, y: 0, z: 0 }), areaId: 'open-running-meadow', destinationLevelId: null, destinationEntranceId: null, railId: null, isLevelExit: false }),
    Object.freeze({ id: 'goal', type: 'level-exit', position: Object.freeze({ x: 123.25, y: 0, z: 0 }), areaId: 'exit-approach', destinationLevelId: '1-2', destinationEntranceId: 'start', railId: null, isLevelExit: true })
  ]),
  triggers: Object.freeze([
    ...MEADOW_WAKE_SECTIONS.map(section => Object.freeze({
      id: `${section.id}-trigger`,
      type: 'gameplay-section',
      areaId: areaIdAtX((section.range[0] + section.range[1]) / 2),
      bounds: bounds(section.range[0], section.range[1]),
      eventChannel: `${section.id}:entered`,
      persistentStateId: null
    })),
    Object.freeze({
      id: 'checkpoint-trigger',
      type: 'checkpoint',
      areaId: 'open-running-meadow',
      bounds: bounds(70.3, 70.7),
      eventChannel: 'checkpoint:reached',
      persistentStateId: 'checkpoint:meadow-wake'
    })
  ]),
  rails: RAILS,
  cameraSettings: Object.freeze({
    mode: 'strict-side-profile',
    lookAhead: true,
    verticalTracking: true,
    freeDepthMovement: false,
    bossTransitions: false
  }),
  persistentState: Object.freeze({
    defaults: Object.freeze({
      'checkpoint:meadow-wake': false,
      '1-1-C1:collected': false,
      '1-1-C2:collected': false,
      '1-1-C3:collected': false
    }),
    checkpointPolicy: 'retain-approved-pre-checkpoint-state',
    actorStatePolicy: 'persistent-id-only'
  })
});

export const MEADOW_WAKE_ENEMY_ACTORS = Object.freeze(
  MEADOW_WAKE_LEVEL_DATA.actors.filter(actor => actor.actorType.startsWith('enemy/'))
);
