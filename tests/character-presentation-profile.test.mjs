import assert from 'node:assert/strict';
import fs from 'node:fs';

const profile = JSON.parse(
  fs.readFileSync(
    new URL('../assets/blender/character-scale-orientation-profile.json', import.meta.url),
    'utf8'
  )
);

const scale = profile.gameplayScale;
assert.equal(scale.characters.Hargold.targetVisibleHeightMetres, 1.82);
assert.equal(scale.characters.Mebble.targetVisibleHeightMetres, 2.2932);
assert.equal(scale.characters.Hargold.currentAssetHeightMetres, 1.82);
assert.equal(scale.characters.Mebble.currentAssetHeightMetres, 2.2932);
assert.equal(scale.characters.Hargold.runtimeNormalizationScale, 1);
assert.equal(scale.characters.Mebble.runtimeNormalizationScale, 1);
assert.equal(scale.ratios.MebbleToHargoldHeight, 1.26);
assert.ok(profile.orientation.revealDegreesByAction.run <= 6);
assert.ok(scale.ratios.HargoldToCommonMobHeight.minimum >= 2);
assert.ok(scale.ratios.HargoldToCommonMobHeight.maximum <= 3);
assert.equal(profile.orientation.negativeScaleMirroringForbidden, true);
assert.equal(profile.orientation.physicalDirectionChangeRequired, true);
assert.ok(
  profile.orientation.revealDegreesByAction.sprint
  < profile.orientation.revealDegreesByAction['turn-low']
);
assert.ok(profile.functionalArticulation.requiredBodyFamilies.includes('all-five-finger-chains'));
assert.ok(profile.functionalArticulation.requiredBodyFamilies.includes('thighs-shins-ankles-feet-toes'));

console.log('character presentation profile tests passed');
