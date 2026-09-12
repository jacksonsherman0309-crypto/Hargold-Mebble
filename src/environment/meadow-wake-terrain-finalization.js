import * as THREE from '../../vendor/three/three.module.js';
import {
  MEADOW_WAKE_PITS,
  MEADOW_WAKE_TERRAIN_MODULES,
  MEADOW_WAKE_TERRAIN_POINTS
} from '../content/meadow-wake-course.js?v=terrain-finalization-1';

const SCALE = 70;

function hash(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
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
  return x < MEADOW_WAKE_TERRAIN_POINTS[0][0]
    ? MEADOW_WAKE_TERRAIN_POINTS[0][1]
    : MEADOW_WAKE_TERRAIN_POINTS.at(-1)[1];
}

function isPit(x) {
  return MEADOW_WAKE_PITS.some(pit => x > pit.from && x < pit.to);
}

function paletteFor(variant) {
  if (variant === 'eroded-bank') return { turf: 0x6f9b49, edge: 0x6d4d35, soil: 0x7f5d43 };
  if (variant === 'stone-seam' || variant === 'ruin-foundation') return { turf: 0x6f964c, edge: 0x6f5d4e, soil: 0x7a6959 };
  if (variant === 'root-bound' || variant === 'root-hollow') return { turf: 0x587f3b, edge: 0x604632, soil: 0x74533b };
  if (variant === 'compacted-clay') return { turf: 0x779849, edge: 0x805e42, soil: 0x927052 };
  if (variant === 'flowered-bank') return { turf: 0x7ba653, edge: 0x76563f, soil: 0x87664b };
  return { turf: 0x709b4d, edge: 0x72523b, soil: 0x826149 };
}

