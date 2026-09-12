const LEGACY_TERRAIN_PRIMITIVES = new Set([
  'instanced-embedded-rounded-fieldstone',
  'instanced-embedded-branching-earth-root',
  'fractured-readable-cliff-edge',
  'cliff-edge-exposed-root',
  'terrain-transition-root-toe',
  'terrain-transition-boulder',
  'landform-living-grass-transition',
  'landform-supporting-boulder',
  'root-bank-supporting-boulder',
  'landform-exposed-root-network',
  'goal-overlook-fractured-edge'
]);

export function applyMeadowWakeTerrainCleanup(renderer) {
  const root = renderer?.foregroundArt?.terrainVisualRoot;
  if (!root) return 0;
  let hidden = 0;
  root.traverse(object => {
    if (!LEGACY_TERRAIN_PRIMITIVES.has(object.name)) return;
    object.visible = false;
    object.userData = {
      ...object.userData,
      terrainReplacementStatus: 'superseded-by-final-terrain-sculpt'
    };
    hidden += 1;
  });
  root.userData = {
    ...root.userData,
    terrainPrimitiveCleanup: true,
    hiddenLegacyTerrainObjects: hidden
  };
  return hidden;
}
