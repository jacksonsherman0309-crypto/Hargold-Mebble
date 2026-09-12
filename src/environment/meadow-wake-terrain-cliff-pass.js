import * as THREE from '../../vendor/three/three.module.js';
import {
  MEADOW_WAKE_PITS,
  MEADOW_WAKE_TERRAIN_POINTS
} from '../content/meadow-wake-course.js?v=terrain-finalization-2';

const SCALE = 70;

function hash(seed) {
  const value = Math.sin(seed * 12.9898 + 19.193) * 43758.5453;
  return value - Math.floor(value);
}

function heightAt(x) {
  for (let index = 0; index < MEADOW_WAKE_TERRAIN_POINTS.length - 1; index += 1) {
    const [x0, y0] = MEADOW_WAKE_TERRAIN_POINTS[index];
    const [x1, y1] = MEADOW_WAKE_TERRAIN_POINTS[index + 1];
    if (x >= x0 && x <= x1) {
      const ratio = (x - x0) / Math.max(0.0001, x1 - x0);
      return THREE.MathUtils.lerp(y0, y1, ratio);
    }
  }
  return MEADOW_WAKE_TERRAIN_POINTS.at(-1)[1];
}

function makeCliffWallGeometry(direction, height, seed) {
  const shape = new THREE.Shape();
  const insideTop = direction * 92;
  const insideBottom = direction * 122;
  shape.moveTo(insideTop, 6);
  shape.lineTo(direction * 18, 4);
  const segments = 12;
  for (let index = 1; index <= segments; index += 1) {
    const ratio = index / segments;
    const ledge = 8 + hash(seed + index * 17) * 22;
    const broad = Math.sin(ratio * Math.PI * 2.4 + seed) * 9;
    const x = direction * (ledge + broad);
    const y = -height * ratio;
    shape.lineTo(x, y);
  }
  shape.lineTo(insideBottom, -height - 18);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 54,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 5,
    bevelThickness: 5,
    curveSegments: 2,
    steps: 1
  });
  geometry.translate(0, 0, -27);
  geometry.computeVertexNormals();
  return geometry;
}

function makeStoneSeamGeometry(width, height, seed) {
  const points = [];
  const count = 9;
  for (let index = 0; index < count; index += 1) {
    const angle = index / count * Math.PI * 2;
    const radius = 0.78 + hash(seed + index * 11) * 0.32;
    points.push([
      Math.cos(angle) * width * 0.5 * radius,
      Math.sin(angle) * height * 0.5 * radius
    ]);
  }
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) shape.lineTo(points[index][0], points[index][1]);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 10,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 2.5,
    bevelThickness: 2.5,
    curveSegments: 2
  });
  geometry.translate(0, 0, -5);
  geometry.computeVertexNormals();
  return geometry;
}

function cloneMaterial(source, fallback, multiplier = 1) {
  const material = source?.clone?.() ?? new THREE.MeshStandardMaterial({ color: fallback });
  if (material.color) material.color.multiplyScalar(multiplier);
  material.roughness = Math.max(0.96, material.roughness ?? 0.96);
  material.metalness = 0;
  material.needsUpdate = true;
  return material;
}

const SUPERSEDED_TERRAIN_NAMES = new Set([
  'terrain-final-left-cliff-breakup',
  'terrain-final-right-cliff-breakup',
  'terrain-final-embedded-fractured-stone',
  'terrain-final-natural-erosion-groove',
  'continuous-sculpted-landform-shoulder'
]);

