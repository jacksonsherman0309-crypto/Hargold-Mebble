import * as THREE from '../../vendor/three/three.module.js';
import { MEADOW_WAKE_SCENERY_PROPS } from '../content/meadow-wake-scenery.js?v=visual-production-gate-1';

const SCALE = 70;
const TAU = Math.PI * 2;

function noise(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function material(color, roughness = 0.9, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function organicTube(points, radii, sides = 14, seed = 1, flatten = 1) {
  const path = points.map(point => point.isVector3 ? point : new THREE.Vector3(...point));
  const positions = [];
  const indices = [];
  const uvs = [];
  for (let i = 0; i < path.length; i += 1) {
    const prev = path[Math.max(0, i - 1)];
    const next = path[Math.min(path.length - 1, i + 1)];
    const tangent = next.clone().sub(prev).normalize();
    const reference = Math.abs(tangent.z) < 0.82 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, reference).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    for (let side = 0; side < sides; side += 1) {
      const angle = side / sides * TAU;
      const wobble = 0.88 + noise(seed + i * 31 + side * 17) * 0.24;
      const radius = radii[Math.min(i, radii.length - 1)] * wobble;
      const offset = normal.clone().multiplyScalar(Math.cos(angle) * radius)
        .add(binormal.clone().multiplyScalar(Math.sin(angle) * radius * flatten));
      const p = path[i].clone().add(offset);
      positions.push(p.x, p.y, p.z);
      uvs.push(side / sides, i / Math.max(1, path.length - 1));
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
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function sculptedStone(width, height, depth, seed = 1, tiers = 5, segments = 10) {
  const positions = [];
  const indices = [];
  const uvs = [];
  for (let tier = 0; tier < tiers; tier += 1) {
    const v = tier / Math.max(1, tiers - 1);
    const bulge = 0.78 + Math.sin(v * Math.PI) * 0.28;
    for (let segment = 0; segment < segments; segment += 1) {
      const a = segment / segments * TAU;
      const irregular = 0.83 + noise(seed + tier * 43 + segment * 19) * 0.3;
      positions.push(
        Math.cos(a) * width * 0.5 * bulge * irregular,
        -height * 0.5 + height * v,
        Math.sin(a) * depth * 0.5 * bulge * irregular
      );
      uvs.push(segment / segments, v);
    }
  }
  for (let tier = 0; tier < tiers - 1; tier += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const a = tier * segments + segment;
      const b = tier * segments + (segment + 1) % segments;
      const c = (tier + 1) * segments + segment;
      const d = (tier + 1) * segments + (segment + 1) % segments;
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

function canopyLobe(radius, height, depth, seed = 1) {
  const rings = 8;
  const segments = 20;
  const positions = [];
  const indices = [];
  for (let ring = 0; ring <= rings; ring += 1) {
    const v = ring / rings;
    const polar = v * Math.PI;
    const radial = Math.sin(polar);
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = segment / segments * TAU;
      const lobe = 0.9 + Math.sin(angle * (6 + seed % 3) + seed) * 0.08;
      const irregular = 0.92 + noise(seed * 7 + ring * 29 + segment) * 0.16;
      positions.push(
        Math.cos(angle) * radius * radial * lobe * irregular,
        Math.cos(polar) * height,
        Math.sin(angle) * depth * radial * lobe * irregular
      );
    }
  }
  for (let ring = 0; ring < rings; ring += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const a = ring * segments + segment;
      const b = ring * segments + (segment + 1) % segments;
      const c = (ring + 1) * segments + segment;
      const d = (ring + 1) * segments + (segment + 1) % segments;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function roundedPanel(width, height, depth, radius = 6) {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw * 0.28, hh * 0.28);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: Math.min(3.5, r * 0.45),
    bevelThickness: 2.6,
    curveSegments: 5,
    steps: 1
  });
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

function addMesh(parent, name, geometry, mat, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function clearGroup(group) {
  if (!group) return;
  while (group.children.length) group.remove(group.children[group.children.length - 1]);
}

function addRoots(parent, origin, radius, bark, seed) {
  const paths = [
    [[0, 0, 0], [-radius * 0.22, -11, 8], [-radius * 0.55, -20, 17], [-radius * 0.92, -26, 25]],
    [[0, 0, 0], [radius * 0.18, -10, 4], [radius * 0.5, -19, 16], [radius * 0.9, -25, 28]],
    [[0, 0, 0], [radius * 0.04, -13, -7], [-radius * 0.08, -27, -20], [-radius * 0.25, -35, -36]],
    [[0, 0, 0], [-radius * 0.04, -12, 7], [radius * 0.12, -25, 28], [radius * 0.34, -31, 45]],
    [[0, 0, 0], [-radius * 0.1, -9, 3], [-radius * 0.3, -22, 34], [-radius * 0.52, -28, 52]]
  ];
  paths.forEach((path, index) => {
    addMesh(parent, 'sculpted-buttress-root', organicTube(
      path.map(([x, y, z]) => [origin[0] + x, origin[1] + y, origin[2] + z]),
      [11, 8, 5, 2.2], 11, seed + index * 13, 0.72
    ), index % 2 ? bark.clone() : bark);
  });
}

function buildTree(parent, { scale = 1, seed = 1, pine = false, flowering = false } = {}, palette) {
  const { bark, barkLight, leaves, leavesDark, leavesLight, blossom } = palette;
  const trunk = organicTube([
    [0, 0, 0], [-3, 65, 1], [6, 132, -2], [-2, 198, 1], [3, 245, 0]
  ], [30, 27, 22, 16, 10], 18, seed, 0.78);
  addMesh(parent, 'production-sculpted-tree-trunk', trunk, bark, [0, 0, 0], [0, 0, 0], [scale, scale, scale]);
  addRoots(parent, [0, 5, 0], 86 * scale, bark, seed + 10);

  const branches = pine ? [
    [[0, 118, 0], [-52, 156, 2], [-92, 176, 3]],
    [[2, 147, -1], [56, 175, -3], [101, 198, 2]],
    [[0, 178, 0], [-37, 212, -2], [-65, 233, 2]],
    [[2, 197, 0], [35, 224, 2], [68, 246, -2]]
  ] : [
    [[0, 132, 0], [-58, 172, 1], [-108, 194, 5]],
    [[4, 153, 0], [62, 188, -4], [116, 211, 4]],
    [[0, 184, -2], [-28, 221, -4], [-56, 248, 3]],
    [[2, 191, 1], [44, 224, 1], [83, 250, -3]]
  ];
  branches.forEach((points, index) => addMesh(parent, 'production-sculpted-tree-branch', organicTube(points, [14, 9, 3.5], 12, seed + 30 + index, 0.78), index % 2 ? barkLight : bark, [0, 0, 0], [0, 0, 0], [scale, scale, scale]));

  const clusters = pine ? [
    [0, 252, -8, 0.92], [-56, 211, 0, 0.7], [58, 218, -3, 0.72], [-28, 177, 2, 0.54], [31, 184, 1, 0.58]
  ] : [
    [0, 255, -3, 1.0], [-70, 220, 4, 0.82], [76, 226, -5, 0.86], [-26, 280, -7, 0.72], [43, 272, 4, 0.7]
  ];
  clusters.forEach(([x, y, z, s], index) => {
    const mat = index % 3 === 0 ? leavesLight : index % 2 ? leaves : leavesDark;
    addMesh(parent, 'production-layered-canopy-lobe', canopyLobe(42, 31, 32, seed + 60 + index), mat, [x * scale, y * scale, z * scale], [0, index * 0.21, 0], [s * scale, s * scale, s * scale]);
    if (flowering && index % 2 === 0) {
      for (let b = 0; b < 6; b += 1) {
        addMesh(parent, 'production-flowering-cluster', new THREE.SphereGeometry(3.2 + (b % 2), 9, 7), blossom, [(x + (b - 2.5) * 9) * scale, (y + 12 + (b % 3) * 7) * scale, (z + 26) * scale]);
      }
    }
  });
}

function suppressFallbackOpening(renderer) {
  const prefixes = [
    'opening-lodge_', 'opening-wayfinder_', 'opening-lantern_', 'opening-crates_', 'opening-woodpile_',
    'opening-flower-bank_', 'opening-trail-fence_', 'opening-oak_', 'elder-root-arch_', 'log-hollow-root-fan_',
    'log-hollow-ferns_', 'log-hollow-fence_', 'log-hollow-mushrooms_', 'log-hollow-birch_'
  ];
  renderer.world.traverse(object => {
    if (prefixes.some(prefix => object.name.startsWith(prefix))) object.visible = false;
  });
}

function replaceNaturalScenery(renderer, palette) {
  const naturalTypes = new Set(['canopy-tree', 'cliff-pine', 'giant-root-stump', 'mushroom-stump']);
  const heightAt = renderer.foregroundArt?.terrainHeightAt;
  if (typeof heightAt !== 'function') return;

  for (const definition of MEADOW_WAKE_SCENERY_PROPS) {
    if (!naturalTypes.has(definition.type) || definition.x < 24) continue;
    const fallback = renderer.world.getObjectByName(`${definition.id}_${definition.type}_authored-scenery`);
    if (fallback) fallback.visible = false;

    const root = new THREE.Group();
    root.name = `${definition.id}_production-natural-landmark`;
    root.position.set(definition.x * SCALE, renderer.height / 2 - heightAt(definition.x) * SCALE, definition.depth ?? -8);
    root.scale.setScalar(definition.scale ?? 1);
    renderer.world.add(root);

    if (definition.type === 'canopy-tree' || definition.type === 'cliff-pine') {
      buildTree(root, {
        scale: definition.type === 'cliff-pine' ? 0.88 : 1,
        seed: Math.round(definition.x * 17),
        pine: definition.type === 'cliff-pine',
        flowering: definition.id === 'panorama-vista-oak'
      }, palette);
    } else if (definition.type === 'giant-root-stump') {
      addMesh(root, 'production-hollow-stump-body', organicTube([
        [0, 0, 0], [-5, 52, 0], [3, 104, -2], [-2, 132, 0]
      ], [54, 50, 44, 40], 20, 300 + definition.x, 0.78), palette.bark);
      addRoots(root, [0, 6, 0], 118, palette.bark, 340 + definition.x);
      addMesh(root, 'production-hollow-stump-crown', sculptedStone(86, 7, 72, 355 + definition.x, 3, 14), palette.cutWood, [0, 132, 0]);
      addMesh(root, 'production-stump-hollow', canopyLobe(22, 30, 4, 362 + definition.x), palette.hollow, [18, 74, 43], [0, 0, 0], [1, 1, 0.25]);
    } else if (definition.type === 'mushroom-stump') {
      addMesh(root, 'production-mushroom-stump', organicTube([[0, 0, 0], [-2, 28, 0], [1, 56, 0]], [28, 26, 23], 16, 400 + definition.x, 0.78), palette.bark);
      addRoots(root, [0, 4, 0], 54, palette.bark, 420 + definition.x);
      addMesh(root, 'production-mushroom-stump-crown', sculptedStone(49, 5, 44, 440 + definition.x, 3, 12), palette.cutWood, [0, 57, 0]);
      for (const [index, x] of [-26, -11, 19, 34].entries()) {
        addMesh(root, 'production-mushroom-cap', canopyLobe(7 + index % 2 * 2, 4, 6, 450 + index), index % 2 ? palette.mushroomA : palette.mushroomB, [x, 15 + index * 4, 18], [0, 0, 0], [1, 0.7, 1]);
      }
    }
  }
}

function replaceNaturalPlatforms(renderer, palette) {
  for (const slot of renderer.platformSlots) {
    if (!slot?.root || ['opening-stump-step', 'fallen-log-launch'].includes(slot.id)) continue;
    const width = slot.width * SCALE;
    const height = slot.height * SCALE;

    if (slot.visual === 'stump') {
      clearGroup(slot.root);
      const h = Math.max(38, height + 26);
      addMesh(slot.root, 'production-platform-stump', organicTube([[0, -h * 0.52, 0], [-2, -5, 0], [2, h * 0.48, 0]], [width * 0.46, width * 0.42, width * 0.36], 18, 500 + slot.x, 0.8), palette.bark);
      addRoots(slot.root, [0, -h * 0.45, 0], width * 0.7, palette.bark, 510 + slot.x);
      addMesh(slot.root, 'production-platform-stump-crown', sculptedStone(width * 0.72, 5, width * 0.62, 520 + slot.x, 3, 14), palette.cutWood, [0, h * 0.48, 0]);
      addMesh(slot.root, 'production-platform-stump-moss', canopyLobe(width * 0.18, 5, width * 0.16, 530 + slot.x), palette.moss, [-width * 0.12, h * 0.32, 14], [0, 0, 0], [1.2, 0.45, 0.8]);
    } else if (slot.visual === 'fallen-log' || slot.visual === 'seesaw') {
      clearGroup(slot.root);
      const points = [
        [-width * 0.5, 0, 0], [-width * 0.22, 3, 2], [0, -2, -2], [width * 0.23, 4, 1], [width * 0.5, 0, 0]
      ];
      addMesh(slot.root, 'production-platform-log', organicTube(points, [16, 19, 20, 18, 14], 18, 550 + slot.x, 0.9), palette.bark);
      for (const x of [-width * 0.28, width * 0.03, width * 0.32]) {
        addMesh(slot.root, 'production-platform-log-moss', canopyLobe(13, 4, 10, 560 + x), palette.moss, [x, 15, 9], [0, 0, 0], [1.55, 0.42, 0.75]);
      }
      if (slot.visual === 'seesaw') addMesh(slot.root, 'production-seesaw-pivot', sculptedStone(52, 38, 62, 580 + slot.x), palette.stone, [0, -31, 0]);
    } else if (slot.visual === 'timber-stack') {
      clearGroup(slot.root);
      const rows = 3;
      for (let row = 0; row < rows; row += 1) {
        const count = row === 1 ? 2 : 3;
        for (let i = 0; i < count; i += 1) {
          const x = (i - (count - 1) / 2) * width * 0.32 + (row % 2) * 7;
          const y = -height * 0.35 + row * 21;
          const length = width * (0.31 + noise(slot.x * 11 + row * 5 + i) * 0.06);
          addMesh(slot.root, 'production-handhewn-timber-stack', organicTube([[-length * 0.5, 0, 0], [0, 1.5, 1], [length * 0.5, -1, 0]], [9, 10, 8], 12, 610 + row * 10 + i, 0.86), row % 2 ? palette.barkLight : palette.bark, [x, y, 0]);
        }
      }
      addMesh(slot.root, 'production-timber-stack-crown', roundedPanel(width * 0.9, 8, 102, 4), palette.cutWood, [0, height * 0.5 + 2, 0]);
    }
  }
}

function rebuildBlocks(renderer, palette) {
  renderer.blockSlots.forEach((slot, index) => {
    if (!slot?.active || !slot?.used) return;
    clearGroup(slot.active);
    clearGroup(slot.used);
    const type = slot.gameplayType;
    const size = 52;
    const depth = type === 'hargold-only' ? 64 : 58;
    const front = depth * 0.5 + 5;

    if (type === 'standard-breakable') {
      addMesh(slot.active, 'production-breakable-core', sculptedStone(size, size, depth, 700 + index, 5, 10), palette.stoneDark);
      const cells = [
        [-14, 14, 21, 16, -0.07], [9, 15, 23, 15, 0.05], [18, -2, 15, 20, -0.08],
        [-15, -6, 21, 18, 0.08], [3, -17, 25, 14, -0.04]
      ];
      cells.forEach(([x, y, w, h, angle], piece) => {
        const slab = addMesh(slot.active, 'production-handset-breakable-stone', roundedPanel(w, h, 8, 3), piece % 2 ? palette.stone : palette.stoneLight, [x, y, front], [0, 0, angle]);
        slab.userData.breakableFacing = true;
      });
      for (const x of [-18, 8, 21]) addMesh(slot.active, 'production-block-moss', canopyLobe(5, 2.5, 4, 770 + x + index), palette.moss, [x, 25, front + 6], [0, 0, 0], [1.5, 0.65, 0.8]);
    } else if (type === 'hargold-only') {
      addMesh(slot.active, 'production-reinforced-stone-body', sculptedStone(size, size, depth, 800 + index, 5, 10), palette.stoneDark);
      for (const angle of [-0.74, 0.74]) addMesh(slot.active, 'production-reinforced-timber-brace', roundedPanel(58, 9, 10, 3), palette.barkLight, [0, 0, front], [0, 0, angle]);
      const medallion = addMesh(slot.active, 'production-strength-medallion', new THREE.CylinderGeometry(13, 13, 5, 28), palette.brass, [0, 0, front + 10]);
      medallion.rotation.x = Math.PI / 2;
    } else {
      const coin = type === 'coin';
      const bodyMat = coin ? palette.warmStone : palette.greenStone;
      addMesh(slot.active, 'production-reward-block-body', roundedPanel(size, size, depth, 8), bodyMat);
      addMesh(slot.active, 'production-reward-inset', roundedPanel(36, 36, 9, 6), coin ? palette.coinGlow : palette.powerGlow, [0, 0, front]);
      for (const [x, y] of [[-21, -21], [21, -21], [-21, 21], [21, 21]]) {
        addMesh(slot.active, 'production-forged-corner', roundedPanel(12, 12, 10, 3), palette.brass, [x, y, front + 2]);
        addMesh(slot.active, 'production-forged-rivet', new THREE.SphereGeometry(3.1, 12, 8), palette.gold, [x, y, front + 8]);
      }
      if (coin) {
        const medallion = addMesh(slot.active, 'production-coin-medallion', new THREE.CylinderGeometry(13, 13, 5, 30), palette.gold, [0, 0, front + 11]);
        medallion.rotation.x = Math.PI / 2;
        addMesh(slot.active, 'production-coin-ring', new THREE.TorusGeometry(8.5, 1.5, 7, 28), palette.barkDark, [0, 0, front + 14]);
      } else {
        for (const [x, rot] of [[-5, -0.55], [5, 0.55]]) {
          const leaf = addMesh(slot.active, 'production-power-leaf', canopyLobe(6.5, 9, 2.5, 900 + index + x), palette.leavesLight, [x, 0, front + 13], [0, 0, rot], [0.62, 1, 0.28]);
          leaf.castShadow = false;
        }
      }
    }
    addMesh(slot.used, 'production-spent-block', roundedPanel(size, size, depth, 7), palette.spentStone);
  });
}

export function applyMeadowWakeProductionGate(renderer) {
  if (!renderer?.world || renderer.world.userData.productionGateApplied) return;
  renderer.world.userData.productionGateApplied = true;

  const palette = {
    bark: material(0x54341f, 0.98),
    barkLight: material(0x765033, 0.95),
    barkDark: material(0x35251b, 1),
    cutWood: material(0xb98555, 0.9),
    leaves: material(0x3e7238, 0.96),
    leavesDark: material(0x244b2b, 0.98),
    leavesLight: material(0x6a9846, 0.93),
    moss: material(0x5c7f36, 0.98),
    stone: material(0x6b6e60, 0.98),
    stoneDark: material(0x4e5148, 0.99),
    stoneLight: material(0x918d78, 0.96),
    warmStone: material(0x9b6a36, 0.86),
    greenStone: material(0x456746, 0.9),
    spentStone: material(0x5b5c54, 0.98),
    brass: material(0xb98538, 0.42, 0.34),
    gold: material(0xeeb43b, 0.28, 0.5),
    coinGlow: new THREE.MeshStandardMaterial({ color: 0xf4c35b, emissive: 0xffa51f, emissiveIntensity: 1.65, roughness: 0.42 }),
    powerGlow: new THREE.MeshStandardMaterial({ color: 0xc6dc83, emissive: 0x74a83c, emissiveIntensity: 1.05, roughness: 0.56 }),
    hollow: material(0x17140f, 1),
    mushroomA: material(0xd18a46, 0.92),
    mushroomB: material(0xa75138, 0.94),
    blossom: material(0xf0c8df, 0.9)
  };

  suppressFallbackOpening(renderer);
  replaceNaturalScenery(renderer, palette);
  replaceNaturalPlatforms(renderer, palette);
  rebuildBlocks(renderer, palette);

  const root = new THREE.Group();
  root.name = 'MeadowWake_ProductionVisualGateMarker';
  root.userData = {
    collisionBearing: false,
    visualGate: 'sculpted-natural-assets-and-blocks',
    replacesRuntimePrimitives: true
  };
  renderer.world.add(root);
}
