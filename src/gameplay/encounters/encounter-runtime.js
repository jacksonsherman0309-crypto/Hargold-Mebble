const DIFFICULTY_KEYS = Object.freeze({
  Easy: 'easy',
  Normal: 'standard',
  Standard: 'standard',
  Hard: 'hard',
  Nightmare: 'nightmare'
});

export function normalizeEncounterWave(wave) {
  const entries = Array.isArray(wave?.enemies)
    ? wave.enemies.map(entry => ({
        enemyId: entry.enemyId ?? entry.id ?? entry.type,
        count: Math.max(0, Math.trunc(entry.count ?? 1))
      }))
    : Object.entries(wave?.enemyCounts ?? {}).map(([enemyId, count]) => ({
        enemyId,
        count: Math.max(0, Math.trunc(count))
      }));
  for (const entry of entries) {
    if (!entry.enemyId) throw new Error(`Encounter wave ${wave?.id ?? '<unknown>'} contains an unnamed enemy`);
  }
  return Object.freeze({
    ...structuredClone(wave),
    enemies: Object.freeze(entries.map(entry => Object.freeze(entry))),
    requested: entries.reduce((sum, entry) => sum + entry.count, 0)
  });
}

function takePermittedEnemies(entries, permitted) {
  let remaining = permitted;
  const selected = [];
  for (const entry of entries) {
    if (remaining <= 0) break;
    const count = Math.min(entry.count, remaining);
    if (count > 0) selected.push(Object.freeze({ enemyId: entry.enemyId, count }));
    remaining -= count;
  }
  return Object.freeze(selected);
}

export function createEncounterRuntime(course, {
  difficulty = 'Normal',
  spawn = wave => ({ wave }),
  despawn = () => {}
} = {}) {
  const key = DIFFICULTY_KEYS[difficulty];
  if (!key) throw new Error(`Unsupported difficulty ${difficulty}`);
  const budget = course.authored.enemyBudget;
  const schedule = course.authored.encounterSchedule;
  const zones = schedule.zones;
  const cap = budget.simultaneousRegularEnemyCaps[key];
  let activeZoneIndex = -1;
  let activeCount = 0;
  let lastDenseEncounterSeconds = -Infinity;
  let elapsedSeconds = 0;
  let recoveryUntilSeconds = 0;
  const completed = new Set();
  const pendingWaves = [];
  const emitted = [];

  function startWave(zone, sourceWave) {
    const zoneCap = Math.min(cap, zone.maximumActiveByDifficulty?.[key] ?? cap);
    const wave = normalizeEncounterWave(sourceWave);
    const requested = wave.requested;
    if (elapsedSeconds < recoveryUntilSeconds && requested > 0) {
      pendingWaves.push({ zoneId: zone.id, wave: structuredClone(sourceWave) });
      emitted.push(Object.freeze({
        type: 'wave-deferred',
        zoneId: zone.id,
        reason: 'recovery-gap',
        remainingSeconds: recoveryUntilSeconds - elapsedSeconds
      }));
      return;
    }
    const permitted = Math.max(0, Math.min(requested, zoneCap - activeCount));
    if (permitted === 0 && requested > 0) {
      pendingWaves.push({ zoneId: zone.id, wave: structuredClone(sourceWave) });
      emitted.push(Object.freeze({ type: 'wave-deferred', zoneId: zone.id, reason: 'simultaneous-cap' }));
      return;
    }
    activeCount += permitted;
    if (permitted >= Math.max(2, zoneCap - 1)) lastDenseEncounterSeconds = elapsedSeconds;
    spawn({
      ...structuredClone(wave),
      enemies: takePermittedEnemies(wave.enemies, permitted)
    }, {
      permitted,
      cap: zoneCap,
      offscreenPolicy: structuredClone(zone.spawnSafety ?? budget.offscreenSpawnPolicy)
    });
    emitted.push(Object.freeze({ type: 'wave-started', zoneId: zone.id, permitted, requested }));
  }

  function enterZone(index) {
    if (index < 0 || index >= zones.length) throw new RangeError(`Invalid encounter zone ${index}`);
    activeZoneIndex = index;
    const zone = zones[index];
    for (const wave of zone.waves ?? []) startWave(zone, wave);
    return drainEvents();
  }

  function defeat(count = 1) {
    activeCount = Math.max(0, activeCount - count);
  }

  function completeZone() {
    if (activeZoneIndex < 0) return drainEvents();
    const zone = zones[activeZoneIndex];
    completed.add(zone.id);
    recoveryUntilSeconds = Math.max(
      recoveryUntilSeconds,
      elapsedSeconds + Math.max(0, zone.recoveryGapAfterSeconds ?? 0)
    );
    for (let index = pendingWaves.length - 1; index >= 0; index -= 1) {
      if (pendingWaves[index].zoneId === zone.id) pendingWaves.splice(index, 1);
    }
    despawn({ zoneId: zone.id, reason: 'zone-complete' });
    activeCount = 0;
    emitted.push(Object.freeze({ type: 'zone-complete', zoneId: zone.id }));
    return drainEvents();
  }

  function tick(deltaSeconds) {
    elapsedSeconds += Math.max(0, deltaSeconds);
    if (elapsedSeconds >= recoveryUntilSeconds && activeZoneIndex >= 0 && pendingWaves.length > 0) {
      const zone = zones[activeZoneIndex];
      const ready = pendingWaves.filter(pending => pending.zoneId === zone.id);
      const retained = pendingWaves.filter(pending => pending.zoneId !== zone.id);
      pendingWaves.splice(0, pendingWaves.length, ...retained);
      for (const pending of ready) startWave(zone, pending.wave);
    }
    return drainEvents();
  }

  function drainEvents() {
    return Object.freeze(emitted.splice(0));
  }

  return Object.freeze({
    enterZone,
    defeat,
    completeZone,
    tick,
    drainEvents,
    get snapshot() {
      return Object.freeze({
        levelId: course.levelId,
        activeZoneIndex,
        activeCount,
        cap,
        zoneCap: activeZoneIndex >= 0
          ? Math.min(cap, zones[activeZoneIndex].maximumActiveByDifficulty?.[key] ?? cap)
          : cap,
        elapsedSeconds,
        recoveryUntilSeconds,
        pendingWaveCount: pendingWaves.length,
        completedZones: Object.freeze([...completed])
      });
    }
  });
}
