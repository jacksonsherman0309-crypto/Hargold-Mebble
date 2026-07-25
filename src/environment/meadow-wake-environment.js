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
  19.68, 20.58, 23.42, 24.86, 27.42, 29.34, 32.26, 33.68, 35.16
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

  decorateCourse({ heightAt, inPit, scale = 70 }) {
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
