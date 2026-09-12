/** Executes the actual browser integration at 120 Hz with ONLY rendering/DOM
 * stubbed. This does not replace the controller, collision, combat, or course. */
import vm from 'node:vm';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function createLiveHarness() {
  const noop = () => {};
  const gradient = { addColorStop: noop };
  const context2d = new Proxy({}, { get: (_, key) => key === 'createLinearGradient' ? () => gradient : noop, set: () => true });
  const node = () => ({ hidden: true, textContent: '', dataset: {}, style: {}, classList: { add: noop, remove: noop, toggle: noop }, addEventListener: noop, setAttribute: noop, append: noop, appendChild: noop, querySelector: () => null });
  const nodes = new Map();
  const canvas = { ...node(), width: 1280, height: 720, parentElement: node(), getContext: () => context2d };
  nodes.set('#game', canvas);
  const sandbox = {
    console, URL, URLSearchParams, structuredClone, Math, Number, Date, Set, Map,
    performance: { now: () => 0 },
    location: { search: '' }, navigator: { getGamepads: () => [] },
    window: {}, requestAnimationFrame: noop, addEventListener: noop,
    document: {
      querySelector(selector) { if (!nodes.has(selector)) nodes.set(selector, node()); return nodes.get(selector); },
      querySelectorAll: () => [], createElement: node,
      documentElement: node(), body: node()
    }
  };
  const context = vm.createContext(sandbox);
  const cache = new Map();
  const entry = new URL('../../src/game.js', import.meta.url);
  function load(url) {
    const key = url.href;
    if (cache.has(key)) return cache.get(key);
    let source;
    if (url.pathname.endsWith('/character-renderer.js')) {
      source = `export class CharacterRenderer {
        constructor(){ this.animationDebugOverride = false; }
        isReady(){return true;} render(){} triggerGroundSlamImpact(){}
      }`;
    } else source = fs.readFileSync(fileURLToPath(new URL(url.pathname, url)), 'utf8');
    if (url.pathname.endsWith('.json')) {
      const value = JSON.parse(source);
      const module = new vm.SyntheticModule(['default'], function () { this.setExport('default', value); }, {context, identifier:key});
      cache.set(key, module);
      return module;
    }
    if (url.pathname === entry.pathname) source += `
export const liveHarness = {
  step(raw = {}) {
    inputBuffer.sample(raw, 1 / 120);
    fixedUpdate(1 / 120);
    cameraX = Math.max(-W * .22, player.footX * SCALE - W * .34);
    return this.snapshot();
  },
  snapshot() { return structuredClone({ player, session, blocks, platforms, compassCoins, coins, mobs, checkpoint, notice }); },
  place(hero, x, y = terrain.heightAt(x)) {
    restartCourse();
    player = createUnifiedCharacterState({hero, footX:x, footY:y, doubleJumpUnlocked:false});
    const support = platforms.find(surface => Math.abs(surface.y - surface.height / 2 - y) < .02 && x >= surface.x - surface.width / 2 && x <= surface.x + surface.width / 2);
    if (support) player.supportPlatformId = support.id;
    session.healthLayers = session.maximumHealthLayers = 1;
    cameraX = Math.max(-W * .22, x * SCALE - W * .34);
    inputBuffer.reset();
  }
};`;
    const module = new vm.SourceTextModule(source, { context, identifier: key });
    cache.set(key, module);
    return module;
  }
  const main = load(entry);
  await main.link((specifier, parent) => load(new URL(specifier, parent.identifier)));
  await main.evaluate();
  return main.namespace.liveHarness;
}
