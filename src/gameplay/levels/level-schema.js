import { validateRailDefinition } from './rail-runtime.js';

export const LEVEL_DATA_SCHEMA_VERSION = 1;

export const LEVEL_DATA_SCHEMA = Object.freeze({
  requiredRootFields: Object.freeze([
    'id',
    'name',
    'world',
    'terrainGeometry',
    'visualEnvironment',
    'gameplayAreas',
    'actors',
    'entrances',
    'triggers',
    'rails',
    'cameraSettings',
    'persistentState'
  ]),
  terrainGeometry: Object.freeze([
    'groundSurfaces',
    'slopes',
    'cliffs',
    'semisolids',
    'hazardSurfaces',
    'materialRegions'
  ]),
  gameplayArea: Object.freeze([
    'id',
    'bounds',
    'camera',
    'zoom',
    'verticalTracking',
    'backgroundSet',
    'music',
    'direction',
    'activationRules'
  ]),
  actorPlacement: Object.freeze([
    'id',
    'actorType',
    'position',
    'areaId',
    'visualLayer',
    'parameters',
    'eventChannels',
    'persistentStateId',
    'activationBounds'
  ]),
  entrance: Object.freeze([
    'id',
    'type',
    'position',
    'areaId',
    'destinationLevelId',
    'destinationEntranceId',
    'railId',
    'isLevelExit'
  ]),
  railNode: Object.freeze([
    'position',
    'arrivalSpeed',
    'exitSpeed',
    'acceleration',
    'waitDuration',
    'easing',
    'loopMode',
    'facingRule',
    'triggerRequirement'
  ])
});

function requireArray(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value;
}

function finite(value, label) {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
  return value;
}

function validateBounds(bounds, label) {
  if (!bounds) throw new TypeError(`${label} bounds are required`);
  const minX = finite(bounds.minX, `${label}.minX`);
  const maxX = finite(bounds.maxX, `${label}.maxX`);
  const minY = finite(bounds.minY, `${label}.minY`);
  const maxY = finite(bounds.maxY, `${label}.maxY`);
  if (maxX <= minX || maxY <= minY) throw new RangeError(`${label} bounds must have positive area`);
}

function validatePosition(position, label, strictPlane = true) {
  if (!position) throw new TypeError(`${label}.position is required`);
  finite(position.x, `${label}.position.x`);
  finite(position.y, `${label}.position.y`);
  finite(position.z ?? 0, `${label}.position.z`);
  if (strictPlane && (position.z ?? 0) !== 0) {
    throw new Error(`${label} leaves the strict side-scrolling gameplay plane`);
  }
}

function uniqueIds(records, label) {
  const ids = new Set();
  for (const record of records) {
    if (!record?.id) throw new TypeError(`${label} record requires an id`);
    if (ids.has(record.id)) throw new Error(`${label} contains duplicate id ${record.id}`);
    ids.add(record.id);
  }
  return ids;
}

export function validateLevelDefinition(level) {
  if (!level?.id || !level?.name) throw new TypeError('level id and name are required');
  if (!Number.isInteger(level.world) || level.world < 1) throw new TypeError('level.world must be a positive integer');
  if (level.strictSideScrollingPlane !== true) {
    throw new Error(`${level.id} must preserve the strict side-scrolling gameplay plane`);
  }
  const areas = requireArray(level.gameplayAreas, 'level.gameplayAreas');
  const actors = requireArray(level.actors, 'level.actors');
  const entrances = requireArray(level.entrances, 'level.entrances');
  const triggers = requireArray(level.triggers, 'level.triggers');
  const rails = requireArray(level.rails, 'level.rails');
  requireArray(level.terrainGeometry?.groundSurfaces, 'level.terrainGeometry.groundSurfaces');
  requireArray(level.visualEnvironment?.layers, 'level.visualEnvironment.layers');

  const areaIds = uniqueIds(areas, 'gameplayAreas');
  uniqueIds(actors, 'actors');
  uniqueIds(entrances, 'entrances');
  uniqueIds(triggers, 'triggers');
  const railIds = uniqueIds(rails, 'rails');

  for (const area of areas) validateBounds(area.bounds, `area ${area.id}`);
  for (const actor of actors) {
    if (!actor.actorType) throw new TypeError(`actor ${actor.id} requires actorType`);
    validatePosition(actor.position, `actor ${actor.id}`);
    if (actor.areaId && !areaIds.has(actor.areaId)) {
      throw new Error(`actor ${actor.id} references missing area ${actor.areaId}`);
    }
    if (actor.activationBounds) validateBounds(actor.activationBounds, `actor ${actor.id} activation`);
  }
  for (const entrance of entrances) {
    validatePosition(entrance.position, `entrance ${entrance.id}`);
    if (entrance.areaId && !areaIds.has(entrance.areaId)) {
      throw new Error(`entrance ${entrance.id} references missing area ${entrance.areaId}`);
    }
    if (entrance.railId && !railIds.has(entrance.railId)) {
      throw new Error(`entrance ${entrance.id} references missing rail ${entrance.railId}`);
    }
  }
  for (const trigger of triggers) {
    validateBounds(trigger.bounds, `trigger ${trigger.id}`);
    if (trigger.areaId && !areaIds.has(trigger.areaId)) {
      throw new Error(`trigger ${trigger.id} references missing area ${trigger.areaId}`);
    }
  }
  for (const rail of rails) validateRailDefinition(rail);
  return true;
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export function createLevelDefinition(definition) {
  const level = structuredClone({
    schemaVersion: LEVEL_DATA_SCHEMA_VERSION,
    strictSideScrollingPlane: true,
    ...definition
  });
  validateLevelDefinition(level);
  return deepFreeze(level);
}

export function gameplayAreaAt(level, position) {
  return level.gameplayAreas.find(area =>
    position.x >= area.bounds.minX &&
    position.x <= area.bounds.maxX &&
    position.y >= area.bounds.minY &&
    position.y <= area.bounds.maxY
  ) ?? null;
}

export function persistentStateIds(level) {
  return Object.freeze([
    ...new Set([
      ...Object.keys(level.persistentState?.defaults ?? {}),
      ...level.actors.map(actor => actor.persistentStateId).filter(Boolean),
      ...level.triggers.map(trigger => trigger.persistentStateId).filter(Boolean)
    ])
  ]);
}
