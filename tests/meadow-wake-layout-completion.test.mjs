import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MEADOW_WAKE_PITS, MEADOW_WAKE_TERRAIN_POINTS, createMeadowWakeBlocks,
  createMeadowWakePlatforms, createMeadowWakeCoins, createMeadowWakeCompassCoins
} from '../src/content/meadow-wake-course.js';
import { MEADOW_WAKE_MOB_PLACEMENTS, MEADOW_WAKE_SAFE_RANGES } from '../src/content/meadow-wake-encounters.js';
import { getCourseEnemyRoster } from '../src/content/world-enemy-rosters.js';
import { createLinearGround } from '../src/runtime/terrain/linear-ground.js';
import { createMob, stepMob, stompMob, attackMob } from '../src/gameplay/enemies/mob-simulation.js';
import { breakBlocksWithRollingShell } from '../src/gameplay/levels/platform-block-runtime.js';
import { collectibleTouchesBody, groundedObstacleBodies, solidAtPoint, updateQuarryRoute } from '../src/gameplay/levels/meadow-wake-course-runtime.js';
import { createLiveHarness } from './helpers/meadow-wake-live-harness.mjs';

const terrain = createLinearGround(MEADOW_WAKE_TERRAIN_POINTS);
const ground = x => terrain.heightAt(x);
const inPit = x => MEADOW_WAKE_PITS.some(pit => x > pit.from && x < pit.to);

test('six Critters and three Shellbacks, with no later-world enemies or unsafe patrols', () => {
  assert.equal(MEADOW_WAKE_MOB_PLACEMENTS.length, 9);
  assert.equal(MEADOW_WAKE_MOB_PLACEMENTS.filter(mob => mob.type === 'camp_critter').length, 6);
  assert.equal(MEADOW_WAKE_MOB_PLACEMENTS.filter(mob => mob.type === 'shellback').length, 3);
  const obstacleBodies = groundedObstacleBodies(createMeadowWakePlatforms(), ground);
  for (const definition of MEADOW_WAKE_MOB_PLACEMENTS) {
    assert.ok(getCourseEnemyRoster('1-1').includes(definition.type));
    const mob = createMob(definition);
    for (let frame = 0; frame < 3600; frame++) {
      stepMob(mob, 1 / 120, { groundHeightAt: ground, hasGroundAhead: x => !inPit(x), minimumX: definition.patrolFrom, maximumX: definition.patrolTo });
      assert.ok(mob.x >= definition.patrolFrom && mob.x <= definition.patrolTo);
      for (const zone of MEADOW_WAKE_SAFE_RANGES) assert.ok(mob.x + mob.width / 2 < zone.from || mob.x - mob.width / 2 > zone.to, `${mob.id}: ${zone.id}`);
      for (const obstacle of obstacleBodies) assert.ok(mob.x + mob.width / 2 < obstacle.x - obstacle.width / 2 || mob.x - mob.width / 2 > obstacle.x + obstacle.width / 2, `${mob.id} inside ${obstacle.id}`);
    }
  }
});

test('overhead blocks leave Mebble standing clearance on the ground route', () => {
  for (const block of createMeadowWakeBlocks(ground)) {
    if (block.formation === 'shell-opened-column') continue;
    const bottom = block.y + block.height / 2;
    const highestGround = Math.min(...[-.7, 0, .7].map(dx => ground(block.x + dx)));
    assert.ok(bottom <= highestGround - 2.2932 - .05, block.id);
  }
});

test('grounded bodies coincide with existing props; high decks/lifts remain one-way', () => {
  const bodies = groundedObstacleBodies(createMeadowWakePlatforms(), ground);
  assert.equal(bodies.length, 5);
  for (const body of bodies) assert.equal(solidAtPoint({x:body.x,y:body.y},bodies)?.id, body.id);
  assert.ok(!bodies.some(body => body.id.includes('awning') || body.id.includes('lift')));
});

test('the adjacent Shellback physically clears the column and releases only C2', () => {
  const blocks = createMeadowWakeBlocks(ground);
  const coins = createMeadowWakeCompassCoins();
  assert.equal(coins[1].locked, true);
  assert.equal(updateQuarryRoute(blocks, coins), false);
  const shell = createMob(MEADOW_WAKE_MOB_PLACEMENTS.find(mob => mob.id === '1-1-shellback-a'));
  shell.y = ground(shell.x);
  stompMob(shell);
  attackMob(shell, { direction: 1 });
  let opened = false;
  for (let frame=0;frame<140;frame++) {
    stepMob(shell,1/120,{groundHeightAt:ground});
    breakBlocksWithRollingShell({x:shell.x-shell.width/2,y:shell.y-shell.height,width:shell.width,height:shell.height},blocks);
    opened = updateQuarryRoute(blocks,coins) || opened;
  }
  assert.equal(opened,true);
  assert.ok(blocks.filter(block=>block.formation==='shell-opened-column').every(block=>block.broken));
  assert.equal(coins[1].locked,false);
  assert.ok(coins.every(coin=>!coin.taken));
});

