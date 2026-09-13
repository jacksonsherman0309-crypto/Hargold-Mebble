import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import * as THREE from '../vendor/three/three.module.js';
import * as course from '../src/content/meadow-wake-course.js';
import {
  ROOM_FINISH, TERRAIN_FINISH_VERSION, terrainHeight,
  buildLivingTerrainGeometry, buildTerrainLedgeGeometry, installMeadowWakeLivingTerrain
} from '../src/environment/meadow-wake-living-terrain.js';

const root = new URL('../', import.meta.url);
const source = path => readFileSync(new URL(path, root), 'utf8');
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const before = sha(course);
const geometrySet = course.MEADOW_WAKE_TERRAIN_MODULES.map(def => ({
  def, meshes: buildLivingTerrainGeometry(def, 720)
}));

test('the terrain entry point patches the exact renderer imported by gameplay', () => {
  const rendererImport = text => text.match(/from ['"](.+character-renderer\.js[^'"]*)['"]/)[1];
  assert.equal(rendererImport(source('src/visual-game.js')), rendererImport(source('src/game.js')));
  assert.match(source('index.html'), new RegExp(TERRAIN_FINISH_VERSION));
  assert.doesNotMatch(source('src/visual-game.js'), /applyMeadowWakeProductionGate|applyMeadowWakeStructuralProductionGate|applyMeadowWakeTerrainCliffPass/);
});

test('all twelve authored rooms and twenty-five terrain modules are retained', () => {
  assert.equal(geometrySet.length, 25);
  assert.deepEqual(Object.keys(ROOM_FINISH).sort(), course.MEADOW_WAKE_GAMEPLAY_ROOMS.map(room => room.id).sort());
  assert.equal(course.MEADOW_WAKE_GAMEPLAY_ROOMS.length, 12);
  assert.equal(course.MEADOW_WAKE_PITS.length, 5);
  assert.equal(before, sha(course), 'building art must not mutate the gameplay definitions');
});

test('height interpolation clamps both aprons and agrees with every collision control point', () => {
  const points = course.MEADOW_WAKE_TERRAIN_POINTS;
  assert.equal(terrainHeight(-100), points[0][1]);
  assert.equal(terrainHeight(1000), points.at(-1)[1]);
  for (const [x,y] of points) assert.equal(terrainHeight(x), y);
});

test('every mesh has finite positions, normals, UVs, colors and valid triangle indices', () => {
  for (const { def, meshes } of geometrySet) for (const [kind,g] of Object.entries(meshes)) {
    assert.equal(g.userData.collisionBearing, false);
    const count = g.getAttribute('position').count;
    assert.ok(count > 0, `${def.id} ${kind}`);
    for (const name of ['position','normal','uv','color']) {
      const a = g.getAttribute(name);
      assert.equal(a.count, count);
      assert.ok(a.array.every(Number.isFinite), `${def.id}: invalid ${name}`);
    }
    assert.equal(g.index.count % 3, 0);
    assert.ok(g.index.array.every(i => i < count));
    assert.ok(Number.isFinite(g.boundingSphere.radius));
  }
});

test('the visible contact row stays within 1.21 pixels of the unchanged collision curve', () => {
  for (const { meshes } of geometrySet) {
    const p = meshes.crown.getAttribute('position');
    let contacts = 0;
    for (let i = 0; i < p.count; i++) if (p.getZ(i) === 0) {
      assert.ok(Math.abs(p.getY(i) - (360 - terrainHeight(p.getX(i)/70)*70)) < 1.21);
      contacts++;
    }
    assert.ok(contacts >= 2);
  }
});

test('modular terrain does not create a collision-bearing bridge across any authored pit', () => {
  for (const { def, meshes } of geometrySet) {
    const from = def.visualFrom ?? def.from, to = def.visualTo ?? def.to;
    for (const pit of course.MEADOW_WAKE_PITS) {
      assert.ok(to <= pit.from || from >= pit.to, `${def.id} spans ${pit.id}`);
    }
    assert.ok(Object.values(meshes).every(g => !g.userData.collisionBearing));
  }
});