export function applyMeadowWakeTerrainCliffPass(renderer) {
  const foreground = renderer?.foregroundArt;
  const terrainRoot = foreground?.terrainVisualRoot;
  const finalRoot = terrainRoot?.getObjectByName('MeadowWake_TerrainFinalization');
  if (!terrainRoot || !finalRoot || !Number.isFinite(renderer?.height)) return null;

  terrainRoot.traverse(object => {
    if (SUPERSEDED_TERRAIN_NAMES.has(object.name) || object.name.endsWith('_terrain-final-pit-mouth')) {
      object.visible = false;
    }
  });

  // The old face shader was intentionally bright for blockout readability.
  // Pull it back so the soil reads as a shaded natural mass beneath the turf.
  if (foreground.terrainBodyMaterial) {
    foreground.terrainBodyMaterial.color?.setHex?.(0xd6c3ad);
    foreground.terrainBodyMaterial.emissive?.setHex?.(0x2b1a12);
    foreground.terrainBodyMaterial.emissiveIntensity = 0.14;
    foreground.terrainBodyMaterial.roughness = 0.98;
    foreground.terrainBodyMaterial.needsUpdate = true;
  }
  if (foreground.recessedSubsoilMaterial) {
    foreground.recessedSubsoilMaterial.color?.setHex?.(0xb9b0a5);
    foreground.recessedSubsoilMaterial.emissive?.setHex?.(0x172019);
    foreground.recessedSubsoilMaterial.emissiveIntensity = 0.08;
    foreground.recessedSubsoilMaterial.needsUpdate = true;
  }

  finalRoot.getObjectByName('MeadowWake_CohesiveCliffFaces')?.removeFromParent();
  const root = new THREE.Group();
  root.name = 'MeadowWake_CohesiveCliffFaces';
  root.userData = { scope: 'terrain-only', visualGate: 'cohesive-jagged-cliff-walls' };
  finalRoot.add(root);

  const soil = cloneMaterial(foreground.materials?.soil, 0x704d37, 0.78);
  const stone = cloneMaterial(foreground.materials?.stone, 0x77736a, 0.7);
  const moss = cloneMaterial(foreground.materials?.turf, 0x527f39, 0.78);

  let edgeSeed = 1;
  for (const pit of MEADOW_WAKE_PITS) {
    for (const [edgeIndex, x] of [pit.from, pit.to].entries()) {
      const direction = edgeIndex === 0 ? -1 : 1;
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const wallHeight = pit.recoveryShelf ? 290 : pit.bridged ? 330 : 360;
      const group = new THREE.Group();
      group.name = `${pit.id}-cohesive-cliff-${edgeIndex === 0 ? 'left' : 'right'}`;
      group.position.set(x * SCALE, surface, 112);
      root.add(group);

      const wall = new THREE.Mesh(makeCliffWallGeometry(direction, wallHeight, edgeSeed * 37), soil);
      wall.name = 'terrain-final-continuous-jagged-cliff-wall';
      wall.castShadow = true;
      wall.receiveShadow = true;
      group.add(wall);

      // A few broad, flush stone seams read as geology rather than a stack of
      // floating polygon rocks.
      for (let index = 0; index < 3; index += 1) {
        const seam = new THREE.Mesh(
          makeStoneSeamGeometry(34 + hash(edgeSeed + index) * 24, 20 + hash(edgeSeed * 3 + index) * 24, edgeSeed * 71 + index),
          stone
        );
        seam.name = 'terrain-final-integrated-cliff-stone-seam';
        seam.position.set(
          direction * (22 + hash(edgeSeed + index * 5) * 38),
          -72 - index * 86 - hash(edgeSeed + index * 7) * 28,
          32
        );
        seam.rotation.z = (hash(edgeSeed + index * 11) - 0.5) * 0.45;
        seam.scale.z = 0.7;
        seam.castShadow = true;
        seam.receiveShadow = true;
        group.add(seam);
      }

      const cap = new THREE.Mesh(
        makeStoneSeamGeometry(104, 12, edgeSeed * 97),
        moss
      );
      cap.name = 'terrain-final-cliff-moss-cap';
      cap.position.set(direction * 30, -2, 34);
      cap.scale.set(1, 0.65, 0.7);
      cap.castShadow = true;
      group.add(cap);
      edgeSeed += 1;
    }
  }
  return root;
}
