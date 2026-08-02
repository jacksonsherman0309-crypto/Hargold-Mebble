import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

import {
  MEADOW_WAKE_BLOCK_DEFINITIONS,
  MEADOW_WAKE_BLOCK_PHRASES,
  MEADOW_WAKE_COIN_DEFINITIONS,
  MEADOW_WAKE_COMPASS_COIN_DEFINITIONS,
  MEADOW_WAKE_GAMEPLAY_ROOMS,
  MEADOW_WAKE_LANDFORM_FEATURES,
  MEADOW_WAKE_PITS,
  MEADOW_WAKE_PLATFORMS,
  MEADOW_WAKE_ROUTE_PHASES,
  MEADOW_WAKE_TERRAIN_MODULES,
  MEADOW_WAKE_TERRAIN_POINTS
} from '../../src/content/meadow-wake-course.js';
import {
  MEADOW_WAKE_ENEMY_ACTORS,
  MEADOW_WAKE_LEVEL_DATA
} from '../../src/content/meadow-wake-level-data.js';
import {
  MEADOW_WAKE_GAMEPLAY_LANDMARKS,
  MEADOW_WAKE_ROOM_FINISH_PROFILES,
  MEADOW_WAKE_SCENERY_PROPS
} from '../../src/content/meadow-wake-scenery.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT = path.join(ROOT, 'data/level-art/world-1/meadow-wake-opening-layout.json');
const SLICE_MIN_X = 0;
const SLICE_MAX_X = 30;
const VISUAL_MIN_X = -2;
const VISUAL_MAX_X = 34;
const GROUND_DATUM_RUNTIME_Y = 7.9;
const DEPTH_PIXELS_PER_METRE = 70;

const round = value => Number(Number(value).toFixed(6));
const inSlice = x => x >= SLICE_MIN_X && x <= SLICE_MAX_X;
const overlapsSlice = ([from, to]) => to >= SLICE_MIN_X && from <= SLICE_MAX_X;
const clampRange = ([from, to]) => [Math.max(from, SLICE_MIN_X), Math.min(to, SLICE_MAX_X)];

function groundYAt(x) {
  for (let index = 1; index < MEADOW_WAKE_TERRAIN_POINTS.length; index += 1) {
    const [leftX, leftY] = MEADOW_WAKE_TERRAIN_POINTS[index - 1];
    const [rightX, rightY] = MEADOW_WAKE_TERRAIN_POINTS[index];
    if (x <= rightX) {
      const ratio = (x - leftX) / Math.max(rightX - leftX, Number.EPSILON);
      return leftY + (rightY - leftY) * ratio;
    }
  }
  return MEADOW_WAKE_TERRAIN_POINTS.at(-1)[1];
}

const runtimeYToBlenderZ = runtimeY => round(GROUND_DATUM_RUNTIME_Y - runtimeY);
const groundZAt = x => runtimeYToBlenderZ(groundYAt(x));

function terrainPointsForSlice() {
  const points = MEADOW_WAKE_TERRAIN_POINTS
    .filter(([x]) => inSlice(x))
    .map(([x, runtimeY]) => ({ x, runtimeY, blenderZ: runtimeYToBlenderZ(runtimeY) }));
  if (points.at(-1)?.x !== SLICE_MAX_X) {
    const runtimeY = groundYAt(SLICE_MAX_X);
    points.push({ x: SLICE_MAX_X, runtimeY: round(runtimeY), blenderZ: runtimeYToBlenderZ(runtimeY) });
  }
  return points;
}

async function sha256(relativePath) {
  const bytes = await readFile(path.join(ROOT, relativePath));
  return createHash('sha256').update(bytes).digest('hex');
}

function platformRecord(platform) {
  return {
    ...platform,
    runtimeCenterY: platform.y,
    blenderCenter: { x: platform.x, y: 0, z: runtimeYToBlenderZ(platform.y) },
    blenderSurfaceZ: runtimeYToBlenderZ(platform.y - platform.height / 2),
    collisionRole: platform.oneWay ? 'one-way-platform' : 'solid-platform',
    artRole: 'separate-authored-environment-object'
  };
}

function groundRelativeRecord(definition) {
  const runtimeGroundY = round(groundYAt(definition.x));
  return {
    ...definition,
    runtimeGroundY,
    runtimeCenterY: round(runtimeGroundY - definition.lift),
    blenderCenter: { x: definition.x, y: 0, z: round(groundZAt(definition.x) + definition.lift) }
  };
}

function enemyRecord(actor) {
  const patrol = [actor.parameters.patrolFrom, actor.parameters.patrolTo];
  return {
    id: actor.id,
    actorType: actor.actorType,
    x: actor.position.x,
    blenderPosition: { x: actor.position.x, y: 0, z: groundZAt(actor.position.x) },
    patrolRange: patrol,
    areaId: actor.areaId,
    placementMode: actor.parameters.placementMode,
    artClearance: {
      horizontalRadiusMetres: 0.72,
      presentationDepthHalfWidthMetres: 0.55,
      rule: 'No terrain dressing, roots, or props may obscure the actor silhouette or patrol floor.'
    },
    runtimeAuthority: 'src/content/meadow-wake-level-data.js'
  };
}

