import * as THREE from '../../vendor/three/three.module.js';
import {
  BACKGROUND_READABILITY_PROFILES,
  CHARACTER_READABILITY_QUALITY,
  HERO_READABILITY_PROFILES,
  readabilityRisk,
  resolveBackgroundProfile,
  resolveReadabilityMode,
  resolveReadabilityQuality
} from './character-readability-config.js';

const OUTGOING_LIGHT_ANCHOR =
  'vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;';

function modeHasContour(mode) {
  return mode === 'contour' || mode === 'combined';
}

function modeHasLighting(mode) {
  return mode === 'lighting' || mode === 'combined';
}

function createContourMaterial(hero, profile, viewport) {
  return new THREE.ShaderMaterial({
    name: `${hero}_screen_space_contour`,
    uniforms: {
      contourColor: { value: new THREE.Color(profile.contourColor) },
      contourOpacity: { value: profile.contourOpacityMinimum },
      contourPixels: { value: 1.25 },
      contourViewport: {
        value: new THREE.Vector2(viewport.width, viewport.height)
      }
    },
    vertexShader: `
      uniform float contourPixels;
      uniform vec2 contourViewport;
      #include <common>
      #include <morphtarget_pars_vertex>
      #include <skinning_pars_vertex>
      void main() {
        #include <beginnormal_vertex>
        #include <morphnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
        #include <defaultnormal_vertex>
        #include <begin_vertex>
        #include <morphtarget_vertex>
        #include <skinning_vertex>
        vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
        gl_Position = projectionMatrix * mvPosition;
        vec2 contourDirection = transformedNormal.xy;
        float contourLength = max( length( contourDirection ), 0.0001 );
        contourDirection /= contourLength;
        vec2 pixelToNdc = vec2(
          2.0 / max( contourViewport.x, 1.0 ),
          2.0 / max( contourViewport.y, 1.0 )
        );
        gl_Position.xy +=
          contourDirection * pixelToNdc * contourPixels * gl_Position.w;
      }
    `,
    fragmentShader: `
      uniform vec3 contourColor;
      uniform float contourOpacity;
      void main() {
        gl_FragColor = vec4( contourColor, contourOpacity );
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    toneMapped: true,
    fog: false
  });
}

function copyContourMesh(source, material) {
  const outline = source.clone(false);
  outline.name = `${source.name || 'character-mesh'}_external-contour`;
  outline.material = material;
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.frustumCulled = false;
  outline.renderOrder = 1000;
  if (outline.isSkinnedMesh && source.skeleton) {
    outline.skeleton = source.skeleton;
    outline.bindMode = source.bindMode;
    outline.bindMatrix.copy(source.bindMatrix);
    outline.bindMatrixInverse.copy(source.bindMatrixInverse);
  }
  outline.userData.characterContour = true;
  return outline;
}

function prepareBaseMaterial(material, profile, quality) {
  const prepared = material.clone();
  prepared.name = `${material.name || 'character-material'}_readability`;
  prepared.roughness = Math.max(
    profile.roughnessFloor,
    Number.isFinite(prepared.roughness) ? prepared.roughness : 1
  );
  prepared.metalness = Math.min(
    profile.metalnessCeiling,
    Number.isFinite(prepared.metalness) ? prepared.metalness : 0
  );
  if (prepared.aoMap) {
    prepared.aoMapIntensity = THREE.MathUtils.clamp(
      Number.isFinite(prepared.aoMapIntensity)
        ? prepared.aoMapIntensity
        : 1,
      0.9,
      1.08
    );
  }
  if (prepared.map) {
    prepared.map.anisotropy = Math.min(4, prepared.map.anisotropy || 1);
    prepared.map.needsUpdate = true;
  }
  const originalNormalScale = prepared.normalScale?.clone() ?? null;
  if (prepared.normalMap && originalNormalScale) {
    prepared.normalScale.copy(originalNormalScale).multiplyScalar(
      quality.normalDetailScale
    );
  }
  prepared.userData.readabilityOriginalNormalScale = originalNormalScale;
  prepared.userData.readabilityUniforms = null;
  prepared.onBeforeCompile = shader => {
    const uniforms = {
      rimColor: { value: new THREE.Color('#d4e7f7') },
      rimStrength: { value: 0 },
      frontFill: { value: 0 },
      upperKey: { value: 0 },
      shadowFloor: { value: 0 },
      midtoneClarity: { value: 0 },
      distanceSimplification: { value: 0 }
    };
    Object.assign(shader.uniforms, {
      readabilityRimColor: uniforms.rimColor,
      readabilityRimStrength: uniforms.rimStrength,
      readabilityFrontFill: uniforms.frontFill,
      readabilityUpperKey: uniforms.upperKey,
      readabilityShadowFloor: uniforms.shadowFloor,
      readabilityMidtoneClarity: uniforms.midtoneClarity,
      readabilityDistanceSimplification: uniforms.distanceSimplification
    });
    if (!shader.fragmentShader.includes(OUTGOING_LIGHT_ANCHOR)) {
      console.warn('Character readability shader anchor was not found.');
      return;
    }
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 readabilityRimColor;
        uniform float readabilityRimStrength;
        uniform float readabilityFrontFill;
        uniform float readabilityUpperKey;
        uniform float readabilityShadowFloor;
        uniform float readabilityMidtoneClarity;
        uniform float readabilityDistanceSimplification;`
      )
      .replace(
        OUTGOING_LIGHT_ANCHOR,
        `${OUTGOING_LIGHT_ANCHOR}
        float readabilityNdotV = saturate( dot( normal, geometryViewDir ) );
        float readabilityFront = pow( readabilityNdotV, 1.45 );
        float readabilityUpper = smoothstep( -0.3, 0.78, normal.y );
        float readabilityRim =
          pow( 1.0 - readabilityNdotV, 2.35 ) *
          mix( 0.72, 1.08, readabilityUpper );
        vec3 readabilityBase = max( diffuseColor.rgb, vec3( 0.0 ) );
        outgoingLight +=
          readabilityBase *
          (
            readabilityFrontFill * readabilityFront +
            readabilityUpperKey * readabilityUpper *
              mix( 0.55, 1.0, readabilityFront )
          );
        outgoingLight +=
          readabilityRimColor *
          readabilityRimStrength *
          readabilityRim;
        vec3 readabilityFloor =
          readabilityBase *
          readabilityShadowFloor *
          mix( 0.72, 1.0, readabilityFront );
        outgoingLight = max( outgoingLight, readabilityFloor );
        float readabilityBaseLuma =
          dot( readabilityBase, vec3( 0.2126, 0.7152, 0.0722 ) );
        float readabilityMidtone =
          1.0 - smoothstep( 0.58, 0.9, abs( readabilityBaseLuma - 0.46 ) * 2.0 );
        vec3 readabilityClearTarget =
          max( outgoingLight, readabilityBase * ( 0.38 + readabilityShadowFloor ) );
        outgoingLight = mix(
          outgoingLight,
          readabilityClearTarget,
          readabilityMidtoneClarity *
            readabilityMidtone *
            readabilityDistanceSimplification
        );`
      );
    prepared.userData.readabilityUniforms = uniforms;
  };
  prepared.customProgramCacheKey = () => 'character-readability-material-v1';
  prepared.needsUpdate = true;
  return prepared;
}

