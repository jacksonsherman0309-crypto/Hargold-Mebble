import * as THREE from '../../vendor/three/three.module.js';
import { MEADOW_WAKE_TERRAIN_MODULES, MEADOW_WAKE_TERRAIN_POINTS } from '../content/meadow-wake-course.js?v=terrain-painted-landmass-1';

const SCALE = 70;
const REFERENCE_URL = './assets/references/terrain/meadow-wake-production-quality-target.jpeg';

function heightAt(x) {
  for (let i = 0; i < MEADOW_WAKE_TERRAIN_POINTS.length - 1; i += 1) {
    const [x0, y0] = MEADOW_WAKE_TERRAIN_POINTS[i];
    const [x1, y1] = MEADOW_WAKE_TERRAIN_POINTS[i + 1];
    if (x >= x0 && x <= x1) {
      return THREE.MathUtils.lerp(y0, y1, (x - x0) / Math.max(0.0001, x1 - x0));
    }
  }
  return MEADOW_WAKE_TERRAIN_POINTS.at(-1)[1];
}

function croppedTexture(source, crop) {
  const texture = source.clone();
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.offset.set(crop.u, crop.v);
  texture.repeat.set(crop.w, crop.h);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function paintedMaterial(source, crop, tint = 0xffffff) {
  return new THREE.MeshBasicMaterial({
    map: croppedTexture(source, crop),
    color: tint,
    side: THREE.DoubleSide,
    transparent: false,
    toneMapped: false
  });
}

function ribbonGeometry(definition, sceneHeight, topOffset, depth, z, uvVerticalScale = 1) {
  const from = definition.visualFrom ?? definition.from;
  const to = definition.visualTo ?? definition.to;
  const span = to - from;
  const samples = Math.max(24, Math.ceil(span / 0.16));
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= samples; i += 1) {
    const u = i / samples;
    const x = THREE.MathUtils.lerp(from, to, u);
    const surface = sceneHeight / 2 - heightAt(x) * SCALE;
    const shoulder = Math.sin(u * Math.PI * 2 + (definition.seed ?? 1) * 0.31) * 5;
    const top = surface + topOffset + shoulder;
    const bottom = top - depth * (0.91 + 0.08 * Math.sin(u * Math.PI * 1.7 + (definition.seed ?? 1)));
    positions.push(x * SCALE, top, z, x * SCALE, bottom, z);
    uvs.push(u, 1, u, 1 - uvVerticalScale);
  }

  for (let i = 0; i < samples; i += 1) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function topSurfaceGeometry(definition, sceneHeight, zFront = 76, zBack = -78) {
  const from = definition.visualFrom ?? definition.from;
  const to = definition.visualTo ?? definition.to;
  const span = to - from;
  const samples = Math.max(24, Math.ceil(span / 0.16));
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= samples; i += 1) {
    const u = i / samples;
    const x = THREE.MathUtils.lerp(from, to, u);
    const surface = sceneHeight / 2 - heightAt(x) * SCALE + 4;
    positions.push(x * SCALE, surface, zFront, x * SCALE, surface + 2, zBack);
    uvs.push(u, 0, u, 1);
  }

  for (let i = 0; i < samples; i += 1) {
    const a = i * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function hidePreviousTerrain(terrainRoot, finalRoot) {
  for (const child of terrainRoot.children) {
    if (child !== finalRoot) child.visible = false;
  }
  for (const child of finalRoot.children) child.visible = false;
}

export function applyMeadowWakeTerrainSurfacePolish(renderer) {
  const foreground = renderer?.foregroundArt;
  const terrainRoot = foreground?.terrainVisualRoot;
  const finalRoot = terrainRoot?.getObjectByName('MeadowWake_TerrainFinalization');
  if (!terrainRoot || !finalRoot || !Number.isFinite(renderer?.height)) return null;

  finalRoot.getObjectByName('MeadowWake_TerrainSurfacePolish')?.removeFromParent();
  hidePreviousTerrain(terrainRoot, finalRoot);

  const root = new THREE.Group();
  root.name = 'MeadowWake_TerrainSurfacePolish';
  root.position.z = 248;
  root.userData = {
    scope: 'terrain-only',
    visualGate: 'painted-reference-terrain-v8',
    architecture: 'reference-texture-driven-2.5d-landmass',
    replacesVisibleTerrain: true
  };
  finalRoot.visible = true;
  finalRoot.add(root);

  const loader = new THREE.TextureLoader();
  const reference = loader.load(REFERENCE_URL);
  reference.colorSpace = THREE.SRGBColorSpace;

  // Crops intentionally sample terrain-only areas of the approved gameplay target.
  // Coordinates are normalized from the 1536x864 stored reference.
  const turfCrop = { u: 0.6836, v: 0.4144, w: 0.0912, h: 0.0718 };
  const bankCrop = { u: 0.6836, v: 0.3380, w: 0.0912, h: 0.1042 };
  const lowerCrop = { u: 0.4232, v: 0.0162, w: 0.1628, h: 0.1968 };
  const topCrop = { u: 0.3830, v: 0.2778, w: 0.1563, h: 0.1123 };

  const turfMaterial = paintedMaterial(reference, turfCrop);
  const bankMaterial = paintedMaterial(reference, bankCrop, 0xf4f0e5);
  const lowerMaterial = paintedMaterial(reference, lowerCrop, 0xc9d0b5);
  const topMaterial = paintedMaterial(reference, topCrop, 0xd8e6c0);

  for (const definition of MEADOW_WAKE_TERRAIN_MODULES) {
    const top = new THREE.Mesh(topSurfaceGeometry(definition, renderer.height), topMaterial);
    top.name = 'painted-reference-ground-top';
    top.receiveShadow = false;
    root.add(top);

    const turf = new THREE.Mesh(ribbonGeometry(definition, renderer.height, 9, 56, 92, 1), turfMaterial);
    turf.name = 'painted-reference-thick-turf-crown';
    root.add(turf);

    const bank = new THREE.Mesh(ribbonGeometry(definition, renderer.height, -34, 390, 58, 1), bankMaterial);
    bank.name = 'painted-reference-rounded-earth-stone-bank';
    root.add(bank);

    const lower = new THREE.Mesh(ribbonGeometry(definition, renderer.height, -325, 245, 73, 1), lowerMaterial);
    lower.name = 'painted-reference-shadowed-vegetated-foreground';
    root.add(lower);
  }

  return root;
}
