// Compatibility entry point for terrain-only callers. Reference pictures are
// review targets, never textures. Live gameplay uses the shared living-bank pass.
export { installMeadowWakeLivingTerrain as applyMeadowWakeTerrainSurfacePolish }
  from './meadow-wake-living-terrain.js?v=living-bank-20260913-r3';
