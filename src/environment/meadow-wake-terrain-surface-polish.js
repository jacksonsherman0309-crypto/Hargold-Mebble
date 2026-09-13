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

function makeRoundedLens(width, height, depth, seed) {
  const segments = 14;
  const shape = new THREE.Shape();
  for (let index = 0; index < segments; index += 1) {
    const angle = index / segments * Math.PI * 2;
    const irregularity = 0.88 + hash(seed + index * 13) * 0.18;
    const x = Math.cos(angle) * width * 0.5 * irregularity;
    const y = Math.sin(angle) * height * 0.5 * irregularity;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: Math.min(4.5, depth * 0.24),
    bevelThickness: Math.min(4.5, depth * 0.24),
    curveSegments: 3,
    steps: 1
  });
  geometry.translate(0, 0, -depth * 0.5);
  geometry.computeVertexNormals();
  return geometry;
}

function makeSoilShoulder(width, height, depth, seed) {
  const segments = 12;
  const front = [];
  const back = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = index / segments * Math.PI * 2;
    const rx = width * 0.5 * (0.9 + hash(seed + index * 11) * 0.16);
    const ry = height * 0.5 * (0.86 + hash(seed + index * 17) * 0.2);
    const x = Math.cos(angle) * rx;
    const y = Math.sin(angle) * ry;
    front.push([x, y, depth * 0.52 + (hash(seed + index * 23) - 0.5) * depth * 0.08]);
    back.push([x * 0.9, y * 0.92, -depth * 0.48]);
  }
  const vertices = [0, 0, depth * 0.58, 0, 0, -depth * 0.5];
  for (const point of front) vertices.push(...point);
  for (const point of back) vertices.push(...point);
  const indices = [];
  const frontStart = 2;
  const backStart = frontStart + segments;
  for (let index = 0; index < segments; index += 1) {
    const next = (index + 1) % segments;
    indices.push(0, frontStart + index, frontStart + next);
    indices.push(1, backStart + next, backStart + index);
    indices.push(frontStart + index, backStart + index, frontStart + next);
    indices.push(frontStart + next, backStart + index, backStart + next);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function makeMossShelf(width, drop, seed) {
  const columns = 10;
  const vertices = [];
  const indices = [];
  for (let index = 0; index <= columns; index += 1) {
    const ratio = index / columns;
    const x = THREE.MathUtils.lerp(-width / 2, width / 2, ratio);
    const upper = Math.sin(ratio * Math.PI) * 2.5;
    const localDrop = drop * (0.62 + hash(seed + index * 7) * 0.38);
    const z = (hash(seed + index * 19) - 0.5) * 2.5;
    vertices.push(x, upper, z, x, -localDrop, z + 1.4);
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

export function applyMeadowWakeTerrainSurfacePolish(renderer) {
  const foreground = renderer?.foregroundArt;
  const terrainRoot = foreground?.terrainVisualRoot;
  const finalRoot = terrainRoot?.getObjectByName('MeadowWake_TerrainFinalization');
  if (!terrainRoot || !finalRoot || !Number.isFinite(renderer?.height)) return null;

  // The dense clod field helped break the blockout but is too noisy beside the
  // supplied target. Retain only a sparse subset and let broad modeled masses
  // carry the bank silhouette instead.
  let clodIndex = 0;
  terrainRoot.traverse(object => {
    if (object.name === 'terrain-final-sculpted-bank-clod') {
      object.visible = clodIndex % 4 === 0;
      clodIndex += 1;
    }
    if (object.name === 'terrain-final-eroded-horizontal-shelf') {
      object.visible = false;
    }
  });

  finalRoot.getObjectByName('MeadowWake_TerrainSurfacePolish')?.removeFromParent();
  const root = new THREE.Group();
  root.name = 'MeadowWake_TerrainSurfacePolish';
  root.userData = {
    scope: 'terrain-only',
    visualGate: 'broad-soil-masses-integrated-stone-lenses-and-soft-moss'
  };
  finalRoot.add(root);

  const soil = cloneMaterial(foreground.materials?.soil, 0x76533f, 0.88);
  const deepSoil = cloneMaterial(foreground.materials?.soil, 0x4c382d, 0.72);
  const stone = cloneMaterial(foreground.materials?.stone, 0x817c72, 0.9);
  const moss = cloneMaterial(foreground.materials?.turf, 0x547f39, 0.86);
  moss.side = THREE.DoubleSide;

  for (const definition of MEADOW_WAKE_TERRAIN_MODULES) {
    const from = definition.visualFrom ?? definition.from;
    const to = definition.visualTo ?? definition.to;
    const span = to - from;

    const shoulderCount = Math.max(2, Math.ceil(span / 2.8));
    for (let index = 0; index < shoulderCount; index += 1) {
      const ratio = (index + 0.5) / shoulderCount;
      const x = THREE.MathUtils.lerp(from, to, ratio);
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const width = Math.min(154, span * SCALE / shoulderCount * (0.76 + hash(definition.seed + index) * 0.22));
      const height = 72 + hash(definition.seed * 5 + index) * 112;
      const depth = 34 + hash(definition.seed * 11 + index) * 30;
      const shoulder = new THREE.Mesh(
        makeSoilShoulder(width, height, depth, definition.seed * 101 + index),
        index % 3 === 2 ? deepSoil : soil
      );
      shoulder.name = 'terrain-polish-broad-earth-shoulder';
      shoulder.position.set(
        x * SCALE,
        surface - 92 - hash(definition.seed * 17 + index) * 185,
        123 + hash(definition.seed * 23 + index) * 6
      );
      shoulder.rotation.z = (hash(definition.seed * 29 + index) - 0.5) * 0.22;
      shoulder.scale.x = 0.95 + hash(definition.seed * 31 + index) * 0.18;
      shoulder.castShadow = true;
      shoulder.receiveShadow = true;
      root.add(shoulder);
    }

    const lensCount = Math.max(1, Math.floor(span / 3.8));
    for (let index = 0; index < lensCount; index += 1) {
      const ratio = (index + 0.54) / lensCount;
      const x = THREE.MathUtils.lerp(from, to, Math.min(0.92, ratio));
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const width = 30 + hash(definition.seed * 37 + index) * 42;
      const height = 18 + hash(definition.seed * 41 + index) * 26;
      const lens = new THREE.Mesh(
        makeRoundedLens(width, height, 13 + hash(definition.seed * 43 + index) * 9, definition.seed * 107 + index),
        stone
      );
      lens.name = 'terrain-polish-integrated-rounded-stone-lens';
      lens.position.set(
        x * SCALE + (hash(definition.seed * 47 + index) - 0.5) * 48,
        surface - 115 - hash(definition.seed * 53 + index) * 175,
        139
      );
      lens.rotation.z = (hash(definition.seed * 59 + index) - 0.5) * 0.48;
      lens.scale.z = 0.72;
      lens.castShadow = true;
      lens.receiveShadow = true;
      root.add(lens);
    }

    const mossCount = Math.max(1, Math.floor(span / 2.2));
    for (let index = 0; index < mossCount; index += 1) {
      const ratio = (index + 0.35) / mossCount;
      const x = THREE.MathUtils.lerp(from, to, ratio);
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const width = 52 + hash(definition.seed * 61 + index) * 82;
      const shelf = new THREE.Mesh(
        makeMossShelf(width, 14 + hash(definition.seed * 67 + index) * 22, definition.seed * 109 + index),
        moss
      );
      shelf.name = 'terrain-polish-soft-moss-shelf';
      shelf.position.set(x * SCALE, surface + 1, 141);
      shelf.rotation.z = (hash(definition.seed * 71 + index) - 0.5) * 0.06;
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      root.add(shelf);
    }
  }

  return root;
}
