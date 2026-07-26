import * as THREE from '../../vendor/three/three.module.js';
import {
  MEADOW_WAKE_SCENERY_BEATS,
  MEADOW_WAKE_SCENERY_PROPS
} from '../content/meadow-wake-scenery.js';

const SCALE = 70;
const TAU = Math.PI * 2;

const TERRAIN_RELIEF_SITES = Object.freeze([
  [1.1, 0.42, 1.05], [3.2, 0.78, 0.78], [5.85, 0.48, 0.94],
  [8.2, 0.86, 1.08], [11.7, 0.58, 0.82], [14.5, 0.92, 1.02],
  [18.2, 0.56, 1.1], [20.6, 0.9, 0.86], [23.8, 0.48, 0.96],
  [26.4, 0.8, 1.04], [29.8, 0.55, 0.8], [32.2, 0.98, 1.14],
  [36.5, 0.63, 0.94], [39.4, 0.88, 1.03], [42.7, 0.5, 0.8],
  [45.9, 0.94, 1.08], [49.35, 0.64, 0.92], [52.6, 0.86, 1.06],
  [56.15, 0.48, 0.82], [59.1, 0.92, 1.12], [64.2, 0.57, 0.88],
  [70.3, 0.78, 1.05], [73.1, 0.5, 0.82], [76.7, 0.94, 1.12],
  [79.3, 0.62, 0.92], [84.2, 0.86, 1.08], [87.6, 0.54, 0.86],
  [90.8, 0.98, 1.14], [94.6, 0.66, 0.96], [98.2, 0.9, 1.08],
  [100.4, 0.5, 0.82], [104.1, 0.8, 1.05], [107.6, 0.58, 0.9],
  [111.2, 0.94, 1.1], [116.8, 0.56, 0.88], [122.5, 0.84, 1.06]
]);

const TURF_FRINGE_SITES = Object.freeze([
  0.7, 1.4, 4.4, 5.2, 7.7, 10.9, 12.1, 14.7, 18.4, 19.7,
  23.4, 24.9, 27.4, 29.3, 32.3, 35.2, 37.4, 39.2, 40.8, 42.3,
  45.4, 47.2, 49.6, 51.5, 53.2, 55.7, 57.5, 59.3, 60.6, 63.7,
  64.4, 69.3, 71.5, 72.8, 74.7, 76.4, 78.7, 80.4, 83.5, 85.2,
  87.7, 89.3, 91.7, 93.5, 95.7, 98.4, 100.2, 103.4, 105.3,
  107.6, 108.9, 111.5, 113.1, 116.4, 118.3, 122.3, 123.2
]);

const FLOWER_COLORS = Object.freeze([0xffd850, 0xfff3d1, 0xc8a5ff, 0xffa45a, 0xf0dbe7]);

function variation(seed) {
  const value = Math.sin(seed * 12.9898 + 4.1414) * 43758.5453;
  return value - Math.floor(value);
}

function chamferedBoxGeometry(width, height, depth, radius = 5) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const corner = Math.min(radius, halfWidth * 0.28, halfHeight * 0.28);
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + corner, -halfHeight);
  shape.lineTo(halfWidth - corner, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + corner);
  shape.lineTo(halfWidth, halfHeight - corner);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - corner, halfHeight);
  shape.lineTo(-halfWidth + corner, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - corner);
  shape.lineTo(-halfWidth, -halfHeight + corner);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + corner, -halfHeight);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: Math.min(3, corner * 0.45),
    bevelThickness: 2.4,
    curveSegments: 4,
    steps: 1
  });
  geometry.center();
  return geometry;
}

