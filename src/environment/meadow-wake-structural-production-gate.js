import * as THREE from '../../vendor/three/three.module.js';
import { MEADOW_WAKE_SCENERY_PROPS } from '../content/meadow-wake-scenery.js?v=visual-structure-gate-1';

const SCALE = 70;
const TAU = Math.PI * 2;

function rnd(seed) {
  const x = Math.sin(seed * 17.17 + 4.13) * 43758.5453;
  return x - Math.floor(x);
}

function mat(color, roughness = 0.92, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function tube(points, radii, sides = 12, seed = 1, flatten = 1) {
  const path = points.map(point => point.isVector3 ? point : new THREE.Vector3(...point));
  const positions = [];
  const indices = [];
  for (let i = 0; i < path.length; i += 1) {
    const prev = path[Math.max(0, i - 1)];
    const next = path[Math.min(path.length - 1, i + 1)];
    const tangent = next.clone().sub(prev).normalize();
    const ref = Math.abs(tangent.z) < 0.82 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, ref).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    for (let side = 0; side < sides; side += 1) {
      const angle = side / sides * TAU;
      const radius = radii[Math.min(i, radii.length - 1)] * (0.88 + rnd(seed + i * 37 + side * 19) * 0.24);
      const offset = normal.clone().multiplyScalar(Math.cos(angle) * radius)
        .add(binormal.clone().multiplyScalar(Math.sin(angle) * radius * flatten));
      const p = path[i].clone().add(offset);
      positions.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < path.length - 1; i += 1) {
    for (let side = 0; side < sides; side += 1) {
      const a = i * sides + side;
      const b = i * sides + (side + 1) % sides;
      const c = (i + 1) * sides + side;
      const d = (i + 1) * sides + (side + 1) % sides;
      indices.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

function stone(width, height, depth, seed = 1) {
  const levels = 5;
  const segments = 9;
  const positions = [];
  const indices = [];
  for (let level = 0; level < levels; level += 1) {
    const v = level / (levels - 1);
    const profile = 0.76 + Math.sin(v * Math.PI) * 0.3;
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = segment / segments * TAU;
      const wobble = 0.82 + rnd(seed + level * 31 + segment * 23) * 0.34;
      positions.push(
        Math.cos(angle) * width * 0.5 * profile * wobble,
        -height * 0.5 + v * height,
        Math.sin(angle) * depth * 0.5 * profile * wobble
      );
    }
  }
  for (let level = 0; level < levels - 1; level += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const a = level * segments + segment;
      const b = level * segments + (segment + 1) % segments;
      const c = (level + 1) * segments + segment;
      const d = (level + 1) * segments + (segment + 1) % segments;
      indices.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

function leafMass(radius, seed = 1) {
  const geometry = new THREE.IcosahedronGeometry(radius, 1);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const n = 0.82 + rnd(seed + i * 11) * 0.34;
    position.setXYZ(i, x * n * 1.2, y * n * 0.68, z * n * 0.9);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function cloth(width, height, depth, seed = 1, cols = 10, rows = 5) {
  const positions = [];
  const indices = [];
  const uvs = [];
  for (let row = 0; row <= rows; row += 1) {
    for (let col = 0; col <= cols; col += 1) {
      const u = col / cols;
      const v = row / rows;
      const x = -width / 2 + u * width;
      const z = -depth / 2 + v * depth;
      const ridge = 1 - Math.abs(u * 2 - 1);
      const y = ridge * height + Math.sin(u * Math.PI * 5 + v * 1.7 + seed) * 2.5 - Math.sin(v * Math.PI) * 4;
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const a = row * (cols + 1) + col;
      const b = a + cols + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

function add(parent, name, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addStoneWall(parent, width, height, z, seed, palette, brokenTop = true) {
  const columns = Math.max(3, Math.round(width / 35));
  const rows = Math.max(2, Math.round(height / 28));
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (brokenTop && row === rows - 1 && rnd(seed + column * 17) < 0.3) continue;
      const cellW = width / columns;
      const x = -width / 2 + (column + 0.5) * cellW + (row % 2) * cellW * 0.18;
      const y = 13 + row * (height / rows);
      const block = add(parent, 'production-ruin-handset-stone', stone(cellW * 0.92, height / rows * 0.86, 38, seed + row * 23 + column), (row + column) % 3 ? palette.stone : palette.stoneLight, [x, y, z], [0, 0, (rnd(seed + row * 31 + column) - 0.5) * 0.16]);
      block.scale.z = 0.9 + rnd(seed + row * 13 + column * 7) * 0.18;
    }
  }
  for (const x of [-width * 0.32, -width * 0.05, width * 0.23]) {
    const moss = add(parent, 'production-ruin-moss', leafMass(8, seed + x), palette.moss, [x, height + 3, z + 19]);
    moss.scale.set(1.7, 0.36, 0.7);
  }
}

function buildRuin(parent, type, seed, palette) {
  if (type === 'ruin-wall') {
    addStoneWall(parent, 124, 92, 0, seed, palette, true);
  } else if (type === 'ruin-tower') {
    addStoneWall(parent, 112, 176, 0, seed, palette, true);
    addStoneWall(parent, 52, 86, 25, seed + 50, palette, true);
    for (const side of [-1, 1]) add(parent, 'production-ruin-timber-brace', tube([[side * 44, 10, 18], [side * 38, 83, 20], [side * 30, 147, 16]], [7, 8, 5], 10, seed + 70 + side), palette.wood);
  } else if (type === 'broken-arch') {
    addStoneWall(parent, 48, 114, 0, seed, palette, true);
    const right = new THREE.Group(); right.position.x = 100; parent.add(right);
    addStoneWall(right, 48, 98, 0, seed + 20, palette, true);
    const centerX = 50;
    const radius = 52;
    for (let i = 0; i < 7; i += 1) {
      const angle = Math.PI * (0.12 + i / 8 * 0.76);
      const x = centerX + Math.cos(angle) * radius;
      const y = 96 + Math.sin(angle) * radius;
      const piece = add(parent, 'production-arch-wedge-stone', stone(28, 22, 34, seed + 90 + i), i % 2 ? palette.stone : palette.stoneLight, [x, y, 0], [0, 0, angle - Math.PI / 2]);
      piece.scale.set(1, 0.85, 1);
    }
  } else if (type === 'goal-gate') {
    for (const side of [-1, 1]) {
      const pillar = new THREE.Group(); pillar.position.x = side * 68; parent.add(pillar);
      addStoneWall(pillar, 52, 156, 0, seed + side * 15, palette, false);
    }
    for (let i = 0; i < 6; i += 1) {
      const x = -54 + i * 22;
      add(parent, 'production-goal-gate-lintel-stone', stone(28, 24, 40, seed + 160 + i), i % 2 ? palette.stoneLight : palette.stone, [x, 166 + Math.sin(i * 0.8) * 3, 0], [0, 0, (i - 2.5) * 0.025]);
    }
    const moss = add(parent, 'production-goal-gate-moss', leafMass(18, seed + 190), palette.moss, [0, 181, 19]);
    moss.scale.set(3.5, 0.4, 0.7);
  }
}

function buildFence(parent, seed, palette) {
  for (const [index, x] of [-62, 0, 62].entries()) {
    add(parent, 'production-fence-post', tube([[x, 0, 0], [x + (index - 1) * 2, 68, 0]], [6.5, 5.5], 10, seed + index), index % 2 ? palette.woodLight : palette.woodDark);
  }
  for (const [index, y] of [28, 50].entries()) {
    add(parent, 'production-fence-rail', tube([[-66, y, 0], [-10, y + (index ? -3 : 3), 1], [68, y + (index ? 2 : -2), 0]], [5.8, 5.3, 4.8], 10, seed + 20 + index), index ? palette.wood : palette.woodLight);
  }
  const vine = add(parent, 'production-fence-vine', tube([[-48, 17, 8], [-16, 34, 9], [15, 31, 8], [49, 45, 9]], [1.8, 1.5, 1.2, 0.8], 7, seed + 40), palette.vine);
  vine.castShadow = false;
}

function buildTimberFrame(parent, type, seed, palette) {
  const watch = type === 'camp-watchtower';
  const width = watch ? 130 : 150;
  const height = watch ? 200 : 166;
  for (const side of [-1, 1]) {
    add(parent, 'production-camp-heavy-upright', tube([[side * width * 0.42, 0, 0], [side * width * 0.4, height * 0.5, 1], [side * width * 0.36, height, -1]], [9, 8, 7], 12, seed + side), side > 0 ? palette.wood : palette.woodDark);
    add(parent, 'production-camp-knee-brace', tube([[side * width * 0.42, 35, 2], [side * width * 0.18, 83, 4]], [6, 4], 10, seed + 10 + side), palette.woodLight);
  }
  add(parent, 'production-camp-crossbeam', tube([[-width * 0.48, height * 0.83, 0], [0, height * 0.85, 2], [width * 0.48, height * 0.82, 0]], [7, 8, 6], 12, seed + 20), palette.wood);
  if (watch) {
    const roof = add(parent, 'production-watchtower-cloth', cloth(176, 46, 120, seed + 30), palette.canvas, [0, height + 8, -6]);
    roof.castShadow = false;
  } else {
    add(parent, 'production-hoist-top-beam', tube([[-83, height + 10, 0], [0, height + 14, 2], [96, height + 7, 0]], [8, 9, 7], 12, seed + 32), palette.woodDark);
    const rope = add(parent, 'production-hoist-rope', tube([[68, height + 5, 4], [68, height - 72, 4]], [1.9, 1.4], 7, seed + 35), palette.rope);
    rope.castShadow = false;
  }
}

function buildBridgeSignal(parent, seed, palette) {
  for (const side of [-1, 1]) {
    add(parent, 'production-bridge-signal-upright', tube([[side * 88, 0, 0], [side * 87, 96, 0], [side * 82, 186, -2]], [9, 8, 6], 12, seed + side), side > 0 ? palette.wood : palette.woodDark);
  }
  add(parent, 'production-bridge-signal-crossbeam', tube([[-101, 178, 0], [-20, 182, 2], [95, 176, 0]], [7, 8, 6], 12, seed + 20), palette.wood);
  for (const x of [-64, 62]) {
    add(parent, 'production-bridge-lantern-frame', stone(18, 25, 15, seed + x), palette.iron, [x, 145, 18]);
    add(parent, 'production-bridge-lantern-glow', leafMass(6, seed + x + 5), palette.glow, [x, 145, 28], [0, 0, 0], [0.75, 1.05, 0.55]);
  }
}

function buildBridgeAnchor(parent, seed, palette) {
  addStoneWall(parent, 92, 96, 0, seed, palette, true);
  for (const side of [-1, 1]) add(parent, 'production-bridge-anchor-timber', tube([[side * 32, 58, 18], [side * 40, 122, 20]], [7, 5], 10, seed + 40 + side), palette.woodDark);
}

export function applyMeadowWakeStructuralProductionGate(renderer) {
  if (!renderer?.world || renderer.world.userData.structuralProductionGateApplied) return;
  const heightAt = renderer.foregroundArt?.terrainHeightAt;
  if (typeof heightAt !== 'function') return;
  renderer.world.userData.structuralProductionGateApplied = true;

  const palette = {
    stone: mat(0x666a5d, 0.98),
    stoneLight: mat(0x8c8977, 0.95),
    moss: mat(0x587b39, 0.99),
    wood: mat(0x6e482b, 0.97),
    woodLight: mat(0x8a5c36, 0.94),
    woodDark: mat(0x3d2b20, 1),
    rope: mat(0x8a6a46, 1),
    vine: mat(0x386a39, 0.98),
    canvas: mat(0x4f703f, 0.96),
    iron: mat(0x333732, 0.6, 0.22),
    glow: new THREE.MeshStandardMaterial({ color: 0xffd17b, emissive: 0xff9d29, emissiveIntensity: 2.1, roughness: 0.45 })
  };

  const supported = new Set(['ruin-wall', 'ruin-tower', 'broken-arch', 'goal-gate', 'trail-fence', 'camp-scaffold', 'camp-watchtower', 'bridge-signal-frame', 'bridge-anchor']);
  for (const definition of MEADOW_WAKE_SCENERY_PROPS) {
    if (!supported.has(definition.type)) continue;
    if (definition.x < 24 && ['trail-fence'].includes(definition.type)) continue;
    const fallback = renderer.world.getObjectByName(`${definition.id}_${definition.type}_authored-scenery`);
    if (fallback) fallback.visible = false;

    const root = new THREE.Group();
    root.name = `${definition.id}_${definition.type}_production-structure`;
    root.position.set(definition.x * SCALE, renderer.height / 2 - heightAt(definition.x) * SCALE, definition.depth ?? -8);
    root.scale.setScalar(definition.scale ?? 1);
    if (definition.facing === -1) root.rotation.y = Math.PI;
    renderer.world.add(root);
    const seed = Math.round(definition.x * 23);

    if (['ruin-wall', 'ruin-tower', 'broken-arch', 'goal-gate'].includes(definition.type)) buildRuin(root, definition.type, seed, palette);
    else if (definition.type === 'trail-fence') buildFence(root, seed, palette);
    else if (definition.type === 'camp-scaffold' || definition.type === 'camp-watchtower') buildTimberFrame(root, definition.type, seed, palette);
    else if (definition.type === 'bridge-signal-frame') buildBridgeSignal(root, seed, palette);
    else if (definition.type === 'bridge-anchor') buildBridgeAnchor(root, seed, palette);
  }
}