function sceneryRecord(prop) {
  return {
    ...prop,
    runtimeDepthUnits: prop.depth ?? 0,
    blenderAnchor: {
      x: prop.x,
      y: round((prop.depth ?? 0) / DEPTH_PIXELS_PER_METRE),
      z: groundZAt(Math.max(SLICE_MIN_X, prop.x))
    },
    visibleAssetStatus: 'MANUAL_ART_REQUIRED',
    anchorAuthority: 'src/content/meadow-wake-scenery.js'
  };
}

export async function buildMeadowWakeOpeningLayout() {
  const sourceFiles = [
    'src/content/meadow-wake-course.js',
    'src/content/meadow-wake-level-data.js',
    'src/content/meadow-wake-scenery.js',
    'src/game.js'
  ];
  const sources = await Promise.all(sourceFiles.map(async source => ({
    path: source,
    sha256: await sha256(source)
  })));

  const groundProfile = terrainPointsForSlice();
  const platforms = MEADOW_WAKE_PLATFORMS.filter(platform => inSlice(platform.x)).map(platformRecord);
  const blocks = MEADOW_WAKE_BLOCK_DEFINITIONS.filter(block => inSlice(block.x)).map(groundRelativeRecord);
  const coins = MEADOW_WAKE_COIN_DEFINITIONS.filter(coin => inSlice(coin.x)).map(groundRelativeRecord);
  const compassCoins = MEADOW_WAKE_COMPASS_COIN_DEFINITIONS.filter(coin => inSlice(coin.x)).map(coin => ({
    ...coin,
    blenderPosition: { x: coin.x, y: 0, z: runtimeYToBlenderZ(coin.y) }
  }));
  const enemyAnchors = MEADOW_WAKE_ENEMY_ACTORS
    .filter(actor => inSlice(actor.position.x))
    .map(enemyRecord);

  return {
    schemaVersion: 1,
    id: 'world-1-1-meadow-wake-opening-vertical-slice',
    status: 'authoritative-layout-freeze',
    visibleArtStatus: 'SCULPT_REQUIRED_RETOPO_REQUIRED_UV_REQUIRED_ART_REVIEW_REQUIRED',
    completionClaim: false,
    scope: {
      courseId: '1-1',
      courseName: 'Meadow Wake',
      playableRangeMetres: [SLICE_MIN_X, SLICE_MAX_X],
      visualBufferRangeMetres: [VISUAL_MIN_X, VISUAL_MAX_X],
      targetTraversalSeconds: [20, 30],
      expansionBlockedUntilArtApproval: true
    },
    authority: {
      layout: 'current runnable browser implementation',
      historicalScaffoldStatus: 'coordinate-free; not used as coordinate authority',
      visibleTerrain: 'assets/blender/environments/world-1/meadow-wake-opening.blend',
      productionAssemblyTarget: 'unity/HargoldMebble',
      sources
    },
    unitsAndAxes: {
      gameplayMetreToBlenderMetre: 1,
      gameplayMetreToUnityUnit: 1,
      blender: { course: '+X', presentationDepth: '+Y', vertical: '+Z' },
      unity: { course: '+X', vertical: '+Y', presentationDepth: '+Z' },
      runtimeBrowser: { course: '+X', vertical: '+Y downward' },
      browserToBlender: {
        x: 'x',
        y: 0,
        z: `${GROUND_DATUM_RUNTIME_Y} - runtimeY`,
        groundDatumRuntimeY: GROUND_DATUM_RUNTIME_Y
      }
    },
    scaleReferences: {
      Hargold: { heightMetres: 1.82, widthMetres: 1.02 },
      Mebble: { heightMetres: 2.2932, widthMetres: 0.72 },
      standardBlock: { widthMetres: 0.74, heightMetres: 0.74, depthMetres: 0.74 }
    },
    gameplayPlane: {
      blenderY: 0,
      unityZ: 0,
      traversalDepthLocked: true,
      collisionWidthMetres: 0.8,
      artKeepClearDepthMetres: 1.1
    },
    spawn: {
      id: 'start',
      x: 1.8,
      blenderPosition: { x: 1.8, y: 0, z: groundZAt(1.8) },
      unityPosition: { x: 1.8, y: groundZAt(1.8), z: 0 },
      source: MEADOW_WAKE_LEVEL_DATA.entrances.find(entry => entry.id === 'start')
    },
    exitTransition: {
      id: 'opening-slice-exit',
      x: SLICE_MAX_X,
      blenderPosition: { x: SLICE_MAX_X, y: 0, z: groundZAt(SLICE_MAX_X) },
      nextRoomId: 'shellback-quarry',
      completionTrigger: false,
      purpose: 'Vertical-slice review boundary only; not a course goal.'
    },
    terrain: {
      groundProfile,
      collisionRepresentation: 'single deterministic linear profile; no visible-terrain collision',
      pits: MEADOW_WAKE_PITS.filter(pit => pit.to >= SLICE_MIN_X && pit.from <= SLICE_MAX_X),
      modules: MEADOW_WAKE_TERRAIN_MODULES
        .filter(module => overlapsSlice([module.visualFrom ?? module.from, module.to]))
        .map(module => ({
          ...module,
          authoredRange: [module.from, module.to],
          sliceRange: [Math.max(module.visualFrom ?? module.from, VISUAL_MIN_X), Math.min(module.to, SLICE_MAX_X)],
          productionMeshStatus: 'SCULPT_REQUIRED'
        })),
      landforms: MEADOW_WAKE_LANDFORM_FEATURES
        .filter(landform => inSlice(landform.x))
        .map(landform => ({ ...landform, productionMeshStatus: 'SCULPT_REQUIRED' })),
      rooms: MEADOW_WAKE_GAMEPLAY_ROOMS
        .filter(room => overlapsSlice(room.range))
        .map(room => ({ ...room, sliceRange: clampRange(room.range) })),
      routePhases: MEADOW_WAKE_ROUTE_PHASES
        .filter(phase => overlapsSlice(phase.range))
        .map(phase => ({ ...phase, sliceRange: clampRange(phase.range) }))
    },
    safeLandingZones: [
      { id: 'spawn-meadow-safe', range: [0.2, 4.75], groundRelative: true },
      { id: 'post-block-breath', range: [10.35, 11.35], groundRelative: true },
      { id: 'root-return-breath', range: [19.65, 23.95], groundRelative: true },
      { id: 'slice-exit-breath', range: [27.7, 30], groundRelative: true }
    ],
    interactionClearances: {
      blocks: { horizontalRadiusMetres: 0.47, verticalBelowMetres: 1.82, presentationDepthHalfWidthMetres: 0.55 },
      movingPlatforms: { horizontalPaddingMetres: 0.55, verticalPaddingMetres: 0.8, presentationDepthHalfWidthMetres: 0.65 },
      enemies: { horizontalRadiusMetres: 0.72, presentationDepthHalfWidthMetres: 0.55 },
      coinTrails: { screenSilhouetteRadiusMetres: 0.18 }
    },
    gameplayObjects: {
      platforms,
      blocks,
      blockPhrases: MEADOW_WAKE_BLOCK_PHRASES.filter(phrase => blocks.some(block => block.formation === phrase.id)),
      coins,
      compassCoins,
      enemyAnchors
    },
    environmentAnchors: {
      scenery: MEADOW_WAKE_SCENERY_PROPS
        .filter(prop => prop.x >= VISUAL_MIN_X && prop.x <= SLICE_MAX_X)
        .map(sceneryRecord),
      landmarks: MEADOW_WAKE_GAMEPLAY_LANDMARKS
        .filter(landmark => MEADOW_WAKE_SCENERY_PROPS.some(prop => prop.id === landmark.propId && prop.x <= SLICE_MAX_X)),
      priorFinishReferences: MEADOW_WAKE_ROOM_FINISH_PROFILES
        .filter(profile => inSlice(profile.x))
        .map(profile => ({ ...profile, role: 'reference-only; not final visible terrain' }))
    },
    camera: {
      mode: 'strict-side-profile',
      orthographic: true,
      gameplayLookAheadMetres: 2.1,
      freeDepthMovement: false,
      gameplayAreas: MEADOW_WAKE_LEVEL_DATA.gameplayAreas
        .filter(area => area.bounds.minX <= SLICE_MAX_X)
        .map(area => ({ ...area, bounds: { ...area.bounds, maxX: Math.min(area.bounds.maxX, SLICE_MAX_X) } })),
      fixedComparisonViewpoints: [
        { id: 'spawn', focus: [2.8, 0.45], cameraBlender: [2.8, -18, 3.7], orthographicScale: 7.5 },
        { id: 'first-terrain-transition', focus: [9.4, 0.65], cameraBlender: [9.4, -18, 3.8], orthographicScale: 7.5 },
        { id: 'block-phrase', focus: [7.9, 1.0], cameraBlender: [7.9, -18, 4.0], orthographicScale: 7.5 },
        { id: 'enemy-encounter', focus: [25.6, 1.25], cameraBlender: [25.6, -18, 4.25], orthographicScale: 7.5 },
        { id: 'slice-exit', focus: [29.0, 1.25], cameraBlender: [29.0, -18, 4.25], orthographicScale: 7.5 }
      ]
    },
    productionGates: {
      blenderSceneOrganization: 'required',
      neutralGuide: 'required',
      highSculpt: 'manual',
      gameRetopology: 'manual',
      uv: 'manual',
      textureBake: 'manual',
      collision: 'automatable from approved layout',
      lod: 'manual-after-game-mesh',
      unityImportAndTraversal: 'requires installed Unity editor',
      targetDevicePerformance: 'not-measured'
    }
  };
}

export async function writeMeadowWakeOpeningLayout(output = OUTPUT) {
  const layout = await buildMeadowWakeOpeningLayout();
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(layout, null, 2)}\n`, 'utf8');
  return output;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = await writeMeadowWakeOpeningLayout();
  console.log(path.relative(ROOT, output).replaceAll('\\', '/'));
}
