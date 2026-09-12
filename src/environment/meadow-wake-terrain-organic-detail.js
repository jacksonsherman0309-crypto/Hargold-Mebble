import * as THREE from '../../vendor/three/three.module.js';
import {
  MEADOW_WAKE_TERRAIN_MODULES,
  MEADOW_WAKE_TERRAIN_POINTS
} from '../content/meadow-wake-course.js?v=terrain-finalization-2';

const SCALE = 70;

function hash(seed) {
  const value = Math.sin(seed * 12.9898 + 37.719) * 43758.5453;
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

function makeDrapeGeometry(width, depth, seed) {
  const columns = 7;
  const vertices = [];
  const colors = [];
  const uvs = [];
  const green = new THREE.Color(0x507f37);
  const dark = new THREE.Color(0x365e2d);
  for (let index = 0; index <= columns; index += 1) {
    const ratio = index / columns;
    const x = THREE.MathUtils.lerp(-width / 2, width / 2, ratio);
    const crown = Math.sin(ratio * Math.PI) * 3.5;
    const hanging = depth * (0.48 + hash(seed + index * 11) * 0.52);
    const z = (hash(seed + index * 17) - 0.5) * 4;
    vertices.push(x, crown, z, x, hanging, z + 1.5);
    uvs.push(ratio, 1, ratio, 0);
    const top = green.clone().multiplyScalar(0.9 + hash(seed + index * 3) * 0.14);
    const bottom = dark.clone().multiplyScalar(0.86 + hash(seed + index * 7) * 0.1);
    colors.push(top.r, top.g, top.b, bottom.r, bottom.g, bottom.b);
  }
  const indices = [];
  for (let index = 0; index < columns; index += 1) {
    const a = index * 2;
    const b = a + 2;
    indices.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeErosionRibbon(length, width, seed) {
  const segments = 8;
  const vertices = [];
  const colors = [];
  const top = new THREE.Color(0x604330);
  const bottom = new THREE.Color(0x382c25);
  for (let index = 0; index <= segments; index += 1) {
    const ratio = index / segments;
    const y = ratio * length;
    const center = Math.sin(ratio * Math.PI * (1.3 + hash(seed) * 1.5) + seed) * width * 0.8;
    const localWidth = width * (1 - ratio * 0.55) * (0.72 + hash(seed + index * 13) * 0.45);
    const z = Math.sin(ratio * 4.2 + seed) * 1.6;
    vertices.push(center - localWidth, y, z, center + localWidth, y, z);
    const color = top.clone().lerp(bottom, ratio);
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
  }
  const indices = [];
  for (let index = 0; index < segments; index += 1) {
    const a = index * 2;
    const b = a + 2;
    indices.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function cloneMaterial(source, fallback) {
  const material = source?.clone?.() ?? new THREE.MeshStandardMaterial({ color: fallback });
  material.color?.setHex?.(0xffffff);
  material.roughness = 1;
  material.metalness = 0;
  material.side = THREE.DoubleSide;
  material.vertexColors = true;
  material.needsUpdate = true;
  return material;
}

export function applyMeadowWakeTerrainOrganicDetail(renderer) {
  const foreground = renderer?.foregroundArt;
  const parent = foreground?.terrainVisualRoot?.getObjectByName('MeadowWake_TerrainFinalization');
  if (!parent || !Number.isFinite(renderer?.height)) return null;
  parent.getObjectByName('MeadowWake_TerrainOrganicDetail')?.removeFromParent();

  const root = new THREE.Group();
  root.name = 'MeadowWake_TerrainOrganicDetail';
  root.userData = { scope: 'terrain-only', purpose: 'moss-overhang-and-erosion-breakup' };
  parent.add(root);

  const mossMaterial = cloneMaterial(foreground.materials?.turf, 0x4f7d36);
  const erosionMaterial = cloneMaterial(foreground.materials?.soil, 0x59402f);

  for (const definition of MEADOW_WAKE_TERRAIN_MODULES) {
    const from = definition.visualFrom ?? definition.from;
    const to = definition.visualTo ?? definition.to;
    const span = to - from;
    const drapeCount = Math.max(2, Math.floor(span / 1.05));
    for (let index = 0; index < drapeCount; index += 1) {
      const ratio = (index + 0.38 + hash(definition.seed + index * 19) * 0.24) / drapeCount;
      const x = THREE.MathUtils.lerp(from, to, ratio);
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const width = 30 + hash(definition.seed * 7 + index) * 68;
      const drop = 14 + hash(definition.seed * 13 + index) * 30;
      const drape = new THREE.Mesh(makeDrapeGeometry(width, drop, definition.seed * 31 + index), mossMaterial);
      drape.name = 'terrain-final-organic-moss-overhang';
      drape.position.set(x * SCALE, surface + 4, 132 + hash(index + definition.seed) * 4);
      drape.rotation.z = (hash(definition.seed * 17 + index) - 0.5) * 0.08;
      drape.castShadow = true;
      drape.receiveShadow = true;
      root.add(drape);
    }

    const grooveCount = Math.max(1, Math.floor(span / 2.3));
    for (let index = 0; index < grooveCount; index += 1) {
      const ratio = (index + 0.5) / grooveCount;
      const x = THREE.MathUtils.lerp(from, to, ratio);
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const length = 78 + hash(definition.seed * 23 + index) * 145;
      const width = 2.4 + hash(definition.seed * 29 + index) * 4.6;
      const ribbon = new THREE.Mesh(makeErosionRibbon(length, width, definition.seed * 43 + index), erosionMaterial);
      ribbon.name = 'terrain-final-natural-erosion-groove';
      ribbon.position.set(x * SCALE, surface - 20, 136);
      ribbon.castShadow = false;
      ribbon.receiveShadow = true;
      root.add(ribbon);
    }
  }
  return root;
}
