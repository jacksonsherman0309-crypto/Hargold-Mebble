import { getWorld } from '../canonical-data.js';

export const IMPORTED_PACKAGE_ROOT = 'archive/imported-packages/20260725-110552/loose-files';

export const IMPORTED_PACKAGE_FILES = Object.freeze([
  'boss_fight_master_plan.md',
  'Character design evolution of Mebble.png',
  'encounter_budget_manifest.json',
  'encounter_zone_manifest.json',
  'enemy_catalog.json',
  'enemy_framework_spec.md',
  'hargold_mebble_full_motion_build_009.html',
  'hargold_mebble_level_editor.html',
  'hargold_mebble_meadow_wake_mob_motion_build_003 (1).html',
  'hargold_mebble_meadow_wake_mob_motion_build_003.html',
  'interaction_matrix.json',
  'level_geometry_scaffolds.json',
  'world_1_construction_plan.md',
  'world_10_construction_plan.md',
  'world_9_construction_plan.md'
]);

const WORLD_ONE_SLOT_REALIGNMENT = Object.freeze({
  '1-8': Object.freeze({
    canonicalLevelId: '1-9',
    canonicalName: null,
    reason: 'The archived optional Rootbound Hollow slot maps to the current secret ninth slot.',
    canonStatus: 'provisional-historical-course-design'
  }),
  '1-9': Object.freeze({
    canonicalLevelId: '1-8',
    canonicalName: 'Verdant Gate',
    reason: 'Current canon places the Verdant Wyrm finale in slot 1-8.',
    canonStatus: 'adapted-to-current-canon'
  })
});

const WORLD_REALIGNMENTS = Object.freeze({
  1: Object.freeze({ archivedName: 'Verdant Vale', disposition: 'compatible' }),
  2: Object.freeze({ archivedName: 'Drowned Coast', disposition: 'rename', currentName: 'Tideglass Coast' }),
  3: Object.freeze({ archivedName: 'Luminite Glade', disposition: 'rename', currentName: 'Crystal Dunes' }),
  4: Object.freeze({ archivedName: 'Skyreach Range', disposition: 'compatible' }),
  5: Object.freeze({ archivedName: 'Scorchglass Dunes', disposition: 'mechanics-only', currentName: 'Ember Rift' }),
  6: Object.freeze({ archivedName: 'Camp Dominion', disposition: 'mechanics-only', currentName: 'Overgrown Grove' }),
  7: Object.freeze({ archivedName: 'Toxic Fen', disposition: 'compatible' }),
  8: Object.freeze({ archivedName: 'Pit of Echoes', disposition: 'provisional-reference', currentName: 'Secret World A' }),
  9: Object.freeze({ archivedName: 'Chrono Archive', disposition: 'provisional-reference', currentName: 'Secret World B' }),
  10: Object.freeze({ archivedName: 'Ironwood Siege', disposition: 'mechanics-only', currentName: 'Final World' })
});

export function realignWorld(worldNumber) {
  const canonical = getWorld(worldNumber);
  const rule = WORLD_REALIGNMENTS[worldNumber];
  if (!canonical || !rule) throw new Error(`Unknown world ${worldNumber}`);
  return Object.freeze({
    worldNumber,
    archivedName: rule.archivedName,
    canonicalName: canonical.name,
    canonicalBoss: canonical.boss,
    disposition: rule.disposition,
    historicalIdentityIsLockedCanon: rule.disposition === 'compatible'
  });
}

export function realignLevelId(archivedLevelId) {
  const explicit = WORLD_ONE_SLOT_REALIGNMENT[archivedLevelId];
  if (explicit) return explicit;
  const [worldText] = archivedLevelId.split('-');
  const world = realignWorld(Number(worldText));
  return Object.freeze({
    canonicalLevelId: archivedLevelId,
    canonicalName: null,
    reason: world.disposition === 'compatible'
      ? 'No current-canon slot reassignment is required.'
      : 'The authored mechanics are retained, but the historical course identity remains provisional.',
    canonStatus: world.disposition === 'compatible'
      ? 'compatible'
      : 'provisional-historical-course-design'
  });
}

export function describeArchiveSource(relativePath) {
  if (!IMPORTED_PACKAGE_FILES.includes(relativePath)) {
    throw new Error(`File is not part of the inventoried imported package: ${relativePath}`);
  }
  return `${IMPORTED_PACKAGE_ROOT}/${relativePath}`;
}