test('body contact collects a chest-height coin; locked rewards cannot be collected', () => {
  const body={x:1,y:5,width:1,height:1.82};
  assert.equal(collectibleTouchesBody({x:1.5,y:5.8},body),true);
  assert.equal(collectibleTouchesBody({x:1.5,y:5.8,locked:true},body),false);
  assert.equal(collectibleTouchesBody({x:3,y:5.8},body),false);
  assert.ok(createMeadowWakeCoins(ground).filter(coin=>coin.route==='hidden-creek').every(coin=>coin.y===7.64));
});

for (const hero of ['Hargold','Mebble']) {
  test(`${hero}: actual live runtime stops at a stump instead of walking through it`, async () => {
    const live=await createLiveHarness();live.place(hero,9.6);
    let state;
    for(let frame=0;frame<180;frame++) state=live.step({right:true});
    assert.ok(state.player.footX < 11.9, JSON.stringify(state.player));
    assert.ok(state.player.footX > 10);
    assert.equal(state.session.lives,3);
  });
  test(`${hero}: actual live runtime crosses all five solid terrain obstacles`, async () => {
    const live=await createLiveHarness();
    const obstacles=groundedObstacleBodies(createMeadowWakePlatforms(),ground);
    for(const obstacle of obstacles) {
      live.place(hero,obstacle.id==='bramble-clue-step:body'?57.05:obstacle.x-obstacle.width/2-2.5);
      let state=live.snapshot(), jumpFrames=0, releasedFrames=10;
      for(let frame=0;frame<420;frame++) {
        const near=obstacle.x-obstacle.width/2-state.player.footX;
        if (near<1.8 && state.player.grounded && releasedFrames>6) jumpFrames=50;
        const jump=jumpFrames>0;
        if(jumpFrames>0) jumpFrames--;
        releasedFrames=jump?0:releasedFrames+1;
        state=live.step({right:true,jump,action:frame%24<12});
        if(state.player.footX>obstacle.x+obstacle.width/2+1.4) break;
      }
      assert.ok(state.player.footX>obstacle.x+obstacle.width/2+1.4, `${hero}: ${obstacle.id} x=${state.player.footX}`);
    }
  });
  test(`${hero}: each protection block is hittable using a normal jump`, async () => {
    const live=await createLiveHarness();
    for(const block of createMeadowWakeBlocks(ground).filter(block=>block.type==='power-up')) {
      live.place(hero,block.x);
      let state;
      for(let frame=0;frame<240;frame++) state=live.step({jump:frame<75});
      assert.equal(state.blocks.find(candidate=>candidate.id===block.id).consumed,true,block.id);
    }
  });
}

for (const hero of ['Hargold','Mebble']) {
  test(`${hero}: walking off the log landing does not re-enter an infinite landing loop`, async () => {
    const live=await createLiveHarness();live.place(hero,21.85,6.43);
    let state;
    for(let frame=0;frame<180;frame++) { state=live.step({right:true}); if(state.player.footX>24.7) break; }
    assert.ok(state.player.footX>24.5, `${hero} got stuck at ${state.player.footX}`);
  });
  test(`${hero}: drop to the hidden creek coin, then jump back to the supported route`, async () => {
    const live=await createLiveHarness();live.place(hero,59.5);
    let state=live.snapshot();
    for(let frame=0;frame<300;frame++) {
      state=live.step({right:state.player.footX<61.6,left:state.player.footX>62.15});
      if(state.compassCoins.find(coin=>coin.id==='1-1-C3').taken&&state.player.grounded) break;
    }
    assert.equal(state.compassCoins.find(coin=>coin.id==='1-1-C3').taken,true);
    for(let frame=0;frame<180;frame++) {
      state=live.step({right:true,jump:frame<58});
      if(state.player.footX>64.2&&state.player.grounded) break;
    }
    assert.ok(state.player.footX>64.2);
    assert.equal(state.session.lives,3);
    assert.ok(state.player.footY<8);
  });
  test(`${hero}: complete the actual course with normal abilities and no lives lost`, async () => {
    const {driveMainRoute}=await import('./helpers/meadow-wake-route-driver.mjs');
    const live=await createLiveHarness();live.place(hero,1.8);
    const result=driveMainRoute(live);
    assert.equal(result.state.session.state,'complete');
    assert.equal(result.livesLost,0);
    assert.equal(result.state.player.doubleJumpUnlocked,false);
    assert.equal(result.state.checkpoint.reached,true);
    assert.ok(result.state.player.footX>=123.25);
    console.log(`${hero} input-only speedrun: ${result.seconds.toFixed(2)}s; no lives lost. This is NOT a normal-player duration estimate.`);
  });
}
