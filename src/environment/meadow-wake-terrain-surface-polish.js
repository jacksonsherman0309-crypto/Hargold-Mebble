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

function makeCohesiveBankFace(definition, sceneHeight) {
  const from = definition.visualFrom ?? definition.from;
  const to = definition.visualTo ?? definition.to;
  const span = to - from;
  const samples = Math.max(10, Math.ceil(span / 0.38));
  const lowerProfile = definition.lowerProfile ?? [0.68, 0.76, 0.7, 0.82, 0.72, 0.66];
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let index = 0; index <= samples; index += 1) {
    const ratio = index / samples;
    const x = THREE.MathUtils.lerp(from, to, ratio);
    const topY = sceneHeight / 2 - heightAt(x) * SCALE - 2;
    const profilePosition = ratio * (lowerProfile.length - 1);
    const profileIndex = Math.min(lowerProfile.length - 2, Math.floor(profilePosition));
    const profileMix = profilePosition - profileIndex;
    const profile = THREE.MathUtils.lerp(lowerProfile[profileIndex], lowerProfile[profileIndex + 1], profileMix);
    const broadUndulation = Math.sin(ratio * Math.PI * 2 + definition.seed * 0.17) * 18;
    const depth = (definition.faceDepth ?? 470) * (0.78 + profile * 0.34) + broadUndulation;
    const bottomY = topY - depth;
    positions.push(x * SCALE, topY, 0, x * SCALE, bottomY, 0);
    const u = ratio * Math.max(2.2, span / 1.8);
    uvs.push(u, 1, u, 0);
  }

  for (let index = 0; index < samples; index += 1) {
    const a = index * 2;
    const b = a + 2;
    indices.push(a, a + 1, b, b, a + 1, b + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
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
  'terrain-final-irregular-living-edge',
  'landform-supporting-boulder',
  'root-bank-supporting-boulder',
  'landform-exposed-root-network',
  'instanced-embedded-rounded-fieldstone',
  'instanced-embedded-branching-earth-root',
  'instanced-authored-terrain-relief-stone',
  'instanced-authored-earth-face-root',
  'terrain-transition-root-toe',
  'terrain-transition-boulder',
  'fractured-readable-cliff-edge',
  'cliff-edge-exposed-root',
  'goal-overlook-fractured-edge',
  'authored-clay-and-loam-strata'
]);

const HIDE_GROUPS = new Set([
  'MeadowWake_BlenderAuthoredRoomFinishKit',
  'MeadowWake_HandcraftedLandformFeatures'
]);

function suppressLegacyTerrainLayers(terrainRoot) {
  terrainRoot.traverse(object => {
    if (HIDE_EXACT.has(object.name) || HIDE_GROUPS.has(object.name)) {
      object.visible = false;
      object.userData = {
        ...object.userData,
        terrainReplacementStatus: 'superseded-by-cohesive-terrain-finish'
      };
    }
  });
}

