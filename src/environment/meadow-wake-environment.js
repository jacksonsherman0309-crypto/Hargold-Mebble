import * as THREE from '../../vendor/three/three.module.js';

const TEXTURE_URLS = Object.freeze({
  farValley: new URL(
    '../../assets/textures/world-1/meadow-wake/verdant-vale-background-v1.png',
    import.meta.url
  ).href,
  forestRidge: new URL(
    '../../assets/textures/world-1/meadow-wake/meadow-midground-ridge-v1.png',
    import.meta.url
  ).href,
  soil: new URL(
    '../../assets/textures/world-1/meadow-wake/meadow-soil-stone-albedo-v2.png',
    import.meta.url
  ).href,
  turf: new URL(
    '../../assets/textures/world-1/meadow-wake/meadow-turf-albedo-v1.png',
    import.meta.url
  ).href
});

const FOLIAGE_SITES = Object.freeze([
  0.72, 1.36, 4.46, 5.24, 7.72, 11.18, 12.08, 14.66, 16.72,
  19.68, 20.58, 23.42, 24.86, 27.42, 29.34, 32.26, 33.68, 35.16,
  37.42, 39.18, 40.82, 42.28, 45.38, 47.16, 49.62, 51.48, 53.22,
  55.72, 57.46, 59.28, 60.56, 63.72, 64.42, 69.28, 71.46, 72.82,
  74.68, 76.42, 78.72, 80.38, 83.46, 85.22, 87.68, 89.34, 91.72,
  93.48, 95.72, 98.42, 100.16, 103.42, 105.28, 107.64, 108.92,
  111.46, 113.12, 116.42, 118.28, 122.28, 123.18
]);

const FLOWER_COLORS = Object.freeze([0xffd84a, 0xf5f0d8, 0xc69bff, 0xffa95c]);

function deterministicWave(seed) {
  return Math.sin(seed * 12.9898) * 43758.5453 % 1;
}

