import * as THREE from '../../vendor/three/three.module.js';
import { MEADOW_WAKE_TERRAIN_MODULES, MEADOW_WAKE_TERRAIN_POINTS } from '../content/meadow-wake-course.js?v=terrain-finalization-2';

const SCALE = 70;
const TAU = Math.PI * 2;

function hash(seed) {
  const value = Math.sin(seed * 12.9898 + 51.731) * 43758.5453;
  return value - Math.floor(value);
}

function heightAt(x) {
  for (let i = 0; i < MEADOW_WAKE_TERRAIN_POINTS.length - 1; i += 1) {
    const [x0, y0] = MEADOW_WAKE_TERRAIN_POINTS[i];
    const [x1, y1] = MEADOW_WAKE_TERRAIN_POINTS[i + 1];
    if (x >= x0 && x <= x1) return THREE.MathUtils.lerp(y0, y1, (x - x0) / Math.max(0.0001, x1 - x0));
  }
  return MEADOW_WAKE_TERRAIN_POINTS.at(-1)[1];
}

function cloneMaterial(source, fallback, multiplier = 1) {
  const material = source?.clone?.() ?? new THREE.MeshStandardMaterial({ color: fallback });
  if (material.color) material.color.multiplyScalar(multiplier);
  material.roughness = 1;
  material.metalness = 0;
  material.needsUpdate = true;
  return material;
}

