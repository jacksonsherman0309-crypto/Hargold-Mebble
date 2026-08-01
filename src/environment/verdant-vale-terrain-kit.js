import * as THREE from '../../vendor/three/three.module.js';
import { VERDANT_VALE_TERRAIN_STANDARD } from '../canonical-data.js';

export const VERDANT_VALE_SCALE = 70;

export const VERDANT_VALE_TERRAIN_MATERIAL_CLASSES =
  VERDANT_VALE_TERRAIN_STANDARD.materialClasses;

const VARIANT_TINTS = Object.freeze({
  'compacted-clay': Object.freeze({
    surface: 0xe4cfad,
    middle: 0xb88968,
    lower: 0x827064,
    relief: 0.72,
    materialClasses: Object.freeze(['worn-path', 'compact-loam', 'embedded-stone'])
  }),
  'meadow-loam': Object.freeze({
    surface: 0xdfc8a7,
    middle: 0xac8365,
    lower: 0x776c61,
    relief: 0.78,
    materialClasses: Object.freeze(['grass', 'compact-loam', 'embedded-stone'])
  }),
  'root-bound': Object.freeze({
    surface: 0xd2bd9f,
    middle: 0x9a7960,
    lower: 0x6a655a,
    relief: 0.96,
    materialClasses: Object.freeze(['grass', 'compact-loam', 'moss'])
  }),
  'root-hollow': Object.freeze({
    surface: 0xcbb596,
    middle: 0x92715a,
    lower: 0x625f56,
    relief: 1.08,
    materialClasses: Object.freeze(['grass', 'damp-soil', 'moss'])
  }),
  'stone-seam': Object.freeze({
    surface: 0xd9c4a8,
    middle: 0xaa9680,
    lower: 0x7a7d74,
    relief: 1.12,
    materialClasses: Object.freeze(['exposed-dirt', 'embedded-stone', 'moss'])
  }),
  'ruin-foundation': Object.freeze({
    surface: 0xd3c0a6,
    middle: 0xa19384,
    lower: 0x747a75,
    relief: 1.18,
    materialClasses: Object.freeze(['compact-loam', 'ruin-stone', 'moss'])
  }),
  'eroded-bank': Object.freeze({
    surface: 0xd9b99b,
    middle: 0xa87c62,
    lower: 0x6d655d,
    relief: 1.28,
    materialClasses: Object.freeze(['exposed-dirt', 'damp-soil', 'embedded-stone'])
  }),
  'flowered-bank': Object.freeze({
    surface: 0xe2c8a8,
    middle: 0xae8568,
    lower: 0x756d63,
    relief: 0.88,
    materialClasses: Object.freeze(['grass', 'compact-loam', 'moss'])
  })
});

function wave(seed) {
  const value = Math.sin(seed * 12.9898 + 4.1414) * 43758.5453;
  return value - Math.floor(value);
}

function absoluteRelief(x, depthRatio) {
  return (
    Math.sin(x * 1.41 + depthRatio * 4.73) * 0.54
    + Math.sin(x * 3.17 - depthRatio * 7.9) * 0.29
    + Math.sin(x * 0.47 + depthRatio * 13.1) * 0.17
  );
}

function sampleRange(from, to, spacing) {
  const values = [];
  for (let x = from; x < to; x += spacing) values.push(x);
  values.push(to);
  return values;
}

function sampleAuthoredProfile(profile, ratio, fallback = 1) {
  if (!Array.isArray(profile) || profile.length < 2) return fallback;
  const clamped = THREE.MathUtils.clamp(ratio, 0, 1);
  const scaled = clamped * (profile.length - 1);
  const index = Math.min(profile.length - 2, Math.floor(scaled));
  return THREE.MathUtils.lerp(profile[index], profile[index + 1], scaled - index);
}

function terrainPalette(variant) {
  return VARIANT_TINTS[variant] ?? VARIANT_TINTS['meadow-loam'];
}

