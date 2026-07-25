import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  IMPORTED_PACKAGE_FILES,
  IMPORTED_PACKAGE_ROOT,
  realignLevelId,
  realignWorld
} from '../src/content/archive-realignment.js';
import {
  buildWorldSpecificCampaign,
  parseConstructionPlan
} from '../src/content/world-specific-content.js';
import {
  enemyBelongsToCourse,
  getCourseEnemyRoster,
  getWorldEnemyRoster
} from '../src/content/world-enemy-rosters.js';
import {
  BEHAVIOR_STATES,
  buildEnemyDefinitions,
  createEnemyRuntime
} from '../src/gameplay/enemies/enemy-runtime.js';
import {
  attackMob,
  createMob,
  stepMob,
  stompMob
} from '../src/gameplay/enemies/mob-simulation.js';
import {
  createAttack,
  createCombatant,
  resolveCombatHit,
  tickCombatant
} from '../src/gameplay/combat/combat-runtime.js';
import { buildInteractionRuntime } from '../src/gameplay/interactions/interaction-runtime.js';
import {
  createEncounterRuntime,
  normalizeEncounterWave
} from '../src/gameplay/encounters/encounter-runtime.js';
import { createBossRuntime, parseBossContracts } from '../src/gameplay/bosses/boss-runtime.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const imported = name => `${root}/${IMPORTED_PACKAGE_ROOT}/${name}`;
const readJson = async name => JSON.parse(await readFile(imported(name), 'utf8'));
const readText = name => readFile(imported(name), 'utf8');

const [budgets, zones, geometry, enemyCatalog, interactionMatrix, bossMarkdown, worldOne, worldNine, worldTen] =
  await Promise.all([
    readJson('encounter_budget_manifest.json'),
    readJson('encounter_zone_manifest.json'),
    readJson('level_geometry_scaffolds.json'),
    readJson('enemy_catalog.json'),
    readJson('interaction_matrix.json'),
    readText('boss_fight_master_plan.md'),
    readText('world_1_construction_plan.md'),
    readText('world_9_construction_plan.md'),
    readText('world_10_construction_plan.md')
  ]);

assert.equal(IMPORTED_PACKAGE_FILES.length, 15);
assert.equal(new Set(IMPORTED_PACKAGE_FILES).size, 15);
assert.equal(realignWorld(5).canonicalName, 'Ember Rift');
assert.equal(realignWorld(6).canonicalName, 'Overgrown Grove');
assert.equal(realignWorld(10).historicalIdentityIsLockedCanon, false);
assert.equal(realignLevelId('1-9').canonicalLevelId, '1-8');
assert.equal(realignLevelId('1-8').canonicalLevelId, '1-9');

const campaign = buildWorldSpecificCampaign({
  encounterBudgets: budgets,
  encounterZones: zones,
  geometryScaffolds: geometry
});
assert.equal(campaign.courses.length, 90);
assert.equal(campaign.getWorld(1).length, 9);
assert.equal(campaign.getCourse('1-8').archivedName, 'Verdant Gate');
assert.equal(campaign.getCourse('1-9').archivedName, 'Rootbound Hollow');
for (const course of campaign.courses) {
  assert.equal(course.authored.encounterSchedule.zones.length, 7, `${course.levelId} encounter zones`);
  assert.equal(course.authored.constructionScaffold.collectibles.length, 3, `${course.levelId} Compass Coins`);
  assert.equal(course.geometryStatus, 'coordinate-free-construction-scaffold');
}

assert.equal(parseConstructionPlan(worldOne, 1).length, 9);
assert.equal(parseConstructionPlan(worldNine, 9).length, 9);
assert.equal(parseConstructionPlan(worldTen, 10).length, 9);
const meadow = parseConstructionPlan(worldOne, 1)[0];
assert.equal(meadow.archivedLevelId, '1-1');
assert.match(meadow.primaryMechanic, /locomotion/i);
assert.equal(meadow.beats.length, 7);

assert.deepEqual(getCourseEnemyRoster('1-1'), ['camp_critter', 'shellback']);
assert.deepEqual(getCourseEnemyRoster('1-3'), ['dirt_squirt', 'spike_beetle']);
assert.equal(enemyBelongsToCourse('camp_sentry', '1-1'), false);
assert.equal(enemyBelongsToCourse('camp_sentry', '1-4'), true);
assert.equal(getWorldEnemyRoster(2).namedWorldEnemies.includes('tidebiter'), true);
assert.equal(getWorldEnemyRoster(5).namedWorldEnemies.includes('steamgor'), true);
assert.equal(getWorldEnemyRoster(6).namedWorldEnemies.includes('camp_chipper'), true);

const enemyDefinitions = buildEnemyDefinitions(enemyCatalog);
assert.equal(Object.keys(enemyDefinitions).length, 39);
assert.deepEqual(enemyDefinitions.shellback.states, BEHAVIOR_STATES.shellback);
assert.equal(enemyDefinitions.camp_chipper.oneHit, true, 'current canon overrides archived two-hit Chipper');
const shellback = createEnemyRuntime(enemyDefinitions.shellback, { seed: 7 });
shellback.command('stomp');
assert.equal(shellback.snapshot.state, 'shell-idle');
shellback.command('kick', { direction: -1 });
assert.equal(shellback.snapshot.state, 'shell-roll');
assert.equal(shellback.snapshot.direction, -1);