function makeTopSurfaceGeometry(definition, sceneHeight) {
  const from = definition.visualFrom ?? definition.from;
  const to = definition.visualTo ?? definition.to;
  const xSpacing = 0.24;
  const xSamples = [];
  for (let x = from; x < to; x += xSpacing) xSamples.push(x);
  xSamples.push(to);

  const zBands = 7;
  const frontZ = 112;
  const backZ = -112;
  const vertices = [];
  const colors = [];
  const uvs = [];
  const palette = paletteFor(definition.variant);
  const turf = new THREE.Color(palette.turf);
  const frontTint = new THREE.Color(palette.edge);

  xSamples.forEach((x, xIndex) => {
    const ground = sceneHeight / 2 - heightAt(x) * SCALE;
    for (let zIndex = 0; zIndex <= zBands; zIndex += 1) {
      const zRatio = zIndex / zBands;
      const z = THREE.MathUtils.lerp(frontZ, backZ, zRatio);
      const broad = Math.sin(x * 0.72 + definition.seed * 0.13) * 1.8;
      const crossfall = Math.sin(x * 1.47 + zRatio * 3.8 + definition.seed * 0.07) * 1.25;
      const crown = Math.sin(zRatio * Math.PI) * (3.4 + hash(definition.seed + xIndex) * 2.2);
      const frontBreak = zRatio < 0.22
        ? Math.sin(x * 3.43 + definition.seed) * (1 - zRatio / 0.22) * 2.4
        : 0;
      const y = ground + broad + crossfall + crown + frontBreak;
      vertices.push(x * SCALE, y, z);
      uvs.push((x - from) / Math.max(0.001, to - from), zRatio);

      const edgeMix = Math.max(0, 1 - zRatio * 5.4);
      const color = turf.clone().lerp(frontTint, edgeMix * 0.34);
      const value = 0.9 + hash(definition.seed * 17 + xIndex * 13 + zIndex * 7) * 0.14;
      color.multiplyScalar(value);
      colors.push(color.r, color.g, color.b);
    }
  });

  const indices = [];
  const stride = zBands + 1;
  for (let xIndex = 0; xIndex < xSamples.length - 1; xIndex += 1) {
    for (let zIndex = 0; zIndex < zBands; zIndex += 1) {
      const a = xIndex * stride + zIndex;
      const b = (xIndex + 1) * stride + zIndex;
      if ((xIndex + zIndex) % 2 === 0) {
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      } else {
        indices.push(a, a + 1, b + 1, a, b + 1, b);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.userData = {
    terrainRepresentation: 'final-authored-top-surface',
    collisionBearing: false,
    roomId: definition.roomId,
    moduleId: definition.id
  };
  return geometry;
}

function makeFrontLipGeometry(definition, sceneHeight) {
  const from = definition.visualFrom ?? definition.from;
  const to = definition.visualTo ?? definition.to;
  const spacing = 0.2;
  const samples = [];
  for (let x = from; x < to; x += spacing) samples.push(x);
  samples.push(to);
  const vertices = [];
  const colors = [];
  const palette = paletteFor(definition.variant);
  const grass = new THREE.Color(palette.turf);
  const soil = new THREE.Color(palette.soil);

  samples.forEach((x, index) => {
    const ground = sceneHeight / 2 - heightAt(x) * SCALE;
    const tooth = 8 + Math.abs(Math.sin(x * 4.1 + definition.seed)) * 9 + hash(index + definition.seed) * 5;
    const front = 116 + Math.sin(x * 3.2 + definition.seed) * 3.2;
    const upper = ground + Math.sin(x * 3.9 + definition.seed * 0.17) * 1.8;
    vertices.push(
      x * SCALE, upper + 4, front,
      x * SCALE, upper - tooth, front + 1.5
    );
    colors.push(
      grass.r, grass.g, grass.b,
      soil.r, soil.g, soil.b
    );
  });

  const indices = [];
  for (let index = 0; index < samples.length - 1; index += 1) {
    const a = index * 2;
    const b = a + 2;
    indices.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData = {
    terrainRepresentation: 'final-irregular-grass-soil-lip',
    collisionBearing: false,
    moduleId: definition.id
  };
  return geometry;
}

function makeCliffBreakup(parent, definition, sceneHeight, material, stoneMaterial) {
  const sides = [];
  if (definition.cliffLeft) sides.push(['left', definition.visualFrom ?? definition.from, 1]);
  if (definition.cliffRight) sides.push(['right', definition.visualTo ?? definition.to, -1]);
  for (const [side, x, direction] of sides) {
    const ground = sceneHeight / 2 - heightAt(x) * SCALE;
    for (let index = 0; index < 5; index += 1) {
      const width = 20 + hash(definition.seed + index * 5) * 18;
      const height = 22 + hash(definition.seed + index * 11) * 24;
      const depth = 18 + hash(definition.seed + index * 17) * 16;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1, 0),
        index % 2 ? material : stoneMaterial
      );
      rock.name = `terrain-final-${side}-cliff-breakup`;
      rock.scale.set(width, height, depth);
      rock.position.set(
        x * SCALE + direction * (7 + index * 8),
        ground - 18 - index * 27,
        111 + (index % 2) * 6
      );
      rock.rotation.set(
        0.08 * (index % 3),
        0.18 * direction * (index % 2 ? 1 : -1),
        direction * (0.12 + index * 0.045)
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      parent.add(rock);
    }
  }
}

function makePitMouths(root, sceneHeight, stoneMaterial, soilMaterial) {
  MEADOW_WAKE_PITS.forEach((pit, pitIndex) => {
    for (const [edgeIndex, x] of [pit.from, pit.to].entries()) {
      const ground = sceneHeight / 2 - heightAt(x) * SCALE;
      const direction = edgeIndex === 0 ? -1 : 1;
      const group = new THREE.Group();
      group.name = `${pit.id}_terrain-final-pit-mouth`;
      group.position.set(x * SCALE, ground, 109);
      root.add(group);
      for (let index = 0; index < 4; index += 1) {
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(1, 0),
          index % 3 ? soilMaterial : stoneMaterial
        );
        rock.scale.set(18 + index * 3, 13 + index * 4, 17 + (index % 2) * 5);
        rock.position.set(direction * (5 + index * 9), -15 - index * 21, index % 2 * 5);
        rock.rotation.z = direction * (0.12 + index * 0.08);
        rock.castShadow = true;
        rock.receiveShadow = true;
        group.add(rock);
      }
    }
  });
}

export function applyMeadowWakeTerrainFinalization(renderer) {
  const foreground = renderer?.foregroundArt;
  if (!foreground?.terrainVisualRoot || !Number.isFinite(renderer?.height)) return null;

  const existing = foreground.terrainVisualRoot.getObjectByName('MeadowWake_TerrainFinalization');
  existing?.removeFromParent();

  const root = new THREE.Group();
  root.name = 'MeadowWake_TerrainFinalization';
  root.userData = {
    terrainRepresentation: 'final-authored-landform-surface-pass',
    collisionBearing: false,
    scope: 'terrain-only'
  };
  foreground.terrainVisualRoot.add(root);

  const turfMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.99,
    metalness: 0,
    vertexColors: true,
    side: THREE.DoubleSide
  });
  const lipMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
    vertexColors: true,
    side: THREE.DoubleSide
  });
  const soilMaterial = new THREE.MeshStandardMaterial({ color: 0x6f513d, roughness: 1, metalness: 0 });
  const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x716e62, roughness: 0.98, metalness: 0 });

  for (const definition of MEADOW_WAKE_TERRAIN_MODULES) {
    const from = definition.visualFrom ?? definition.from;
    const to = definition.visualTo ?? definition.to;
    const midpoint = (from + to) / 2;
    if (isPit(midpoint)) continue;

    const module = new THREE.Group();
    module.name = `${definition.id}_terrain-final-surface`;
    module.userData = {
      roomId: definition.roomId,
      moduleId: definition.id,
      terrainOnly: true
    };
    root.add(module);

    const top = new THREE.Mesh(makeTopSurfaceGeometry(definition, renderer.height), turfMaterial);
    top.name = 'terrain-final-modeled-top-surface';
    top.receiveShadow = true;
    top.castShadow = false;
    module.add(top);

    const lip = new THREE.Mesh(makeFrontLipGeometry(definition, renderer.height), lipMaterial);
    lip.name = 'terrain-final-irregular-living-edge';
    lip.receiveShadow = true;
    lip.castShadow = true;
    module.add(lip);

    makeCliffBreakup(module, definition, renderer.height, soilMaterial, stoneMaterial);
  }

  makePitMouths(root, renderer.height, stoneMaterial, soilMaterial);
  return root;
}
