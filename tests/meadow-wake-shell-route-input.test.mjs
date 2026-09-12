import assert from 'node:assert/strict';
import test from 'node:test';
import { createMob, stompMob, attackMob } from '../src/gameplay/enemies/mob-simulation.js';
import { createLiveHarness } from './helpers/meadow-wake-live-harness.mjs';

test('an idle shell is a safe reusable tool, including after a second stomp', () => {
  const shell = createMob({id:'shell-test', type:'shellback', x:0});
  assert.equal(stompMob(shell).outcome,'shell-retracted');
  assert.equal(shell.damaging,false);
  assert.equal(stompMob(shell).outcome,'shell-stopped');
  assert.equal(shell.alive,true);
  assert.equal(shell.damaging,false);
  assert.equal(attackMob(shell).outcome,'shell-launched');
  assert.equal(shell.damaging,true);
});

for (const hero of ['Hargold','Mebble']) {
  test(`${hero}: the real springy log jump collects C1 without double jump`, async () => {
    const live = await createLiveHarness();
    live.place(hero,17.95,6.23);
    let state;
    for (let frame=0;frame<200;frame++) state=live.step({jump:frame<75});
    assert.equal(state.compassCoins.find(coin=>coin.id==='1-1-C1').taken,true);
    assert.equal(state.player.doubleJumpUnlocked,false);
    assert.equal(state.session.lives,3);
  });
  test(`${hero}: normal jump, reposition and action inputs open the quarry route`, async () => {
    const live = await createLiveHarness();
    live.place(hero,29.3);
    let state=live.snapshot(),phase='stomp';
    for (let frame=0;frame<1000;frame++) {
      const shell=state.mobs.find(mob=>mob.id==='1-1-shellback-a');
      const player=state.player;
      let input={};
      if (!state.compassCoins.find(coin=>coin.id==='1-1-C2').locked) break;
      if (phase==='stomp') {
        const dx=(shell?.x??30.75)-player.footX;
        input={right:frame>14&&dx>.05,left:dx<-.05,jump:frame<50};
        if (shell?.state==='shell-idle') phase='left';
      } else if (phase==='left') {
        const dx=(shell?.x??30.75)-.9-player.footX;
        input={right:dx>.08,left:dx<-.08};
        if (player.grounded&&Math.abs(dx)<.15) phase='kick';
      } else if (shell?.state!=='shell-roll') {
        input={right:true,action:player.facing>0&&frame%20<10};
      }
      state=live.step(input);
      assert.equal(state.session.lives,3);
    }
    assert.equal(state.compassCoins.find(coin=>coin.id==='1-1-C2').locked,false);
    assert.ok(state.blocks.filter(block=>block.formation==='shell-opened-column').every(block=>block.broken));
  });
}
