import * as THREE from '../../vendor/three/three.module.js';
import { MEADOW_WAKE_TERRAIN_MODULES, MEADOW_WAKE_TERRAIN_POINTS } from '../content/meadow-wake-course.js?v=terrain-finalization-2';

const SCALE = 70;

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

function material(color, roughness = 1) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, side: THREE.DoubleSide });
}

function cloneTextureMaterial(source, fallback, tint = 1) {
  const m = source?.clone?.() ?? material(fallback);
  if (m.color) m.color.set(fallback).multiplyScalar(tint);
  m.roughness = 1;
  m.metalness = 0;
  m.side = THREE.DoubleSide;
  if (m.map) {
    m.map = m.map.clone();
    m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping;
    m.map.repeat.set(1.25, 1.55);
    m.map.needsUpdate = true;
  }
  return m;
}

function makeLandmass(definition, sceneHeight) {
  const from = definition.visualFrom ?? definition.from;
  const to = definition.visualTo ?? definition.to;
  const span = to - from;
  const columns = Math.max(28, Math.ceil(span / 0.16));
  const rows = 9;
  const positions = [], uvs = [], indices = [];
  for (let row = 0; row <= rows; row += 1) {
    const v = row / rows;
    for (let col = 0; col <= columns; col += 1) {
      const u = col / columns;
      const x = THREE.MathUtils.lerp(from, to, u);
      const top = sceneHeight / 2 - heightAt(x) * SCALE - 2;
      const broad = Math.sin(u * Math.PI * 2.1 + definition.seed * 0.37) * 11;
      const shoulder = Math.sin(v * Math.PI) * (18 + 10 * Math.sin(u * 7.3 + definition.seed));
      const depth = 500 + 45 * Math.sin(u * Math.PI + definition.seed * 0.2);
      const y = top - v * depth + broad * v;
      const z = 5 + shoulder + Math.sin(u * 12.7 + v * 4.3 + definition.seed) * 5 * Math.sin(v * Math.PI);
      positions.push(x * SCALE, y, z);
      uvs.push(u * Math.max(3, span / 1.4), 1 - v * 2.5);
    }
  }
  for (let r = 0; r < rows; r += 1) for (let c = 0; c < columns; c += 1) {
    const a = r * (columns + 1) + c, b = a + 1, d = (r + 1) * (columns + 1) + c, e = d + 1;
    indices.push(a, d, b, b, d, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices); g.computeVertexNormals(); return g;
}

function makeTurfCap(definition, sceneHeight) {
  const from = definition.visualFrom ?? definition.from;
  const to = definition.visualTo ?? definition.to;
  const span = to - from;
  const columns = Math.max(28, Math.ceil(span / 0.16));
  const rows = 7;
  const positions = [], uvs = [], indices = [];
  for (let row = 0; row <= rows; row += 1) {
    const v = row / rows;
    for (let col = 0; col <= columns; col += 1) {
      const u = col / columns;
      const x = THREE.MathUtils.lerp(from, to, u);
      const surface = sceneHeight / 2 - heightAt(x) * SCALE;
      const fringe = 30 + 12 * Math.sin(u * 8.4 + definition.seed) + 8 * Math.sin(u * 19.7 + definition.seed * 0.7);
      const y = surface + 8 - v * Math.max(18, fringe);
      const z = 48 + v * 30 + Math.sin(u * 11.2 + definition.seed) * 4;
      positions.push(x * SCALE, y, z);
      uvs.push(u * Math.max(3, span / 1.25), 1 - v);
    }
  }
  for (let r = 0; r < rows; r += 1) for (let c = 0; c < columns; c += 1) {
    const a = r * (columns + 1) + c, b = a + 1, d = (r + 1) * (columns + 1) + c, e = d + 1;
    indices.push(a, d, b, b, d, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices); g.computeVertexNormals(); return g;
}

function makeShadowSkirt(definition, sceneHeight) {
  const from = definition.visualFrom ?? definition.from;
  const to = definition.visualTo ?? definition.to;
  const span = to - from;
  const columns = Math.max(20, Math.ceil(span / 0.22));
  const positions = [], indices = [];
  for (let i = 0; i <= columns; i += 1) {
    const u = i / columns;
    const x = THREE.MathUtils.lerp(from, to, u);
    const surface = sceneHeight / 2 - heightAt(x) * SCALE;
    const upper = surface - 225 + Math.sin(u * 10 + definition.seed) * 18;
    const lower = surface - 520 - hash(definition.seed * 29 + i) * 90;
    positions.push(x * SCALE, upper, 28, x * SCALE, lower, 36);
  }
  for (let i = 0; i < columns; i += 1) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices); g.computeVertexNormals(); return g;
}

function roundedStone(radius, seed) {
  const g = new THREE.IcosahedronGeometry(radius, 2);
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i += 1) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = 0.94 + Math.sin(seed * 2.9 + x * 0.07 + y * 0.09 + z * 0.06) * 0.08;
    p.setXYZ(i, x * n * 1.08, y * n * 0.78, z * n * 0.62);
  }
  p.needsUpdate = true; g.computeVertexNormals(); return g;
}

