import * as THREE from '../../vendor/three/three.module.js';
import { MEADOW_WAKE_TERRAIN_POINTS } from '../content/meadow-wake-course.js?v=visual-rebuild-opening-2';

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

function material(color, roughness = 0.9, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function leafGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -7);
  shape.bezierCurveTo(7, -4, 8, 4, 0, 11);
  shape.bezierCurveTo(-8, 4, -7, -4, 0, -7);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1.7,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.7,
    bevelThickness: 0.55,
    curveSegments: 6
  });
  geometry.center();
  return geometry;
}

function barkPlateGeometry(width = 11, height = 26, seed = 1) {
  const shape = new THREE.Shape();
  const wobble = value => Math.sin(seed * 2.13 + value * 1.77) * 1.6;
  shape.moveTo(-width / 2 + wobble(0), -height / 2);
  shape.lineTo(width / 2 + wobble(1), -height / 2 + 2);
  shape.lineTo(width / 2 + wobble(2), height / 2 - 3);
  shape.lineTo(width * 0.1 + wobble(3), height / 2);
  shape.lineTo(-width / 2 + wobble(4), height / 2 - 2);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 2.4,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.8,
    bevelThickness: 0.7
  });
  geometry.center();
  return geometry;
}

function organicTube(points, radii, sides = 9, seed = 1) {
  const path = points.map(point => new THREE.Vector3(...point));
  const positions = [];
  const indices = [];
  for (let i = 0; i < path.length; i += 1) {
    const previous = path[Math.max(0, i - 1)];
    const next = path[Math.min(path.length - 1, i + 1)];
    const tangent = next.clone().sub(previous).normalize();
    const reference = Math.abs(tangent.z) < 0.8 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, reference).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    for (let side = 0; side < sides; side += 1) {
      const angle = side / sides * Math.PI * 2;
      const radius = radii[Math.min(i, radii.length - 1)] * (1 + Math.sin(seed + i * 2.2 + side * 1.4) * 0.08);
      const point = path[i].clone()
        .add(normal.clone().multiplyScalar(Math.cos(angle) * radius))
        .add(binormal.clone().multiplyScalar(Math.sin(angle) * radius));
      positions.push(point.x, point.y, point.z);
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
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addMesh(parent, name, geometry, mat, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export class MeadowWakeOpeningPolish {
  constructor({ world, height }) {
    this.world = world;
    this.height = height;
    this.root = new THREE.Group();
    this.root.name = 'MeadowWake_OpeningPolishV2';
    world.add(this.root);
    this.deepLeaf = material(0x1f4826, 0.98);
    this.midLeaf = material(0x39743a, 0.96);
    this.lightLeaf = material(0x6aa647, 0.94);
    this.bark = material(0x4b2c1d, 0.98);
    this.barkLight = material(0x704127, 0.95);
    this.rope = material(0x8a6943, 1);
    this.iron = material(0x2c2925, 0.7, 0.25);
    this.warmGlow = new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xffa62b, emissiveIntensity: 1.6, roughness: 0.5 });
  }

  groundY(x) {
    return this.height / 2 - terrainHeightAt(x) * SCALE;
  }

  build() {
    this.replaceBlobCanopyRead();
    this.addElderBarkAndVines();
    this.addCampJoineryAndLanterns();
    this.addForegroundLeafCurtain();
  }

  replaceBlobCanopyRead() {
    this.world.traverse(object => {
      if (object.isMesh && object.name === 'production-elder-leaf-mass') object.visible = false;
    });

    const elder = new THREE.Group();
    elder.name = 'ProductionElderLeafArchitecture';
    elder.position.set(13.7 * SCALE, this.groundY(13.7), -75);
    this.root.add(elder);

    const branchSets = [
      [[-70, -176, 0], [-112, -222, 1], [-168, -246, -2]],
      [[-38, -210, 0], [-12, -264, -3], [20, -302, -5]],
      [[18, -214, 0], [66, -252, 1], [104, -286, -2]],
      [[78, -194, 0], [126, -220, 1], [166, -248, 0]],
      [[120, -168, 0], [166, -183, 1], [202, -206, 0]]
    ];
    branchSets.forEach((points, index) => {
      addMesh(elder, 'production-fine-canopy-branch', organicTube(points, [10, 7, 3], 9, 50 + index), index % 2 ? this.barkLight : this.bark);
    });

    const leaf = leafGeometry();
    const instances = 156;
    const palettes = [this.deepLeaf, this.midLeaf, this.lightLeaf];
    for (let paletteIndex = 0; paletteIndex < palettes.length; paletteIndex += 1) {
      const instanced = new THREE.InstancedMesh(leaf, palettes[paletteIndex], Math.ceil(instances / 3));
      instanced.name = 'production-individual-elder-leaves';
      instanced.castShadow = true;
      const dummy = new THREE.Object3D();
      let count = 0;
      for (let i = paletteIndex; i < instances; i += 3) {
        const band = i % 5;
        const t = i / instances;
        const centerX = -150 + (i * 71 % 350);
        const centerY = -250 - Math.sin(t * Math.PI) * 80 + band * 7;
        const spreadX = Math.sin(i * 1.91) * 25;
        const spreadY = Math.cos(i * 1.37) * 22;
        dummy.position.set(centerX + spreadX, centerY + spreadY, 12 + (i % 7) * 5);
        dummy.rotation.set(0.1 * Math.sin(i), 0.35 * Math.sin(i * 0.7), -1.1 + (i % 11) * 0.2);
        const scale = 0.8 + (i % 6) * 0.09;
        dummy.scale.set(scale * (0.8 + (i % 3) * 0.12), scale, scale * 0.55);
        dummy.updateMatrix();
        instanced.setMatrixAt(count, dummy.matrix);
        count += 1;
      }
      instanced.count = count;
      elder.add(instanced);
    }
  }

  addElderBarkAndVines() {
    const elder = new THREE.Group();
    elder.name = 'ProductionElderSurfaceDetail';
    elder.position.set(13.7 * SCALE, this.groundY(13.7), -34);
    this.root.add(elder);

    for (let i = 0; i < 22; i += 1) {
      const y = -18 - i * 13;
      const x = -68 + Math.sin(i * 1.73) * 15;
      const plate = addMesh(elder, 'production-bark-plate', barkPlateGeometry(10 + i % 4 * 2, 21 + i % 3 * 4, 100 + i), i % 3 ? this.barkLight : this.bark, [x, y, 31]);
      plate.rotation.z = -0.08 + Math.sin(i) * 0.17;
      plate.rotation.y = Math.sin(i * 0.8) * 0.22;
    }

    for (let i = 0; i < 4; i += 1) {
      const vine = addMesh(elder, 'production-elder-vine', organicTube([
        [-55 + i * 13, -40, 38], [-46 + i * 10, -100, 41], [-58 + i * 14, -162, 39], [-34 + i * 12, -224, 42]
      ], [2.1, 1.8, 1.3, 0.8], 7, 150 + i), this.midLeaf);
      vine.castShadow = false;
    }
  }

  addCampJoineryAndLanterns() {
    const camp = new THREE.Group();
    camp.name = 'ProductionOpeningCampDetailV2';
    camp.position.set(2.5 * SCALE, this.groundY(2.5) - 6, -20);
    this.root.add(camp);

    for (const [x, y, angle] of [[-100, -62, 0.54], [-56, -67, -0.48], [25, -65, 0.52], [72, -63, -0.5]]) {
      const brace = addMesh(camp, 'production-camp-diagonal-joinery', new THREE.BoxGeometry(10, 92, 12), this.barkLight, [x, y, 8]);
      brace.rotation.z = angle;
    }

    for (const x of [-118, 96]) {
      const cord = addMesh(camp, 'production-lantern-cord', new THREE.CylinderGeometry(1.4, 1.4, 54, 8), this.rope, [x, -66, 23]);
      const frame = addMesh(camp, 'production-lantern-frame', new THREE.CylinderGeometry(10, 12, 25, 8), this.iron, [x, -34, 23]);
      frame.scale.set(0.8, 1, 0.65);
      addMesh(camp, 'production-lantern-glow', new THREE.SphereGeometry(7, 14, 9), this.warmGlow, [x, -34, 23]);
      cord.castShadow = false;
    }

    for (let i = 0; i < 5; i += 1) {
      const rope = addMesh(camp, 'production-awning-seam-rope', new THREE.CylinderGeometry(1.1, 1.1, 205, 7), this.rope, [-110 + i * 50, -134, 28]);
      rope.rotation.z = Math.PI / 2;
      rope.rotation.y = -0.1 + i * 0.05;
      rope.castShadow = false;
    }
  }

  addForegroundLeafCurtain() {
    const leaf = leafGeometry();
    const sites = [0.4, 1.1, 3.4, 5.1, 8.1, 9.7, 12.2, 15.1, 17.2, 19.7];
    sites.forEach((x, siteIndex) => {
      const group = new THREE.Group();
      group.name = 'ProductionForegroundLeafSpray';
      group.position.set(x * SCALE, this.groundY(x) + 1, 86);
      this.root.add(group);
      for (let i = 0; i < 8; i += 1) {
        const mesh = addMesh(group, 'production-individual-ground-leaf', leaf.clone(), i % 3 === 0 ? this.lightLeaf : i % 2 ? this.midLeaf : this.deepLeaf, [Math.sin(i * 1.7) * 15, -10 - Math.abs(Math.cos(i)) * 9, i % 3 * 3]);
        mesh.rotation.z = -1.1 + i * 0.31;
        mesh.rotation.y = Math.sin(i * 0.9) * 0.4;
        mesh.scale.set(0.35 + (i % 3) * 0.08, 0.65 + (siteIndex % 3) * 0.08, 0.35);
      }
    });
  }
}
