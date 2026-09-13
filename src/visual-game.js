// The renderer URL must be identical to game.js: query strings create separate
// ES-module instances. This entry point installs only the terrain finish.
import { CharacterRenderer } from './character-renderer.js?v=level-one-layout-20260911';
import { installMeadowWakeLivingTerrain } from './environment/meadow-wake-living-terrain.js?v=living-bank-20260913-r3';

if (!CharacterRenderer.prototype.__livingTerrainInstalled) {
  const build = CharacterRenderer.prototype.buildMeadowWake;
  const loadTextures = CharacterRenderer.prototype.loadEnvironmentTextures;
  const loadAssets = CharacterRenderer.prototype.loadMeadowWakeAssets;
  CharacterRenderer.prototype.__livingTerrainInstalled = true;
  CharacterRenderer.prototype.buildMeadowWake = function (...args) {
    const result = build.apply(this, args);
    installMeadowWakeLivingTerrain(this);
    return result;
  };
  CharacterRenderer.prototype.loadEnvironmentTextures = async function (...args) {
    const result = await loadTextures.apply(this, args);
    this.livingTerrain?.bindTextures();
    return result;
  };
  CharacterRenderer.prototype.loadMeadowWakeAssets = async function (...args) {
    const result = await loadAssets.apply(this, args);
    this.livingTerrain?.finalize();
    return result;
  };
}
await import('./game.js?v=living-bank-20260913-r3');