const HIDE_NAMES = new Set([
  'modeled-verdant-vale-earth-relief','recessed-irregular-subsoil-mass','modeled-irregular-living-surface-transition',
  'authored-clay-and-loam-strata','instanced-embedded-rounded-fieldstone','instanced-embedded-branching-earth-root',
  'instanced-authored-terrain-relief-stone','instanced-authored-earth-face-root','terrain-final-sculpted-bank-clod',
  'terrain-final-eroded-horizontal-shelf','terrain-final-embedded-fractured-stone','terrain-final-natural-erosion-groove',
  'terrain-final-irregular-living-edge','fractured-readable-cliff-edge','cliff-edge-exposed-root','landform-supporting-boulder',
  'root-bank-supporting-boulder','landform-exposed-root-network','terrain-transition-root-toe','terrain-transition-boulder',
  'goal-overlook-fractured-edge','instanced-localized-organic-root-mat','instanced-clustered-surface-moss'
]);
const HIDE_GROUPS = new Set(['MeadowWake_BlenderAuthoredRoomFinishKit','MeadowWake_HandcraftedLandformFeatures']);

function suppressLegacy(root) {
  root.traverse(o => { if (HIDE_NAMES.has(o.name) || HIDE_GROUPS.has(o.name)) o.visible = false; });
}

export function applyMeadowWakeTerrainSurfacePolish(renderer) {
  const foreground = renderer?.foregroundArt;
  const terrainRoot = foreground?.terrainVisualRoot;
  const finalRoot = terrainRoot?.getObjectByName('MeadowWake_TerrainFinalization');
  if (!terrainRoot || !finalRoot || !Number.isFinite(renderer?.height)) return null;
  suppressLegacy(terrainRoot);
  finalRoot.getObjectByName('MeadowWake_TerrainSurfacePolish')?.removeFromParent();

  const root = new THREE.Group();
  root.name = 'MeadowWake_TerrainSurfacePolish';
  root.position.z = 238;
  root.userData = { scope: 'terrain-only', visualGate: 'reference-first-living-landmass-v7', replacesVisibleTerrain: true };
  finalRoot.add(root);

  const earth = cloneTextureMaterial(foreground.materials?.soil, 0x3f3328, 0.92);
  const turf = cloneTextureMaterial(foreground.materials?.turf, 0x426f2d, 1);
  const shadow = material(0x172219, 1);
  const stone = material(0x56564b, 1);
  const stoneMoss = material(0x46533a, 1);
  const fringeDark = material(0x284b27, 1);
  const fringeLight = material(0x5c8735, 1);

  for (const definition of MEADOW_WAKE_TERRAIN_MODULES) {
    const from = definition.visualFrom ?? definition.from;
    const to = definition.visualTo ?? definition.to;
    const span = to - from;

    const body = new THREE.Mesh(makeLandmass(definition, renderer.height), earth);
    body.name = 'reference-landmass-earth-body'; body.castShadow = body.receiveShadow = true; root.add(body);
    const cap = new THREE.Mesh(makeTurfCap(definition, renderer.height), turf);
    cap.name = 'reference-landmass-deep-turf-cap'; cap.castShadow = cap.receiveShadow = true; root.add(cap);
    const skirt = new THREE.Mesh(makeShadowSkirt(definition, renderer.height), shadow);
    skirt.name = 'reference-landmass-shadowed-lower-skirt'; skirt.receiveShadow = true; root.add(skirt);

    // Sparse, broad embedded stones: never a repeated geology field.
    const stoneCount = span > 5.5 ? 2 : 1;
    for (let i = 0; i < stoneCount; i += 1) {
      const u = (i + 0.55) / stoneCount;
      const x = THREE.MathUtils.lerp(from, to, u);
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const r = 30 + hash(definition.seed * 41 + i) * 16;
      const rock = new THREE.Mesh(roundedStone(r, definition.seed * 83 + i), i % 2 ? stoneMoss : stone);
      rock.name = 'reference-landmass-broad-embedded-stone';
      rock.position.set(x * SCALE, surface - 165 - hash(definition.seed * 47 + i) * 120, 44);
      rock.rotation.z = (hash(definition.seed * 53 + i) - 0.5) * 0.24;
      rock.scale.set(1.45, 0.8, 0.58); rock.castShadow = rock.receiveShadow = true; root.add(rock);
    }

    // Dense turf silhouette. These are terrain fringe, not decorative set dressing.
    const clusters = Math.max(10, Math.round(span * 2.15));
    for (let i = 0; i < clusters; i += 1) {
      const u = (i + 0.3 + hash(definition.seed * 59 + i) * 0.4) / clusters;
      const x = THREE.MathUtils.lerp(from, to, Math.min(0.995, u));
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const blades = 6 + (i % 4);
      for (let b = 0; b < blades; b += 1) {
        const h = 15 + hash(definition.seed * 67 + i * 11 + b) * 25;
        const blade = new THREE.Mesh(new THREE.ConeGeometry(1.25 + (b % 2) * 0.55, h, 5), b % 3 ? fringeLight : fringeDark);
        blade.name = 'reference-landmass-turf-fringe';
        blade.position.set(x * SCALE + (b - blades / 2) * 3.2, surface + h * 0.38 - (b % 3) * 2.5, 78 + (b % 2) * 5);
        blade.rotation.z = (hash(definition.seed * 73 + i * 13 + b) - 0.5) * 0.58;
        blade.castShadow = true; root.add(blade);
      }
    }

    // Lower-bank vegetation silhouette hides the technical bottom of the landmass as in the target.
    const lowerClusters = Math.max(5, Math.round(span * 0.95));
    for (let i = 0; i < lowerClusters; i += 1) {
      const u = (i + 0.5) / lowerClusters;
      const x = THREE.MathUtils.lerp(from, to, u);
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const h = 38 + hash(definition.seed * 89 + i) * 45;
      const clump = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7), fringeDark);
      clump.name = 'reference-landmass-shadow-vegetation';
      clump.position.set(x * SCALE, surface - 285 - hash(definition.seed * 97 + i) * 95, 70);
      clump.scale.set(30 + hash(i + 2) * 25, h, 12); clump.castShadow = true; root.add(clump);
    }
  }
  return root;
}
