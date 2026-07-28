import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import {
  BACKGROUND_READABILITY_PROFILES,
  CHARACTER_READABILITY_MODES,
  CHARACTER_READABILITY_QUALITY,
  HERO_READABILITY_PROFILES,
  broadMeadowWakeProfileAt,
  readabilityRisk,
  resolveBackgroundProfile,
  resolveReadabilityMode,
  resolveReadabilityQuality
} from '../src/rendering/character-readability-config.js';
import { GAME_RULES } from '../src/canonical-data.js';

const expectedBackgrounds = [
  'bright-grassland',
  'dense-forest',
  'dark-cave',
  'bright-stone',
  'sunset',
  'snow-ice',
  'toxic-green',
  'busy-gameplay'
];
const validation = JSON.parse(
  readFileSync(
    new URL('../data/character-readability-validation.json', import.meta.url),
    'utf8'
  )
);

assert.deepEqual(
  CHARACTER_READABILITY_MODES,
  ['off', 'contour', 'lighting', 'combined']
);
assert.deepEqual(
  Object.keys(BACKGROUND_READABILITY_PROFILES),
  expectedBackgrounds
);
assert.deepEqual(
  GAME_RULES.characterPresentation.readability.backgroundProfiles,
  expectedBackgrounds
);
assert.equal(
  GAME_RULES.characterPresentation.readability.defaultMode,
  'combined'
);
assert.equal(
  GAME_RULES.characterPresentation.readability.characterOnly,
  true
);
assert.equal(
  GAME_RULES.characterPresentation.readability.fullSceneEdgeDetectionForbidden,
  true
);
assert.equal(resolveReadabilityMode('invalid'), 'combined');
assert.equal(resolveReadabilityQuality('invalid'), 'balanced');
assert.equal(resolveBackgroundProfile('invalid'), 'bright-grassland');

for (const [name, quality] of Object.entries(
  CHARACTER_READABILITY_QUALITY
)) {
  assert.ok(
    quality.contourPixels >= 1 && quality.contourPixels <= 2,
    `${name} contour must remain within the locked 1–2 CSS-pixel range`
  );
  assert.ok(
    quality.maximumPixelRatio <= 2,
    `${name} must cap device-pixel-ratio for mobile`
  );
}

for (const [hero, profile] of Object.entries(HERO_READABILITY_PROFILES)) {
  assert.notEqual(profile.contourColor.toLowerCase(), '#000000');
  assert.ok(profile.contourOpacityMinimum > 0);
  assert.ok(profile.contourOpacityMaximum < 0.8);
  for (const background of expectedBackgrounds) {
    const risk = readabilityRisk(hero, background);
    assert.ok(
      risk >= 0 && risk <= 1,
      `${hero}/${background} risk must be normalized`
    );
  }
}

assert.ok(
  readabilityRisk('Hargold', 'dark-cave') <
    readabilityRisk('Hargold', 'toxic-green'),
  'dark scenes must avoid amplifying the contour into a black sticker'
);
assert.equal(broadMeadowWakeProfileAt(2), 'bright-grassland');
assert.equal(broadMeadowWakeProfileAt(13), 'dense-forest');
assert.equal(broadMeadowWakeProfileAt(25), 'bright-stone');
assert.equal(broadMeadowWakeProfileAt(40), 'busy-gameplay');
assert.equal(validation.stressMatrix.results, '16-of-16-ready');
assert.deepEqual(validation.stressMatrix.profiles, expectedBackgrounds);
assert.deepEqual(validation.stressMatrix.heroes, ['Hargold', 'Mebble']);
assert.deepEqual(validation.phoneViewport, { width: 932, height: 430 });

for (const file of [
  ...Object.values(validation.abCaptures),
  ...Object.values(validation.phoneCaptures)
]) {
  assert.ok(
    statSync(new URL(`../${file}`, import.meta.url)).size > 40_000,
    `${file} must contain a captured browser frame`
  );
}

for (const hero of validation.stressMatrix.heroes) {
  for (const profile of validation.stressMatrix.profiles) {
    const file = validation.stressMatrix.pathTemplate
      .replace('{hero-lower}', hero.toLowerCase())
      .replace('{profile}', profile);
    assert.ok(
      statSync(new URL(`../${file}`, import.meta.url)).size > 40_000,
      `${hero}/${profile} must have a ready-gated stress capture`
    );
  }
}

const renderer = readFileSync(
  new URL('../src/character-renderer.js', import.meta.url),
  'utf8'
);
const pass = readFileSync(
  new URL('../src/rendering/character-readability.js', import.meta.url),
  'utf8'
);

assert.match(renderer, /new CharacterReadabilityPass/);
assert.match(renderer, /readabilityBackdrop/);
assert.match(renderer, /readabilityPair/);
assert.match(renderer, /broadMeadowWakeProfileAt/);
assert.match(renderer, /ResizeObserver/);
assert.match(renderer, /readability\.updateViewport/);
assert.doesNotMatch(renderer, /EffectComposer|OutlinePass|SobelOperator/);

assert.match(pass, /THREE\.BackSide/);
assert.match(pass, /depthTest:\s*true/);
assert.match(pass, /depthWrite:\s*false/);
assert.match(pass, /contourPixels/);
assert.match(pass, /screen_space_contour/);
assert.match(pass, /0\.32/);
assert.match(pass, /closeupRimScale/);
assert.match(pass, /aoMapIntensity/);
assert.match(pass, /drawCallsPerVisibleMesh/);
assert.doesNotMatch(pass, /gl_FragColor\s*=\s*vec4\(\s*vec3\(\s*0\.0/);

console.log('Character readability contract checks passed');