const interactions = buildInteractionRuntime(enemyCatalog, interactionMatrix);
assert.equal(interactions.resolve({ source: 'standard-attack', targetId: 'camp_chipper' }).outcome, 'defeat');
assert.equal(interactions.resolve({ source: 'fire', targetId: 'steamgor' }).outcome, 'immune');
assert.equal(interactions.resolve({ source: 'ice', targetId: 'steamgor' }).outcome, 'defeat');
assert.equal(interactions.resolve({ source: 'stomp', targetId: 'tidebiter', environment: 'ground' }).outcome, 'invalid-environment');

const normalizedWave = normalizeEncounterWave(
  campaign.getCourse('1-1').authored.encounterSchedule.zones[3].waves[0]
);
assert.equal(normalizedWave.requested, 3);
assert.deepEqual(normalizedWave.enemies, [
  { enemyId: 'camp_critter', count: 1 },
  { enemyId: 'shellback', count: 1 },
  { enemyId: 'spike_beetle', count: 1 }
]);

const spawnedWaves = [];
const meadowRuntime = createEncounterRuntime(campaign.getCourse('1-1'), {
  spawn: (wave, context) => spawnedWaves.push({ wave, context })
});
assert.equal(meadowRuntime.snapshot.cap, 5);
const meadowEvents = meadowRuntime.enterZone(0);
assert.equal(meadowRuntime.snapshot.activeCount, 1);
assert.equal(meadowRuntime.snapshot.zoneCap, 1);
assert.equal(meadowEvents[0].requested, 1);
assert.equal(spawnedWaves[0].wave.enemies[0].enemyId, 'camp_critter');
assert.equal(spawnedWaves[0].context.offscreenPolicy.requiresOffscreenOrTelegraphedEntry, true);
meadowRuntime.completeZone();
assert.equal(meadowRuntime.snapshot.activeCount, 0);
const recoveryEvents = meadowRuntime.enterZone(1);
assert.equal(recoveryEvents[0].reason, 'recovery-gap');
assert.equal(meadowRuntime.snapshot.pendingWaveCount, 1);
const resumedEvents = meadowRuntime.tick(4.8);
assert.equal(resumedEvents[0].type, 'wave-started');
assert.equal(resumedEvents[0].requested, 2);
assert.equal(meadowRuntime.snapshot.activeCount, 2);

const flatGround = () => 5;
const critter = createMob({ id: 'critter-test', type: 'camp_critter', x: 4, direction: 1 });
critter.y = flatGround();
stepMob(critter, 1 / 120, {
  groundHeightAt: flatGround,
  hasGroundAhead: () => true,
  target: { x: 8, y: 4 }
});
assert.ok(critter.x > 4, 'Camp Critter patrols deterministically');
assert.equal(stompMob(critter).outcome, 'defeat');
assert.equal(critter.damaging, false, 'defeated mobs immediately stop damaging');

const spike = createMob({ id: 'spike-test', type: 'spike_beetle', x: 4 });
assert.equal(stompMob(spike).outcome, 'damage-player');
assert.equal(spike.alive, true);

const spatialShellback = createMob({ id: 'shell-test', type: 'shellback', x: 4 });
assert.equal(stompMob(spatialShellback).outcome, 'shell-retracted');
assert.equal(attackMob(spatialShellback, { direction: -1 }).outcome, 'shell-launched');
assert.equal(spatialShellback.direction, -1);
assert.equal(stompMob(spatialShellback).outcome, 'shell-stopped');

const sentry = createMob({ id: 'sentry-test', type: 'camp_sentry', x: 8 });
sentry.y = flatGround();
const sentryEvents = stepMob(sentry, 1, {
  groundHeightAt: flatGround,
  target: { x: 3, y: 4 }
});
assert.equal(sentryEvents[0].type, 'projectile-fired');
assert.equal(sentryEvents[0].projectile.ownerId, 'sentry-test');
assert.equal(sentryEvents[0].projectile.team, 'enemy');
assert.ok(sentryEvents[0].projectile.lifetimeSeconds > 0);

const combatCritter = createCombatant({
  id: 'camp_critter',
  team: 'enemy',
  tags: ['enemy', 'ground-enemy', 'stomppable']
});
const heroAttack = createAttack({
  id: 'hero-attack-1',
  ownerId: 'Hargold',
  team: 'player',
  source: 'standard-attack',
  knockback: { x: 2, y: -1 }
});
assert.equal(resolveCombatHit(combatCritter, heroAttack, {
  interaction: interactions,
  targetId: 'camp_critter',
  environment: 'ground'
}).outcome, 'defeat');
assert.equal(combatCritter.damaging, false);
tickCombatant(combatCritter, 1 / 120);
assert.equal(combatCritter.alive, false);

const bosses = parseBossContracts(bossMarkdown);
assert.equal(bosses.length, 10);
for (const boss of bosses) {
  assert.ok(boss.attacks.length >= 6, `${boss.archivedBossName} attacks`);
  assert.equal(boss.damageEvents.length, 5, `${boss.archivedBossName} damage events`);
  assert.ok(boss.arenaMutations.length >= 2, `${boss.archivedBossName} arena mutations`);
}
const verdant = createBossRuntime(bosses[0], { canonicalBossName: 'Verdant Wyrm' });
verdant.begin();
for (let event = 1; event <= 5; event += 1) assert.equal(verdant.earnDamageEvent(event), true);
assert.equal(verdant.snapshot.state, 'defeated');
assert.equal(verdant.snapshot.damageEvents, 5);
verdant.resetAfterLifeLoss();
assert.equal(verdant.snapshot.damageEvents, 0);

console.log('World-specific archive restoration checks passed.');
