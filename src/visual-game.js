import { CharacterRenderer } from './character-renderer.js?v=visual-production-gate-1';
import { applyMeadowWakeProductionGate } from './environment/meadow-wake-production-gate.js?v=visual-production-gate-1';

const originalBuildMeadowWake = CharacterRenderer.prototype.buildMeadowWake;
if (!CharacterRenderer.prototype.__productionGatePatched) {
  CharacterRenderer.prototype.__productionGatePatched = true;
  CharacterRenderer.prototype.buildMeadowWake = function patchedBuildMeadowWake(...args) {
    const result = originalBuildMeadowWake.apply(this, args);
    queueMicrotask(() => applyMeadowWakeProductionGate(this));
    return result;
  };
}

await import('./game.js?v=visual-production-gate-1');
