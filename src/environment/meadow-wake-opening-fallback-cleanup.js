import * as THREE from '../../vendor/three/three.module.js';

const OPENING_MIN_X = 8.5 * 70;
const OPENING_MAX_X = 21.5 * 70;

const FALLBACK_NAMES = new Set([
  'layered-meadow-tree-trunk',
  'layered-meadow-tree-branch',
  'walk-under-elder-root-arch',
  'elder-root-inner-branch',
  'elder-root-ground-toe'
]);

function inOpeningRange(object) {
  const point = new THREE.Vector3();
  object.getWorldPosition(point);
  return point.x >= OPENING_MIN_X && point.x <= OPENING_MAX_X;
}

export function applyMeadowWakeOpeningFallbackCleanup(world) {
  world.updateMatrixWorld(true);
  world.traverse(object => {
    if (!inOpeningRange(object)) return;
    if (FALLBACK_NAMES.has(object.name) || object.name === 'rounded-leaf-cluster') {
      object.visible = false;
    }
  });

  const depthOverrides = new Map([
    ['ProductionOpeningCamp', 46],
    ['ProductionOpeningCampDetailV2', 86],
    ['ProductionElderTreeAndRootArch', 42],
    ['ProductionElderLeafArchitecture', 104],
    ['ProductionElderSurfaceDetail', 112],
    ['ProductionForegroundLeafSpray', 118]
  ]);

  world.traverse(object => {
    if (!depthOverrides.has(object.name)) return;
    object.position.z = depthOverrides.get(object.name);
  });
  world.updateMatrixWorld(true);
}