function taperedPanelGeometry(bottomWidth, topWidth, height, depth) {
  const shape = new THREE.Shape();
  shape.moveTo(-bottomWidth / 2, 0);
  shape.lineTo(bottomWidth / 2, 0);
  shape.lineTo(topWidth / 2, height);
  shape.lineTo(-topWidth / 2, height);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 1.8,
    bevelThickness: 1.8,
    curveSegments: 4
  });
  geometry.translate(0, -height / 2, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

export class MeadowWakeForegroundArt {
  constructor({ world, height, width, materials, materialFactory }) {
    this.world = world;
    this.height = height;
    this.width = width;
    this.materials = materials;
    this.materialFactory = materialFactory;
    this.animated = [];
    this.sectionGroups = [];
    this.elapsed = 0;

    this.canvas = new THREE.MeshStandardMaterial({
      color: 0x456f3d,
      roughness: 0.98,
      metalness: 0,
      side: THREE.DoubleSide
    });
    this.canvasLight = new THREE.MeshStandardMaterial({
      color: 0x678c4b,
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide
    });
    this.darkWood = new THREE.MeshStandardMaterial({
      color: 0x3e2719,
      roughness: 0.92,
      metalness: 0
    });
    this.lightWood = new THREE.MeshStandardMaterial({
      color: 0xa66b35,
      roughness: 0.84,
      metalness: 0
    });
    this.rope = new THREE.MeshStandardMaterial({
      color: 0x9b744b,
      roughness: 1,
      metalness: 0
    });
    this.brass = new THREE.MeshStandardMaterial({
      color: 0xc38b35,
      roughness: 0.34,
      metalness: 0.58
    });
    this.iron = new THREE.MeshStandardMaterial({
      color: 0x34413d,
      roughness: 0.66,
      metalness: 0.42
    });
    this.bark = new THREE.MeshStandardMaterial({
      color: 0x623a22,
      roughness: 0.98,
      metalness: 0
    });
    this.barkLight = new THREE.MeshStandardMaterial({
      color: 0x8a5630,
      roughness: 0.96,
      metalness: 0
    });
    this.leafDark = new THREE.MeshStandardMaterial({
      color: 0x2f6a33,
      roughness: 0.96,
      metalness: 0
    });
    this.leafLight = new THREE.MeshStandardMaterial({
      color: 0x6ca343,
      roughness: 0.94,
      metalness: 0
    });
    this.water = new THREE.MeshPhysicalMaterial({
      color: 0x6fcbd2,
      transparent: true,
      opacity: 0.62,
      roughness: 0.18,
      metalness: 0,
      transmission: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.lanternGlass = new THREE.MeshStandardMaterial({
      color: 0xffd974,
      emissive: 0xff9d36,
      emissiveIntensity: 1.75,
      transparent: true,
      opacity: 0.88,
      roughness: 0.25,
      metalness: 0
    });
  }

  addMesh(root, name, geometry, material, position = [0, 0, 0]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.castShadow = !material.transparent;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  }

  applySurfaceTextures({ timber, ruinStone, canvas, bark }) {
    for (const material of [this.lightWood, this.materials.wood]) {
      material.map = timber;
      material.bumpMap = timber;
      material.bumpScale = 0.42;
      material.color.setHex(
        material === this.lightWood ? 0xa98c78 : 0x8e7567
      );
      material.needsUpdate = true;
    }
    for (const material of [this.canvas, this.canvasLight]) {
      material.map = canvas;
      material.bumpMap = canvas;
      material.bumpScale = 0.24;
      material.color.setHex(material === this.canvas ? 0x76966e : 0x9caf8b);
      material.needsUpdate = true;
    }
    for (const material of [this.bark, this.barkLight, this.darkWood]) {
      material.map = bark;
      material.bumpMap = bark;
      material.bumpScale = material === this.darkWood ? 0.34 : 0.58;
      material.color.setHex(material === this.bark ? 0x9c7a68 : material === this.barkLight ? 0xc2997a : 0x6e5b50);
      material.needsUpdate = true;
    }
    this.materials.stone.map = ruinStone;
    this.materials.stone.bumpMap = ruinStone;
    this.materials.stone.bumpScale = 0.6;
    this.materials.stone.color.setHex(0xb8b8ad);
    this.materials.stone.needsUpdate = true;
  }

  addBox(root, name, width, height, depth, material, position = [0, 0, 0], radius = 2.5) {
    return this.addMesh(
      root,
      name,
      radius > 0
        ? chamferedBoxGeometry(width, height, depth, radius)
        : new THREE.BoxGeometry(width, height, depth),
      material,
      position
    );
  }

  addContactShadow(root, width, { y = 2, z = 102, opacity = 0.12 } = {}) {
    for (let layer = 0; layer < 4; layer += 1) {
      const shadow = this.addMesh(
        root,
        'soft-contact-shadow',
        new THREE.CircleGeometry(1, 36),
        new THREE.MeshBasicMaterial({
          color: 0x132116,
          transparent: true,
          opacity: opacity * (1 - layer * 0.2),
          depthWrite: false,
          side: THREE.DoubleSide
        }),
        [0, y - layer * 0.4, z - layer * 0.8]
      );
      shadow.scale.set(width * (0.42 + layer * 0.035), width * (0.065 + layer * 0.016), 1);
      shadow.castShadow = false;
      shadow.receiveShadow = false;
    }
  }

  addRopeCurve(root, name, points, radius = 2.2) {
    const curve = new THREE.CatmullRomCurve3(points);
    return this.addMesh(
      root,
      name,
      new THREE.TubeGeometry(curve, 28, radius, 6, false),
      this.rope
    );
  }

  addGrassFringe(root, width, y, z = 66, seed = 0, density = 7) {
    const count = Math.max(3, Math.round(width / density));
    for (let index = 0; index < count; index += 1) {
      const ratio = (index + 0.5) / count;
      const bladeHeight = 8 + variation(seed * 7 + index) * 10;
      const blade = this.addMesh(
        root,
        'sculpted-turf-fringe',
        new THREE.ConeGeometry(1.6 + variation(index + seed) * 1.3, bladeHeight, 5),
        index % 3 ? this.leafDark : this.leafLight,
        [-width / 2 + ratio * width, y + bladeHeight * 0.48, z + (index % 3) * 2]
      );
      blade.rotation.z = (variation(seed * 13 + index) - 0.5) * 0.42;
      this.animated.push({
        object: blade,
        baseRotation: blade.rotation.z,
        phase: seed * 0.41 + index * 0.63,
        amplitude: 0.035
      });
    }
  }

  addFlower(root, x, y, z, color, scale = 1) {
    const stem = this.addMesh(
      root,
      'wildflower-stem',
      new THREE.CylinderGeometry(0.55, 0.85, 12 * scale, 6),
      this.leafDark,
      [x, y + 6 * scale, z]
    );
    stem.castShadow = false;
    const centre = this.addMesh(
      root,
      'wildflower-centre',
      new THREE.SphereGeometry(1.5 * scale, 8, 6),
      this.materialFactory(0xe5a936),
      [x, y + 12.5 * scale, z + 0.5]
    );
    centre.castShadow = false;
    const petalMaterial = this.materialFactory(color);
    for (let index = 0; index < 5; index += 1) {
      const angle = index / 5 * TAU;
      const petal = this.addMesh(
        root,
        'wildflower-petal',
        new THREE.SphereGeometry(1.7 * scale, 8, 6),
        petalMaterial,
        [
          x + Math.cos(angle) * 2.1 * scale,
          y + 12.5 * scale + Math.sin(angle) * 2.1 * scale,
          z
        ]
      );
      petal.scale.set(1.3, 0.72, 0.45);
      petal.castShadow = false;
    }
  }

  addLeafCluster(root, x, y, z, scale = 1, seed = 0, material = this.leafDark) {
    const cluster = new THREE.Group();
    cluster.name = 'rounded-leaf-cluster';
    cluster.position.set(x, y, z);
    root.add(cluster);
    for (let index = 0; index < 9; index += 1) {
      const angle = index / 9 * TAU;
      const ring = index < 3 ? 0.48 : index < 7 ? 0.82 : 0.6;
      const leaf = this.addMesh(
        cluster,
        'rounded-foliage-volume',
        new THREE.DodecahedronGeometry((11 + variation(seed + index) * 7) * scale, 1),
        index % 3 === 0 ? this.leafLight : material,
        [
          Math.cos(angle) * 27 * ring * scale,
          Math.sin(angle) * 16 * ring * scale + (index >= 7 ? 16 * scale : 3 * scale),
          (index % 3 - 1) * 7 * scale
        ]
      );
      leaf.scale.set(1.18, 0.78, 0.84);
    }
    for (let index = 0; index < 6; index += 1) {
      const angle = index / 6 * TAU + 0.3;
      const leafSpray = this.addMesh(
        cluster,
        'readable-canopy-leaf-spray',
        new THREE.SphereGeometry(5.5 * scale, 10, 7),
        index % 2 ? this.leafLight : material,
        [
          Math.cos(angle) * 34 * scale,
          5 * scale + Math.sin(angle) * 21 * scale,
          10 * scale
        ]
      );
      leafSpray.scale.set(1.55, 0.56, 0.36);
      leafSpray.rotation.z = angle + Math.PI / 2;
    }
    this.animated.push({
      object: cluster,
      baseRotation: 0,
      phase: seed * 0.77,
      amplitude: 0.012
    });
    return cluster;
  }

  buildPlatform(definition) {
    const root = new THREE.Group();
    root.name = `${definition.id}_${definition.visual}_authored-platform`;
    root.position.set(
      definition.x * SCALE,
      this.height / 2 - definition.y * SCALE,
      0
    );
    this.world.add(root);

    const width = definition.width * SCALE;
    const height = Math.max(12, definition.height * SCALE);
    const turf = this.materials.turf;
    const soil = this.materials.soil;
    const stone = this.materials.stone;
    const wood = this.materials.wood;
    let core = null;
    let cap = null;

    if (definition.visual === 'turf-ledge') {
      core = this.addBox(root, 'sculpted-soil-ledger', width * 0.92, height + 28, 126, soil, [0, -12, 0], 9);
      cap = this.addBox(root, 'overhanging-living-turf', width + 8, 11, 136, turf, [0, height / 2 + 4, 0], 5);
      const stoneCount = Math.max(3, Math.round(width / 28));
      for (let index = 0; index < stoneCount; index += 1) {
        const rock = this.addMesh(
          root,
          'ledge-bedded-fieldstone',
          new THREE.DodecahedronGeometry(10 + variation(index + definition.x) * 8, 0),
          stone,
          [
            -width * 0.42 + index * width * 0.84 / Math.max(1, stoneCount - 1),
            -height * 0.45 - (index % 2) * 10,
            65
          ]
        );
        rock.scale.set(1.25, 0.72, 0.64);
        rock.rotation.z = (variation(index * 3 + definition.x) - 0.5) * 0.34;
      }
      for (const x of [-width * 0.29, width * 0.18]) {
        const rootDrop = this.addMesh(
          root,
          'ledge-exposed-root',
          new THREE.CylinderGeometry(2.2, 3.8, 29, 7),
          this.bark,
          [x, -height * 0.6 - 10, 69]
        );
        rootDrop.rotation.z = x < 0 ? -0.18 : 0.23;
      }
      this.addGrassFringe(root, width, height / 2 + 8, 70, definition.x, 8);
      if (Math.round(definition.x) % 2 === 0) {
        this.addFlower(root, width * 0.18, height / 2 + 6, 73, FLOWER_COLORS[Math.round(definition.x) % FLOWER_COLORS.length], 0.72);
      }
    } else if (['camp-deck', 'timber-lift', 'timber-slat'].includes(definition.visual)) {
      const plankCount = definition.visual === 'timber-slat'
        ? Math.max(3, Math.round(width / 20))
        : Math.max(4, Math.round(width / 30));
      const plankWidth = width / plankCount;
      for (let index = 0; index < plankCount; index += 1) {
        const plank = this.addBox(
          root,
          `${definition.visual}-bevelled-plank`,
          plankWidth - 2.6,
          height,
          112,
          index % 3 === 0 ? this.lightWood : wood,
          [-width / 2 + plankWidth * (index + 0.5), (index % 2) * 1.1, 0],
          2.8
        );
        plank.rotation.z = (variation(index + definition.x) - 0.5) * 0.025;
      }
      this.addBox(root, 'timber-underbeam', width * 0.88, 8, 126, this.darkWood, [0, -height * 0.68, -2], 2);
      if (definition.visual !== 'timber-slat') {
        for (const side of [-1, 1]) {
          const brace = this.addBox(
            root,
            'timber-knee-brace',
            width * 0.48,
            7,
            18,
            this.darkWood,
            [side * width * 0.2, -height - 10, 52],
            2
          );
          brace.rotation.z = side * 0.28;
          const lashing = this.addMesh(
            root,
            'rope-lashing',
            new THREE.TorusGeometry(10, 1.8, 6, 16),
            this.rope,
            [side * width * 0.38, -height * 0.35, 59]
          );
          lashing.rotation.y = Math.PI / 2;
        }
      }
      if (definition.visual === 'timber-lift') {
        for (const side of [-1, 1]) {
          this.addBox(root, 'lift-brass-corner', 12, 7, 118, this.brass, [side * (width / 2 - 8), height * 0.18, 0], 2);
          this.addRopeCurve(root, 'lift-suspension-rope', [
            new THREE.Vector3(side * width * 0.42, 0, -38),
            new THREE.Vector3(side * width * 0.42, 40, -30),
            new THREE.Vector3(side * width * 0.32, 82, -22)
          ], 1.7);
        }
      }
      this.addContactShadow(root, width * 0.8, { y: -height * 0.8, z: 84, opacity: 0.09 });
    } else if (definition.visual === 'rope-bridge') {
      const plankCount = Math.max(10, Math.round(width / 18));
      const plankWidth = width / plankCount;
      for (let index = 0; index < plankCount; index += 1) {
        const ratio = index / Math.max(1, plankCount - 1);
        const sag = -Math.sin(ratio * Math.PI) * 5.5;
        const plank = this.addBox(
          root,
          'rope-bridge-handcut-plank',
          plankWidth - 2.3,
          height,
          100,
          index % 4 === 0 ? this.lightWood : wood,
          [-width / 2 + plankWidth * (index + 0.5), sag, 0],
          2.4
        );
        plank.rotation.z = -Math.cos(ratio * Math.PI) * 0.045;
      }
      for (const z of [-47, 47]) {
        this.addRopeCurve(root, 'bridge-bearing-rope', [
          new THREE.Vector3(-width / 2, 3, z),
          new THREE.Vector3(0, -9, z),
          new THREE.Vector3(width / 2, 3, z)
        ], 2.5);
        this.addRopeCurve(root, 'bridge-hand-rope', [
          new THREE.Vector3(-width / 2, 58, z),
          new THREE.Vector3(0, 30, z),
          new THREE.Vector3(width / 2, 58, z)
        ], 2.2);
      }
      for (const side of [-1, 1]) {
        this.addBox(root, 'bridge-post', 10, 82, 14, this.darkWood, [side * width / 2, 29, 48], 3);
      }
      this.addContactShadow(root, width * 0.88, { y: -14, z: 84, opacity: 0.075 });
    } else if (definition.visual === 'fallen-log' || definition.visual === 'seesaw') {
      const log = this.addMesh(
        root,
        'rounded-fallen-log',
        new THREE.CylinderGeometry(15, 18, width, 24, 3),
        this.bark
      );
      log.rotation.z = Math.PI / 2;
      for (let index = 0; index < 7; index += 1) {
        const barkRidge = this.addMesh(
          root,
          'fallen-log-bark-ridge',
          new THREE.TorusGeometry(16.2, 1.2, 6, 20),
          index % 2 ? this.barkLight : this.darkWood,
          [-width * 0.38 + index * width * 0.76 / 6, 0, 0]
        );
        barkRidge.rotation.y = Math.PI / 2;
      }
      for (const side of [-1, 1]) {
        const end = this.addMesh(
          root,
          'fallen-log-growth-rings',
          new THREE.CircleGeometry(14.8, 28),
          this.lightWood,
          [side * width / 2 + side * 0.7, 0, 0]
        );
        end.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      for (const x of [-width * 0.26, width * 0.08, width * 0.33]) {
        const mossPatch = this.addMesh(
          root,
          'fallen-log-moss-volume',
          new THREE.DodecahedronGeometry(9, 0),
          this.leafDark,
          [x, 14, 12]
        );
        mossPatch.scale.set(1.8, 0.46, 1.2);
      }
      if (definition.visual === 'seesaw') {
        const pivot = this.addMesh(
          root,
          'seesaw-carved-stone-pivot',
          new THREE.DodecahedronGeometry(24, 1),
          stone,
          [0, -30, 0]
        );
        pivot.scale.set(1.05, 0.76, 0.9);
        this.addMesh(root, 'seesaw-brass-axle', new THREE.CylinderGeometry(6, 6, 94, 14), this.brass, [0, -13, 0]).rotation.x = Math.PI / 2;
      }
      this.addGrassFringe(root, width * 0.64, 13, 38, definition.x, 11);
      this.addContactShadow(root, width * 0.82, { y: -18, z: 82, opacity: 0.1 });
    } else if (definition.visual === 'stump') {
      const trunkHeight = Math.max(34, height + 22);
      const stump = this.addMesh(
        root,
        'playable-bark-stump',
        new THREE.CylinderGeometry(width * 0.39, width * 0.48, trunkHeight, 22, 3),
        this.bark
      );
      stump.position.y = -3;
      for (let index = 0; index < 9; index += 1) {
        const ridge = this.addBox(
          root,
          'stump-bark-ridge',
          3.3,
          trunkHeight * 0.82,
          4,
          index % 2 ? this.barkLight : this.darkWood,
          [
            Math.cos(index / 9 * TAU) * width * 0.43,
            -4,
            Math.sin(index / 9 * TAU) * width * 0.43
          ],
          1.2
        );
        ridge.rotation.y = -index / 9 * TAU;
      }
      const topRing = this.addMesh(
        root,
        'stump-growth-ring-top',
        new THREE.CylinderGeometry(width * 0.375, width * 0.375, 4, 26),
        this.lightWood,
        [0, trunkHeight / 2 - 3, 0]
      );
      const innerRing = this.addMesh(
        root,
        'stump-growth-ring-detail',
        new THREE.TorusGeometry(width * 0.22, 1.8, 6, 26),
        this.darkWood,
        [0, trunkHeight / 2 - 0.5, 0]
      );
      innerRing.rotation.x = Math.PI / 2;
      topRing.receiveShadow = true;
      this.addGrassFringe(root, width * 0.62, trunkHeight / 2 - 1, 35, definition.x, 9);
      this.addContactShadow(root, width, { y: -trunkHeight / 2, z: 82, opacity: 0.11 });
    } else {
      const creekStone = definition.visual === 'creek-stone';
      const bodyMaterial = creekStone ? this.materialFactory(0x53635c) : stone;
      core = this.addBox(root, 'hand-laid-ruin-core', width * 0.94, height + 12, 124, bodyMaterial, [0, -4, 0], 8);
      const stoneCount = Math.max(3, Math.round(width / 25));
      for (let index = 0; index < stoneCount; index += 1) {
        const rock = this.addMesh(
          root,
          creekStone ? 'water-worn-creek-stone' : 'mossy-ruin-facing-stone',
          new THREE.DodecahedronGeometry(11 + variation(index + definition.x) * 7, 0),
          bodyMaterial,
          [
            -width * 0.43 + index * width * 0.86 / Math.max(1, stoneCount - 1),
            -height * 0.15 - (index % 2) * 7,
            67
          ]
        );
        rock.scale.set(1.25, creekStone ? 0.62 : 0.78, 0.62);
        rock.rotation.z = (variation(index * 5 + definition.x) - 0.5) * 0.38;
      }
      cap = this.addBox(
        root,
        creekStone ? 'wet-stone-landing-cap' : 'ruin-moss-cap',
        width + 3,
        creekStone ? 7 : 9,
        132,
        creekStone ? this.materialFactory(0x718879) : turf,
        [0, height / 2 + 3, 0],
        4
      );
      if (!creekStone) this.addGrassFringe(root, width * 0.9, height / 2 + 6, 70, definition.x, 11);
      this.addContactShadow(root, width * 0.82, { y: -height * 0.7, z: 83, opacity: 0.08 });
    }

    return { ...definition, root, core, cap, imported: null, authoredForeground: true };
  }

  buildCoin({ x, y, index, major = false }) {
    const root = new THREE.Group();
    root.name = major ? 'compass-coin-production-collectible' : 'trail-coin-production-collectible';
    root.position.set(x * SCALE, this.height / 2 - y * SCALE, 56);
    const radius = major ? 20 : 10.5;
    const depth = major ? 6 : 4;
    const gold = new THREE.MeshStandardMaterial({
      color: major ? 0xffd258 : 0xf5bd32,
      emissive: major ? 0x744000 : 0x4c2b00,
      emissiveIntensity: major ? 0.72 : 0.42,
      roughness: 0.22,
      metalness: 0.68
    });
    const darkGold = new THREE.MeshStandardMaterial({
      color: 0x9f661b,
      roughness: 0.38,
      metalness: 0.56
    });
    const disc = this.addMesh(
      root,
      major ? 'compass-coin-bevelled-disc' : 'trail-coin-bevelled-disc',
      new THREE.CylinderGeometry(radius, radius, depth, 36, 2, false),
      gold
    );
    disc.rotation.x = Math.PI / 2;
    for (const z of [-depth / 2 - 0.7, depth / 2 + 0.7]) {
      this.addMesh(
        root,
        'collectible-raised-rim',
        new THREE.TorusGeometry(radius * 0.72, major ? 2.25 : 1.3, 8, 32),
        darkGold,
        [0, 0, z]
      );
    }
    const emblemZ = depth / 2 + 1.2;
    const compassPoints = major ? 8 : 4;
    for (let point = 0; point < compassPoints; point += 1) {
      const angle = point / compassPoints * TAU;
      const needle = this.addMesh(
        root,
        major ? 'major-compass-needle' : 'trail-direction-needle',
        new THREE.ConeGeometry(major ? 2.9 : 1.8, major ? 14 : 8, 3),
        point % 2 ? darkGold : gold,
        [
          Math.cos(angle) * radius * 0.24,
          Math.sin(angle) * radius * 0.24,
          emblemZ
        ]
      );
      needle.rotation.z = angle - Math.PI / 2;
      needle.rotation.x = Math.PI / 2;
    }
    const glow = this.addMesh(
      root,
      'collectible-soft-glow',
      new THREE.RingGeometry(radius * 1.08, radius * 1.38, 36),
      new THREE.MeshBasicMaterial({
        color: major ? 0xffe784 : 0xffd45b,
        transparent: true,
        opacity: major ? 0.25 : 0.11,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      }),
      [0, 0, -1]
    );
    glow.castShadow = false;
    root.userData = {
      kind: major ? 'compass' : 'coin',
      index,
      phase: index * 0.47,
      baseY: root.position.y,
      wasTaken: false
    };
    this.world.add(root);
    return root;
  }

  buildCourseMarker({ name, x, groundY }) {
    const root = new THREE.Group();
    root.name = `${name}_authored-course-marker`;
    root.position.set(x * SCALE, groundY, 24);
    this.world.add(root);

    const isCheckpoint = name === 'checkpoint';
    const poleHeight = isCheckpoint ? 142 : 174;
    const bannerMaterial = this.canvas;
    const pole = this.addMesh(
      root,
      `${name}-turned-timber-pole`,
      new THREE.CylinderGeometry(5.5, 8, poleHeight, 14, 3),
      this.darkWood,
      [0, poleHeight / 2, 0]
    );
    pole.rotation.z = -0.012;
    const footing = this.addMesh(
      root,
      `${name}-mossy-stone-footing`,
      new THREE.DodecahedronGeometry(17, 1),
      this.materials.stone,
      [0, 10, 0]
    );
    footing.scale.set(1.2, 0.68, 0.9);
    this.addBox(
      root,
      `${name}-banner-crossbar`,
      isCheckpoint ? 72 : 86,
      8,
      12,
      this.lightWood,
      [isCheckpoint ? 25 : 30, poleHeight - 20, 3],
      3
    );
    const banner = this.addBox(
      root,
      `${name}-woven-canvas-banner`,
      isCheckpoint ? 52 : 64,
      isCheckpoint ? 68 : 82,
      6,
      bannerMaterial,
      [isCheckpoint ? 31 : 38, poleHeight - (isCheckpoint ? 58 : 69), 12],
      6
    );
    banner.rotation.z = -0.018;
    const medallion = this.addMesh(
      root,
      `${name}-compass-medallion`,
      new THREE.CylinderGeometry(isCheckpoint ? 11 : 13, isCheckpoint ? 11 : 13, 4, 24),
      this.brass,
      [isCheckpoint ? 31 : 38, poleHeight - (isCheckpoint ? 55 : 66), 17]
    );
    medallion.rotation.x = Math.PI / 2;
    this.addMesh(
      root,
      `${name}-compass-ring`,
      new THREE.TorusGeometry(isCheckpoint ? 7 : 9, 1.35, 6, 20),
      this.iron,
      [isCheckpoint ? 31 : 38, poleHeight - (isCheckpoint ? 55 : 66), 20]
    );
    for (const angle of [0, Math.PI / 2]) {
      const needle = this.addBox(
        root,
        `${name}-compass-needle`,
        2,
        isCheckpoint ? 15 : 18,
        2,
        this.iron,
        [isCheckpoint ? 31 : 38, poleHeight - (isCheckpoint ? 55 : 66), 21],
        0.5
      );
      needle.rotation.z = angle;
    }
    const finial = this.addMesh(
      root,
      `${name}-brass-finial`,
      new THREE.SphereGeometry(9, 16, 10),
      this.brass,
      [0, poleHeight + 5, 0]
    );
    finial.scale.y = 1.18;
    this.addRopeCurve(root, `${name}-banner-cord`, [
      new THREE.Vector3(0, poleHeight - 18, 8),
      new THREE.Vector3(31, poleHeight - 26, 11),
      new THREE.Vector3(isCheckpoint ? 55 : 68, poleHeight - 20, 8)
    ], 1.3);
    this.addContactShadow(root, isCheckpoint ? 72 : 92, { opacity: 0.1 });
    this.animated.push({
      object: banner,
      baseRotation: banner.rotation.z,
      phase: x * 0.33,
      amplitude: 0.006
    });
    return root;
  }

  addStoneStack(root, { width = 86, height = 100, z = 0, seed = 0, moss = true } = {}) {
    const columns = Math.max(2, Math.round(width / 34));
    const rows = Math.max(2, Math.round(height / 28));
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const stone = this.addMesh(
          root,
          'authored-rounded-ruin-stone',
          new THREE.DodecahedronGeometry(16 + variation(seed + row * 9 + column) * 4, 0),
          this.materials.stone,
          [
            -width / 2 + (column + 0.5) * width / columns + (row % 2) * 4,
            14 + row * height / rows,
            z + (column % 2) * 4
          ]
        );
        stone.scale.set(width / columns / 28, 0.62, 0.82);
        stone.rotation.z = (variation(seed * 3 + row + column) - 0.5) * 0.2;
      }
    }
    if (moss) {
      this.addBox(root, 'ruin-living-moss-cap', width + 10, 8, 42, this.materials.turf, [0, height + 8, z], 4);
      this.addGrassFringe(root, width, height + 9, z + 24, seed, 12);
    }
  }

  addLantern(root, x, y, z, scale = 1) {
    const lantern = new THREE.Group();
    lantern.name = 'warm-camp-lantern';
    lantern.position.set(x, y, z);
    lantern.scale.setScalar(scale);
    root.add(lantern);
    this.addBox(lantern, 'lantern-glass', 17, 23, 14, this.lanternGlass, [0, 0, 0], 3);
    this.addBox(lantern, 'lantern-cap', 23, 4, 18, this.iron, [0, 14, 0], 2);
    this.addBox(lantern, 'lantern-base', 21, 4, 18, this.iron, [0, -14, 0], 2);
    for (const side of [-1, 1]) {
      this.addBox(lantern, 'lantern-frame', 2.5, 28, 2.5, this.iron, [side * 9, 0, 8], 0.8);
    }
    const halo = this.addMesh(
      lantern,
      'lantern-halo',
      new THREE.CircleGeometry(18, 24),
      new THREE.MeshBasicMaterial({
        color: 0xffc65a,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }),
      [0, 0, 10]
    );
    halo.castShadow = false;
    this.animated.push({ object: halo, phase: x * 0.2 + y, pulse: true });
    return lantern;
  }

  buildProp(definition, heightAt) {
    const root = new THREE.Group();
    root.name = `${definition.id}_${definition.type}_authored-scenery`;
    root.position.set(
      definition.x * SCALE,
      this.height / 2 - heightAt(definition.x) * SCALE,
      definition.depth ?? -8
    );
    root.scale.setScalar(definition.scale ?? 1);
    if (definition.facing === -1) root.rotation.y = Math.PI;
    else if (/camp-lodge|camp-tent|checkpoint-shelter|camp-scaffold|camp-watchtower/.test(definition.type)) {
      root.rotation.y = -THREE.MathUtils.degToRad(6);
    }
    this.world.add(root);

    const wood = this.materials.wood;
    const stone = this.materials.stone;
    const turf = this.materials.turf;
    const type = definition.type;

    if (type === 'camp-lodge') {
      this.addContactShadow(root, 195, { y: 2, z: 126, opacity: 0.14 });
      this.addBox(root, 'lodge-raised-deck', 198, 18, 118, this.darkWood, [0, 12, 0], 4);
      for (const x of [-80, -27, 27, 80]) {
        this.addBox(root, 'lodge-deck-plank', 47, 12, 124, x % 54 ? wood : this.lightWood, [x, 23, 0], 3);
      }
      for (const x of [-86, 86]) {
        this.addBox(root, 'lodge-heavy-upright', 15, 172, 18, this.darkWood, [x, 101, -6], 4);
        const roofBeam = this.addBox(root, 'lodge-a-frame-beam', 142, 14, 20, wood, [x * 0.48, 180, -8], 4);
        roofBeam.rotation.z = x < 0 ? 0.68 : -0.68;
      }
      this.addBox(root, 'lodge-ridge-beam', 18, 32, 168, this.darkWood, [0, 220, -8], 4);
      const lodgeRoof = this.addMesh(
        root,
        'lodge-tailored-canvas-roof',
        new THREE.ConeGeometry(142, 74, 4, 2, false),
        this.canvas,
        [0, 190, -2]
      );
      lodgeRoof.rotation.y = Math.PI / 4;
      lodgeRoof.scale.z = 0.68;
      this.addBox(root, 'lodge-canvas-eave-trim', 204, 8, 118, this.canvasLight, [0, 154, 0], 3);
      this.addBox(root, 'lodge-dark-entry', 58, 108, 8, this.materialFactory(0x132118), [-4, 78, 59], 7);
      const leftFlap = this.addMesh(
        root,
        'lodge-tailored-canvas-flap',
        taperedPanelGeometry(58, 36, 108, 7),
        this.canvasLight,
        [-55, 78, 54]
      );
      leftFlap.rotation.z = -0.025;
      const rightFlap = this.addMesh(
        root,
        'lodge-tailored-canvas-flap',
        taperedPanelGeometry(58, 36, 108, 7),
        this.canvas,
        [51, 78, 54]
      );
      rightFlap.rotation.z = 0.025;
      for (const x of [-78, -30, 30, 78]) {
        this.addBox(root, 'lodge-wall-timber', 7, 112, 7, this.darkWood, [x, 80, 61], 2);
      }
      this.addBox(root, 'lodge-canvas-banner', 30, 62, 5, this.canvas, [67, 118, 68], 5);
      const badge = this.addMesh(root, 'lodge-original-leaf-badge', new THREE.SphereGeometry(8, 18, 10), this.canvasLight, [67, 124, 72]);
      badge.scale.set(0.6, 1.25, 0.25);
      badge.rotation.z = -0.48;
      this.addLantern(root, -108, 108, 58, 0.82);
      this.addLantern(root, 108, 108, 58, 0.82);
      this.addRopeCurve(root, 'lodge-hanging-rope', [
        new THREE.Vector3(-94, 178, 54),
        new THREE.Vector3(0, 160, 62),
        new THREE.Vector3(94, 178, 54)
      ], 2);
      for (const x of [-48, 0, 48]) {
        this.addRopeCurve(root, 'lodge-roof-seam-cord', [
          new THREE.Vector3(x * 0.2, 224, 38),
          new THREE.Vector3(x, 184, 55),
          new THREE.Vector3(x * 1.55, 154, 60)
        ], 1.15);
      }
      this.addLeafCluster(root, -126, 32, 20, 0.72, 4);
      this.addLeafCluster(root, 132, 26, 18, 0.62, 8);
    } else if (type === 'trail-sign') {
      this.addBox(root, 'trail-sign-post', 10, 84, 13, this.darkWood, [0, 42, 0], 3);
      for (const [index, y] of [0, 1].map((value, index) => [index, 68 + index * 30])) {
        const board = this.addBox(root, 'hand-painted-wayfinder-board', 94 - index * 14, 24, 11, index ? wood : this.lightWood, [18 - index * 5, y, 5], 5);
        board.rotation.z = index ? -0.06 : 0.045;
      }
      const cap = this.addMesh(root, 'trail-sign-finial', new THREE.SphereGeometry(7, 12, 8), this.brass, [0, 90, 0]);
      cap.scale.y = 1.3;
      this.addContactShadow(root, 65, { opacity: 0.1 });
    } else if (type === 'lantern-post') {
      this.addBox(root, 'lantern-post-timber', 9, 94, 12, this.darkWood, [0, 47, 0], 3);
      const arm = this.addBox(root, 'lantern-post-arm', 58, 8, 12, wood, [20, 90, 0], 3);
      arm.rotation.z = -0.08;
      this.addBox(root, 'lantern-post-brace', 38, 6, 9, this.darkWood, [12, 75, 2], 2).rotation.z = 0.55;
      this.addLantern(root, 46, 62, 10, 0.82);
      this.addContactShadow(root, 54, { opacity: 0.09 });
    } else if (type === 'trail-fence') {
      for (const [index, x] of [-62, 0, 62].entries()) {
        const post = this.addBox(
          root,
          'weathered-trail-fence-post',
          10,
          64 + index % 2 * 7,
          14,
          index === 1 ? this.lightWood : this.darkWood,
          [x, 31 + index % 2 * 3, 0],
          3
        );
        post.rotation.z = (index - 1) * 0.025;
        const cap = this.addMesh(
          root,
          'fence-post-carved-cap',
          new THREE.SphereGeometry(6, 10, 7),
          this.darkWood,
          [x, 65 + index % 2 * 7, 0]
        );
        cap.scale.y = 0.72;
      }
      for (const [index, y] of [27, 49].entries()) {
        const rail = this.addBox(
          root,
          'weathered-trail-fence-rail',
          132,
          8,
          11,
          index ? wood : this.lightWood,
          [0, y, 2],
          3
        );
        rail.rotation.z = index ? -0.035 : 0.045;
      }
      this.addRopeCurve(root, 'fence-repair-lashing', [
        new THREE.Vector3(-7, 53, 10),
        new THREE.Vector3(0, 46, 13),
        new THREE.Vector3(7, 53, 10)
      ], 1.25);
      this.addGrassFringe(root, 138, 1, 18, definition.x, 12);
      this.addContactShadow(root, 138, { opacity: 0.075 });
    } else if (type === 'crate-stack') {
      const crates = [[-22, 20, 38], [22, 20, 38], [0, 58, 34]];
      crates.forEach(([x, y, size], index) => {
        this.addBox(root, 'camp-supply-crate', size, size, size, index % 2 ? wood : this.lightWood, [x, y, 0], 4);
        this.addBox(root, 'crate-cross-slat', size * 0.84, 4, size + 3, this.darkWood, [x, y, size / 2 + 2], 1.5).rotation.z = index % 2 ? -0.62 : 0.62;
        for (const side of [-1, 1]) {
          this.addBox(root, 'crate-edge-slat', 5, size * 0.84, size + 3, this.darkWood, [x + side * size * 0.39, y, size / 2 + 2], 1.5);
        }
      });
      this.addContactShadow(root, 96, { opacity: 0.12 });
    } else if (type === 'barrel-stack') {
      for (const [x, y, scale] of [[-20, 27, 1], [20, 27, 1], [0, 68, 0.88]]) {
        const barrel = this.addMesh(root, 'camp-water-barrel', new THREE.CylinderGeometry(22 * scale, 22 * scale, 48 * scale, 18, 3), this.barkLight, [x, y, 0]);
        for (const bandY of [-15, 15]) {
          const band = this.addMesh(root, 'barrel-iron-band', new THREE.TorusGeometry(22.4 * scale, 2, 6, 20), this.iron, [x, y + bandY * scale, 0]);
          band.rotation.x = Math.PI / 2;
        }
        barrel.rotation.y = 0.12 * x;
      }
      this.addContactShadow(root, 88, { opacity: 0.11 });
    } else if (type === 'woodpile') {
      for (let index = 0; index < 7; index += 1) {
        const log = this.addMesh(
          root,
          'split-camp-firewood',
          new THREE.CylinderGeometry(6, 7, 58, 10),
          index % 2 ? this.bark : this.barkLight,
          [(index % 4 - 1.5) * 15, 9 + Math.floor(index / 4) * 13, 0]
        );
        log.rotation.z = Math.PI / 2 + (index % 2 ? 0.05 : -0.04);
      }
      this.addBox(root, 'woodpile-roof', 86, 8, 46, this.canvas, [0, 48, 0], 3).rotation.z = -0.06;
      this.addContactShadow(root, 88, { opacity: 0.1 });
    } else if (type === 'flower-bank' || type === 'fern-bank') {
      const count = type === 'flower-bank' ? 12 : 10;
      for (let index = 0; index < count; index += 1) {
        const localX = (index - (count - 1) / 2) * 9;
        const fern = this.addMesh(
          root,
          type === 'flower-bank' ? 'flower-bank-leaf' : 'layered-fern-frond',
          new THREE.ConeGeometry(4 + index % 3, 18 + index % 4 * 5, 6),
          index % 3 ? this.leafDark : this.leafLight,
          [localX, 10 + index % 2 * 3, (index % 3) * 4]
        );
        fern.rotation.z = (variation(index + definition.x) - 0.5) * 0.5;
        this.animated.push({ object: fern, baseRotation: fern.rotation.z, phase: index * 0.6 + definition.x, amplitude: 0.045 });
        if (type === 'flower-bank' && index % 2 === 0) {
          this.addFlower(root, localX + 3, 0, 12, FLOWER_COLORS[index % FLOWER_COLORS.length], 0.72 + index % 3 * 0.08);
        }
      }
    } else if (type === 'canopy-tree') {
      const trunk = this.addMesh(root, 'layered-meadow-tree-trunk', new THREE.CylinderGeometry(18, 27, 198, 16, 3), this.bark, [0, 92, -8]);
      trunk.rotation.z = -0.06;
      for (const side of [-1, 1]) {
        const branch = this.addMesh(root, 'layered-meadow-tree-branch', new THREE.CylinderGeometry(7, 12, 102, 12), this.bark, [side * 28, 154, -4]);
        branch.rotation.z = side * -0.72;
      }
      this.addLeafCluster(root, -42, 202, -14, 1.42, definition.x);
      this.addLeafCluster(root, 45, 214, -20, 1.5, definition.x + 2);
      this.addLeafCluster(root, 0, 242, -26, 1.68, definition.x + 4);
      this.addContactShadow(root, 128, { opacity: 0.08, z: 136 });
    } else if (type === 'root-fan') {
      for (let index = 0; index < 7; index += 1) {
        const rootMesh = this.addMesh(
          root,
          'exposed-root-fan',
          new THREE.CylinderGeometry(3 + index % 2, 8, 78 - index * 4, 9),
          index % 2 ? this.bark : this.darkWood,
          [(index - 3) * 11, 24, 0]
        );
        rootMesh.rotation.z = -1.02 + index * 0.34;
      }
      this.addLeafCluster(root, 0, 30, -5, 0.72, definition.x);
    } else if (type === 'mushroom-stump') {
      const stump = this.addMesh(root, 'story-stump', new THREE.CylinderGeometry(28, 34, 58, 18, 2), this.bark, [0, 28, 0]);
      stump.rotation.z = 0.04;
      const top = this.addMesh(root, 'story-stump-rings', new THREE.CylinderGeometry(27, 27, 4, 22), this.lightWood, [0, 58, 0]);
      for (const [index, x] of [-28, -14, 24, 35].entries()) {
        const stem = this.addMesh(root, 'tiny-mushroom-stem', new THREE.CylinderGeometry(2.4, 3.2, 12 + index * 2, 8), this.materialFactory(0xe6d2a7), [x, 8 + index, 18]);
        stem.castShadow = false;
        const cap = this.addMesh(root, 'tiny-mushroom-cap', new THREE.SphereGeometry(6 + index % 2 * 2, 12, 8), this.materialFactory(index % 2 ? 0xe09842 : 0xb65b36), [x, 15 + index * 2, 18]);
        cap.scale.y = 0.48;
      }
      top.receiveShadow = true;
      this.addContactShadow(root, 76, { opacity: 0.1 });
    } else if (['ruin-wall', 'ruin-tower'].includes(type)) {
      this.addStoneStack(root, {
        width: type === 'ruin-tower' ? 78 : 118,
        height: type === 'ruin-tower' ? 148 : 76,
        seed: definition.x,
        z: 0
      });
      if (type === 'ruin-tower') {
        this.addBox(root, 'ruin-broken-cornice', 104, 14, 52, stone, [0, 151, 0], 4).rotation.z = -0.05;
        const vine = this.addRopeCurve(root, 'ruin-hanging-vine', [
          new THREE.Vector3(32, 152, 28),
          new THREE.Vector3(38, 112, 32),
          new THREE.Vector3(25, 64, 36)
        ], 1.8);
        vine.material = this.leafDark;
      }
      this.addContactShadow(root, type === 'ruin-tower' ? 86 : 124, { opacity: 0.1 });
    } else if (type === 'broken-arch' || type === 'goal-gate') {
      const height = type === 'goal-gate' ? 164 : 118;
      for (const side of [-1, 1]) {
        const pillar = new THREE.Group();
        pillar.position.x = side * 48;
        root.add(pillar);
        this.addStoneStack(pillar, { width: 42, height, seed: definition.x + side, moss: true });
      }
      this.addBox(root, 'arch-weathered-lintel', 132, 28, 52, stone, [0, height + 4, 0], 6);
      this.addBox(root, 'arch-moss-crown', 126, 8, 56, turf, [0, height + 22, 0], 4);
      if (type === 'goal-gate') {
        this.addBox(root, 'goal-hanging-banner', 38, 68, 5, this.canvas, [0, height - 34, 32], 5);
        const badge = this.addMesh(root, 'goal-leaf-emblem', new THREE.SphereGeometry(9, 18, 10), this.canvasLight, [0, height - 30, 37]);
        badge.scale.set(0.6, 1.2, 0.22);
        badge.rotation.z = -0.48;
        this.animated.push({ object: root.getObjectByName('goal-hanging-banner'), baseRotation: 0, phase: definition.x, amplitude: 0.008 });
      }
      this.addContactShadow(root, 148, { opacity: 0.11 });
    } else if (type === 'camp-tent' || type === 'checkpoint-shelter') {
      const width = type === 'checkpoint-shelter' ? 156 : 178;
      for (const x of [-width * 0.42, width * 0.42]) {
        this.addBox(root, 'tent-upright', 10, 112, 13, this.darkWood, [x, 56, -6], 3);
      }
      this.addBox(root, 'tent-ridge', width * 0.82, 10, 14, wood, [0, 116, -6], 3);
      const left = this.addBox(root, 'tent-layered-canvas', width * 0.62, 9, 116, this.canvas, [-width * 0.2, 96, 0], 4);
      const right = this.addBox(root, 'tent-layered-canvas', width * 0.62, 9, 116, this.canvasLight, [width * 0.2, 96, 0], 4);
      left.rotation.z = 0.46;
      right.rotation.z = -0.46;
      this.addBox(root, 'tent-platform', width, 14, 100, this.darkWood, [0, 12, 0], 3);
      this.addLantern(root, type === 'checkpoint-shelter' ? 0 : -width * 0.33, 68, 58, 0.72);
      if (type === 'checkpoint-shelter') {
        this.addBox(root, 'checkpoint-rest-bench', 84, 10, 32, wood, [0, 36, 32], 3);
        this.addBox(root, 'checkpoint-map-board', 62, 48, 8, this.lightWood, [50, 72, 54], 4);
      }
      this.addContactShadow(root, width, { opacity: 0.11 });
    } else if (type === 'camp-scaffold' || type === 'camp-watchtower') {
      const width = type === 'camp-watchtower' ? 142 : 124;
      const height = type === 'camp-watchtower' ? 188 : 132;
      for (const x of [-width * 0.42, width * 0.42]) {
        this.addBox(root, 'scaffold-upright', 12, height, 16, this.darkWood, [x, height / 2, 0], 4);
      }
      this.addBox(root, 'scaffold-deck', width, 14, 92, wood, [0, height * 0.58, 0], 3);
      for (const side of [-1, 1]) {
        const brace = this.addBox(root, 'scaffold-cross-brace', width * 0.78, 7, 12, this.lightWood, [0, height * 0.32, 38], 2);
        brace.rotation.z = side * 0.56;
      }
      if (type === 'camp-watchtower') {
        const roofLeft = this.addBox(root, 'watchtower-canvas-roof', width * 0.62, 8, 104, this.canvas, [-width * 0.2, height - 8, 0], 4);
        const roofRight = this.addBox(root, 'watchtower-canvas-roof', width * 0.62, 8, 104, this.canvasLight, [width * 0.2, height - 8, 0], 4);
        roofLeft.rotation.z = 0.38;
        roofRight.rotation.z = -0.38;
        this.addLantern(root, 0, height * 0.66, 54, 0.74);
      }
      this.addContactShadow(root, width, { opacity: 0.1 });
    } else if (type === 'timber-hoist') {
      for (const x of [-58, 58]) {
        this.addBox(root, 'hoist-upright', 12, 154, 16, this.darkWood, [x, 77, 0], 4);
      }
      this.addBox(root, 'hoist-crossbeam', 142, 14, 18, wood, [0, 150, 0], 4);
      this.addMesh(root, 'hoist-pulley', new THREE.TorusGeometry(20, 4, 8, 24), this.iron, [24, 128, 14]);
      this.addRopeCurve(root, 'hoist-rope', [
        new THREE.Vector3(24, 128, 14),
        new THREE.Vector3(26, 74, 15),
        new THREE.Vector3(18, 24, 16)
      ], 2);
      const weight = this.addMesh(root, 'hoist-stone-counterweight', new THREE.DodecahedronGeometry(18, 0), stone, [18, 18, 16]);
      weight.scale.y = 1.2;
      this.addContactShadow(root, 132, { opacity: 0.1 });
    } else if (type === 'bramble-gate') {
      for (const side of [-1, 1]) {
        const branch = this.addMesh(root, 'bramble-arched-branch', new THREE.CylinderGeometry(4, 7, 122, 10), this.bark, [side * 38, 52, 0]);
        branch.rotation.z = side * -0.44;
      }
      this.addRopeCurve(root, 'bramble-vine', [
        new THREE.Vector3(-52, 22, 12),
        new THREE.Vector3(0, 112, 18),
        new THREE.Vector3(52, 22, 12)
      ], 3.1).material = this.leafDark;
      for (let index = 0; index < 8; index += 1) {
        this.addLeafCluster(root, -42 + index * 12, 28 + Math.sin(index / 7 * Math.PI) * 66, 14, 0.2, index + definition.x);
      }
    } else if (type === 'creek-reeds') {
      for (let index = 0; index < 12; index += 1) {
        const reed = this.addMesh(
          root,
          'creek-reed',
          new THREE.CylinderGeometry(0.9, 1.5, 34 + index % 4 * 7, 6),
          this.leafDark,
          [(index - 5.5) * 7, 17 + index % 4 * 3.5, index % 3 * 5]
        );
        reed.rotation.z = (variation(index + definition.x) - 0.5) * 0.16;
        const seedHead = this.addMesh(root, 'reed-seed-head', new THREE.SphereGeometry(3, 8, 6), this.barkLight, [reed.position.x, reed.position.y * 2, reed.position.z]);
        seedHead.scale.y = 1.8;
        this.animated.push({ object: reed, baseRotation: reed.rotation.z, phase: index * 0.46, amplitude: 0.04 });
      }
    } else if (type === 'bridge-anchor') {
      this.addStoneStack(root, { width: 82, height: 58, seed: definition.x, moss: true });
      this.addBox(root, 'bridge-anchor-post', 13, 108, 16, this.darkWood, [0, 84, 4], 4);
      const ring = this.addMesh(root, 'bridge-anchor-iron-ring', new THREE.TorusGeometry(14, 3.2, 8, 24), this.iron, [0, 118, 14]);
      ring.rotation.y = Math.PI / 2;
      this.addRopeCurve(root, 'bridge-anchor-tension-rope', [
        new THREE.Vector3(0, 118, 14),
        new THREE.Vector3(42, 98, 18),
        new THREE.Vector3(78, 72, 22)
      ], 2.8);
    } else if (type === 'creek-cascade') {
      for (const [index, x] of [-46, -18, 18, 48].entries()) {
        const rock = this.addMesh(root, 'creek-bank-boulder', new THREE.DodecahedronGeometry(22 + index % 2 * 7, 1), stone, [x, 22 + index % 2 * 10, -4]);
        rock.scale.set(1.2, 0.78, 0.9);
      }
      const cascade = this.addBox(root, 'animated-creek-cascade', 62, 68, 4, this.water, [0, 36, 36], 6);
      cascade.rotation.z = -0.08;
      this.animated.push({
        object: cascade,
        phase: definition.x,
        water: true,
        baseY: cascade.position.y
      });
      for (let index = 0; index < 5; index += 1) {
        const foam = this.addMesh(root, 'cascade-foam', new THREE.SphereGeometry(7 + index % 2 * 3, 12, 8), this.materialFactory(0xcdf2e7), [-24 + index * 12, 4 + index % 2 * 2, 42]);
        foam.scale.set(1.4, 0.42, 0.5);
        foam.material.transparent = true;
        foam.material.opacity = 0.62;
      }
    } else if (type === 'waterwheel') {
      const wheel = new THREE.Group();
      wheel.name = 'working-camp-waterwheel';
      wheel.position.set(0, 62, 8);
      root.add(wheel);
      this.addMesh(wheel, 'waterwheel-rim', new THREE.TorusGeometry(48, 6, 8, 32), this.darkWood);
      for (let index = 0; index < 10; index += 1) {
        const angle = index / 10 * TAU;
        const spoke = this.addBox(wheel, 'waterwheel-spoke', 82, 5, 9, wood, [0, 0, 0], 1.5);
        spoke.rotation.z = angle;
        this.addBox(wheel, 'waterwheel-paddle', 20, 12, 32, this.lightWood, [Math.cos(angle) * 48, Math.sin(angle) * 48, 0], 2).rotation.z = angle;
      }
      this.addMesh(wheel, 'waterwheel-axle', new THREE.CylinderGeometry(9, 9, 44, 14), this.iron).rotation.x = Math.PI / 2;
      this.animated.push({ object: wheel, phase: definition.x, wheel: true });
      this.addStoneStack(root, { width: 112, height: 42, seed: definition.x, moss: true, z: -12 });
    } else if (type === 'reinforced-gate') {
      for (const side of [-1, 1]) {
        const pillar = new THREE.Group();
        pillar.name = 'reinforced-gate-stone-pillar';
        pillar.position.x = side * 52;
        root.add(pillar);
        this.addStoneStack(pillar, {
          width: 44,
          height: 132,
          seed: definition.x + side,
          moss: true,
          z: -8
        });
      }
      this.addBox(root, 'reinforced-gate-lintel', 138, 24, 48, stone, [0, 134, -8], 6);
      for (const side of [-1, 1]) {
        const brace = this.addBox(root, 'reinforced-gate-timber-brace', 112, 10, 14, wood, [0, 78, 26], 3);
        brace.rotation.z = side * 0.68;
      }
      const medallion = this.addMesh(root, 'reinforced-gate-explorer-medallion', new THREE.CylinderGeometry(15, 15, 5, 20), this.brass, [0, 82, 36]);
      medallion.rotation.x = Math.PI / 2;
    }

    return root;
  }

  decorateTerrain({ heightAt, inPit }) {
    const nearGroup = new THREE.Group();
    nearGroup.name = 'MeadowWake_AuthoredTerrainRelief';
    this.world.add(nearGroup);

    for (const [x, drop, size] of TERRAIN_RELIEF_SITES) {
      if (inPit(x)) continue;
      const top = this.height / 2 - heightAt(x) * SCALE;
      const rock = this.addMesh(
        nearGroup,
        'authored-terrain-relief-stone',
        new THREE.DodecahedronGeometry(12 * size, 0),
        this.materials.stone,
        [x * SCALE, top - drop * SCALE, 88]
      );
      rock.scale.set(1.36, 0.72, 0.54);
      rock.rotation.z = (variation(x) - 0.5) * 0.46;
      if (Math.round(x * 10) % 3 === 0) {
        const root = this.addMesh(
          nearGroup,
          'authored-earth-face-root',
          new THREE.CylinderGeometry(2.1, 3.8, 34 * size, 7),
          this.bark,
          [x * SCALE + 11, top - drop * SCALE - 20, 92]
        );
        root.rotation.z = variation(x * 2) > 0.5 ? 0.32 : -0.28;
      }
    }

    for (let index = 0; index < TURF_FRINGE_SITES.length; index += 1) {
      const x = TURF_FRINGE_SITES[index];
      if (inPit(x)) continue;
      const top = this.height / 2 - heightAt(x) * SCALE;
      const cluster = new THREE.Group();
      cluster.name = 'authored-turf-edge-cluster';
      cluster.position.set(x * SCALE, top + 4, 92 + index % 3 * 3);
      nearGroup.add(cluster);
      this.addGrassFringe(cluster, 34 + index % 4 * 5, 0, 0, index + x, 6);
      if (index % 3 === 0) {
        this.addFlower(cluster, 4, 0, 5, FLOWER_COLORS[index % FLOWER_COLORS.length], 0.65 + index % 2 * 0.1);
      }
    }
  }

  buildAuthoredScenery(heightAt) {
    for (const definition of MEADOW_WAKE_SCENERY_PROPS) this.buildProp(definition, heightAt);
    this.sectionGroups = MEADOW_WAKE_SCENERY_BEATS.map(beat => ({
      id: beat.id,
      range: beat.range
    }));
  }

  update(cameraX, deltaSeconds) {
    this.elapsed += Math.min(deltaSeconds, 0.05);
    for (const entry of this.animated) {
      if (entry.pulse) {
        const pulse = 0.92 + Math.sin(this.elapsed * 3.1 + entry.phase) * 0.08;
        entry.object.scale.setScalar(pulse);
        entry.object.material.opacity = 0.12 + Math.sin(this.elapsed * 2.7 + entry.phase) * 0.035;
      } else if (entry.water) {
        entry.object.material.opacity = 0.56 + Math.sin(this.elapsed * 2.2 + entry.phase) * 0.06;
        entry.object.position.y =
          entry.baseY + Math.sin(this.elapsed * 2.8 + entry.phase) * 0.7;
      } else if (entry.wheel) {
        entry.object.rotation.z -= deltaSeconds * 0.34;
      } else {
        entry.object.rotation.z = entry.baseRotation +
          Math.sin(this.elapsed * 1.45 + entry.phase) * entry.amplitude;
      }
    }

    const cameraWorldX = (cameraX + this.width / 2) / SCALE;
    for (const child of this.world.children) {
      const propX = child.position.x / SCALE;
      if (!/_authored-scenery$/.test(child.name)) continue;
      child.visible = Math.abs(propX - cameraWorldX) < 18;
    }
  }
}

export { chamferedBoxGeometry };
