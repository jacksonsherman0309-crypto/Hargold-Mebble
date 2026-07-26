import * as THREE from '../vendor/three/three.module.js';
import { GLTFLoader } from '../vendor/three/loaders/GLTFLoader.js';
import {
  MEADOW_WAKE_BLOCK_DEFINITIONS,
  MEADOW_WAKE_FOREGROUND_PROPS,
  MEADOW_WAKE_PITS,
  MEADOW_WAKE_PLATFORMS,
  MEADOW_WAKE_TERRAIN_POINTS,
  MEADOW_WAKE_WORLD_END,
  createMeadowWakeCoins,
  createMeadowWakeCompassCoins
} from './content/meadow-wake-course.js?v=block-production-1';
import { MeadowWakeEnvironmentArt } from './environment/meadow-wake-environment.js?v=block-production-1';

const MODEL_SPECS = Object.freeze({
  Hargold: Object.freeze({
    url: new URL('../assets/exports/hargold_character.glb?v=continuous-skin-3', import.meta.url).href,
    pixelsPerMetre: 43,
    sideYaw: Math.PI / 2,
    cameraBias: THREE.MathUtils.degToRad(14)
  }),
  Mebble: Object.freeze({
    url: new URL('../assets/exports/mebble_character.glb?v=continuous-skin-3', import.meta.url).href,
    pixelsPerMetre: 40,
    sideYaw: Math.PI / 2,
    cameraBias: THREE.MathUtils.degToRad(14)
  })
});

const FALLBACK_CLIPS = Object.freeze({});

export class CharacterRenderer {
  constructor({ mount, width, height, onProgress = () => {} }) {
    this.width = width;
    this.height = height;
    this.onProgress = onProgress;
    this.models = new Map();
    this.failed = new Set();
    this.courseAssetsReady = false;
    this.environmentArtReady = false;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x78c9e7);
    this.camera = new THREE.OrthographicCamera(
      -width / 2, width / 2, height / 2, -height / 2, 0.1, 2000
    );
    this.camera.position.set(0, 0, 900);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.16;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.className = 'character-layer';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.append(this.renderer.domElement);

