import * as THREE from '../../vendor/three/three.module.js';
import { MEADOW_WAKE_TERRAIN_POINTS } from '../content/meadow-wake-course.js?v=visual-rebuild-opening-1';

const SCALE = 70;

function terrainHeightAt(x) {
  for (let index = 0; index < MEADOW_WAKE_TERRAIN_POINTS.length - 1; index += 1) {
    const [x0, y0] = MEADOW_WAKE_TERRAIN_POINTS[index];
    const [x1, y1] = MEADOW_WAKE_TERRAIN_POINTS[index + 1];
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / Math.max(0.0001, x1 - x0);
      return THREE.MathUtils.lerp(y0, y1, t);
    }
  }
  return MEADOW_WAKE_TERRAIN_POINTS.at(-1)[1];
}

function mat(color, roughness = 0.9, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function organicTubeGeometry(points, radii, sides = 12, seed = 1) {
  const positions = [];
  const indices = [];
  const uvs = [];
  const p = points.map(point => new THREE.Vector3(...point));
  for (let i = 0; i < p.length; i += 1) {
    const prev = p[Math.max(0, i - 1)];
    const next = p[Math.min(p.length - 1, i + 1)];
    const tangent = next.clone().sub(prev).normalize();
    const ref = Math.abs(tangent.z) < 0.86 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, ref).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    for (let side = 0; side < sides; side += 1) {
      const angle = side / sides * Math.PI * 2;
      const wobble = 1 + Math.sin(seed * 1.7 + i * 2.31 + side * 1.93) * 0.08;
      const radius = radii[Math.min(i, radii.length - 1)] * wobble;
      const offset = normal.clone().multiplyScalar(Math.cos(angle) * radius)
        .add(binormal.clone().multiplyScalar(Math.sin(angle) * radius));
      const v = p[i].clone().add(offset);
      positions.push(v.x, v.y, v.z);
      uvs.push(side / sides, i / Math.max(1, p.length - 1));
    }
  }
  for (let i = 0; i < p.length - 1; i += 1) {
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

function deformedRockGeometry(radius = 20, seed = 1) {
  const geometry = new THREE.IcosahedronGeometry(radius, 1);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const scale = 0.84 + 0.22 * Math.sin(seed * 4.11 + x * 0.07 + y * 0.11 + z * 0.05);
    position.setXYZ(i, x * scale, y * (0.86 + scale * 0.12), z * scale);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function leafCloudGeometry(radius = 28, seed = 1) {
  const geometry = new THREE.IcosahedronGeometry(radius, 2);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const n = 1 + Math.sin(seed * 3.77 + x * 0.08 + y * 0.05 + z * 0.09) * 0.15;
    position.setXYZ(i, x * n * 1.08, y * n * 0.9, z * n * 0.92);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function panelGeometry(width, height, depth, bevel = 5) {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(bevel, hw * 0.22, hh * 0.22);
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
    bevelSize: Math.min(2.8, r * 0.45),
    bevelThickness: 2.2,
    curveSegments: 4
  });
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

function addMesh(parent, name, geometry, material, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function clearGroup(group) {
  while (group.children.length) group.remove(group.children[group.children.length - 1]);
}

export class MeadowWakeOpeningProductionArt {
  constructor({ world, height, platformSlots, blockSlots }) {
    this.world = world;
    this.height = height;
    this.platformSlots = platformSlots;
    this.blockSlots = blockSlots;
    this.root = new THREE.Group();
    this.root.name = 'MeadowWake_OpeningProductionArt';
    this.world.add(this.root);

    this.bark = mat(0x5a351f, 0.96);
    this.barkLight = mat(0x7b4c29, 0.92);
    this.cutWood = mat(0xc48b4e, 0.82);
    this.deepLeaf = mat(0x254b25, 0.96);
    this.leaf = mat(0x3f7835, 0.94);
    this.leafLight = mat(0x669743, 0.92);
    this.moss = mat(0x4e7f32, 0.98);
    this.stone = mat(0x665e4f, 0.95);
    this.stoneLight = mat(0x918775, 0.92);
    this.timber = mat(0x754522, 0.9);
    this.darkTimber = mat(0x3e291d, 0.96);
    this.brass = mat(0xd39b37, 0.38, 0.42);
    this.gold = mat(0xf1b934, 0.3, 0.52);
    this.creamStone = mat(0xb8b09c, 0.9);
    this.glow = new THREE.MeshStandardMaterial({
      color: 0xffd96a,
      emissive: 0xffb62e,
      emissiveIntensity: 1.25,
      roughness: 0.45,
      metalness: 0
    });
  }

  groundY(x) {
    return this.height / 2 - terrainHeightAt(x) * SCALE;
  }

  build() {
    this.upgradeOpeningPlatforms();
    this.upgradeOpeningBlocks();
    this.buildOpeningCamp();
    this.buildElderTree();
    this.buildOpeningRocksAndPlants();
  }

  upgradeOpeningPlatforms() {
    const stump = this.platformSlots.find(slot => slot.id === 'opening-stump-step');
    if (stump?.root) {
      clearGroup(stump.root);
      const trunk = addMesh(stump.root, 'production-stump-body', organicTubeGeometry([
        [0, -26, 0], [-3, -8, 1], [2, 9, -1], [0, 22, 0]
      ], [34, 32, 29, 27], 16, 11), this.bark);
      trunk.rotation.z = 0.025;
      addMesh(stump.root, 'production-stump-crown', new THREE.CylinderGeometry(27, 28, 5, 36), this.cutWood, [0, 22, 0]);
      for (const [index, angle] of [-1.1, -0.55, 0.15, 0.65, 1.1].entries()) {
        const root = addMesh(stump.root, 'production-stump-root', organicTubeGeometry([
          [0, -18, 0], [Math.cos(angle) * 24, -29, Math.sin(angle) * 8], [Math.cos(angle) * 49, -35, Math.sin(angle) * 11]
        ], [10, 7, 2.5], 10, 20 + index), index % 2 ? this.barkLight : this.bark);
        root.position.z = 2;
      }
      for (const radius of [17, 10]) {
        const ring = addMesh(stump.root, 'production-growth-ring', new THREE.TorusGeometry(radius, 1.3, 7, 30), this.darkTimber, [0, 25, 0]);
        ring.rotation.x = Math.PI / 2;
      }
      for (const [x, z, s] of [[-22, 8, 0.55], [19, 10, 0.46], [4, 20, 0.38]]) {
        const tuft = addMesh(stump.root, 'production-stump-moss', leafCloudGeometry(9, s * 13), this.moss, [x, 12, z]);
        tuft.scale.set(1.4, 0.45, 0.55);
      }
    }

    const log = this.platformSlots.find(slot => slot.id === 'fallen-log-launch');
    if (log?.root) {
      clearGroup(log.root);
      const body = addMesh(log.root, 'production-fallen-log', organicTubeGeometry([
        [-104, 0, 0], [-66, 5, 1], [-22, 0, -2], [25, 4, 1], [66, -2, -1], [104, 1, 0]
      ], [18, 20, 19, 21, 18, 14], 16, 31), this.bark);
      body.rotation.z = 0.015;
      for (let i = 0; i < 7; i += 1) {
        const ridge = addMesh(log.root, 'production-log-bark-ridge', organicTubeGeometry([
          [-88 + i * 26, 14 + (i % 2) * 2, 12], [-62 + i * 26, 15, 12]
        ], [2.1, 1.4], 7, 50 + i), i % 2 ? this.barkLight : this.darkTimber);
        ridge.rotation.z = (i % 2 ? 0.04 : -0.03);
      }
      for (const [x, scale, seed] of [[-65, 0.9, 2], [-10, 1.05, 4], [55, 0.82, 6]]) {
        const moss = addMesh(log.root, 'production-log-moss', leafCloudGeometry(14, seed), this.moss, [x, 15, 4]);
        moss.scale.set(scale * 1.7, 0.35, 0.72);
      }
      for (const [x, y, s] of [[-86, -25, 1], [82, -23, 2]]) {
        const rock = addMesh(log.root, 'production-log-footing-rock', deformedRockGeometry(25, s), this.stone, [x, y, -8]);
        rock.scale.set(1.25, 0.68, 1.05);
      }
    }
  }

  upgradeOpeningBlocks() {
    for (const slot of this.blockSlots) {
      if (!slot?.root || slot.root.position.x > 10.3 * SCALE) continue;
      clearGroup(slot.active);
      clearGroup(slot.used);
      const width = 52;
      const height = 52;
      const depth = 52;
      const front = depth / 2 + 4;

      if (slot.gameplayType === 'standard-breakable') {
        addMesh(slot.active, 'production-breakable-core', panelGeometry(width, height, depth, 6), this.stone);
        const stones = [
          [-15, 14, 20, 16, -0.06], [7, 15, 21, 15, 0.06], [18, -2, 14, 20, -0.08],
          [-15, -5, 20, 18, 0.08], [2, -16, 23, 14, -0.04]
        ];
        stones.forEach(([x, y, w, h, r], i) => {
          const piece = addMesh(slot.active, 'production-breakable-facing-stone', panelGeometry(w, h, 7, 3), i % 2 ? this.stoneLight : this.creamStone, [x, y, front]);
          piece.rotation.z = r;
        });
        for (const [x, y] of [[-18, 24], [12, 25], [23, -22]]) {
          const moss = addMesh(slot.active, 'production-block-moss', leafCloudGeometry(4.8, x + y), this.moss, [x, y, front + 6]);
          moss.scale.set(1.5, 0.45, 0.6);
        }
      } else {
        addMesh(slot.active, 'production-reward-stone-shell', panelGeometry(width, height, depth, 7), this.creamStone);
        addMesh(slot.active, 'production-reward-inset', panelGeometry(34, 34, 8, 5), this.glow, [0, 0, front]);
        for (const [x, y] of [[-21, -21], [21, -21], [-21, 21], [21, 21]]) {
          addMesh(slot.active, 'production-reward-corner', panelGeometry(12, 12, 10, 3), this.brass, [x, y, front + 2]);
          addMesh(slot.active, 'production-reward-rivet', new THREE.SphereGeometry(3.1, 12, 8), this.gold, [x, y, front + 8]);
        }
        if (slot.gameplayType === 'coin') {
          const medal = addMesh(slot.active, 'production-coin-medallion', new THREE.CylinderGeometry(14, 14, 5, 36), this.gold, [0, 0, front + 10]);
          medal.rotation.x = Math.PI / 2;
          const ring = addMesh(slot.active, 'production-coin-ring', new THREE.TorusGeometry(9, 1.7, 8, 32), this.darkTimber, [0, 0, front + 13]);
          ring.rotation.x = 0;
          addMesh(slot.active, 'production-coin-slot', panelGeometry(3, 15, 2, 1), this.darkTimber, [0, 0, front + 14]);
        }
      }
      addMesh(slot.used, 'production-used-block', panelGeometry(width, height, depth, 6), mat(0x5e5b52, 0.96));
    }
  }

  buildOpeningCamp() {
    const group = new THREE.Group();
    group.name = 'ProductionOpeningCamp';
    group.position.set(2.5 * SCALE, this.groundY(2.5) - 6, -68);
    this.root.add(group);

    const posts = [
      [[-135, 2, 0], [-132, -70, 0], [-124, -150, 0]],
      [[105, 3, 0], [106, -72, 1], [112, -145, 0]],
      [[-72, -2, -25], [-70, -82, -25], [-66, -144, -25]],
      [[52, -2, -25], [56, -82, -25], [62, -142, -25]]
    ];
    posts.forEach((points, index) => addMesh(group, 'production-camp-post', organicTubeGeometry(points, [10, 11, 13], 11, 70 + index), index % 2 ? this.barkLight : this.darkTimber));

    for (const [y, z, seed] of [[-118, 3, 81], [-68, -18, 82]]) {
      addMesh(group, 'production-camp-crossbeam', organicTubeGeometry([[-145, y, z], [-30, y + 2, z], [118, y - 2, z]], [9, 10, 8], 10, seed), this.timber);
    }

    const canopy = new THREE.BufferGeometry();
    const positions = [];
    const indices = [];
    const uvs = [];
    const cols = 12;
    const rows = 6;
    for (let row = 0; row <= rows; row += 1) {
      for (let col = 0; col <= cols; col += 1) {
        const u = col / cols;
        const v = row / rows;
        const x = -155 + u * 285;
        const z = -35 + v * 88;
        const ridge = 1 - Math.abs(u * 2 - 1);
        const y = -142 - ridge * 54 + Math.sin(u * Math.PI * 5 + v * 1.5) * 4 + Math.sin(v * Math.PI) * 7;
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
    canopy.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    canopy.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    canopy.setIndex(indices);
    canopy.computeVertexNormals();
    addMesh(group, 'production-camp-draped-canopy', canopy, mat(0x3f6738, 0.98));

    for (const [x, y, s] of [[-118, -14, 1], [-82, -5, 2], [88, -8, 3], [125, -22, 4]]) {
      const rock = addMesh(group, 'production-camp-foundation-stone', deformedRockGeometry(22, s), s % 2 ? this.stoneLight : this.stone, [x, y, 18]);
      rock.scale.set(1.25, 0.72, 1.05);
    }
  }

  buildElderTree() {
    const group = new THREE.Group();
    group.name = 'ProductionElderTreeAndRootArch';
    group.position.set(13.7 * SCALE, this.groundY(13.7), -86);
    this.root.add(group);

    addMesh(group, 'production-elder-trunk', organicTubeGeometry([
      [-80, 15, 0], [-78, -70, 2], [-70, -145, -2], [-55, -225, 4], [-34, -300, -6]
    ], [42, 39, 34, 27, 19], 18, 101), this.bark);

    addMesh(group, 'production-elder-overhead-limb', organicTubeGeometry([
      [-62, -196, 0], [-5, -222, 2], [58, -215, -4], [122, -188, 0], [176, -155, 2]
    ], [24, 22, 19, 14, 7], 15, 102), this.barkLight);

    for (const [index, points] of [
      [[-60, 8, 0], [-34, -5, 3], [-8, -2, 0]],
      [[-72, 4, 0], [-98, -2, 3], [-132, 5, 0]],
      [[-52, 2, -4], [-26, 8, -6], [18, 12, -4]],
      [[-86, 2, -5], [-112, 10, -8], [-154, 18, -5]]
    ].entries()) {
      addMesh(group, 'production-elder-root', organicTubeGeometry(points, [18, 11, 3.5], 12, 110 + index), index % 2 ? this.barkLight : this.bark);
    }

    const canopies = [
      [-90, -325, -20, 1.4, 201], [-35, -350, -12, 1.55, 202], [40, -326, -18, 1.45, 203],
      [108, -280, -22, 1.3, 204], [160, -230, -18, 1.05, 205], [-150, -278, -18, 1.1, 206]
    ];
    canopies.forEach(([x, y, z, scale, seed], index) => {
      const cloud = addMesh(group, 'production-elder-leaf-mass', leafCloudGeometry(36, seed), index % 3 === 0 ? this.leafLight : index % 2 ? this.leaf : this.deepLeaf, [x, y, z]);
      cloud.scale.set(scale * 1.25, scale * 0.85, scale);
    });
  }

  buildOpeningRocksAndPlants() {
    const plantSites = [0.8, 1.35, 3.7, 4.4, 8.6, 10.8, 12.6, 14.2, 16.3, 18.8, 20.1];
    plantSites.forEach((x, index) => {
      const root = new THREE.Group();
      root.position.set(x * SCALE, this.groundY(x) + 4, index % 2 ? 48 : 58);
      root.name = 'ProductionOpeningGroundDressing';
      this.root.add(root);
      const leafCount = 4 + index % 3;
      for (let i = 0; i < leafCount; i += 1) {
        const angle = -1.1 + i / Math.max(1, leafCount - 1) * 2.2;
        const leaf = addMesh(root, 'production-ground-leaf', leafCloudGeometry(7 + (i % 2) * 2, 300 + index * 7 + i), i % 2 ? this.leaf : this.leafLight, [Math.cos(angle) * 8, -8 - i * 1.5, Math.sin(angle) * 5]);
        leaf.scale.set(0.45, 1.6, 0.35);
        leaf.rotation.z = angle * 0.35;
      }
      if (index % 2 === 0) {
        const rock = addMesh(root, 'production-ground-rock', deformedRockGeometry(11 + index % 3 * 2, 400 + index), index % 4 ? this.stone : this.stoneLight, [14, 2, -5]);
        rock.scale.set(1.35, 0.68, 1.05);
      }
    });
  }
}