export class MeadowWakeEnvironmentArt {
  constructor({ scene, world, backgroundFar, backgroundMid, renderer, width, height }) {
    this.scene = scene;
    this.world = world;
    this.backgroundFar = backgroundFar;
    this.backgroundMid = backgroundMid;
    this.renderer = renderer;
    this.width = width;
    this.height = height;
    this.loader = new THREE.TextureLoader();
    this.foliage = [];
    this.elapsed = 0;

    this.soilMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0
    });
    this.turfMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.88,
      metalness: 0,
      emissive: 0x18320c,
      emissiveIntensity: 0.16
    });
    this.stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x455044,
      roughness: 0.98,
      metalness: 0
    });
    this.woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x714221,
      roughness: 0.88,
      metalness: 0
    });

    this.farMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthWrite: false,
      fog: false
    });
    this.midMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      alphaTest: 0.025,
      depthWrite: false,
      fog: false
    });

    this.buildBackdrop();
  }

  buildBackdrop() {
    const farGeometry = new THREE.PlaneGeometry(1800, 1013);
    this.farPlate = new THREE.Mesh(farGeometry, this.farMaterial);
    this.farPlate.name = 'MeadowWake_FarVerdantValePlate';
    this.farPlate.position.set(0, 10, -940);
    this.farPlate.renderOrder = -1000;
    this.backgroundFar.add(this.farPlate);

    const ridgeGeometry = new THREE.PlaneGeometry(2180, 726);
    this.forestRidge = new THREE.Mesh(ridgeGeometry, this.midMaterial);
    this.forestRidge.name = 'MeadowWake_MidgroundForestRidge';
    this.forestRidge.position.set(190, -248, -660);
    this.forestRidge.renderOrder = -900;
    this.backgroundMid.add(this.forestRidge);
    for (const offset of [-2180, 2180]) {
      const ridgeContinuation = this.forestRidge.clone();
      ridgeContinuation.name = 'MeadowWake_MidgroundForestRidgeContinuation';
      ridgeContinuation.position.x += offset;
      this.backgroundMid.add(ridgeContinuation);
    }

    const hazeMaterial = new THREE.MeshBasicMaterial({
      color: 0xc9ead9,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
      fog: false
    });
    const haze = new THREE.Mesh(new THREE.PlaneGeometry(2200, 150), hazeMaterial);
    haze.name = 'MeadowWake_ValleyDepthHaze';
    haze.position.set(120, -168, -690);
    haze.renderOrder = -950;
    this.backgroundMid.add(haze);
    for (const offset of [-2200, 2200]) {
      const hazeContinuation = haze.clone();
      hazeContinuation.name = 'MeadowWake_ValleyDepthHazeContinuation';
      hazeContinuation.position.x += offset;
      this.backgroundMid.add(hazeContinuation);
    }
  }

  configureColorTexture(texture, { repeat = false } = {}) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    if (repeat) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    }
    texture.needsUpdate = true;
    return texture;
  }

  async loadTextures() {
    const [farValley, forestRidge, soil, turf] = await Promise.all([
      this.loader.loadAsync(TEXTURE_URLS.farValley),
      this.loader.loadAsync(TEXTURE_URLS.forestRidge),
      this.loader.loadAsync(TEXTURE_URLS.soil),
      this.loader.loadAsync(TEXTURE_URLS.turf)
    ]);

    this.farMaterial.map = this.configureColorTexture(farValley);
    this.farMaterial.needsUpdate = true;
    this.midMaterial.map = this.configureColorTexture(forestRidge);
    this.midMaterial.needsUpdate = true;
    this.soilMaterial.map = this.configureColorTexture(soil, { repeat: true });
    this.soilMaterial.needsUpdate = true;
    this.turfMaterial.map = this.configureColorTexture(turf, { repeat: true });
    this.turfMaterial.needsUpdate = true;
  }

  addForegroundProp(definition, heightAt, scale) {
    const group = new THREE.Group();
    group.name = `${definition.id}_${definition.type}`;
    const top = this.height / 2 - heightAt(definition.x) * scale;
    group.position.set(definition.x * scale, top, -6);
    group.scale.setScalar(definition.scale ?? 1);
    const addBox = (name, width, height, depth, material, x, y, z = 0) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
      mesh.name = name;
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };

    if (definition.type === 'fence') {
      for (const x of [-38, 0, 38]) {
        addBox('weathered-fence-post', 8, 54, 12, this.woodMaterial, x, 27, 0);
      }
      addBox('weathered-fence-rail', 86, 7, 9, this.woodMaterial, 0, 20, 1).rotation.z = 0.08;
      addBox('weathered-fence-rail', 86, 7, 9, this.woodMaterial, 0, 40, 1).rotation.z = -0.05;
    } else if (definition.type === 'root-cluster') {
      for (let index = 0; index < 5; index += 1) {
        const root = new THREE.Mesh(
          new THREE.CylinderGeometry(4, 7, 62 - index * 5, 8),
          this.woodMaterial
        );
        root.name = 'fallen-tree-root';
        root.rotation.z = -1.05 + index * 0.5;
        root.position.set((index - 2) * 14, 17, 0);
        group.add(root);
      }
    } else if (definition.type === 'ruin-pillar') {
      for (let index = 0; index < 4; index += 1) {
        const stone = new THREE.Mesh(
          new THREE.DodecahedronGeometry(20 - index * 1.5, 0),
          this.stoneMaterial
        );
        stone.name = 'mossy-ruin-stone';
        stone.scale.set(1.25, 0.72, 0.7);
        stone.position.set((index % 2 ? 2 : -2), 17 + index * 27, 0);
        stone.rotation.z = index % 2 ? 0.12 : -0.09;
        group.add(stone);
      }
      addBox('ruin-moss-cap', 52, 8, 34, this.turfMaterial, 0, 119, 0);
    } else if (definition.type === 'camp-scaffold' || definition.type === 'camp-checkpoint') {
      for (const x of [-48, 48]) {
        addBox('camp-timber-upright', 11, 128, 15, this.woodMaterial, x, 64, 0);
      }
      addBox('camp-timber-platform', 112, 13, 70, this.woodMaterial, 0, 72, 0);
      const braceA = addBox('camp-cross-brace', 118, 8, 12, this.woodMaterial, 0, 42, 12);
      const braceB = addBox('camp-cross-brace', 118, 8, 12, this.woodMaterial, 0, 42, 12);
      braceA.rotation.z = 0.48;
      braceB.rotation.z = -0.48;
      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(78, 46, 4),
        new THREE.MeshStandardMaterial({ color: 0x426b3a, roughness: 0.96, metalness: 0 })
      );
      canopy.name = 'camp-canvas-canopy';
      canopy.rotation.y = Math.PI / 4;
      canopy.scale.z = 0.7;
      canopy.position.set(0, 132, -4);
      group.add(canopy);
      if (definition.type === 'camp-checkpoint') {
        addBox('checkpoint-rest-crate', 38, 38, 42, this.woodMaterial, 64, 19, 10);
      }
    } else if (definition.type === 'stump') {
      const stump = new THREE.Mesh(
        new THREE.CylinderGeometry(30, 37, 66, 16),
        this.woodMaterial
      );
      stump.name = 'environment-tree-stump';
      stump.position.y = 33;
      stump.castShadow = true;
      group.add(stump);
      const moss = new THREE.Mesh(new THREE.CylinderGeometry(31, 31, 5, 18), this.turfMaterial);
      moss.name = 'stump-moss-cap';
      moss.position.y = 67;
      group.add(moss);
    } else if (definition.type === 'stone-arch') {
      for (const x of [-38, 38]) {
        addBox('ruin-arch-pillar', 34, 94, 42, this.stoneMaterial, x, 47, 0);
      }
      addBox('ruin-arch-lintel', 112, 30, 45, this.stoneMaterial, 0, 102, 0);
      addBox('ruin-arch-moss', 110, 7, 47, this.turfMaterial, 0, 121, 0);
    }
    this.world.add(group);
  }

  decorateCourse({ heightAt, inPit, scale = 70, props = [] }) {
    const grassDark = new THREE.MeshStandardMaterial({
      color: 0x326e35,
      roughness: 0.94,
      metalness: 0
    });
    const grassLight = new THREE.MeshStandardMaterial({
      color: 0x74a83c,
      roughness: 0.94,
      metalness: 0
    });
    const stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x3f7836,
      roughness: 0.96,
      metalness: 0
    });

    for (let index = 0; index < FOLIAGE_SITES.length; index += 1) {
      const x = FOLIAGE_SITES[index];
      if (inPit(x)) continue;
      const top = this.height / 2 - heightAt(x) * scale;
      const cluster = new THREE.Group();
      cluster.name = 'MeadowWake_ForegroundFoliageCluster';
      const blades = 5 + index % 4;
      for (let bladeIndex = 0; bladeIndex < blades; bladeIndex += 1) {
        const bladeHeight = 12 + ((index * 7 + bladeIndex * 5) % 14);
        const blade = new THREE.Mesh(
          new THREE.ConeGeometry(2.2 + bladeIndex % 2, bladeHeight, 5),
          bladeIndex % 3 ? grassDark : grassLight
        );
        blade.position.set((bladeIndex - blades / 2) * 4.8, bladeHeight / 2, (bladeIndex % 3) * 4);
        blade.rotation.z = (deterministicWave(index * 10 + bladeIndex) - 0.5) * 0.35;
        blade.castShadow = true;
        cluster.add(blade);
      }

      if (index % 2 === 0) {
        const stemHeight = 18 + index % 4 * 3;
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 1.2, stemHeight, 6),
          stemMaterial
        );
        stem.position.set(9, stemHeight / 2, 7);
        cluster.add(stem);
        const petalMaterial = new THREE.MeshStandardMaterial({
          color: FLOWER_COLORS[index % FLOWER_COLORS.length],
          roughness: 0.8,
          metalness: 0
        });
        for (let petalIndex = 0; petalIndex < 5; petalIndex += 1) {
          const angle = petalIndex / 5 * Math.PI * 2;
          const petal = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 6), petalMaterial);
          petal.scale.set(1.35, 0.75, 0.5);
          petal.position.set(
            9 + Math.cos(angle) * 3.3,
            stemHeight + Math.sin(angle) * 3.3,
            8
          );
          cluster.add(petal);
        }
      }

      cluster.position.set(x * scale, top + 3, 82 + index % 3 * 4);
      cluster.scale.setScalar(0.82 + index % 4 * 0.06);
      this.world.add(cluster);
      this.foliage.push({ cluster, phase: index * 0.73 });
    }
    for (const prop of props) this.addForegroundProp(prop, heightAt, scale);
  }

  applyLedgeMaterials(root) {
    root.traverse(node => {
      if (!node.isMesh) return;
      if (/Grass/i.test(node.name)) node.material = this.turfMaterial;
      else if (/Core|Soil/i.test(node.name)) node.material = this.soilMaterial;
      else if (/Rock/i.test(node.name)) node.visible = false;
      node.receiveShadow = true;
    });
  }

  update(cameraX, deltaSeconds) {
    this.elapsed += Math.min(deltaSeconds, 0.05);
    this.backgroundFar.position.x = -cameraX * 0.018;
    this.backgroundMid.position.x = -cameraX * 0.11;
    this.backgroundMid.position.y = Math.sin(this.elapsed * 0.14) * 1.5;
    for (const { cluster, phase } of this.foliage) {
      cluster.rotation.z = Math.sin(this.elapsed * 1.25 + phase) * 0.018;
    }
  }
}
