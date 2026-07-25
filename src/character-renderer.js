import * as THREE from '../vendor/three/three.module.js';
import { GLTFLoader } from '../vendor/three/loaders/GLTFLoader.js';

const MODEL_SPECS = Object.freeze({
  Hargold: Object.freeze({
    url: '../assets/exports/hargold_character.glb',
    pixelsPerMetre: 67,
    yaw: 0
  }),
  Mebble: Object.freeze({
    url: '../assets/exports/mebble_character.glb',
    pixelsPerMetre: 61,
    yaw: 0
  })
});

const FALLBACK_CLIPS = Object.freeze({
  apex: 'rise',
  'land-hard': 'land-soft',
  skid: 'run'
});

export class CharacterRenderer {
  constructor({ mount, width, height, onProgress = () => {} }) {
    this.width = width;
    this.height = height;
    this.onProgress = onProgress;
    this.models = new Map();
    this.failed = new Set();
    this.scene = new THREE.Scene();
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
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.className = 'character-layer';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.append(this.renderer.domElement);

    this.scene.add(new THREE.HemisphereLight(0xfff4d3, 0x29452f, 2.25));
    const key = new THREE.DirectionalLight(0xffd5aa, 4.4);
    key.position.set(-260, 380, 520);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x91c7ff, 2.4);
    rim.position.set(320, 220, -180);
    this.scene.add(rim);

    this.loader = new GLTFLoader();
    this.loadPromise = Promise.allSettled(
      Object.entries(MODEL_SPECS).map(([hero, spec]) => this.loadHero(hero, spec))
    ).then(() => this.onProgress(this.statusText()));
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
    if (this.models.size === Object.keys(MODEL_SPECS).length) return '3D characters ready';
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

  play(model, requestedName) {
    const name = model.clips.has(requestedName) ? requestedName : 'idle';
    if (model.actionName === name) return;
    const next = model.mixer.clipAction(model.clips.get(name));
    next.reset();
    next.enabled = true;
    next.setEffectiveTimeScale(1);
    next.setEffectiveWeight(1);
    next.play();
    if (model.action) model.action.crossFadeTo(next, 0.13, true);
    model.action = next;
    model.actionName = name;
  }

  render({ hero, screenX, screenY, facing, locomotion, glide }, deltaSeconds) {
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
        0
      );
      this.play(model, this.selectClip(hero, locomotion, glide));
      model.mixer.update(deltaSeconds);
    }
    this.renderer.render(this.scene, this.camera);
  }
}
