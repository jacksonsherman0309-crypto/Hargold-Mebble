export const CHARACTER_READABILITY_MODES = Object.freeze([
  'off',
  'contour',
  'lighting',
  'combined'
]);

export const CHARACTER_READABILITY_QUALITY = Object.freeze({
  low: Object.freeze({
    contourPixels: 1,
    lightingScale: 0.68,
    normalDetailScale: 0.48,
    maximumPixelRatio: 1.5
  }),
  balanced: Object.freeze({
    contourPixels: 1.35,
    lightingScale: 1,
    normalDetailScale: 0.62,
    maximumPixelRatio: 2
  }),
  high: Object.freeze({
    contourPixels: 1.65,
    lightingScale: 1.08,
    normalDetailScale: 0.72,
    maximumPixelRatio: 2
  })
});

export const HERO_READABILITY_PROFILES = Object.freeze({
  Hargold: Object.freeze({
    contourColor: '#17251b',
    representativeLuminance: 0.34,
    contourOpacityMinimum: 0.5,
    contourOpacityMaximum: 0.72,
    rimMinimum: 0.055,
    rimMaximum: 0.13,
    faceFill: 0.085,
    upperKey: 0.055,
    shadowFloor: 0.16,
    midtoneClarity: 0.1,
    roughnessFloor: 0.66,
    metalnessCeiling: 0.08
  }),
  Mebble: Object.freeze({
    contourColor: '#261f2b',
    representativeLuminance: 0.39,
    contourOpacityMinimum: 0.53,
    contourOpacityMaximum: 0.76,
    rimMinimum: 0.065,
    rimMaximum: 0.145,
    faceFill: 0.095,
    upperKey: 0.06,
    shadowFloor: 0.17,
    midtoneClarity: 0.11,
    roughnessFloor: 0.68,
    metalnessCeiling: 0.08
  })
});

export const BACKGROUND_READABILITY_PROFILES = Object.freeze({
  'bright-grassland': Object.freeze({
    label: 'Bright grassland',
    upperColor: '#93d4ea',
    lowerColor: '#557f3f',
    luminance: 0.57,
    detail: 0.62,
    temperature: 'warm',
    rimColor: '#d4e7f7',
    affinity: Object.freeze({ Hargold: 0.86, Mebble: 0.65 })
  }),
  'dense-forest': Object.freeze({
    label: 'Dense forest',
    upperColor: '#28452c',
    lowerColor: '#4f3424',
    luminance: 0.26,
    detail: 0.84,
    temperature: 'cool',
    rimColor: '#f3d2ad',
    affinity: Object.freeze({ Hargold: 0.9, Mebble: 0.78 })
  }),
  'dark-cave': Object.freeze({
    label: 'Dark cave or ruin',
    upperColor: '#20262c',
    lowerColor: '#17191d',
    luminance: 0.13,
    detail: 0.48,
    temperature: 'cool',
    rimColor: '#f4d2ad',
    affinity: Object.freeze({ Hargold: 0.38, Mebble: 0.52 })
  }),
  'bright-stone': Object.freeze({
    label: 'Bright stone structure',
    upperColor: '#d8d2bd',
    lowerColor: '#8e8a7a',
    luminance: 0.67,
    detail: 0.7,
    temperature: 'warm',
    rimColor: '#cfdef0',
    affinity: Object.freeze({ Hargold: 0.42, Mebble: 0.54 })
  }),
  sunset: Object.freeze({
    label: 'Sunset backlight',
    upperColor: '#e78f52',
    lowerColor: '#6f3f3a',
    luminance: 0.43,
    detail: 0.6,
    temperature: 'warm',
    rimColor: '#cbdff4',
    affinity: Object.freeze({ Hargold: 0.62, Mebble: 0.7 })
  }),
  'snow-ice': Object.freeze({
    label: 'Snow or ice',
    upperColor: '#dceaf1',
    lowerColor: '#8db4c5',
    luminance: 0.78,
    detail: 0.52,
    temperature: 'cool',
    rimColor: '#f1d3b5',
    affinity: Object.freeze({ Hargold: 0.24, Mebble: 0.34 })
  }),
  'toxic-green': Object.freeze({
    label: 'Toxic green',
    upperColor: '#81a93c',
    lowerColor: '#31491e',
    luminance: 0.39,
    detail: 0.77,
    temperature: 'cool',
    rimColor: '#f1d2ae',
    affinity: Object.freeze({ Hargold: 0.94, Mebble: 0.83 })
  }),
  'busy-gameplay': Object.freeze({
    label: 'Busy gameplay foreground',
    upperColor: '#78b6a1',
    lowerColor: '#6f4b31',
    luminance: 0.45,
    detail: 1,
    temperature: 'warm',
    rimColor: '#d4e3f5',
    affinity: Object.freeze({ Hargold: 0.84, Mebble: 0.76 })
  })
});

const MEADOW_WAKE_BROAD_ZONES = Object.freeze([
  Object.freeze({ from: 0, to: 11.8, profile: 'bright-grassland' }),
  Object.freeze({ from: 11.8, to: 20.5, profile: 'dense-forest' }),
  Object.freeze({ from: 20.5, to: 31.5, profile: 'bright-stone' }),
  Object.freeze({ from: 31.5, to: 55, profile: 'busy-gameplay' }),
  Object.freeze({ from: 55, to: 72, profile: 'dense-forest' }),
  Object.freeze({ from: 72, to: Infinity, profile: 'bright-grassland' })
]);

export function resolveReadabilityMode(value) {
  return CHARACTER_READABILITY_MODES.includes(value) ? value : 'combined';
}

export function resolveReadabilityQuality(value) {
  return CHARACTER_READABILITY_QUALITY[value] ? value : 'balanced';
}

export function resolveBackgroundProfile(value) {
  return BACKGROUND_READABILITY_PROFILES[value]
    ? value
    : 'bright-grassland';
}

export function broadMeadowWakeProfileAt(worldX) {
  return MEADOW_WAKE_BROAD_ZONES.find(zone =>
    worldX >= zone.from && worldX < zone.to
  )?.profile ?? 'bright-grassland';
}

export function readabilityRisk(hero, backgroundName) {
  const heroProfile = HERO_READABILITY_PROFILES[hero];
  const background = BACKGROUND_READABILITY_PROFILES[
    resolveBackgroundProfile(backgroundName)
  ];
  const luminanceSimilarity = 1 - Math.min(
    1,
    Math.abs(background.luminance - heroProfile.representativeLuminance) / 0.58
  );
  let risk =
    luminanceSimilarity * 0.54 +
    background.affinity[hero] * 0.31 +
    background.detail * 0.15;
  if (background.luminance < 0.18) risk *= 0.72;
  return Math.max(0, Math.min(1, risk));
}
