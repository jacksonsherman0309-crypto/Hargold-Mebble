import * as THREE from '../../vendor/three/three.module.js';
import {
  MEADOW_WAKE_PITS,
  MEADOW_WAKE_TERRAIN_MODULES,
  MEADOW_WAKE_TERRAIN_POINTS
} from '../content/meadow-wake-course.js?v=terrain-finalization-2';

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
  if (variant === 'eroded-bank') return { turf: 0x6f9b49, edge: 0x674832, soil: 0x76533b, deep: 0x4f392d, stone: 0x777067 };
  if (variant === 'stone-seam' || variant === 'ruin-foundation') return { turf: 0x6f964c, edge: 0x6a5949, soil: 0x746252, deep: 0x4d463f, stone: 0x858076 };
  if (variant === 'root-bound' || variant === 'root-hollow') return { turf: 0x587f3b, edge: 0x5a412f, soil: 0x694a35, deep: 0x403129, stone: 0x68675f };
  if (variant === 'compacted-clay') return { turf: 0x779849, edge: 0x76563e, soil: 0x856348, deep: 0x553d31, stone: 0x747269 };
  if (variant === 'flowered-bank') return { turf: 0x7ba653, edge: 0x704f39, soil: 0x7c5b43, deep: 0x4d382c, stone: 0x777369 };
  return { turf: 0x709b4d, edge: 0x684a36, soil: 0x775640, deep: 0x49352b, stone: 0x737067 };
}

