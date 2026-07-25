import { realignLevelId, realignWorld } from './archive-realignment.js';

function requireArray(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value;
}

function clone(value) {
  return structuredClone(value);
}

export function buildWorldSpecificCampaign({
  encounterBudgets,
  encounterZones,
  geometryScaffolds
}) {
  const budgets = requireArray(encounterBudgets?.levels, 'encounterBudgets.levels');
  const zones = requireArray(encounterZones?.levels, 'encounterZones.levels');
  const scaffolds = requireArray(geometryScaffolds?.levels, 'geometryScaffolds.levels');
  const budgetById = new Map(budgets.map(level => [level.id, level]));
  const zonesById = new Map(zones.map(level => [level.levelId, level]));
  const scaffoldById = new Map(scaffolds.map(level => [level.levelId, level]));
  const ids = new Set([...budgetById.keys(), ...zonesById.keys(), ...scaffoldById.keys()]);

  if (ids.size !== 90 || budgetById.size !== 90 || zonesById.size !== 90 || scaffoldById.size !== 90) {
    throw new Error('Imported campaign must contain the same 90 authored level IDs in all three manifests');
  }

  const courses = [...ids].sort((left, right) => {
    const [lw, ll] = left.split('-').map(Number);
    const [rw, rl] = right.split('-').map(Number);
    return lw - rw || ll - rl;
  }).map(archivedLevelId => {
    const budget = budgetById.get(archivedLevelId);
    const encounter = zonesById.get(archivedLevelId);
    const geometry = scaffoldById.get(archivedLevelId);
    if (!budget || !encounter || !geometry) throw new Error(`Incomplete authored sources for ${archivedLevelId}`);
    const worldNumber = Number(archivedLevelId.split('-')[0]);
    const realignment = realignLevelId(archivedLevelId);
    const encounterZoneList = requireArray(encounter.zones, `${archivedLevelId}.zones`);
    if (encounterZoneList.length !== 7) throw new Error(`${archivedLevelId} must retain seven authored encounter zones`);
    if (geometry.collectibles?.length !== 3) throw new Error(`${archivedLevelId} must retain three collectible solutions`);
    return Object.freeze({
      archivedLevelId,
      levelId: realignment.canonicalLevelId,
      archivedName: budget.name,
      canonicalName: realignment.canonicalName,
      world: realignWorld(worldNumber),
      canonStatus: realignment.canonStatus,
      realignmentReason: realignment.reason,
      authored: Object.freeze({
        difficulty: budget.difficulty,
        bossLevel: Boolean(budget.bossLevel),
        enemyBudget: clone(budget),
        encounterSchedule: clone(encounter),
        constructionScaffold: clone(geometry)
      }),
      geometryStatus: geometry.coordinatesClaimed
        ? 'implemented-coordinates'
        : 'coordinate-free-construction-scaffold'
    });
  });

  const byCanonicalId = new Map(courses.map(course => [course.levelId, course]));
  if (byCanonicalId.size !== 90) throw new Error('Canon realignment produced duplicate course IDs');
  return Object.freeze({
    courses: Object.freeze(courses),
    getCourse(levelId) {
      return byCanonicalId.get(levelId) ?? null;
    },
    getWorld(worldNumber) {
      return Object.freeze(courses.filter(course => course.world.worldNumber === worldNumber));
    }
  });
}

export function parseConstructionPlan(markdown, worldNumber) {
  const headingPattern = /^# (?:World[^\n]*|(\d+-\d+)\s+[^\n]*)$/gm;
  const matches = [...markdown.matchAll(headingPattern)];
  const courses = [];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    if (!match[1]) continue;
    const end = matches[index + 1]?.index ?? markdown.length;
    const source = markdown.slice(match.index, end).trim();
    const title = match[0].replace(/^#\s+/, '');
    const [, archivedName = ''] = title.split(/\s+[—-]\s+/, 2);
    const field = label => source.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]+)`))?.[1]?.trim() ?? null;
    const beatMatches = [...source.matchAll(/^###\s+\d+\.\s+([^\n]+)\n([\s\S]*?)(?=^###\s+\d+\.|^##\s+|^#\s+|(?![\s\S]))/gm)];
    courses.push(Object.freeze({
      archivedLevelId: match[1],
      archivedName,
      worldNumber,
      identity: field('Identity'),
      primaryMechanic: field('Primary mechanic'),
      supportingMechanic: field('Supporting mechanic') ?? field('Secondary mechanic'),
      checkpoint: field('Checkpoint'),
      beats: Object.freeze(beatMatches.map(([, name, description]) => Object.freeze({
        name: name.trim(),
        description: description.trim()
      }))),
      source
    }));
  }
  return Object.freeze(courses);
}
