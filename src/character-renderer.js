import * as THREE from '../vendor/three/three.module.js';
import { GLTFLoader } from '../vendor/three/loaders/GLTFLoader.js';
import {
  MEADOW_WAKE_BLOCK_DEFINITIONS,
  MEADOW_WAKE_PLATFORMS
} from './content/meadow-wake-course.js?v=course-interactions-1';

const MODEL_SPECS = Object.freeze({
  Hargold: Object.freeze({
    url: new URL('../assets/exports/hargold_character.glb', import.meta.url).href,
    pixelsPerMetre: 43,
    yaw: Math.PI / 2
  }),
  Mebble: Object.freeze({
    url: new URL('../assets/exports/mebble_character.glb', import.meta.url).href,
    pixelsPerMetre: 40,
    yaw: Math.PI / 2
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
    this.platformSlots = [];
    this.mobMeshes = new Map();
    this.projectileMeshes = new Map();
    this.loader = new GLTFLoader();
    this.buildMeadowWake();

    this.loadPromise = Promise.allSettled(
      [
        ...Object.entries(MODEL_SPECS).map(([hero, spec]) => this.loadHero(hero, spec)),
        this.loadMeadowWakeAssets()
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
    for (const x of samples) {
      const top = this.height / 2 - heightAt(x) * scale;
      vertices.push(x * scale, top, front, x * scale, bottom, front);
      vertices.push(x * scale, top, back, x * scale, bottom, back);
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
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.receiveShadow = true;
    this.world.add(mesh);
    return mesh;
  }

  buildMeadowWake() {
    const scale = 70;
    const points = [[0, 7.9], [5, 7.9], [8, 7.25], [12, 7.85], [16, 7.15], [20, 7.75], [24, 7.1], [28, 7.8], [32, 7.25], [36, 7.8]];
    const pits = [[9.4, 10.8], [21.1, 22.7], [30.1, 31.5]];
    const inPit = x => pits.some(([from, to]) => x > from && x < to);
    const heightAt = x => {
      for (let index = 0; index < points.length - 1; index += 1) {
        const [x0, y0] = points[index], [x1, y1] = points[index + 1];
        if (x >= x0 && x <= x1) return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
      }
      return points.at(-1)[1];
    };
    const grass = this.material(0x5f9d42), soil = this.material(0x4a3423);
    const stone = this.material(0x53605a), wood = this.material(0x704523), leaf = this.material(0x2f6c35);
    const gold = new THREE.MeshStandardMaterial({ color: 0xf5bd32, roughness: 0.28, metalness: 0.55 });
    for (const [start, end] of [[0, 9.4], [10.8, 21.1], [22.7, 30.1], [31.5, 36]]) {
      this.terrainStrip('authored-continuous-terrain', start, end, heightAt, soil);
    }
    for (let x = 0; x < 36; x += 0.5) {
      const x1 = Math.min(36, x + 0.5);
      if (inPit(x + 0.25)) continue;
      const top0 = this.height / 2 - heightAt(x) * scale;
      const top1 = this.height / 2 - heightAt(x1) * scale;
      this.terrainSegment('living-grass-rim', x * scale, x1 * scale, top0 + 9, top1 + 9, grass, 178, Math.min(top0, top1) - 4);
      if (x < 10 || Math.round(x * 2) % 3 === 0) {
        for (let detail = 0; detail < 2; detail += 1) {
          const detailX = (x + 0.13 + detail * 0.23) * scale;
          const detailTop = this.height / 2 - heightAt(x + 0.13 + detail * 0.23) * scale;
          const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(9 + ((x * 7 + detail * 3) % 5), 0),
            this.material(detail % 2 ? 0x59442f : 0x6b5035)
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
    for (const x of [2.2, 5.8, 12.4, 17.2, 25.6, 33.8]) {
      const top = this.height / 2 - heightAt(x) * scale;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(16, 23, 150, 10), wood);
      trunk.position.set(x * scale, top - 75, -135);
      this.world.add(trunk);
      for (const [offsetX, offsetY, radius] of [[0, -34, 62], [-42, -4, 47], [43, 0, 50]]) {
        const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 2), leaf);
        crown.position.set(x * scale + offsetX, top + offsetY, -138);
        this.world.add(crown);
      }
    }
    for (const { id, x, y, width, height } of MEADOW_WAKE_PLATFORMS) {
      const core = this.box('authored-platform', x * scale, this.height / 2 - y * scale, width * scale, height * scale, 125, stone);
      const cap = this.box('platform-grass', x * scale, this.height / 2 - y * scale + height * scale / 2, width * scale + 2, 9, 130, grass);
      this.platformSlots.push({ id, x, y, width, height, core, cap });
    }
    for (let x = 18.3; x <= 20.1; x += .24) {
      const plank = this.box('rope-bridge-plank', x * scale, this.height / 2 - 6.25 * scale + Math.sin((x - 18.3) * Math.PI) * 16, 15, 12, 105, wood);
      plank.rotation.z = Math.cos((x - 18.3) * Math.PI) * .08;
    }
    for (const definition of MEADOW_WAKE_BLOCK_DEFINITIONS) {
      const { id, type, x, lift, width, height } = definition;
      const artType = type === 'hargold-only' ? 'hargold' : 'breakable';
      const centreY = this.height / 2 - (heightAt(x) - lift) * scale;
      const block = this.box(
        type,
        x * scale,
        centreY,
        width * scale,
        height * scale,
        type === 'hargold-only' ? 86 : 82,
        type === 'hargold-only' ? this.material(0x6d553c) : stone
      );
      this.blockSlots.push({
        id,
        type: artType,
        gameplayType: type,
        placeholder: block,
        baseY: centreY
      });
    }
    [3.5, 6.8, 8.7, 12.5, 15.2, 18.4, 23.5, 26.2, 29.1, 33.2].forEach((x, index) => {
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 4, 24), gold);
      coin.rotation.x = Math.PI / 2;
      coin.position.set(x * scale, this.height / 2 - (heightAt(x) - (index % 3 === 0 ? 1.55 : .8)) * scale, 35);
      coin.userData = { kind: 'coin', index };
      this.collectibleMeshes.push(coin);
      this.world.add(coin);
    });
    [[8.9, 2.2], [24.4, 2.4], [34.2, 1.7]].forEach(([x, lift], index) => {
      const compass = new THREE.Mesh(new THREE.TorusGeometry(18, 5, 10, 32), gold);
      compass.position.set(x * scale, this.height / 2 - (heightAt(x) - lift) * scale, 35);
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
      ['checkpoint', 18, 0xf0b93d],
      ['goal', 35.35, 0x3d8750]
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
    const farMountain = this.material(0x91aaa1);
    const midMountain = this.material(0x587e61);
    for (let x = -500; x < 3200; x += 380) {
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(240, 520, 9), farMountain);
      mountain.position.set(x, 105 + (x % 3) * 12, -720);
      mountain.rotation.y = x * 0.007;
      this.backgroundFar.add(mountain);
    }
    for (let x = -350; x < 3200; x += 310) {
      const hill = new THREE.Mesh(new THREE.IcosahedronGeometry(190, 2), midMountain);
      hill.scale.set(1.3, 0.72, 0.45);
      hill.position.set(x, -130 + (x % 4) * 9, -610);
      this.backgroundMid.add(hill);
    }
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xf7fbf1,
      roughness: 1,
      transparent: true,
      opacity: 0.78
    });
    for (let x = -300; x < 2700; x += 520) {
      const cloud = new THREE.Group();
      for (const [dx, radius] of [[-55, 42], [0, 62], [58, 38]]) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), cloudMaterial);
        puff.scale.y = 0.55;
        puff.position.x = dx;
        cloud.add(puff);
      }
      cloud.position.set(x, 245 + (x % 5) * 9, -760);
      this.backgroundFar.add(cloud);
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
        const ledge = ledgeTemplate.clone(true);
        ledge.name = 'AuthoredMeadowLedgeVisual';
        ledge.scale.set(70 * slot.width / 2, 70, 70);
        ledge.position.set(
          slot.x * 70,
          this.height / 2 - slot.y * 70 - slot.height * 35,
          2
        );
        slot.core.visible = false;
        slot.cap.visible = false;
        this.world.add(ledge);
      }
      this.courseAssetsReady = true;
      this.onProgress(this.statusText());
    } catch (error) {
      console.error('Unable to load Meadow Wake production-intent assets', error);
      this.failed.add('Meadow Wake art kit');
      this.onProgress(this.statusText());
    }
  }

  async loadHero(hero, spec) {
    this.onProgress(`Loading ${hero} 3D model...`);
    try {
      const gltf = await this.loader.loadAsync(spec.url);
      const root = gltf.scene;
      root.name = `${hero}_runtime`;
      root.rotation.y = spec.yaw;
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
        baseScale: spec.pixelsPerMetre
      });
      this.onProgress(this.statusText());
    } catch (error) {
      this.failed.add(hero);
      console.error(`Unable to load ${hero} GLB`, error);
      this.onProgress(this.statusText());
    }
  }

  statusText() {
    if (this.models.size === Object.keys(MODEL_SPECS).length && this.courseAssetsReady) {
      return '3D characters + Meadow Wake art kit ready';
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

  updateBlocks(blocks) {
    const states = new Map(blocks.map(block => [block.id, block]));
    for (const slot of this.blockSlots) {
      const state = states.get(slot.id);
      const visual = slot.visual || slot.placeholder;
      visual.visible = !state?.broken;
      if (!visual.visible) continue;
      const bump = state?.bumpSeconds ?? 0;
      visual.position.y = slot.baseY + (bump > 0 ? Math.sin(Math.min(1, bump / 0.12) * Math.PI) * 10 : 0);
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
    mobs = [],
    projectiles = []
  }, deltaSeconds) {
    this.world.position.x = -cameraX - this.width / 2;
    this.backgroundFar.position.x = -cameraX * 0.06;
    this.backgroundMid.position.x = -cameraX * 0.16;
    for (const mesh of this.collectibleMeshes) {
      const source = mesh.userData.kind === 'coin' ? coins[mesh.userData.index] : compassCoins[mesh.userData.index];
      mesh.visible = !source?.taken;
      mesh.rotation.y += deltaSeconds * 2.7;
    }
    this.updateBlocks(blocks);
    this.updateMobs(mobs, deltaSeconds);
    this.updateProjectiles(projectiles);
    for (const [modelHero, model] of this.models) {
      const active = modelHero === hero;
      model.root.visible = active;
      if (!active) continue;
      const direction = facing < 0 ? -1 : 1;
      model.root.scale.set(
        model.baseScale * direction,
        model.baseScale,
        model.baseScale
      );
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