function makeTopSurfaceGeometry(definition, sceneHeight) {
  const from = definition.visualFrom ?? definition.from;
  const to = definition.visualTo ?? definition.to;
  const xSpacing = 0.18;
  const xSamples = [];
  for (let x = from; x < to; x += xSpacing) xSamples.push(x);
  xSamples.push(to);

  const zBands = 10;
  const frontZ = 120;
  const backZ = -116;
  const vertices = [];
  const colors = [];
  const uvs = [];
  const palette = paletteFor(definition.variant);
  const turf = new THREE.Color(palette.turf);
  const frontTint = new THREE.Color(palette.edge);

  xSamples.forEach((x, xIndex) => {
    const ground = sceneHeight / 2 - heightAt(x) * SCALE;
    const localSeed = definition.seed * 31 + xIndex * 17;
    for (let zIndex = 0; zIndex <= zBands; zIndex += 1) {
      const zRatio = zIndex / zBands;
      const edgeNoise = (hash(localSeed + zIndex * 5) - 0.5) * (1 - zRatio) * 5.5;
      const z = THREE.MathUtils.lerp(frontZ + edgeNoise, backZ, zRatio);
      const broad = Math.sin(x * 0.62 + definition.seed * 0.13) * 2.4;
      const crossfall = Math.sin(x * 1.47 + zRatio * 3.8 + definition.seed * 0.07) * 1.7;
      const crown = Math.sin(zRatio * Math.PI) * (4.8 + hash(localSeed) * 3.4);
      const frontBreak = zRatio < 0.24
        ? Math.sin(x * 3.43 + definition.seed) * (1 - zRatio / 0.24) * 3.2
        : 0;
      const backRoll = zRatio > 0.58 ? Math.sin(x * 0.84 + zRatio * 4.1) * 1.4 : 0;
      const y = ground + broad + crossfall + crown + frontBreak + backRoll;
      vertices.push(x * SCALE, y, z);
      uvs.push((x - from) * 0.48, zRatio * 2.15);

      const edgeMix = Math.max(0, 1 - zRatio * 4.6);
      const color = turf.clone().lerp(frontTint, edgeMix * 0.28);
      const value = 0.88 + hash(localSeed + zIndex * 7) * 0.17;
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
      if ((xIndex + zIndex) % 2 === 0) indices.push(a, a + 1, b, b, a + 1, b + 1);
      else indices.push(a, a + 1, b + 1, a, b + 1, b);
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
  const spacing = 0.14;
  const samples = [];
  for (let x = from; x < to; x += spacing) samples.push(x);
  samples.push(to);
  const vertices = [];
  const colors = [];
  const palette = paletteFor(definition.variant);
  const grass = new THREE.Color(palette.turf);
  const soil = new THREE.Color(palette.soil);
  const deep = new THREE.Color(palette.deep);

  samples.forEach((x, index) => {
    const ground = sceneHeight / 2 - heightAt(x) * SCALE;
    const tooth = 11 + Math.abs(Math.sin(x * 4.1 + definition.seed)) * 12 + hash(index + definition.seed) * 7;
    const front = 122 + Math.sin(x * 3.2 + definition.seed) * 4.6;
    const upper = ground + Math.sin(x * 3.9 + definition.seed * 0.17) * 2.2;
    const undercut = 3.5 + hash(index * 13 + definition.seed) * 4.8;
    vertices.push(
      x * SCALE, upper + 5, front,
      x * SCALE, upper - tooth * 0.48, front + undercut,
      x * SCALE, upper - tooth - 8, front - 2.5
    );
    colors.push(
      grass.r, grass.g, grass.b,
      soil.r, soil.g, soil.b,
      deep.r, deep.g, deep.b
    );
  });

  const indices = [];
  for (let index = 0; index < samples.length - 1; index += 1) {
    const a = index * 3;
    const b = a + 3;
    indices.push(a, a + 1, b, b, a + 1, b + 1);
    indices.push(a + 1, a + 2, b + 1, b + 1, a + 2, b + 2);
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

function makeBankReliefGeometry(width, height, depth, seed) {
  const front = [];
  const back = [];
  const ringCount = 10;
  for (let index = 0; index < ringCount; index += 1) {
    const angle = index / ringCount * Math.PI * 2;
    const radiusX = width * 0.5 * (0.82 + hash(seed + index * 3) * 0.3);
    const radiusY = height * 0.5 * (0.8 + hash(seed + index * 7) * 0.34);
    front.push([Math.cos(angle) * radiusX, Math.sin(angle) * radiusY, depth * 0.52 + (hash(seed + index * 11) - 0.5) * depth * 0.14]);
    back.push([Math.cos(angle) * radiusX * 0.76, Math.sin(angle) * radiusY * 0.78, -depth * 0.48]);
  }
  const vertices = [0, 0, depth * 0.58, 0, 0, -depth * 0.5];
  for (const point of front) vertices.push(...point);
  for (const point of back) vertices.push(...point);
  const frontCenter = 0;
  const backCenter = 1;
  const frontStart = 2;
  const backStart = frontStart + ringCount;
  const indices = [];
  for (let index = 0; index < ringCount; index += 1) {
    const next = (index + 1) % ringCount;
    indices.push(frontCenter, frontStart + index, frontStart + next);
    indices.push(backCenter, backStart + next, backStart + index);
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

function makeFracturedStoneGeometry(width, height, depth, seed) {
  const points = [];
  const count = 8;
  for (let index = 0; index < count; index += 1) {
    const angle = index / count * Math.PI * 2;
    const jag = 0.72 + hash(seed + index * 17) * 0.42;
    points.push([Math.cos(angle) * width * 0.5 * jag, Math.sin(angle) * height * 0.5 * jag]);
  }
  const vertices = [];
  for (const [x, y] of points) vertices.push(x, y, depth * 0.5 + (hash(seed + x + y) - 0.5) * 3);
  for (const [x, y] of points) vertices.push(x * 0.88, y * 0.9, -depth * 0.5);
  const indices = [];
  for (let index = 1; index < count - 1; index += 1) indices.push(0, index, index + 1);
  for (let index = 1; index < count - 1; index += 1) indices.push(count, count + index + 1, count + index);
  for (let index = 0; index < count; index += 1) {
    const next = (index + 1) % count;
    indices.push(index, count + index, next, next, count + index, count + next);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function addBankRelief(parent, definition, sceneHeight, soilMaterial, deepSoilMaterial, stoneMaterial) {
  const from = definition.visualFrom ?? definition.from;
  const to = definition.visualTo ?? definition.to;
  const span = to - from;
  const count = Math.max(5, Math.ceil(span * 1.8));
  const palette = paletteFor(definition.variant);
  for (let index = 0; index < count; index += 1) {
    const ratio = (index + 0.35 + hash(definition.seed + index * 19) * 0.3) / count;
    const x = THREE.MathUtils.lerp(from, to, ratio);
    const surface = sceneHeight / 2 - heightAt(x) * SCALE;
    const depthFromTop = 52 + hash(definition.seed * 5 + index) * 235;
    const width = 36 + hash(definition.seed * 11 + index * 3) * 68;
    const height = 28 + hash(definition.seed * 7 + index * 13) * 58;
    const protrusion = 15 + hash(definition.seed * 3 + index * 23) * 28;
    const clod = new THREE.Mesh(
      makeBankReliefGeometry(width, height, protrusion, definition.seed * 41 + index),
      index % 4 === 0 ? deepSoilMaterial : soilMaterial
    );
    clod.name = 'terrain-final-sculpted-bank-clod';
    clod.position.set(x * SCALE, surface - depthFromTop, 106 + hash(index + definition.seed) * 12);
    clod.rotation.z = (hash(definition.seed + index * 29) - 0.5) * 0.38;
    clod.scale.x *= 0.85 + hash(definition.seed + index * 31) * 0.5;
    clod.castShadow = true;
    clod.receiveShadow = true;
    parent.add(clod);

    if (index % 2 === 0) {
      const stoneWidth = width * (0.22 + hash(index + 9) * 0.22);
      const stone = new THREE.Mesh(
        makeFracturedStoneGeometry(stoneWidth, stoneWidth * (0.64 + hash(index + 13) * 0.42), 14 + hash(index + 17) * 14, definition.seed * 61 + index),
        stoneMaterial
      );
      stone.name = 'terrain-final-embedded-fractured-stone';
      stone.position.set(
        x * SCALE + (hash(index + 21) - 0.5) * width * 0.42,
        surface - depthFromTop + (hash(index + 25) - 0.5) * height * 0.46,
        126 + hash(index + 27) * 8
      );
      stone.rotation.z = (hash(index + 33) - 0.5) * 0.72;
      stone.castShadow = true;
      stone.receiveShadow = true;
      parent.add(stone);
    }
  }

  // Break the front into shallow erosion shelves so the bank does not read as
  // one continuous vertical curtain.
  const shelfCount = Math.max(2, Math.ceil(span / 2.1));
  for (let index = 0; index < shelfCount; index += 1) {
    const x = THREE.MathUtils.lerp(from, to, (index + 0.5) / shelfCount);
    const surface = sceneHeight / 2 - heightAt(x) * SCALE;
    const width = Math.min(span * SCALE / shelfCount * 0.7, 128);
    const shelf = new THREE.Mesh(
      makeBankReliefGeometry(width, 13 + hash(index + definition.seed) * 14, 28, definition.seed * 73 + index),
      index % 2 ? soilMaterial : deepSoilMaterial
    );
    shelf.name = 'terrain-final-eroded-horizontal-shelf';
    shelf.position.set(x * SCALE, surface - 105 - hash(index * 7 + definition.seed) * 170, 119);
    shelf.scale.y = 0.48;
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    parent.add(shelf);
  }

  parent.userData.terrainPalette = palette;
}

function addGrassFringe(parent, definition, sceneHeight, turfMaterial) {
  const from = definition.visualFrom ?? definition.from;
  const to = definition.visualTo ?? definition.to;
  const spacing = 0.22;
  let index = 0;
  for (let x = from + spacing * 0.35; x < to; x += spacing) {
    const surface = sceneHeight / 2 - heightAt(x) * SCALE;
    const height = 9 + hash(definition.seed * 13 + index) * 17;
    const width = 3 + hash(definition.seed * 19 + index) * 5;
    const lean = (hash(definition.seed * 23 + index) - 0.5) * 6;
    const z = 125 + hash(definition.seed * 29 + index) * 7;
    const vertices = [
      -width, 0, 0,
      width, 0, 0,
      lean, -height, 1.5,
      -width * 0.7, 0, -2,
      width * 0.7, 0, -2,
      lean * 0.7, -height * 0.82, 3
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex([0, 1, 2, 3, 5, 4]);
    geometry.computeVertexNormals();
    const tuft = new THREE.Mesh(geometry, turfMaterial);
    tuft.name = 'terrain-final-living-grass-fringe';
    tuft.position.set(x * SCALE, surface + 2 + Math.sin(x * 3.1) * 1.4, z);
    tuft.rotation.z = (hash(index + definition.seed * 31) - 0.5) * 0.28;
    tuft.castShadow = true;
    parent.add(tuft);
    index += 1;
  }
}

function makeCliffBreakup(parent, definition, sceneHeight, material, stoneMaterial) {
  const sides = [];
  if (definition.cliffLeft) sides.push(['left', definition.visualFrom ?? definition.from, 1]);
  if (definition.cliffRight) sides.push(['right', definition.visualTo ?? definition.to, -1]);
  for (const [side, x, direction] of sides) {
    const ground = sceneHeight / 2 - heightAt(x) * SCALE;
    for (let index = 0; index < 7; index += 1) {
      const width = 22 + hash(definition.seed + index * 5) * 28;
      const height = 24 + hash(definition.seed + index * 11) * 32;
      const depth = 18 + hash(definition.seed + index * 17) * 22;
      const rock = new THREE.Mesh(
        makeFracturedStoneGeometry(width, height, depth, definition.seed * 91 + index),
        index % 3 ? material : stoneMaterial
      );
      rock.name = `terrain-final-${side}-cliff-breakup`;
      rock.position.set(
        x * SCALE + direction * (7 + index * 8.5),
        ground - 18 - index * 27,
        113 + index % 3 * 4
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

function makePitMouths(root, sceneHeight, stoneMaterial, soilMaterial, deepSoilMaterial) {
  MEADOW_WAKE_PITS.forEach((pit, pitIndex) => {
    for (const [edgeIndex, x] of [pit.from, pit.to].entries()) {
      const ground = sceneHeight / 2 - heightAt(x) * SCALE;
      const direction = edgeIndex === 0 ? -1 : 1;
      const group = new THREE.Group();
      group.name = `${pit.id}_terrain-final-pit-mouth`;
      group.position.set(x * SCALE, ground, 111);
      root.add(group);
      for (let index = 0; index < 6; index += 1) {
        const width = 24 + hash(pitIndex * 11 + index) * 24;
        const height = 18 + hash(pitIndex * 17 + index) * 26;
        const rock = new THREE.Mesh(
          makeFracturedStoneGeometry(width, height, 18 + hash(index + pitIndex) * 18, pitIndex * 101 + index),
          index % 3 === 0 ? stoneMaterial : index % 2 ? soilMaterial : deepSoilMaterial
        );
        rock.position.set(direction * (5 + index * 9), -14 - index * 21, index % 2 * 6);
        rock.rotation.z = direction * (0.12 + index * 0.075);
        rock.castShadow = true;
        rock.receiveShadow = true;
        group.add(rock);
      }
    }
  });
}

function cloneTerrainMaterial(source, fallbackColor, { vertexColors = false, side = THREE.FrontSide } = {}) {
  const material = source?.clone?.() ?? new THREE.MeshStandardMaterial({ color: fallbackColor });
  material.color?.setHex?.(0xffffff);
  material.vertexColors = vertexColors;
  material.roughness = Math.max(0.94, material.roughness ?? 0.94);
  material.metalness = 0;
  material.side = side;
  material.needsUpdate = true;
  return material;
}

export function applyMeadowWakeTerrainFinalization(renderer) {
  const foreground = renderer?.foregroundArt;
  if (!foreground?.terrainVisualRoot || !Number.isFinite(renderer?.height)) return null;

  foreground.terrainVisualRoot.getObjectByName('MeadowWake_TerrainFinalization')?.removeFromParent();

  const root = new THREE.Group();
  root.name = 'MeadowWake_TerrainFinalization';
  root.userData = {
    terrainRepresentation: 'final-authored-landform-surface-pass',
    collisionBearing: false,
    scope: 'terrain-only',
    visualGate: 'reference-driven-terrain-finish-v2'
  };
  foreground.terrainVisualRoot.add(root);

  const turfMaterial = cloneTerrainMaterial(foreground.materials?.turf, 0x6f9948, { vertexColors: true, side: THREE.DoubleSide });
  const lipMaterial = cloneTerrainMaterial(foreground.materials?.soil, 0x74533e, { vertexColors: true, side: THREE.DoubleSide });
  const grassBladeMaterial = cloneTerrainMaterial(foreground.materials?.turf, 0x709a48, { side: THREE.DoubleSide });
  const soilMaterial = cloneTerrainMaterial(foreground.materials?.soil, 0x6f513d);
  const deepSoilMaterial = cloneTerrainMaterial(foreground.materials?.soil, 0x473429);
  deepSoilMaterial.color?.multiplyScalar?.(0.62);
  const stoneMaterial = cloneTerrainMaterial(foreground.materials?.stone, 0x777369);
  stoneMaterial.color?.multiplyScalar?.(0.82);

  for (const definition of MEADOW_WAKE_TERRAIN_MODULES) {
    const from = definition.visualFrom ?? definition.from;
    const to = definition.visualTo ?? definition.to;
    const midpoint = (from + to) / 2;
    if (isPit(midpoint)) continue;

    const module = new THREE.Group();
    module.name = `${definition.id}_terrain-final-surface`;
    module.userData = { roomId: definition.roomId, moduleId: definition.id, terrainOnly: true };
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

    addBankRelief(module, definition, renderer.height, soilMaterial, deepSoilMaterial, stoneMaterial);
    addGrassFringe(module, definition, renderer.height, grassBladeMaterial);
    makeCliffBreakup(module, definition, renderer.height, soilMaterial, stoneMaterial);
  }

  makePitMouths(root, renderer.height, stoneMaterial, soilMaterial, deepSoilMaterial);
  return root;
}
