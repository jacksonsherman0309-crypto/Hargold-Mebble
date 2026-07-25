/*
 * Implemented Meadow Wake course geometry.
 *
 * These coordinates describe the geometry that is currently playable in the
 * browser build. They are not a replacement generator for other courses.
 * Every future course must provide its own authored data.
 */
export const MEADOW_WAKE_PLATFORMS = Object.freeze([
  Object.freeze({ id: 'meadow-step-a', x: 7.9, y: 6.25, width: 2.2, height: 0.35, oneWay: true }),
  Object.freeze({ id: 'gap-landing-a', x: 11.6, y: 6.5, width: 1.5, height: 0.3, oneWay: true }),
  Object.freeze({ id: 'upper-route-a', x: 15.1, y: 5.55, width: 1.8, height: 0.32, oneWay: true }),
  Object.freeze({ id: 'upper-route-b', x: 23.7, y: 5.65, width: 2, height: 0.32, oneWay: true }),
  Object.freeze({ id: 'block-approach-a', x: 27.3, y: 6.1, width: 1.5, height: 0.3, oneWay: true }),
  Object.freeze({ id: 'final-rise-a', x: 32.8, y: 5.7, width: 1.8, height: 0.32, oneWay: true })
]);

export const MEADOW_WAKE_BLOCK_DEFINITIONS = Object.freeze([
  ...[6.4, 6.95, 13.5, 14.05, 26.15, 26.7].map((x, index) => Object.freeze({
    id: `breakable-${index + 1}`,
    type: 'standard-breakable',
    x,
    lift: 1.45,
    width: 0.74,
    height: 0.74
  })),
  Object.freeze({
    id: 'hargold-gate-1',
    type: 'hargold-only',
    x: 28.7,
    lift: 1.45,
    width: 0.82,
    height: 0.82
  })
]);

export function createMeadowWakeBlocks(heightAt) {
  return MEADOW_WAKE_BLOCK_DEFINITIONS.map(definition => ({
    ...definition,
    y: heightAt(definition.x) - definition.lift,
    broken: false,
    bumpSeconds: 0
  }));
}
