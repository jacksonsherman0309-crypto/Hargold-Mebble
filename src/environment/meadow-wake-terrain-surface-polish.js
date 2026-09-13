import * as THREE from '../../vendor/three/three.module.js';
import {
  MEADOW_WAKE_TERRAIN_MODULES,
  MEADOW_WAKE_TERRAIN_POINTS
} from '../content/meadow-wake-course.js?v=terrain-finalization-2';

const SCALE = 70;

function hash(seed) {
  const value = Math.sin(seed * 12.9898 + 51.731) * 43758.5453;
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

function cloneMaterial(source, fallback, multiplier = 1) {
  const material = source?.clone?.() ?? new THREE.MeshStandardMaterial({ color: fallback });
  if (material.color) material.color.multiplyScalar(multiplier);
  material.roughness = Math.max(0.97, material.roughness ?? 0.97);
  material.metalness = 0;
  material.needsUpdate = true;
  return material;
}

function makeBroadSoilMass(width, height, depth, seed) {
  const columns = 9;
  const rows = 5;
  const positions = [];
  const indices = [];
  for (let row = 0; row <= rows; row += 1) {
    const v = row / rows;
    for (let column = 0; column <= columns; column += 1) {
      const u = column / columns;
      const x = (u - 0.5) * width;
      const y = (v - 0.5) * height;
      const edgeFade = Math.sin(u * Math.PI) * Math.sin(v * Math.PI);
      const broad = Math.sin(u * Math.PI * 1.35 + seed * 0.11) * 7 + Math.cos(v * Math.PI * 1.1 + seed * 0.07) * 5;
      const small = (hash(seed + row * 31 + column * 17) - 0.5) * 8;
      const z = depth * 0.38 + (broad + small) * edgeFade;
      positions.push(x, y, z);
    }
  }
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const a = row * (columns + 1) + column;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function makeStoneLens(width, height, depth, seed) {
  const points = [];
  const count = 12;
  for (let index = 0; index < count; index += 1) {
    const angle = index / count * Math.PI * 2;
    const radius = 0.9 + (hash(seed + index * 13) - 0.5) * 0.14;
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
    depth,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 3,
    bevelThickness: 3,
    curveSegments: 3,
    steps: 1
  });
  geometry.translate(0, 0, -depth * 0.5);
  geometry.computeVertexNormals();
  return geometry;
}

function makeMossShelf(width, drop, seed) {
  const columns = 12;
  const vertices = [];
  const indices = [];
  for (let index = 0; index <= columns; index += 1) {
    const ratio = index / columns;
    const x = THREE.MathUtils.lerp(-width / 2, width / 2, ratio);
    const crown = Math.sin(ratio * Math.PI) * 2.2;
    const localDrop = drop * (0.62 + hash(seed + index * 7) * 0.34);
    const z = (hash(seed + index * 19) - 0.5) * 2;
    vertices.push(x, crown, z, x, -localDrop, z + 1.2);
  }
  for (let index = 0; index < columns; index += 1) {
    const a = index * 2;
    const b = a + 2;
    indices.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const HIDE_EXACT = new Set([
  'terrain-final-sculpted-bank-clod',
  'terrain-final-eroded-horizontal-shelf',
  'terrain-final-embedded-fractured-stone',
  'terrain-final-natural-erosion-groove',
  'landform-supporting-boulder',
  'root-bank-supporting-boulder',
  'landform-exposed-root-network',
  'instanced-embedded-rounded-fieldstone',
  'instanced-embedded-branching-earth-root',
  'terrain-transition-root-toe',
  'terrain-transition-boulder',
  'fractured-readable-cliff-edge',
  'cliff-edge-exposed-root',
  'goal-overlook-fractured-edge'
]);

export function applyMeadowWakeTerrainSurfacePolish(renderer) {
  const foreground = renderer?.foregroundArt;
  const terrainRoot = foreground?.terrainVisualRoot;
  const finalRoot = terrainRoot?.getObjectByName('MeadowWake_TerrainFinalization');
  if (!terrainRoot || !finalRoot || !Number.isFinite(renderer?.height)) return null;

  terrainRoot.traverse(object => {
    if (HIDE_EXACT.has(object.name)) object.visible = false;
  });

  finalRoot.getObjectByName('MeadowWake_TerrainSurfacePolish')?.removeFromParent();
  const root = new THREE.Group();
  root.name = 'MeadowWake_TerrainSurfacePolish';
  root.userData = {
    scope: 'terrain-only',
    visualGate: 'cohesive-soil-masses-sparse-geology-soft-moss-v2'
  };
  finalRoot.add(root);

  const soil = cloneMaterial(foreground.materials?.soil, 0x76533f, 0.88);
  const deepSoil = cloneMaterial(foreground.materials?.soil, 0x513b30, 0.76);
  const stone = cloneMaterial(foreground.materials?.stone, 0x8a857b, 0.94);
  const moss = cloneMaterial(foreground.materials?.turf, 0x567f3c, 0.9);
  moss.side = THREE.DoubleSide;

  for (const definition of MEADOW_WAKE_TERRAIN_MODULES) {
    const from = definition.visualFrom ?? definition.from;
    const to = definition.visualTo ?? definition.to;
    const span = to - from;

    // One or two broad masses carry each bank. This deliberately avoids the
    // gravel-field look produced by dozens of small repeated clods.
    const massCount = span > 4.4 ? 2 : 1;
    for (let index = 0; index < massCount; index += 1) {
      const ratio = (index + 0.5) / massCount;
      const x = THREE.MathUtils.lerp(from, to, ratio);
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const width = span * SCALE / massCount * 0.93;
      const height = 255 + hash(definition.seed * 5 + index) * 125;
      const mass = new THREE.Mesh(
        makeBroadSoilMass(width, height, 44, definition.seed * 101 + index),
        index % 2 ? deepSoil : soil
      );
      mass.name = 'terrain-polish-cohesive-earth-bank';
      mass.position.set(
        x * SCALE,
        surface - 168 - hash(definition.seed * 17 + index) * 54,
        127
      );
      mass.rotation.z = (hash(definition.seed * 29 + index) - 0.5) * 0.05;
      mass.castShadow = true;
      mass.receiveShadow = true;
      root.add(mass);
    }

    // Sparse broad geology: at most one visible lens per room-sized module.
    if (span >= 3.2 && hash(definition.seed * 37) > 0.28) {
      const x = THREE.MathUtils.lerp(from, to, 0.32 + hash(definition.seed * 41) * 0.36);
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const lens = new THREE.Mesh(
        makeStoneLens(48 + hash(definition.seed * 43) * 42, 24 + hash(definition.seed * 47) * 24, 14, definition.seed * 107),
        stone
      );
      lens.name = 'terrain-polish-integrated-stone-lens';
      lens.position.set(x * SCALE, surface - 155 - hash(definition.seed * 53) * 120, 140);
      lens.rotation.z = (hash(definition.seed * 59) - 0.5) * 0.34;
      lens.scale.z = 0.7;
      lens.castShadow = true;
      lens.receiveShadow = true;
      root.add(lens);
    }

    const mossCount = Math.max(1, Math.floor(span / 2.8));
    for (let index = 0; index < mossCount; index += 1) {
      const x = THREE.MathUtils.lerp(from, to, (index + 0.5) / mossCount);
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const shelf = new THREE.Mesh(
        makeMossShelf(72 + hash(definition.seed * 61 + index) * 90, 12 + hash(definition.seed * 67 + index) * 18, definition.seed * 109 + index),
        moss
      );
      shelf.name = 'terrain-polish-soft-moss-shelf';
      shelf.position.set(x * SCALE, surface + 1, 142);
      shelf.rotation.z = (hash(definition.seed * 71 + index) - 0.5) * 0.045;
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      root.add(shelf);
    }
  }

  return root;
}
