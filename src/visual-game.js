import { CharacterRenderer } from './character-renderer.js?v=visual-production-gate-3';
import { applyMeadowWakeProductionGate } from './environment/meadow-wake-production-gate.js?v=visual-production-gate-2';
import { applyMeadowWakeStructuralProductionGate } from './environment/meadow-wake-structural-production-gate.js?v=visual-production-gate-2';
import { applyMeadowWakeTerrainCleanup } from './environment/meadow-wake-terrain-cleanup.js?v=terrain-finalization-1';
import { applyMeadowWakeTerrainFinalization } from './environment/meadow-wake-terrain-finalization.js?v=terrain-finalization-2';
import { applyMeadowWakeTerrainOrganicDetail } from './environment/meadow-wake-terrain-organic-detail.js?v=terrain-finalization-1';

const originalBuildMeadowWake = CharacterRenderer.prototype.buildMeadowWake;
if (!CharacterRenderer.prototype.__productionGatePatched) {
  CharacterRenderer.prototype.__productionGatePatched = true;
  CharacterRenderer.prototype.buildMeadowWake = function patchedBuildMeadowWake(...args) {
    const result = originalBuildMeadowWake.apply(this, args);
    queueMicrotask(() => {
      applyMeadowWakeProductionGate(this);
      applyMeadowWakeStructuralProductionGate(this);
      applyMeadowWakeTerrainCleanup(this);
      applyMeadowWakeTerrainFinalization(this);
      applyMeadowWakeTerrainOrganicDetail(this);
    });
    return result;
  };
}

await import('./game.js?v=visual-production-gate-3');