export class CharacterReadabilityPass {
  constructor({
    hero,
    root,
    viewport,
    mode = 'combined',
    quality = 'balanced'
  }) {
    this.hero = hero;
    this.root = root;
    this.mode = resolveReadabilityMode(mode);
    this.qualityName = resolveReadabilityQuality(quality);
    this.quality = CHARACTER_READABILITY_QUALITY[this.qualityName];
    this.profile = HERO_READABILITY_PROFILES[hero];
    this.viewport = { ...viewport };
    this.backgroundName = 'bright-grassland';
    this.response = {
      risk: 0.5,
      contourOpacity: this.profile.contourOpacityMinimum,
      rimStrength: this.profile.rimMinimum,
      closeupRimScale: 1
    };
    this.materials = [];
    this.contourMaterials = [];
    this.contourMeshes = [];
    this.attach();
  }

  attach() {
    const meshes = [];
    this.root.traverse(object => {
      if (object.isMesh && !object.userData.characterContour) meshes.push(object);
    });
    for (const mesh of meshes) {
      const sourceMaterials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      const preparedMaterials = sourceMaterials.map(material => {
        const prepared = prepareBaseMaterial(
          material,
          this.profile,
          this.quality
        );
        this.materials.push(prepared);
        return prepared;
      });
      mesh.material = Array.isArray(mesh.material)
        ? preparedMaterials
        : preparedMaterials[0];
      mesh.renderOrder = 1001;
      const contourMaterial = createContourMaterial(
        this.hero,
        this.profile,
        this.viewport
      );
      const contour = copyContourMesh(mesh, contourMaterial);
      mesh.parent.add(contour);
      this.contourMaterials.push(contourMaterial);
      this.contourMeshes.push(contour);
    }
    this.setMode(this.mode);
  }

  setMode(mode) {
    this.mode = resolveReadabilityMode(mode);
    const contourEnabled = modeHasContour(this.mode);
    for (const mesh of this.contourMeshes) mesh.visible = contourEnabled;
    this.applyUniforms();
  }

  updateViewport(width, height) {
    this.viewport.width = width;
    this.viewport.height = height;
    for (const material of this.contourMaterials) {
      material.uniforms.contourViewport.value.set(width, height);
    }
  }