function bankGeometry(definition, sceneHeight) {
  const from = definition.visualFrom ?? definition.from;
  const to = definition.visualTo ?? definition.to;
  const span = to - from;
  const columns = Math.max(18, Math.ceil(span / 0.24));
  const rows = 7;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let row = 0; row <= rows; row += 1) {
    const v = row / rows;
    for (let column = 0; column <= columns; column += 1) {
      const u = column / columns;
      const x = THREE.MathUtils.lerp(from, to, u);
      const top = sceneHeight / 2 - heightAt(x) * SCALE;
      const depth = 455 + 45 * Math.sin(u * Math.PI + definition.seed * 0.23);
      const edge = Math.sin(u * Math.PI);
      const broad = Math.sin(u * TAU * 1.35 + definition.seed) * 12 * v * edge;
      const erosion = Math.sin(v * Math.PI * 2.2 + u * 5.1 + definition.seed * 0.31) * 8 * v * edge;
      const y = top - v * depth + broad;
      const z = 7 + (Math.sin(u * 8.2 + v * 5.7 + definition.seed) * 8 + erosion) * edge;
      positions.push(x * SCALE, y, z);
      uvs.push(u * Math.max(2.5, span / 1.6), 1 - v * 2.2);
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
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function turfCrownGeometry(definition, sceneHeight) {
  const from = definition.visualFrom ?? definition.from;
  const to = definition.visualTo ?? definition.to;
  const span = to - from;
  const columns = Math.max(18, Math.ceil(span / 0.22));
  const rows = 5;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let row = 0; row <= rows; row += 1) {
    const v = row / rows;
    for (let column = 0; column <= columns; column += 1) {
      const u = column / columns;
      const x = THREE.MathUtils.lerp(from, to, u);
      const surface = sceneHeight / 2 - heightAt(x) * SCALE;
      const lip = 16 + 9 * Math.sin(u * 10.4 + definition.seed) + 5 * Math.sin(u * 24.7 + definition.seed * 0.6);
      const y = surface + 5 - v * Math.max(9, lip);
      const z = 35 + v * 20 + Math.sin(u * 13 + definition.seed) * 4;
      positions.push(x * SCALE, y, z);
      uvs.push(u * Math.max(3, span / 1.4), 1 - v);
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
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function skirtGeometry(definition, sceneHeight) {
  const from = definition.visualFrom ?? definition.from;
  const to = definition.visualTo ?? definition.to;
  const span = to - from;
  const samples = Math.max(12, Math.ceil(span / 0.32));
  const positions = [];
  const indices = [];
  for (let i = 0; i <= samples; i += 1) {
    const u = i / samples;
    const x = THREE.MathUtils.lerp(from, to, u);
    const top = sceneHeight / 2 - heightAt(x) * SCALE;
    const drop = 330 + hash(definition.seed * 13 + i) * 90;
    const wave = Math.sin(u * 9.2 + definition.seed) * 12;
    positions.push(x * SCALE, top - 190 + wave, 20, x * SCALE, top - drop, 28);
  }
  for (let i = 0; i < samples; i += 1) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function stoneGeometry(radius, seed) {
  const geometry = new THREE.IcosahedronGeometry(radius, 2);
  const p = geometry.getAttribute('position');
  for (let i = 0; i < p.count; i += 1) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = 0.9 + 0.12 * Math.sin(seed * 3.7 + x * 0.09 + y * 0.07 + z * 0.11);
    p.setXYZ(i, x * n * 1.12, y * n * 0.78, z * n * 0.7);
  }
  p.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

const LEGACY_TERRAIN_NAMES = new Set([
  'modeled-verdant-vale-earth-relief', 'recessed-irregular-subsoil-mass',
  'modeled-irregular-living-surface-transition', 'authored-clay-and-loam-strata',
  'instanced-embedded-rounded-fieldstone', 'instanced-embedded-branching-earth-root',
  'instanced-authored-terrain-relief-stone', 'instanced-authored-earth-face-root',
  'terrain-final-sculpted-bank-clod', 'terrain-final-eroded-horizontal-shelf',
  'terrain-final-embedded-fractured-stone', 'terrain-final-natural-erosion-groove',
  'terrain-final-irregular-living-edge', 'fractured-readable-cliff-edge',
  'cliff-edge-exposed-root', 'landform-supporting-boulder', 'root-bank-supporting-boulder',
  'landform-exposed-root-network', 'terrain-transition-root-toe', 'terrain-transition-boulder',
  'goal-overlook-fractured-edge'
]);
const LEGACY_TERRAIN_GROUPS = new Set(['MeadowWake_BlenderAuthoredRoomFinishKit', 'MeadowWake_HandcraftedLandformFeatures']);

function suppressOldTerrain(root) {
  root.traverse(object => {
    if (LEGACY_TERRAIN_NAMES.has(object.name) || LEGACY_TERRAIN_GROUPS.has(object.name)) object.visible = false;
  });
}

export function applyMeadowWakeTerrainSurfacePolish(renderer) {
  const foreground = renderer?.foregroundArt;
  const terrainRoot = foreground?.terrainVisualRoot;
  const finalRoot = terrainRoot?.getObjectByName('MeadowWake_TerrainFinalization');
  if (!terrainRoot || !finalRoot || !Number.isFinite(renderer?.height)) return null;
  suppressOldTerrain(terrainRoot);
  finalRoot.getObjectByName('MeadowWake_TerrainSurfacePolish')?.removeFromParent();

  const root = new THREE.Group();
  root.name = 'MeadowWake_TerrainSurfacePolish';
  root.position.z = 225;
  root.userData = { scope: 'terrain-only', visualGate: 'hard-reference-living-landmass-v6' };
  finalRoot.add(root);

  const earth = cloneMaterial(foreground.materials?.soil, 0x4f392d, 0.72);
  const deepEarth = cloneMaterial(foreground.materials?.soil, 0x263024, 0.46);
  const turf = cloneMaterial(foreground.materials?.turf, 0x4f7d31, 0.9);
  const stone = cloneMaterial(foreground.materials?.stone, 0x5e5d50, 0.72);
  const stoneLight = cloneMaterial(foreground.materials?.stone, 0x777466, 0.82);
  for (const material of [earth, deepEarth, turf, stone, stoneLight]) material.side = THREE.DoubleSide;
  if (earth.map) { earth.map = earth.map.clone(); earth.map.wrapS = earth.map.wrapT = THREE.RepeatWrapping; earth.map.repeat.set(1.15, 1.45); earth.map.needsUpdate = true; }
  if (turf.map) { turf.map = turf.map.clone(); turf.map.wrapS = turf.map.wrapT = THREE.RepeatWrapping; turf.map.repeat.set(1.4, 1.1); turf.map.needsUpdate = true; }

  for (const definition of MEADOW_WAKE_TERRAIN_MODULES) {
    const from = definition.visualFrom ?? definition.from;
    const to = definition.visualTo ?? definition.to;
    const span = to - from;

    const bank = new THREE.Mesh(bankGeometry(definition, renderer.height), earth);
    bank.name = 'reference-sculpted-dark-earth-body'; bank.receiveShadow = true; bank.castShadow = true; root.add(bank);
    const crown = new THREE.Mesh(turfCrownGeometry(definition, renderer.height), turf);
    crown.name = 'reference-deep-living-turf-crown'; crown.receiveShadow = true; crown.castShadow = true; root.add(crown);
    const skirt = new THREE.Mesh(skirtGeometry(definition, renderer.height), deepEarth);
    skirt.name = 'reference-shadowed-foreground-skirt'; skirt.receiveShadow = true; root.add(skirt);

    const stoneCount = Math.max(2, Math.round(span * 0.38));
    for (let i = 0; i < stoneCount; i += 1) {
      const u = (i + 0.55) / stoneCount;
      const x = THREE.MathUtils.lerp(from, to, u);
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const size = 19 + hash(definition.seed * 41 + i) * 16;
      const rock = new THREE.Mesh(stoneGeometry(size, definition.seed * 101 + i), i % 3 ? stone : stoneLight);
      rock.name = 'reference-rounded-embedded-bank-stone';
      rock.position.set(x * SCALE, surface - 95 - hash(definition.seed * 47 + i) * 205, 32);
      rock.rotation.z = (hash(definition.seed * 53 + i) - 0.5) * 0.35;
      rock.scale.set(1.2, 0.72, 0.58); rock.castShadow = true; rock.receiveShadow = true; root.add(rock);
    }

    const tuftCount = Math.max(5, Math.round(span * 1.1));
    for (let i = 0; i < tuftCount; i += 1) {
      const u = (i + 0.35 + hash(definition.seed * 61 + i) * 0.3) / tuftCount;
      const x = THREE.MathUtils.lerp(from, to, Math.min(0.98, u));
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const blades = 4 + (i % 3);
      for (let b = 0; b < blades; b += 1) {
        const h = 11 + hash(definition.seed * 71 + i * 7 + b) * 16;
        const blade = new THREE.Mesh(new THREE.ConeGeometry(1.1 + b * 0.12, h, 5), turf);
        blade.name = 'reference-turf-crown-blade';
        blade.position.set(x * SCALE + (b - blades / 2) * 3.4, surface + h * 0.45, 56 + b % 2 * 3);
        blade.rotation.z = (hash(definition.seed * 79 + i * 11 + b) - 0.5) * 0.42;
        blade.castShadow = true; root.add(blade);
      }
    }
  }
  return root;
}