    this.scene.fog = new THREE.Fog(0x9fd7d1, 700, 1800);
    this.scene.add(new THREE.HemisphereLight(0xfff4d3, 0x29452f, 2.55));
    const key = new THREE.DirectionalLight(0xffe1b8, 4.8);
    key.position.set(-260, 380, 520);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -900;
    key.shadow.camera.right = 900;
    key.shadow.camera.top = 700;
    key.shadow.camera.bottom = -700;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x91c7ff, 2.4);
    rim.position.set(320, 220, -180);
    this.scene.add(rim);
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.backgroundFar = new THREE.Group();
    this.backgroundMid = new THREE.Group();
    this.scene.add(this.backgroundFar, this.backgroundMid);
    this.collectibleMeshes = [];
    this.blockSlots = [];
    this.blockEffects = [];
    this.blockEffectClock = 0;
    this.blockShakeSeconds = 0;
    this.blockShakeAmplitude = 0;
    this.platformSlots = [];
    this.mobMeshes = new Map();
    this.projectileMeshes = new Map();
    this.loader = new GLTFLoader();
    this.environmentArt = new MeadowWakeEnvironmentArt({
      scene: this.scene,
      world: this.world,
      backgroundFar: this.backgroundFar,
      backgroundMid: this.backgroundMid,
      renderer: this.renderer,
      width,
      height
    });
    this.buildMeadowWake();

    this.loadPromise = Promise.allSettled(
      [
        ...Object.entries(MODEL_SPECS).map(([hero, spec]) => this.loadHero(hero, spec)),
        this.loadMeadowWakeAssets(),
        this.loadEnvironmentTextures()
      ]
    ).then(() => this.onProgress(this.statusText()));
  }

  material(color) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.02 });
  }

  box(name, x, y, width, height, depth, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.name = name;
    mesh.position.set(x, y, 0);
    this.world.add(mesh);
    return mesh;
  }

  terrainSegment(name, x0, x1, top0, top1, material, depth = 170, bottom = -480) {
    const front = depth / 2;
    const back = -depth / 2;
    const vertices = new Float32Array([
      x0, top0, front, x1, top1, front, x0, bottom, front, x1, bottom, front,
      x0, top0, back, x1, top1, back, x0, bottom, back, x1, bottom, back
    ]);
    const indices = [
      0, 2, 1, 1, 2, 3,
      5, 6, 4, 7, 6, 5,
      0, 1, 4, 1, 5, 4,
      2, 6, 3, 3, 6, 7,
      0, 4, 2, 2, 4, 6,
      1, 3, 5, 3, 7, 5
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const uSpan = Math.max(0.18, (x1 - x0) / 180);
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute([
      0, 1, uSpan, 1, 0, 0, uSpan, 0,
      0, 1, uSpan, 1, 0, 0, uSpan, 0
    ], 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.receiveShadow = true;
    this.world.add(mesh);
    return mesh;
  }

  terrainStrip(name, start, end, heightAt, material, scale = 70, depth = 170) {
    const front = depth / 2;
    const back = -depth / 2;
    const bottom = -480;
    const samples = [];
    for (let x = start; x < end; x += 0.25) samples.push(x);
    samples.push(end);
    const vertices = [];
    const uvs = [];
    for (const x of samples) {
      const top = this.height / 2 - heightAt(x) * scale;
      vertices.push(x * scale, top, front, x * scale, bottom, front);
      vertices.push(x * scale, top, back, x * scale, bottom, back);
      const u = (x - start) / 2.35;
      uvs.push(u, 1, u, 0, u, 1, u, 0);
    }
    const indices = [];
    for (let index = 0; index < samples.length - 1; index += 1) {
      const a = index * 4;
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
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.receiveShadow = true;
    this.world.add(mesh);
    return mesh;
  }

  buildPlatformVisual(definition) {
    const scale = 70;
    const root = new THREE.Group();
    root.name = `${definition.id}_${definition.visual}`;
    root.position.set(
      definition.x * scale,
      this.height / 2 - definition.y * scale,
      0
    );
    this.world.add(root);

    const makeBox = (name, width, height, depth, material, x = 0, y = 0, z = 0) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
      mesh.name = name;
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      root.add(mesh);
      return mesh;
    };
    const width = definition.width * scale;
    const height = definition.height * scale;
    const grass = this.environmentArt.turfMaterial;
    const soil = this.environmentArt.soilMaterial;
    const stone = this.environmentArt.stoneMaterial;
    const wood = this.environmentArt.woodMaterial;
    const core = makeBox('platform-soil-core', width, height, 125, soil);
    const cap = makeBox('platform-living-turf', width + 3, 9, 132, grass, 0, height / 2);

    if (['camp-deck', 'timber-lift', 'timber-slat', 'rope-bridge'].includes(definition.visual)) {
      core.visible = false;
      cap.visible = false;
      const plankCount = definition.visual === 'rope-bridge'
        ? Math.max(7, Math.round(width / 18))
        : Math.max(3, Math.round(width / 40));
      const plankWidth = width / plankCount;
      for (let index = 0; index < plankCount; index += 1) {
        const localX = -width / 2 + plankWidth * (index + 0.5);
        const sag = definition.visual === 'rope-bridge'
          ? -Math.sin((index / Math.max(1, plankCount - 1)) * Math.PI) * 14
          : 0;
        const plank = makeBox(
          `${definition.visual}-plank`,
          plankWidth - 2,
          Math.max(12, height),
          116,
          wood,
          localX,
          sag,
          0
        );
        if (definition.visual === 'rope-bridge') {
          plank.rotation.z = -Math.cos((index / Math.max(1, plankCount - 1)) * Math.PI) * 0.08;
        }
      }
      if (definition.visual === 'camp-deck' || definition.visual === 'timber-lift') {
        makeBox('timber-cross-brace', width * 0.7, 8, 18, wood, 0, -height - 15, 56).rotation.z = 0.16;
        makeBox('timber-cross-brace', width * 0.7, 8, 18, wood, 0, -height - 15, 56).rotation.z = -0.16;
      }
      if (definition.visual === 'rope-bridge') {
        for (const side of [-1, 1]) {
          makeBox('bridge-end-post', 9, 78, 12, wood, side * width / 2, 24, 48);
          const rope = new THREE.Mesh(
            new THREE.TorusGeometry(width / 2, 2.2, 6, 36, Math.PI),
            this.material(0x8c6741)
          );
          rope.name = 'bridge-hand-rope';
          rope.rotation.z = side < 0 ? 0 : Math.PI;
          rope.scale.y = 0.3;
          rope.position.set(0, 35, 49);
          root.add(rope);
        }
      }
    } else if (definition.visual === 'fallen-log' || definition.visual === 'seesaw') {
      core.visible = false;
      cap.visible = false;
      const log = new THREE.Mesh(
        new THREE.CylinderGeometry(14, 17, width, 18, 1),
        wood
      );
      log.name = definition.visual;
      log.rotation.z = Math.PI / 2;
      log.castShadow = true;
      log.receiveShadow = true;
      root.add(log);
      makeBox('log-moss-ridge', width * 0.78, 7, 76, grass, 0, 14, 0);
      if (definition.visual === 'seesaw') {
        const pivot = new THREE.Mesh(new THREE.CylinderGeometry(16, 23, 35, 12), stone);
        pivot.name = 'seesaw-stone-pivot';
        pivot.position.set(0, -25, 0);
        root.add(pivot);
      }
    } else if (definition.visual === 'stump') {
      core.visible = false;
      cap.visible = false;
      const stump = new THREE.Mesh(
        new THREE.CylinderGeometry(width * 0.42, width * 0.48, Math.max(28, height + 18), 16),
        wood
      );
      stump.name = 'platform-tree-stump';
      stump.position.y = -4;
      stump.castShadow = true;
      stump.receiveShadow = true;
      root.add(stump);
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(width * 0.38, width * 0.38, 3, 20),
        this.material(0xc99a5e)
      );
      ring.name = 'stump-growth-rings';
      ring.position.y = Math.max(28, height + 18) / 2 - 2;
      root.add(ring);
    } else if (definition.visual === 'ruin-ledge' || definition.visual === 'creek-stone') {
      core.material = stone;
      cap.material = definition.visual === 'ruin-ledge' ? grass : stone;
      const stones = Math.max(2, Math.round(definition.width * 1.4));
      for (let index = 0; index < stones; index += 1) {
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(12 + (index % 3) * 2, 0),
          stone
        );
        rock.name = 'hand-laid-platform-stone';
        rock.scale.set(1.25, 0.72, 1.2);
        rock.position.set(-width / 2 + (index + 0.5) * width / stones, -height * 0.22, 67);
        rock.rotation.z = index % 2 ? 0.18 : -0.11;
        root.add(rock);
      }
    }

    const slot = { ...definition, root, core, cap, imported: null };
    this.platformSlots.push(slot);
    return slot;
  }

  chamferedBlockGeometry(width, height, depth, radius = 5) {
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
      bevelSegments: 2,
      bevelSize: Math.min(2.4, corner * 0.45),
      bevelThickness: 2,
      curveSegments: 3,
      steps: 1
    });
    geometry.center();
    return geometry;
  }

  buildMeadowBlockVisual(definition, centreY) {
    const scale = 70;
    const width = definition.width * scale;
    const height = definition.height * scale;
    const depth = definition.type === 'hargold-only' ? 86 : 82;
    const root = new THREE.Group();
    root.name = `${definition.id}_${definition.type}_production-block`;
    root.position.set(definition.x * scale, centreY, 0);
    this.world.add(root);

    const active = new THREE.Group();
    active.name = `${definition.type}_active-state`;
    const used = new THREE.Group();
    used.name = `${definition.type}_used-solid-state`;
    used.visible = false;
    root.add(active, used);

    const addMesh = (parent, name, geometry, material, position = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = name;
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const standard = (color, roughness = 0.78, metalness = 0.02) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const stonePalette = [0x70543e, 0x806149, 0x624b3a, 0x8b6a4e, 0x594536];
    const timber = standard(0x8a552d, 0.76);
    const darkTimber = standard(0x4c3020, 0.86);
    const moss = standard(0x537a35, 0.94);
    const brass = standard(0xd49a35, 0.32, 0.5);
    const warmGold = standard(0xf4bd35, 0.28, 0.58);
    const frontZ = depth / 2 + 3;

    const addStoneFace = parent => {
      addMesh(
        parent,
        'fieldstone-block-core',
        this.chamferedBlockGeometry(width, height, depth, 6),
        standard(0x392d27, 0.92)
      );
      const cells = [
        [-0.29, 0.27, 0.35, 0.37, -0.06],
        [0.08, 0.3, 0.34, 0.3, 0.08],
        [0.35, 0.22, 0.25, 0.42, -0.08],
        [-0.34, -0.1, 0.28, 0.31, 0.09],
        [-0.04, -0.04, 0.34, 0.39, -0.04],
        [0.31, -0.13, 0.3, 0.28, 0.07],
        [-0.27, -0.37, 0.38, 0.25, -0.05],
        [0.15, -0.37, 0.43, 0.24, 0.04]
      ];
      cells.forEach(([x, y, w, h, angle], index) => {
        const slab = addMesh(
          parent,
          'hand-set-breakable-stone',
          this.chamferedBlockGeometry(width * w, height * h, 9 + index % 3, 3.5),
          standard(stonePalette[index % stonePalette.length], 0.9),
          [x * width, y * height, frontZ]
        );
        slab.rotation.z = angle;
      });
      for (const [x, y, angle, length] of [
        [-0.13, 0.13, 0.75, 14],
        [0.16, 0.01, -0.62, 12],
        [-0.02, -0.23, 0.34, 13]
      ]) {
        const crack = addMesh(
          parent,
          'carved-break-line',
          new THREE.BoxGeometry(length, 2.2, 2.5),
          standard(0x271f1b, 1),
          [x * width, y * height, frontZ + 8]
        );
        crack.rotation.z = angle;
      }
      for (const x of [-0.31, -0.08, 0.21, 0.36]) {
        const tuft = addMesh(
          parent,
          'block-moss-tuft',
          new THREE.DodecahedronGeometry(4.2, 0),
          moss,
          [x * width, height * 0.47, frontZ + 7]
        );
        tuft.scale.set(1.4, 0.55, 0.55);
      }
    };

    const addFrame = (parent, bodyColor, panelColor, usedState = false) => {
      addMesh(
        parent,
        usedState ? 'spent-block-body' : 'reward-block-body',
        this.chamferedBlockGeometry(width, height, depth, 7),
        standard(bodyColor, 0.82)
      );
      addMesh(
        parent,
        'recessed-carved-panel',
        this.chamferedBlockGeometry(width * 0.67, height * 0.65, 10, 4),
        standard(panelColor, usedState ? 0.92 : 0.66),
        [0, 0, frontZ]
      );
      for (const [x, y, w, h] of [
        [0, height * 0.4, width * 0.78, 6],
        [0, -height * 0.4, width * 0.78, 6],
        [-width * 0.4, 0, 6, height * 0.78],
        [width * 0.4, 0, 6, height * 0.78]
      ]) {
        addMesh(parent, 'timber-reward-frame', new THREE.BoxGeometry(w, h, 11), darkTimber, [x, y, frontZ + 3]);
      }
      for (const [x, y] of [
        [-width * 0.37, -height * 0.37],
        [width * 0.37, -height * 0.37],
        [-width * 0.37, height * 0.37],
        [width * 0.37, height * 0.37]
      ]) {
        addMesh(
          parent,
          'forged-corner-rivet',
          new THREE.SphereGeometry(3.6, 10, 7),
          usedState ? standard(0x59564c, 0.7, 0.12) : brass,
          [x, y, frontZ + 9]
        );
      }
    };

    if (definition.type === 'standard-breakable') {
      addStoneFace(active);
    } else if (definition.type === 'hargold-only') {
      addMesh(
        active,
        'reinforced-explorer-stone',
        this.chamferedBlockGeometry(width, height, depth, 7),
        standard(0x55483b, 0.92)
      );
      for (const angle of [-0.72, 0.72]) {
        const brace = addMesh(
          active,
          'reinforced-timber-crossbrace',
          new THREE.BoxGeometry(width * 0.88, 9, 14),
          timber,
          [0, 0, frontZ + 1]
        );
        brace.rotation.z = angle;
      }
      const medallion = addMesh(
        active,
        'hargold-strength-medallion',
        new THREE.CylinderGeometry(14, 14, 6, 20),
        brass,
        [0, 0, frontZ + 10]
      );
      medallion.rotation.x = Math.PI / 2;
      const leaf = addMesh(
        active,
        'original-explorer-leaf-mark',
        new THREE.SphereGeometry(7, 14, 8),
        moss,
        [0, 0, frontZ + 15]
      );
      leaf.scale.set(0.62, 1.15, 0.24);
      leaf.rotation.z = -0.58;
      for (const [x, y] of [
        [-width * 0.38, -height * 0.38],
        [width * 0.38, -height * 0.38],
        [-width * 0.38, height * 0.38],
        [width * 0.38, height * 0.38]
      ]) {
        addMesh(active, 'hargold-block-rivet', new THREE.SphereGeometry(4, 10, 7), brass, [x, y, frontZ + 8]);
      }
    } else {
      const isCoin = definition.type === 'coin';
      addFrame(active, isCoin ? 0x9a6028 : 0x315e3b, isCoin ? 0xd99728 : 0x477c49);
      addFrame(used, 0x514b40, 0x6b675c, true);
      const medallion = addMesh(
        active,
        isCoin ? 'trail-coin-compass-emblem' : 'explorer-power-emblem',
        new THREE.CylinderGeometry(isCoin ? 13 : 12, isCoin ? 13 : 12, 5, 24),
        isCoin ? warmGold : standard(0xd9cf7a, 0.5, 0.08),
        [0, 0, frontZ + 11]
      );
      medallion.rotation.x = Math.PI / 2;
      if (isCoin) {
        addMesh(
          active,
          'coin-compass-ring',
          new THREE.TorusGeometry(9, 1.5, 6, 24),
          standard(0x8b571b, 0.5, 0.22),
          [0, 0, frontZ + 15]
        );
        for (const angle of [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4]) {
          const needle = addMesh(
            active,
            'coin-compass-needle',
            new THREE.BoxGeometry(2.1, angle % (Math.PI / 2) === 0 ? 15 : 12, 2),
            standard(0x8b571b, 0.5, 0.22),
            [0, 0, frontZ + 16]
          );
          needle.rotation.z = angle;
        }
      } else {
        for (const [x, rotation] of [[-4.2, -0.58], [4.2, 0.58]]) {
          const powerLeaf = addMesh(
            active,
            'paired-power-leaf',
            new THREE.SphereGeometry(6.5, 14, 8),
            standard(0x4f7d39, 0.74),
            [x, 0, frontZ + 15]
          );
          powerLeaf.scale.set(0.55, 1.15, 0.24);
          powerLeaf.rotation.z = rotation;
        }
      }
      addMesh(
        used,
        'spent-block-ring',
        new THREE.TorusGeometry(10, 1.8, 6, 24),
        standard(0x45443e, 0.94),
        [0, 0, frontZ + 14]
      );
    }

    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xfff1b5,
      transparent: true,
      opacity: 0.56,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const flash = addMesh(
      root,
      'block-impact-flash',
      this.chamferedBlockGeometry(width + 5, height + 5, 3, 7),
      flashMaterial,
      [0, 0, depth / 2 + 11]
    );
    flash.visible = false;

    const artType = definition.type === 'hargold-only'
      ? 'hargold'
      : definition.type === 'standard-breakable'
        ? 'breakable'
        : definition.type;
    const slot = {
      id: definition.id,
      type: artType,
      gameplayType: definition.type,
      root,
      active,
      used,
      flash,
      placeholder: root,
      baseY: centreY,
      lastImpactSerial: 0,
      wasRevealed: !definition.hidden,
      revealProgress: definition.hidden ? 0 : 1,
      productionVisual: true
    };
    this.blockSlots.push(slot);
    return slot;
  }

  spawnBlockEffect(mesh, {
    life = 0.72,
    velocity = new THREE.Vector3(),
    angularVelocity = new THREE.Vector3(),
    gravity = 520,
    kind = 'debris'
  } = {}) {
    this.world.add(mesh);
    this.blockEffects.push({
      mesh,
      life,
      duration: life,
      velocity,
      angularVelocity,
      gravity,
      kind
    });
  }

  spawnBlockImpact(slot, state) {
    const x = slot.root.position.x;
    const y = slot.root.position.y;
    const z = 98;
    const isBreak = state.impactKind === 'break' || state.impactKind === 'shell-break';
    const dustMaterial = new THREE.MeshStandardMaterial({
      color: 0xb89166,
      roughness: 1,
      transparent: true,
      opacity: 0.8
    });
    for (let index = 0; index < (isBreak ? 10 : 4); index += 1) {
      const angle = (index / (isBreak ? 10 : 4)) * Math.PI * 2 + 0.23;
      const speed = isBreak ? 90 + (index % 4) * 24 : 42 + index * 7;
      const particle = new THREE.Mesh(
        new THREE.DodecahedronGeometry(isBreak ? 4.5 + index % 3 : 2.8, 0),
        dustMaterial.clone()
      );
      particle.name = isBreak ? 'volumetric-block-debris' : 'block-impact-dust';
      particle.position.set(x, y, z + index % 3);
      particle.scale.set(1.1, 0.8, 0.72);
      this.spawnBlockEffect(particle, {
        life: isBreak ? 0.78 : 0.45,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed - 55, (index % 2 ? 1 : -1) * 12),
        angularVelocity: new THREE.Vector3(2 + index, 3 + index * 0.4, 5 - index * 0.2),
        gravity: isBreak ? 560 : 360
      });
    }

    if (state.impactKind === 'coin-reward') {
      const visibleRewardCount = Math.min(3, Math.max(1, Number(state.reward) || 1));
      for (let index = 0; index < visibleRewardCount; index += 1) {
        const coin = new THREE.Mesh(
          new THREE.CylinderGeometry(10, 10, 4, 24),
          new THREE.MeshStandardMaterial({
            color: 0xffca3b,
            emissive: 0x7b4300,
            emissiveIntensity: 0.7,
            roughness: 0.25,
            metalness: 0.62
          })
        );
        coin.name = 'block-reward-coin-pop';
        coin.rotation.x = Math.PI / 2;
        coin.position.set(x + (index - (visibleRewardCount - 1) / 2) * 14, y - 8, z + 8);
        this.spawnBlockEffect(coin, {
          life: 0.86,
          velocity: new THREE.Vector3((index - 1) * 20, 128 + index * 10, 0),
          angularVelocity: new THREE.Vector3(0, 8, 0),
          gravity: 300,
          kind: 'reward'
        });
      }
    } else if (state.impactKind === 'power-reward') {
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(13, 18, 12),
        new THREE.MeshBasicMaterial({
          color: 0xb9ed79,
          transparent: true,
          opacity: 0.76,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      glow.name = 'block-power-leaf-glow';
      glow.position.set(x, y, z + 8);
      this.spawnBlockEffect(glow, {
        life: 0.9,
        velocity: new THREE.Vector3(0, 112, 0),
        gravity: 160,
        kind: 'reward'
      });
    }
    this.blockShakeSeconds = Math.max(this.blockShakeSeconds, isBreak ? 0.2 : 0.1);
    this.blockShakeAmplitude = Math.max(this.blockShakeAmplitude, isBreak ? 5.5 : 2.2);
  }

  updateBlockEffects(deltaSeconds) {
    this.blockEffectClock += deltaSeconds;
    for (const effect of this.blockEffects) {
      effect.life -= deltaSeconds;
      effect.velocity.y -= effect.gravity * deltaSeconds;
      effect.mesh.position.addScaledVector(effect.velocity, deltaSeconds);
      effect.mesh.rotation.x += effect.angularVelocity.x * deltaSeconds;
      effect.mesh.rotation.y += effect.angularVelocity.y * deltaSeconds;
      effect.mesh.rotation.z += effect.angularVelocity.z * deltaSeconds;
      const remaining = Math.max(0, effect.life / effect.duration);
      if (effect.mesh.material?.opacity !== undefined) {
        effect.mesh.material.opacity = Math.min(effect.mesh.material.opacity, remaining);
      }
      if (effect.kind === 'reward') {
        const pulse = 1 + Math.sin((1 - remaining) * Math.PI) * 0.28;
        effect.mesh.scale.setScalar(pulse);
      }
    }
    for (const effect of this.blockEffects.filter(effect => effect.life <= 0)) {
      effect.mesh.removeFromParent();
      effect.mesh.geometry?.dispose();
      effect.mesh.material?.dispose();
    }
    this.blockEffects = this.blockEffects.filter(effect => effect.life > 0);
    this.blockShakeSeconds = Math.max(0, this.blockShakeSeconds - deltaSeconds);
    if (this.blockShakeSeconds === 0) this.blockShakeAmplitude = 0;
  }

  buildMeadowWake() {
    const scale = 70;
    const points = MEADOW_WAKE_TERRAIN_POINTS;
    const inPit = x => MEADOW_WAKE_PITS.some(({ from, to }) => x > from && x < to);
    const heightAt = x => {
      for (let index = 0; index < points.length - 1; index += 1) {
        const [x0, y0] = points[index], [x1, y1] = points[index + 1];
        if (x >= x0 && x <= x1) return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
      }
      return points.at(-1)[1];
    };
    const grass = this.environmentArt.turfMaterial;
    const soil = this.environmentArt.soilMaterial;
    const stone = this.environmentArt.stoneMaterial;
    const wood = this.environmentArt.woodMaterial;
    const gold = new THREE.MeshStandardMaterial({ color: 0xf5bd32, roughness: 0.28, metalness: 0.55 });
    const terrainRuns = [];
    let terrainCursor = 0;
    for (const pit of MEADOW_WAKE_PITS) {
      terrainRuns.push([terrainCursor, pit.from]);
      terrainCursor = pit.to;
    }
    terrainRuns.push([terrainCursor, MEADOW_WAKE_WORLD_END]);
    for (const [start, end] of terrainRuns) {
      this.terrainStrip('authored-continuous-terrain', start, end, heightAt, soil);
    }
    for (let x = 0; x < MEADOW_WAKE_WORLD_END; x += 0.5) {
      const x1 = Math.min(MEADOW_WAKE_WORLD_END, x + 0.5);
      if (inPit(x + 0.25)) continue;
      const top0 = this.height / 2 - heightAt(x) * scale;
      const top1 = this.height / 2 - heightAt(x1) * scale;
      this.terrainSegment('living-grass-rim', x * scale, x1 * scale, top0 + 9, top1 + 9, grass, 178, Math.min(top0, top1) - 4);
      if (x < 10 || Math.round(x * 2) % 4 === 0) {
        for (let detail = 0; detail < 2; detail += 1) {
          const detailX = (x + 0.13 + detail * 0.23) * scale;
          const detailTop = this.height / 2 - heightAt(x + 0.13 + detail * 0.23) * scale;
          const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(9 + ((x * 7 + detail * 3) % 5), 0),
            stone
          );
          rock.name = 'terrain-rock-cladding';
          rock.scale.set(1.25, 0.76, 0.45);
          rock.position.set(detailX, detailTop - 17 - detail * 16, 88);
          rock.rotation.z = (x + detail) * 0.41;
          rock.castShadow = true;
          this.world.add(rock);
        }
      }
    }
    this.environmentArt.decorateCourse({
      heightAt,
      inPit,
      scale,
      courseEnd: MEADOW_WAKE_WORLD_END,
      props: MEADOW_WAKE_FOREGROUND_PROPS
    });
    for (const definition of MEADOW_WAKE_PLATFORMS) this.buildPlatformVisual(definition);

    for (const definition of MEADOW_WAKE_BLOCK_DEFINITIONS) {
      const centreY = this.height / 2 - (heightAt(definition.x) - definition.lift) * scale;
      this.buildMeadowBlockVisual(definition, centreY);
    }
    const visualCoins = createMeadowWakeCoins(heightAt);
    visualCoins.forEach(({ x, y }, index) => {
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 4, 24), gold);
      coin.rotation.x = Math.PI / 2;
      coin.position.set(x * scale, this.height / 2 - y * scale, 35);
      coin.userData = { kind: 'coin', index };
      this.collectibleMeshes.push(coin);
      this.world.add(coin);
    });
    createMeadowWakeCompassCoins().forEach(({ x, y }, index) => {
      const compass = new THREE.Mesh(new THREE.TorusGeometry(18, 5, 10, 32), gold);
      compass.position.set(x * scale, this.height / 2 - y * scale, 35);
      compass.userData = { kind: 'compass', index };
      this.collectibleMeshes.push(compass);
      this.world.add(compass);
    });
    this.addMobProxy('1-1-critter-a', 'camp_critter');
    this.addMobProxy('1-1-shellback-a', 'shellback');
    this.addMobProxy('1-1-critter-b', 'camp_critter');
    this.addMobProxy('1-1-shellback-b', 'shellback');
    this.addMobProxy('1-1-critter-c', 'camp_critter');
    for (const [name, x, color] of [
      ['checkpoint', 70.5, 0xf0b93d],
      ['goal', 123.25, 0x3d8750]
    ]) {
      const groundY = this.height / 2 - heightAt(x) * scale;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(5, 6, 150, 10), wood);
      pole.name = `${name}-pole`;
      pole.position.set(x * scale, groundY + 75, 8);
      this.world.add(pole);
      const banner = this.box(`${name}-banner`, x * scale + 39, groundY + 15, 72, 58, 10, this.material(color));
      banner.position.z = 16;
      const finial = new THREE.Mesh(new THREE.SphereGeometry(10, 14, 10), gold);
      finial.position.set(x * scale, groundY + 155, 8);
      this.world.add(finial);
    }
  }

  addMobProxy(id, type) {
    const group = new THREE.Group();
    group.name = `${id}_3D_behavior_proxy`;
    if (type === 'shellback') {
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(27, 20, 14),
        this.material(0x506f34)
      );
      shell.name = 'shell';
      shell.scale.set(1.18, 0.72, 0.88);
      shell.position.set(-3, 22, 0);
      group.add(shell);
      const shellBand = new THREE.Mesh(
        new THREE.TorusGeometry(21, 3.5, 8, 24),
        this.material(0xd6a744)
      );
      shellBand.name = 'shell-band';
      shellBand.rotation.x = Math.PI / 2;
      shellBand.scale.y = 0.72;
      shellBand.position.set(-3, 22, 21);
      group.add(shellBand);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(12, 16, 10),
        this.material(0xd19a55)
      );
      head.name = 'head';
      head.position.set(25, 19, 4);
      group.add(head);
    } else {
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(23, 20, 14),
        this.material(0x9a5c2d)
      );
      body.name = 'body';
      body.scale.set(1.08, 0.78, 0.82);
      body.position.set(-4, 19, 0);
      group.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(14, 18, 12),
        this.material(0xd59a52)
      );
      head.name = 'head';
      head.position.set(19, 23, 5);
      group.add(head);
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(2.5, 10, 8),
        this.material(0x192018)
      );
      eye.position.set(27, 27, 16);
      group.add(eye);
    }
    const warning = new THREE.Mesh(
      new THREE.ConeGeometry(7, 20, 4),
      new THREE.MeshStandardMaterial({
        color: 0xffdf5d,
        emissive: 0x6a4500,
        emissiveIntensity: 0.8,
        roughness: 0.35
      })
    );
    warning.name = 'warning';
    warning.position.set(0, 75, 10);
    warning.rotation.z = Math.PI;
    warning.visible = false;
    group.add(warning);
    group.visible = false;
    this.mobMeshes.set(id, group);
    this.world.add(group);
  }

  prepareImportedAsset(root) {
    root.traverse(object => {
      object.frustumCulled = false;
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const importedMaterial of materials) {
        if (!importedMaterial) continue;
        importedMaterial.side = THREE.DoubleSide;
        importedMaterial.needsUpdate = true;
      }
    });
    return root;
  }

  async loadMeadowWakeAssets() {
    this.onProgress('Loading Meadow Wake production-intent assets...');
    try {
      const [environmentGltf, critterGltf, shellbackGltf, breakableGltf, hargoldBlockGltf, ledgeGltf] = await Promise.all([
        this.loader.loadAsync(new URL('../assets/exports/world-1/meadow_wake_opening_environment.glb', import.meta.url).href),
        this.loader.loadAsync(new URL('../assets/exports/world-1/camp_critter.glb', import.meta.url).href),
        this.loader.loadAsync(new URL('../assets/exports/world-1/shellback.glb', import.meta.url).href),
        this.loader.loadAsync(new URL('../assets/exports/world-1/breakable_block.glb', import.meta.url).href),
        this.loader.loadAsync(new URL('../assets/exports/world-1/hargold_block.glb', import.meta.url).href),
        this.loader.loadAsync(new URL('../assets/exports/world-1/meadow_ledge.glb', import.meta.url).href)
      ]);
      const environment = this.prepareImportedAsset(environmentGltf.scene);
      environment.name = 'MeadowWake_AuthoredOpeningEnvironment';
      environment.traverse(node => {
        if (/^(TreeCrown|TreeTrunk|MeadowBush)/i.test(node.name)) node.visible = false;
      });
      environment.scale.setScalar(70);
      environment.position.set(0, this.height / 2 - 7.9 * 70, -12);
      this.world.add(environment);

      const templates = {
        camp_critter: this.prepareImportedAsset(critterGltf.scene),
        shellback: this.prepareImportedAsset(shellbackGltf.scene)
      };
      for (const [id, group] of this.mobMeshes) {
        const type = id.includes('shellback') ? 'shellback' : 'camp_critter';
        const warning = group.getObjectByName('warning');
        for (const child of [...group.children]) {
          if (child !== warning) group.remove(child);
        }
        const model = templates[type].clone(true);
        model.name = type === 'shellback' ? 'ShellbackVisual' : 'CampCritterVisual';
        model.scale.setScalar(type === 'shellback' ? 58 : 54);
        model.rotation.y = Math.PI / 2;
        group.add(model);
      }
      const blockTemplates = {
        breakable: this.prepareImportedAsset(breakableGltf.scene),
        hargold: this.prepareImportedAsset(hargoldBlockGltf.scene)
      };
      for (const slot of this.blockSlots) {
        if (slot.productionVisual) continue;
        if (!blockTemplates[slot.type]) continue;
        const importedBlock = blockTemplates[slot.type].clone(true);
        importedBlock.name = slot.type === 'hargold' ? 'HargoldOnlyBlockVisual' : 'BreakableBlockVisual';
        const blockDefinition = MEADOW_WAKE_BLOCK_DEFINITIONS.find(block => block.id === slot.id);
        const renderedSize = (blockDefinition?.height ?? 0.74) * 70;
        importedBlock.scale.setScalar(renderedSize);
        importedBlock.position.set(
          slot.placeholder.position.x,
          slot.placeholder.position.y - renderedSize / 2,
          slot.placeholder.position.z + 4
        );
        importedBlock.rotation.y = slot.type === 'breakable' ? Math.PI : 0;
        slot.placeholder.visible = false;
        slot.visual = importedBlock;
        slot.baseY = importedBlock.position.y;
        this.world.add(importedBlock);
      }
      const ledgeTemplate = this.prepareImportedAsset(ledgeGltf.scene);
      for (const slot of this.platformSlots) {
        if (slot.visual !== 'turf-ledge') continue;
        const ledge = ledgeTemplate.clone(true);
        ledge.name = 'AuthoredMeadowLedgeVisual';
        this.environmentArt.applyLedgeMaterials(ledge);
        ledge.scale.set(70 * slot.width / 2, 70, 70);
        ledge.position.set(0, -slot.height * 35, 2);
        slot.core.visible = false;
        slot.cap.visible = false;
        slot.root.add(ledge);
        slot.imported = ledge;
      }
      this.courseAssetsReady = true;
      this.onProgress(this.statusText());
    } catch (error) {
      console.error('Unable to load Meadow Wake production-intent assets', error);
      this.failed.add('Meadow Wake art kit');
      this.onProgress(this.statusText());
    }
  }

  async loadEnvironmentTextures() {
    this.onProgress('Loading Meadow Wake valley and terrain textures...');
    try {
      await this.environmentArt.loadTextures();
      this.environmentArtReady = true;
      this.onProgress(this.statusText());
    } catch (error) {
      console.error('Unable to load Meadow Wake environment textures', error);
      this.failed.add('Meadow Wake environment textures');
      this.onProgress(this.statusText());
    }
  }

  async loadHero(hero, spec) {
    this.onProgress(`Loading ${hero} 3D model...`);
    try {
      const gltf = await this.loader.loadAsync(spec.url);
      const root = gltf.scene;
      root.name = `${hero}_runtime`;
      const rightFacingYaw = spec.sideYaw - spec.cameraBias;
      root.rotation.y = rightFacingYaw;
      root.scale.setScalar(spec.pixelsPerMetre);
      root.visible = false;
      root.traverse(object => {
        object.frustumCulled = false;
        if (!object.isMesh) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (!material) continue;
          material.side = THREE.DoubleSide;
          material.needsUpdate = true;
        }
      });
      this.scene.add(root);
      const mixer = new THREE.AnimationMixer(root);
      const clips = new Map(gltf.animations.map(clip => [clip.name, clip]));
      this.models.set(hero, {
        root,
        mixer,
        clips,
        action: null,
        actionName: '',
        baseScale: spec.pixelsPerMetre,
        currentYaw: rightFacingYaw,
        rightFacingYaw,
        leftFacingYaw: -spec.sideYaw + spec.cameraBias
      });
      this.onProgress(this.statusText());
    } catch (error) {
      this.failed.add(hero);
      console.error(`Unable to load ${hero} GLB`, error);
      this.onProgress(this.statusText());
    }
  }

  statusText() {
    if (
      this.models.size === Object.keys(MODEL_SPECS).length
      && this.courseAssetsReady
      && this.environmentArtReady
    ) {
      return '3D characters + layered Meadow Wake environment ready';
    }
    if (this.failed.size) return `3D fallback active (${[...this.failed].join(', ')} failed)`;
    return `Loading 3D characters ${this.models.size}/${Object.keys(MODEL_SPECS).length}`;
  }

  isReady(hero) {
    return this.models.has(hero);
  }

  selectClip(hero, locomotion, glide) {
    if (hero === 'Mebble' && glide !== 'closed') {
      if (glide === 'opening') return 'glide-open';
      if (glide === 'closing') return 'glide-close';
      return 'glide-sustain';
    }
    return FALLBACK_CLIPS[locomotion] || locomotion || 'idle';
  }

  play(model, requestedName, horizontalSpeed = 0) {
    const name = model.clips.has(requestedName) ? requestedName : 'idle';
    if (model.actionName !== name) {
      const next = model.mixer.clipAction(model.clips.get(name));
      next.reset();
      next.enabled = true;
      next.setEffectiveWeight(1);
      next.play();
      const blendSeconds = ['skid', 'wall-jump', 'hurt'].includes(name) ? 0.08 : 0.12;
      if (model.action) model.action.crossFadeTo(next, blendSeconds, true);
      model.action = next;
      model.actionName = name;
    }
    if (model.action) {
      const authoredSpeed = name === 'walk' ? 3.2 : name === 'run' ? 5.7 : name === 'sprint' ? 7.15 : 0;
      model.action.setEffectiveTimeScale(
        authoredSpeed ? THREE.MathUtils.clamp(Math.abs(horizontalSpeed) / authoredSpeed, 0.65, 1.35) : 1
      );
    }
  }

  updateMobs(mobs, deltaSeconds) {
    const activeProjectiles = new Set();
    for (const mob of mobs) {
      const group = this.mobMeshes.get(mob.id);
      if (!group) continue;
      group.visible = Boolean(mob.activated) && (mob.alive || mob.defeatedSeconds <= 0.45);
      if (!group.visible) continue;
      group.position.set(mob.x * 70, this.height / 2 - mob.y * 70, 42);
      group.scale.x = mob.direction < 0 ? -1 : 1;
      const shellShape = ['shell-idle', 'shell-wake', 'shell-roll'].includes(mob.state);
      const head = group.getObjectByName('head') || group.getObjectByName('ShellbackHead');
      if (head) head.visible = mob.type !== 'shellback' || !shellShape;
      const warning = group.getObjectByName('warning');
      if (warning) warning.visible = Boolean(mob.warning);
      if (mob.type === 'shellback') {
        group.rotation.z = mob.state === 'shell-roll'
          ? group.rotation.z + mob.direction * deltaSeconds * 10
          : 0;
        group.scale.y = shellShape ? 0.82 : 1;
      }
      const opacity = mob.alive ? 1 : Math.max(0, 1 - mob.defeatedSeconds / 0.45);
      group.traverse(object => {
        if (!object.isMesh) return;
        object.material.transparent = opacity < 1;
        object.material.opacity = opacity;
      });
    }
    return activeProjectiles;
  }

  updateProjectiles(projectiles) {
    const active = new Set();
    for (const projectile of projectiles) {
      active.add(projectile.id);
      let mesh = this.projectileMeshes.get(projectile.id);
      if (!mesh) {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(Math.max(7, projectile.radius * 70), 14, 10),
          new THREE.MeshStandardMaterial({
            color: projectile.variant === 'acorn' ? 0x76502d : 0xef8a35,
            emissive: projectile.variant === 'acorn' ? 0x000000 : 0x7a2508,
            emissiveIntensity: 0.6,
            roughness: 0.45
          })
        );
        mesh.name = `${projectile.id}_3D_projectile`;
        this.projectileMeshes.set(projectile.id, mesh);
        this.world.add(mesh);
      }
      mesh.visible = projectile.alive;
      mesh.position.set(projectile.x * 70, this.height / 2 - projectile.y * 70, 58);
    }
    for (const [id, mesh] of this.projectileMeshes) {
      if (!active.has(id)) mesh.visible = false;
    }
  }

  updateBlocks(blocks, deltaSeconds) {
    const states = new Map(blocks.map(block => [block.id, block]));
    for (const slot of this.blockSlots) {
      const state = states.get(slot.id);
      if (!state) continue;
      const visual = slot.root || slot.visual || slot.placeholder;
      if ((state.impactSerial ?? 0) < slot.lastImpactSerial) {
        slot.lastImpactSerial = 0;
      }
      if ((state.impactSerial ?? 0) > slot.lastImpactSerial) {
        slot.lastImpactSerial = state.impactSerial;
        this.spawnBlockImpact(slot, state);
      }

      const revealed = !state.hidden || state.revealed;
      if (revealed && !slot.wasRevealed) slot.revealProgress = 0;
      slot.wasRevealed = revealed;
      slot.revealProgress = revealed
        ? Math.min(1, (slot.revealProgress ?? 1) + deltaSeconds * 8.5)
        : 0;
      visual.visible = !state.broken && revealed;
      if (!visual.visible) continue;
      const bump = state.bumpSeconds ?? 0;
      const duration = Math.max(0.001, state.bumpDuration ?? 0.18);
      const bumpProgress = bump > 0 ? 1 - bump / duration : 1;
      const bumpOffset = bump > 0 ? Math.sin(bumpProgress * Math.PI) * 11 : 0;
      visual.position.y = slot.baseY + bumpOffset;
      const revealEase = 1 - Math.pow(1 - slot.revealProgress, 3);
      const bumpSquash = bump > 0 ? Math.sin(bumpProgress * Math.PI) : 0;
      visual.scale.set(
        revealEase * (1 + bumpSquash * 0.06),
        revealEase * (1 - bumpSquash * 0.08),
        revealEase
      );
      if (slot.active && slot.used) {
        slot.active.visible = !state.consumed;
        slot.used.visible = Boolean(state.consumed);
      }
      if (slot.flash) {
        slot.flash.visible = (state.flashSeconds ?? 0) > 0;
        slot.flash.material.opacity = Math.min(0.62, (state.flashSeconds ?? 0) * 3.9);
      }
    }
  }

  updatePlatforms(platforms) {
    const states = new Map(platforms.map(platform => [platform.id, platform]));
    for (const slot of this.platformSlots) {
      const state = states.get(slot.id);
      if (!state) continue;
      slot.root.position.x = state.x * 70;
      slot.root.position.y = this.height / 2 - state.y * 70;
      slot.root.rotation.z = -(state.angle ?? 0);
    }
  }

  render({
    hero,
    screenX,
    screenY,
    facing,
    locomotion,
    glide,
    horizontalSpeed = 0,
    cameraX = 0,
    coins = [],
    compassCoins = [],
    blocks = [],
    platforms = [],
    mobs = [],
    projectiles = []
  }, deltaSeconds) {
    this.updateBlockEffects(deltaSeconds);
    const shakeRatio = Math.min(1, this.blockShakeSeconds / 0.2);
    const shakeX = Math.sin(this.blockEffectClock * 91) * this.blockShakeAmplitude * shakeRatio;
    const shakeY = Math.cos(this.blockEffectClock * 77) * this.blockShakeAmplitude * 0.55 * shakeRatio;
    this.world.position.x = -cameraX - this.width / 2 + shakeX;
    this.world.position.y = shakeY;
    this.environmentArt.update(cameraX, deltaSeconds);
    for (const mesh of this.collectibleMeshes) {
      const source = mesh.userData.kind === 'coin' ? coins[mesh.userData.index] : compassCoins[mesh.userData.index];
      mesh.visible = !source?.taken;
      mesh.rotation.y += deltaSeconds * 2.7;
    }
    this.updateBlocks(blocks, deltaSeconds);
    this.updatePlatforms(platforms);
    this.updateMobs(mobs, deltaSeconds);
    this.updateProjectiles(projectiles);
    for (const [modelHero, model] of this.models) {
      const active = modelHero === hero;
      model.root.visible = active;
      if (!active) continue;
      const direction = facing < 0 ? -1 : 1;
      model.root.scale.setScalar(model.baseScale);
      const targetYaw = direction < 0 ? model.leftFacingYaw : model.rightFacingYaw;
      const yawDelta = Math.atan2(
        Math.sin(targetYaw - model.currentYaw),
        Math.cos(targetYaw - model.currentYaw)
      );
      const turnResponsiveness = ['skid', 'turn-low'].includes(locomotion) ? 15 : 10;
      model.currentYaw += yawDelta * (1 - Math.exp(-turnResponsiveness * deltaSeconds));
      model.root.rotation.y = model.currentYaw;
      model.root.position.set(
        screenX - this.width / 2,
        this.height / 2 - screenY,
        110
      );
      this.play(model, this.selectClip(hero, locomotion, glide), horizontalSpeed);
      model.mixer.update(deltaSeconds);
    }
    this.renderer.render(this.scene, this.camera);
  }
}