export function applyMeadowWakeTerrainSurfacePolish(renderer) {
  const foreground = renderer?.foregroundArt;
  const terrainRoot = foreground?.terrainVisualRoot;
  const finalRoot = terrainRoot?.getObjectByName('MeadowWake_TerrainFinalization');
  if (!terrainRoot || !finalRoot || !Number.isFinite(renderer?.height)) return null;

  suppressLegacyTerrainLayers(terrainRoot);

  finalRoot.getObjectByName('MeadowWake_TerrainSurfacePolish')?.removeFromParent();
  const root = new THREE.Group();
  root.name = 'MeadowWake_TerrainSurfacePolish';
  root.position.z = 210;
  root.userData = {
    scope: 'terrain-only',
    visualGate: 'cohesive-textured-bank-face-sparse-geology-v5',
    legacyTerrainFinishSuppressed: true
  };
  finalRoot.add(root);

  const bankMaterial = cloneMaterial(foreground.materials?.soil, 0x77533f, 0.94);
  bankMaterial.side = THREE.DoubleSide;
  if (bankMaterial.map) {
    bankMaterial.map = bankMaterial.map.clone();
    bankMaterial.map.wrapS = THREE.RepeatWrapping;
    bankMaterial.map.wrapT = THREE.RepeatWrapping;
    bankMaterial.map.repeat.set(1.38, 1.58);
    bankMaterial.map.needsUpdate = true;
  }
  const soil = cloneMaterial(foreground.materials?.soil, 0x76533f, 0.9);
  const deepSoil = cloneMaterial(foreground.materials?.soil, 0x513b30, 0.8);
  const stone = cloneMaterial(foreground.materials?.stone, 0x8a857b, 0.98);
  const moss = cloneMaterial(foreground.materials?.turf, 0x567f3c, 0.92);
  moss.side = THREE.DoubleSide;

  for (const definition of MEADOW_WAKE_TERRAIN_MODULES) {
    const from = definition.visualFrom ?? definition.from;
    const to = definition.visualTo ?? definition.to;
    const span = to - from;

    const bank = new THREE.Mesh(makeCohesiveBankFace(definition, renderer.height), bankMaterial);
    bank.name = 'terrain-polish-continuous-textured-bank-face';
    bank.position.z = 0;
    bank.receiveShadow = true;
    bank.castShadow = false;
    root.add(bank);

    const massCount = span > 5.1 ? 2 : 1;
    for (let index = 0; index < massCount; index += 1) {
      const ratio = (index + 0.5) / massCount;
      const x = THREE.MathUtils.lerp(from, to, ratio);
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const width = span * SCALE / massCount * 0.72;
      const height = 190 + hash(definition.seed * 5 + index) * 80;
      const mass = new THREE.Mesh(
        makeBroadSoilMass(width, height, 24, definition.seed * 101 + index),
        index % 2 ? deepSoil : soil
      );
      mass.name = 'terrain-polish-cohesive-earth-bank';
      mass.position.set(x * SCALE, surface - 190 - hash(definition.seed * 17 + index) * 58, 5);
      mass.rotation.z = (hash(definition.seed * 29 + index) - 0.5) * 0.035;
      mass.scale.z = 0.52;
      mass.castShadow = true;
      mass.receiveShadow = true;
      root.add(mass);
    }

    if (span >= 3.6 && hash(definition.seed * 37) > 0.68) {
      const x = THREE.MathUtils.lerp(from, to, 0.34 + hash(definition.seed * 41) * 0.3);
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const lens = new THREE.Mesh(
        makeStoneLens(68 + hash(definition.seed * 43) * 52, 28 + hash(definition.seed * 47) * 20, 10, definition.seed * 107),
        stone
      );
      lens.name = 'terrain-polish-integrated-stone-lens';
      lens.position.set(x * SCALE, surface - 170 - hash(definition.seed * 53) * 105, 11);
      lens.rotation.z = (hash(definition.seed * 59) - 0.5) * 0.22;
      lens.scale.z = 0.45;
      lens.castShadow = true;
      lens.receiveShadow = true;
      root.add(lens);
    }

    const mossCount = Math.max(1, Math.floor(span / 3.5));
    for (let index = 0; index < mossCount; index += 1) {
      const x = THREE.MathUtils.lerp(from, to, (index + 0.5) / mossCount);
      const surface = renderer.height / 2 - heightAt(x) * SCALE;
      const shelf = new THREE.Mesh(
        makeMossShelf(105 + hash(definition.seed * 61 + index) * 105, 13 + hash(definition.seed * 67 + index) * 17, definition.seed * 109 + index),
        moss
      );
      shelf.name = 'terrain-polish-soft-moss-shelf';
      shelf.position.set(x * SCALE, surface + 1, 12);
      shelf.rotation.z = (hash(definition.seed * 71 + index) - 0.5) * 0.03;
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      root.add(shelf);
    }
  }

  return root;
}
