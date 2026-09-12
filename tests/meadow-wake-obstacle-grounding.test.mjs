import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from '../vendor/three/three.module.js';
import { groundedPlatformArt, alignGroundedPlatformCrown } from '../src/environment/meadow-wake-obstacle-grounding.js';
import { createMeadowWakePlatforms, MEADOW_WAKE_TERRAIN_POINTS } from '../src/content/meadow-wake-course.js';
import { createLinearGround } from '../src/runtime/terrain/linear-ground.js';
const ground=createLinearGround(MEADOW_WAKE_TERRAIN_POINTS);
const platforms=createMeadowWakePlatforms();

test('only the five solid obstacles receive grounded visual supports',()=>{
 const fitted=platforms.map(def=>groundedPlatformArt(def,x=>ground.heightAt(x)));
 assert.equal(fitted.filter((def,index)=>def!==platforms[index]).length,5);
 for(const [index,def] of fitted.entries()){
  if(def===platforms[index])continue;
  const end=def.y+def.height/2+def.supportDrop;
  for(const x of [def.x-def.width/2,def.x,def.x+def.width/2])assert.ok(end>ground.heightAt(x));
 }
 assert.equal(fitted.find(def=>def.id==='fallen-log-launch').staticFooting,true);
});

test('stump crown fits its collision plane without replacing the mesh',()=>{
 const def=platforms.find(p=>p.id==='opening-stump-step');const root=new THREE.Group();
 const crown=new THREE.Mesh(new THREE.CylinderGeometry(20,20,4,12));
 crown.name='stump-growth-ring-top';crown.position.y=22;root.add(crown);
 const original=crown.geometry;
 alignGroundedPlatformCrown(root,def);
 assert.equal(crown.geometry,original);
 assert.equal(crown.position.y+2,def.height*70/2);
});

test('horizontal log is aligned to the playable top; its width is unchanged',()=>{
 const def=platforms.find(p=>p.id==='fallen-log-launch');const root=new THREE.Group();
 const log=new THREE.Mesh(new THREE.CylinderGeometry(15,18,210,24));
 log.name='rounded-fallen-log';log.rotation.z=Math.PI/2;root.add(log);
 alignGroundedPlatformCrown(root,def);
 assert.equal(log.position.y+18,def.height*70/2);
 assert.equal(log.geometry.parameters.height,210);
});

test('unrelated platforms and their artwork remain unchanged',()=>{
 const def=platforms.find(p=>p.id==='camp-awning-deck');const root=new THREE.Group();
 const child=new THREE.Group();child.position.y=7;root.add(child);
 assert.equal(alignGroundedPlatformCrown(root,def),0);
 assert.equal(child.position.y,7);
 assert.equal(groundedPlatformArt(def,x=>ground.heightAt(x)),def);
});