export function materialClassesForVerdantVariant(variant) {
  return terrainPalette(variant).materialClasses;
}

function terrainColor(palette, depthRatio, noise) {
  const surface = new THREE.Color(palette.surface);
  const middle = new THREE.Color(palette.middle);
  const lower = new THREE.Color(palette.lower);
  const color = depthRatio < 0.42
    ? surface.lerp(middle, depthRatio / 0.42)
    : middle.lerp(lower, (depthRatio - 0.42) / 0.58);
  const value = THREE.MathUtils.clamp(0.91 + noise * 0.1, 0.78, 1.04);
  color.multiplyScalar(value);
  return color;
}

/**
 * Detailed visible terrain body. This never participates in gameplay
 * collision; the deterministic controller continues to use the authored
 * MEADOW_WAKE_TERRAIN_POINTS profile.
 */
export function createVerdantTerrainBodyGeometry({
  from,
  to,
  heightAt,
  sceneHeight,
  faceDepth,
  depth = 192,
  seed = 0,
  variant = 'meadow-loam',
  lowerProfile = null,
  lowerInset = [0.12, 0.12],
  textureScale = 7.6,
  horizontalSpacing = 0.28,
  verticalBands = 7
}) {
  const palette = terrainPalette(variant);
  const samples = sampleRange(from, to, horizontalSpacing);
  const rowCount = Math.max(5, verticalBands);
  const front = depth / 2;
  const vertices = [];
  const uvs = [];
  const colors = [];

  for (let xIndex = 0; xIndex < samples.length; xIndex += 1) {
    const x = samples[xIndex];
    const spanRatio = (x - from) / Math.max(0.001, to - from);
    const authoredFade = Math.sin(spanRatio * Math.PI);
    const top = sceneHeight / 2 - heightAt(x) * VERDANT_VALE_SCALE;
    const authoredDepth = sampleAuthoredProfile(lowerProfile, spanRatio, 0.76);
    const lowerIrregularity =
      Math.sin(x * 1.23 + seed * 0.19) * 15
      + Math.sin(x * 0.43 + seed * 0.07) * 11;
    const localDepth = faceDepth * authoredDepth + lowerIrregularity;

    for (let row = 0; row <= rowCount; row += 1) {
      const depthRatio = row / rowCount;
      const broadPocket =
        Math.sin((x + seed * 0.31) * 0.72 + depthRatio * 5.8)
        * Math.sin(depthRatio * Math.PI)
        * 7.5;
      const erosion =
        Math.max(0, Math.sin(x * 2.07 + seed) - 0.35)
        * Math.sin(depthRatio * Math.PI)
        * 7;
      const noise = absoluteRelief(x, depthRatio);
      const moduleDetail =
        (wave(seed * 13 + xIndex * 3 + row * 11) - 0.5)
        * authoredFade;
      const relief =
        (noise * 9 + moduleDetail * 13 + broadPocket)
        * palette.relief
        * Math.sin(Math.max(0.05, depthRatio) * Math.PI);
      const lowerEdgeEase = depthRatio * depthRatio * (3 - 2 * depthRatio);
      const leftInfluence = Math.max(0, 1 - spanRatio / 0.24);
      const rightInfluence = Math.max(0, 1 - (1 - spanRatio) / 0.24);
      const xInset = (
        (lowerInset[0] ?? 0.12) * leftInfluence
        - (lowerInset[1] ?? 0.12) * rightInfluence
      ) * VERDANT_VALE_SCALE * lowerEdgeEase;
      const y =
        top
        - localDepth * depthRatio
        - erosion
        + Math.sin(depthRatio * Math.PI * 2 + x * 0.29) * 2.4;
      vertices.push(x * VERDANT_VALE_SCALE + xInset, y, front + relief);
      uvs.push(
        (x + seed * 0.071) / (textureScale * 0.58),
        (top - y + seed * 1.7) / 245
      );
      const color = terrainColor(palette, depthRatio, noise + moduleDetail);
      colors.push(color.r, color.g, color.b);
    }
  }

  const indices = [];
  const rowStride = rowCount + 1;
  for (let column = 0; column < samples.length - 1; column += 1) {
    for (let row = 0; row < rowCount; row += 1) {
      const a = column * rowStride + row;
      const b = (column + 1) * rowStride + row;
      const alternate = (column + row) % 2 === 0;
      if (alternate) {
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      } else {
        indices.push(a, a + 1, b + 1, a, b + 1, b);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData = {
    terrainRepresentation: 'visible-relief-mesh',
    collisionBearing: false,
    variant,
    authoredLowerProfile: [...(lowerProfile ?? [])],
    lowerInset: [...lowerInset],
    materialClasses: [...palette.materialClasses]
  };
  return geometry;
}

/**
 * Recessed, low-frequency earth mass behind the detailed landform faces. It
 * keeps the bottom of the viewport grounded without extending every detailed
 * face into one continuous texture curtain. This is visible art only.
 */
export function createVerdantSubsoilBackdropGeometry({
  from,
  to,
  heightAt,
  sceneHeight,
  seed = 0,
  depth = 154,
  upperDrop = 72,
  lowerDepth = 690,
  horizontalSpacing = 0.7
}) {
  const samples = sampleRange(from, to, horizontalSpacing);
  const front = depth / 2;
  const vertices = [];
  const colors = [];
  const uvs = [];
  const upperColor = new THREE.Color(0x6e6559);
  const lowerColor = new THREE.Color(0x3f4941);

  for (let index = 0; index < samples.length; index += 1) {
    const x = samples[index];
    const ratio = (x - from) / Math.max(0.001, to - from);
    const surfaceY = sceneHeight / 2 - heightAt(x) * VERDANT_VALE_SCALE;
    const shoulder = upperDrop
      + Math.sin(x * 0.51 + seed * 0.09) * 34
      + Math.sin(ratio * Math.PI) * 26;
    const base = lowerDepth
      + Math.sin(x * 0.23 + seed) * 44
      + Math.sin(ratio * Math.PI * 2.4) * 28;
    for (let row = 0; row <= 3; row += 1) {
      const depthRatio = row / 3;
      const y = surfaceY - THREE.MathUtils.lerp(shoulder, base, depthRatio);
      const relief = absoluteRelief(x, depthRatio) * 5.5;
      vertices.push(x * VERDANT_VALE_SCALE, y, front + relief);
      uvs.push((x + seed * 0.13) / 10.5, depthRatio * 1.8);
      const color = upperColor.clone().lerp(lowerColor, depthRatio);
      color.multiplyScalar(0.92 + wave(seed + index * 5 + row * 7) * 0.1);
      colors.push(color.r, color.g, color.b);
    }
  }

  const indices = [];
  for (let column = 0; column < samples.length - 1; column += 1) {
    for (let row = 0; row < 3; row += 1) {
      const a = column * 4 + row;
      const b = (column + 1) * 4 + row;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData = {
    terrainRepresentation: 'recessed-visible-subsoil-mass',
    collisionBearing: false
  };
  return geometry;
}

export function createVerdantGrassOverhangGeometry({
  from,
  to,
  heightAt,
  sceneHeight,
  depth = 204,
  seed = 0,
  horizontalSpacing = 0.18
}) {
  const samples = sampleRange(from, to, horizontalSpacing);
  const front = depth / 2;
  const back = -depth / 2;
  const vertices = [];
  const uvs = [];

  for (const x of samples) {
    const surfaceY = sceneHeight / 2 - heightAt(x) * VERDANT_VALE_SCALE;
    const edge = Math.sin(x * 4.27 + seed) * 1.8 + Math.sin(x * 1.41) * 1.2;
    const top = surfaceY + 14 + edge;
    const bottom = surfaceY - 16 - Math.abs(Math.sin(x * 3.13 + seed)) * 8;
    const frontRelief = Math.sin(x * 3.71 + seed) * 3.2;
    vertices.push(
      x * VERDANT_VALE_SCALE, top, front + frontRelief,
      x * VERDANT_VALE_SCALE, bottom, front + frontRelief,
      x * VERDANT_VALE_SCALE, top, back,
      x * VERDANT_VALE_SCALE, bottom, back
    );
    const u = x / 2.9;
    uvs.push(u, 1, u, 0, u, 1, u, 0);
  }

  const indices = [];
  for (let column = 0; column < samples.length - 1; column += 1) {
    const a = column * 4;
    const b = a + 4;
    indices.push(
      a, a + 1, b, b, a + 1, b + 1,
      a + 2, b + 2, a + 3, b + 2, b + 3, a + 3,
      a, b, a + 2, b, b + 2, a + 2,
      a + 1, a + 3, b + 1, b + 1, a + 3, b + 3
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData = {
    terrainRepresentation: 'visible-grass-overhang',
    collisionBearing: false,
    materialClasses: ['grass', 'moss']
  };
  return geometry;
}

export function createTerrainCollisionDebugGroup({
  points,
  pits,
  anchors,
  heightAt,
  sceneHeight
}) {
  const group = new THREE.Group();
  group.name = 'MeadowWake_CollisionTerrainDebugOverlay';
  group.visible = false;
  group.renderOrder = 2000;
  group.userData = {
    terrainRepresentation: 'collision-debug',
    collisionSource: 'MEADOW_WAKE_TERRAIN_POINTS'
  };

  const supportedPositions = [];
  const supportedBands = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const [x0, y0] = points[index];
    const [x1, y1] = points[index + 1];
    const midpoint = (x0 + x1) / 2;
    if (pits.some(pit => midpoint > pit.from && midpoint < pit.to)) continue;
    supportedPositions.push(
      x0 * VERDANT_VALE_SCALE,
      sceneHeight / 2 - y0 * VERDANT_VALE_SCALE + 16,
      142,
      x1 * VERDANT_VALE_SCALE,
      sceneHeight / 2 - y1 * VERDANT_VALE_SCALE + 16,
      142
    );
    supportedBands.push({
      x0: x0 * VERDANT_VALE_SCALE,
      y0: sceneHeight / 2 - y0 * VERDANT_VALE_SCALE + 16,
      x1: x1 * VERDANT_VALE_SCALE,
      y1: sceneHeight / 2 - y1 * VERDANT_VALE_SCALE + 16
    });
  }
  const collisionGeometry = new THREE.BufferGeometry();
  collisionGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(supportedPositions, 3)
  );
  const collisionLine = new THREE.LineSegments(
    collisionGeometry,
    new THREE.LineBasicMaterial({
      color: 0x5bff87,
      depthTest: false,
      transparent: true,
      opacity: 0.96
    })
  );
  collisionLine.name = 'deterministic-ground-collision-profile';
  collisionLine.renderOrder = 2001;
  group.add(collisionLine);

  const collisionBand = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 7, 5),
    new THREE.MeshBasicMaterial({
      color: 0x5bff87,
      depthTest: false,
      transparent: true,
      opacity: 0.86
    }),
    supportedBands.length
  );
  const collisionMatrix = new THREE.Matrix4();
  const collisionPosition = new THREE.Vector3();
  const collisionQuaternion = new THREE.Quaternion();
  const collisionScale = new THREE.Vector3();
  const collisionRotation = new THREE.Euler();
  supportedBands.forEach((band, index) => {
    const deltaX = band.x1 - band.x0;
    const deltaY = band.y1 - band.y0;
    collisionPosition.set(
      (band.x0 + band.x1) / 2,
      (band.y0 + band.y1) / 2,
      146
    );
    collisionRotation.set(0, 0, Math.atan2(deltaY, deltaX));
    collisionQuaternion.setFromEuler(collisionRotation);
    collisionScale.set(Math.hypot(deltaX, deltaY), 1, 1);
    collisionMatrix.compose(collisionPosition, collisionQuaternion, collisionScale);
    collisionBand.setMatrixAt(index, collisionMatrix);
  });
  collisionBand.instanceMatrix.needsUpdate = true;
  collisionBand.name = 'deterministic-ground-collision-band';
  collisionBand.renderOrder = 2002;
  collisionBand.frustumCulled = false;
  group.add(collisionBand);

  const pitPositions = [];
  for (const pit of pits) {
    for (const x of [pit.from, pit.to]) {
      const y = sceneHeight / 2 - heightAt(x) * VERDANT_VALE_SCALE;
      pitPositions.push(x * VERDANT_VALE_SCALE, y + 24, 145, x * VERDANT_VALE_SCALE, y - 210, 145);
    }
  }
  const pitGeometry = new THREE.BufferGeometry();
  pitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pitPositions, 3));
  const pitLines = new THREE.LineSegments(
    pitGeometry,
    new THREE.LineBasicMaterial({
      color: 0xff5e52,
      depthTest: false,
      transparent: true,
      opacity: 0.94
    })
  );
  pitLines.name = 'fatal-pit-volume-edges';
  pitLines.renderOrder = 2003;
  group.add(pitLines);

  const pitBand = new THREE.InstancedMesh(
    new THREE.BoxGeometry(10, 1, 6),
    new THREE.MeshBasicMaterial({
      color: 0xff5e52,
      depthTest: false,
      transparent: true,
      opacity: 0.9
    }),
    pits.length * 2
  );
  const pitMatrix = new THREE.Matrix4();
  let pitIndex = 0;
  for (const pit of pits) {
    for (const x of [pit.from, pit.to]) {
      const y = sceneHeight / 2 - heightAt(x) * VERDANT_VALE_SCALE;
      pitMatrix.compose(
        new THREE.Vector3(x * VERDANT_VALE_SCALE, y - 92, 147),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 230, 1)
      );
      pitBand.setMatrixAt(pitIndex, pitMatrix);
      pitIndex += 1;
    }
  }
  pitBand.instanceMatrix.needsUpdate = true;
  pitBand.name = 'fatal-pit-volume-edge-bands';
  pitBand.renderOrder = 2004;
  pitBand.frustumCulled = false;
  group.add(pitBand);

  const markerGeometry = new THREE.OctahedronGeometry(5.5, 0);
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdd58,
    depthTest: false
  });
  const anchorMesh = new THREE.InstancedMesh(
    markerGeometry,
    markerMaterial,
    anchors.length
  );
  const matrix = new THREE.Matrix4();
  anchors.forEach((anchor, index) => {
    const y = sceneHeight / 2 - heightAt(anchor.x) * VERDANT_VALE_SCALE;
    matrix.makeTranslation(anchor.x * VERDANT_VALE_SCALE, y + 30, 148);
    anchorMesh.setMatrixAt(index, matrix);
  });
  anchorMesh.name = 'terrain-prop-and-gameplay-anchors';
  anchorMesh.renderOrder = 2005;
  anchorMesh.userData = { anchors };
  group.add(anchorMesh);
  return group;
}

export function countTerrainRenderCost(root) {
  let meshCount = 0;
  let triangles = 0;
  const materials = new Set();
  root?.traverse(object => {
    if (!object.visible || !object.isMesh) return;
    meshCount += 1;
    const geometry = object.geometry;
    const instanceCount = object.isInstancedMesh ? object.count : 1;
    const triangleCount = geometry?.index
      ? geometry.index.count / 3
      : (geometry?.getAttribute('position')?.count ?? 0) / 3;
    triangles += triangleCount * instanceCount;
    const objectMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    objectMaterials.filter(Boolean).forEach(material => materials.add(material));
  });
  return Object.freeze({
    meshCount,
    triangleCount: Math.round(triangles),
    materialCount: materials.size
  });
}