  update({
    background = 'bright-grassland',
    deltaSeconds,
    heroScreenHeightPixels = 130
  }) {
    this.backgroundName = resolveBackgroundProfile(background);
    const backgroundProfile =
      BACKGROUND_READABILITY_PROFILES[this.backgroundName];
    const risk = readabilityRisk(this.hero, this.backgroundName);
    const lightingEnabled = modeHasLighting(this.mode);
    const contourEnabled = modeHasContour(this.mode);
    const closeupRimScale = THREE.MathUtils.clamp(
      (270 - heroScreenHeightPixels) / 110,
      0.42,
      1
    );
    const targetOpacity = contourEnabled
      ? THREE.MathUtils.lerp(
          this.profile.contourOpacityMinimum,
          this.profile.contourOpacityMaximum,
          risk
        )
      : 0;
    const targetRim = lightingEnabled
      ? THREE.MathUtils.lerp(
          this.profile.rimMinimum,
          this.profile.rimMaximum,
          risk
        ) * this.quality.lightingScale * closeupRimScale
      : 0;
    const smoothing = 1 - Math.exp(
      -Math.min(Math.max(deltaSeconds, 0), 0.1) / 0.32
    );
    this.response.risk = THREE.MathUtils.lerp(
      this.response.risk,
      risk,
      smoothing
    );
    this.response.contourOpacity = THREE.MathUtils.lerp(
      this.response.contourOpacity,
      targetOpacity,
      smoothing
    );
    this.response.rimStrength = THREE.MathUtils.lerp(
      this.response.rimStrength,
      targetRim,
      smoothing
    );
    this.response.closeupRimScale = closeupRimScale;
    this.response.rimColor = backgroundProfile.rimColor;
    this.response.distanceSimplification = THREE.MathUtils.clamp(
      (155 - heroScreenHeightPixels) / 70,
      0,
      1
    );
    this.applyUniforms();
  }

  applyUniforms() {
    const lightingEnabled = modeHasLighting(this.mode);
    const contourEnabled = modeHasContour(this.mode);
    const background =
      BACKGROUND_READABILITY_PROFILES[this.backgroundName];
    for (const material of this.contourMaterials) {
      material.visible = contourEnabled;
      material.uniforms.contourOpacity.value = contourEnabled
        ? this.response.contourOpacity
        : 0;
      material.uniforms.contourPixels.value =
        this.quality.contourPixels;
    }
    for (const material of this.materials) {
      const uniforms = material.userData.readabilityUniforms;
      if (!uniforms) continue;
      uniforms.rimColor.value.set(
        this.response.rimColor ?? background.rimColor
      );
      uniforms.rimStrength.value = lightingEnabled
        ? this.response.rimStrength
        : 0;
      uniforms.frontFill.value = lightingEnabled
        ? this.profile.faceFill * this.quality.lightingScale
        : 0;
      uniforms.upperKey.value = lightingEnabled
        ? this.profile.upperKey * this.quality.lightingScale
        : 0;
      uniforms.shadowFloor.value = lightingEnabled
        ? this.profile.shadowFloor * this.quality.lightingScale
        : 0;
      uniforms.midtoneClarity.value = lightingEnabled
        ? this.profile.midtoneClarity * this.quality.lightingScale
        : 0;
      uniforms.distanceSimplification.value = lightingEnabled
        ? this.response.distanceSimplification ?? 0
        : 0;
    }
  }

  snapshot() {
    return {
      hero: this.hero,
      mode: this.mode,
      quality: this.qualityName,
      background: this.backgroundName,
      contourPixels: this.quality.contourPixels,
      contourOpacity: this.response.contourOpacity,
      rimStrength: this.response.rimStrength,
      closeupRimScale: this.response.closeupRimScale,
      risk: this.response.risk,
      drawCallsPerVisibleMesh: modeHasContour(this.mode) ? 2 : 1
    };
  }
}

function seededValue(index) {
  const value = Math.sin(index * 91.771 + 18.313) * 43758.5453;
  return value - Math.floor(value);
}

export function createReadabilityDiagnosticBackdrop({
  profileName,
  width,
  height
}) {
  const resolved = resolveBackgroundProfile(profileName);
  const profile = BACKGROUND_READABILITY_PROFILES[resolved];
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, profile.upperColor);
  gradient.addColorStop(1, profile.lowerColor);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const detailCount = Math.round(18 + profile.detail * 42);
  for (let index = 0; index < detailCount; index += 1) {
    const x = seededValue(index * 4) * canvas.width;
    const y = (0.28 + seededValue(index * 4 + 1) * 0.72) * canvas.height;
    const size = 7 + seededValue(index * 4 + 2) * 38;
    context.globalAlpha = 0.12 + seededValue(index * 4 + 3) * 0.2;
    context.fillStyle = index % 3 === 0
      ? profile.upperColor
      : profile.lowerColor;
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fill();
    if (index % 4 === 0) {
      context.fillRect(x - size * 0.12, y, size * 0.24, size * 1.8);
    }
  }
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    depthWrite: true,
    depthTest: true,
    toneMapped: false
  });
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 1.5, height * 1.5),
    material
  );
  plane.name = `ReadabilityDiagnostic_${resolved}`;
  plane.position.set(0, 0, 100);
  plane.renderOrder = 900;
  return plane;
}