test('geometry is deterministic and fits the bounded merged-mesh budget', () => {
  let triangles = 0, meshes = 0;
  for (const entry of geometrySet) for (const g of Object.values(entry.meshes)) {
    triangles += g.index.count / 3; meshes++;
  }
  assert.equal(meshes, 175);
  assert.ok(triangles < 350000, `resident triangles: ${triangles}`);
  const again = buildLivingTerrainGeometry(geometrySet[0].def, 720);
  for (const key of Object.keys(again)) {
    assert.deepEqual(again[key].getAttribute('position').array, geometrySet[0].meshes[key].getAttribute('position').array);
    assert.deepEqual(again[key].index.array, geometrySet[0].meshes[key].index.array);
    again[key].dispose();
  }
});

test('installation is idempotent and preserves actor, prop, and collision roots', () => {
  const world = new THREE.Group(), terrain = new THREE.Group(), dressing = new THREE.Group();
  const props = new THREE.Group(), actors = new THREE.Group(), collision = new THREE.Group();
  world.add(terrain,dressing,props,actors,collision);
  const old = new THREE.Group(); terrain.add(old);
  const texture = () => new THREE.Texture({ width: 16, height: 16 });
  const f = { terrainVisualRoot: terrain, terrainDressingRoot: dressing,
    animated: [], debugMode: 'visible', setDebugMode(mode) { this.debugMode=mode; } };
  const renderer = { foregroundArt:f, height:720, environmentArt: {
    soilMaterial:{map:texture()}, turfMaterial:{map:texture()},
    detailTextures:{ruinStone:texture(),livingSurface:texture()}
  } };
  const state = installMeadowWakeLivingTerrain(renderer);
  assert.equal(installMeadowWakeLivingTerrain(renderer),state);
  assert.equal(terrain.children.length,1);
  assert.equal(old.parent,null); assert.equal(dressing.parent,null);
  assert.equal(props.parent,world); assert.equal(actors.parent,world); assert.equal(collision.parent,world);
  assert.equal(f.terrainModuleRoots.length,25);
  state.bindTextures(); assert.equal(state.texturesReady,true);
  const lateKit=new THREE.Group(); terrain.add(lateKit); f.productionTerrainKitRoot=lateKit;
  state.finalize(); assert.equal(lateKit.parent,null);
  assert.equal(terrain.children.length,1);
  assert.equal(state.publish().terrainMeshCount,175);
  assert.equal(state.publish().referenceImagesInScene,false);
  assert.equal(state.publish().legacyPassesActive,0);
});

test('reference images are review-only, not terrain albedo or cropped screenshot materials', () => {
  for (const path of ['src/environment/meadow-wake-living-terrain.js','src/environment/meadow-wake-terrain-surface-polish.js']) {
    const text=source(path);
    assert.doesNotMatch(text,/assets\/references|REFERENCE_URL|croppedTexture|paintedMaterial|TextureLoader/);
  }
});

test('terrain ledges preserve each platform contact plane and never alter motion definitions', () => {
  const saved=sha(course.MEADOW_WAKE_PLATFORMS);
  const terrainTypes=['turf-ledge','root-ledge','ruin-ledge','creek-stone'];
  const selected=course.MEADOW_WAKE_PLATFORMS.filter(p=>terrainTypes.includes(p.visual));
  assert.ok(selected.length >= 10);
  for (const def of selected) {
    const meshes=buildTerrainLedgeGeometry(def), p=meshes.crown.getAttribute('position');
    const halfWidth=def.width*35, top=def.height*35;
    let contacts=0;
    for (let i=0;i<p.count;i++) {
      assert.ok(Math.abs(p.getX(i)) <= halfWidth+.001);
      if(p.getZ(i)===0) { assert.ok(Math.abs(p.getY(i)-top-1.2)<.001); contacts++; }
    }
    assert.ok(contacts>1);
    for (const geometry of Object.values(meshes)) {
      assert.ok(geometry.getAttribute('position').array.every(Number.isFinite));
      assert.ok(geometry.getAttribute('normal').array.every(Number.isFinite));
      assert.equal(geometry.userData.collisionBearing,false);
      geometry.dispose();
    }
  }
  assert.equal(saved,sha(course.MEADOW_WAKE_PLATFORMS));
});
