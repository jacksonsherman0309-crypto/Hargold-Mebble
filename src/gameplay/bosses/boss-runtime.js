function linesUnder(source, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`^### ${escaped}\\s*\\n([\\s\\S]*?)(?=^### |^## |(?![\\s\\S]))`, 'm'));
  return match?.[1] ?? '';
}

function linesUnderBoldLabel(source, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`^\\*\\*${escaped}:\\*\\*\\s*\\n([\\s\\S]*?)(?=^### |^\\*\\*[^\\n]+:\\*\\*|^---|(?![\\s\\S]))`, 'm'));
  return match?.[1] ?? '';
}

export function parseBossContracts(markdown) {
  const matches = [...markdown.matchAll(/^## World (\d+) [—-] ([^\n]+)$/gm)];
  return Object.freeze(matches.map((match, index) => {
    const source = markdown.slice(match.index, matches[index + 1]?.index ?? markdown.length);
    const worldNumber = Number(match[1]);
    const archivedBossName = match[2].trim();
    const roomMatch = source.match(/^### Room [—-] ([^\n]+)\n([^\n]+)/m);
    const attacks = [...linesUnder(source, 'Unique attacks').matchAll(/^\d+\.\s+\*\*([^*]+)\*\*\s+[—-]\s+Tell:\s*([^]+?)\s+Counterplay:\s*([^\n]+)/gm)]
      .map(([, name, telegraph, counterplay]) => Object.freeze({
        name: name.trim(),
        telegraph: telegraph.trim(),
        counterplay: counterplay.trim()
      }));
    const damageEvents = [...linesUnder(source, 'Five earned damage events').matchAll(/^\d+\.\s+([^\n]+)/gm)]
      .map(([, description], eventIndex) => Object.freeze({
        eventNumber: eventIndex + 1,
        description: description.trim()
      }));
    const mutations = [...linesUnderBoldLabel(source, 'Arena mutations').matchAll(/^-\s+([^\n]+)/gm)]
      .map(([, description]) => description.trim());
    return Object.freeze({
      worldNumber,
      archivedBossName,
      room: roomMatch ? Object.freeze({ name: roomMatch[1].trim(), description: roomMatch[2].trim() }) : null,
      attacks: Object.freeze(attacks),
      damageEvents: Object.freeze(damageEvents),
      arenaMutations: Object.freeze(mutations),
      source
    });
  }));
}

export function createBossRuntime(contract, {
  canonicalBossName,
  difficulty = 'Normal'
}) {
  if (contract.damageEvents.length !== 5) throw new Error(`${contract.archivedBossName} must retain five earned damage events`);
  let state = 'approach';
  let damageEvents = 0;
  let activeAttack = null;
  let attackSeconds = 0;
  const arenaMutations = [];
  const events = [];

  function begin() {
    if (state !== 'approach') throw new Error('Boss encounter has already begun');
    state = 'combat';
    events.push(Object.freeze({ type: 'boss-start', boss: canonicalBossName }));
  }

  function telegraphAttack(attackName) {
    if (state !== 'combat') return false;
    const attack = contract.attacks.find(candidate => candidate.name === attackName);
    if (!attack) throw new Error(`Unknown authored attack ${attackName}`);
    activeAttack = attack;
    attackSeconds = 0;
    events.push(Object.freeze({ type: 'attack-telegraph', ...attack }));
    return true;
  }

  function tick(deltaSeconds) {
    if (activeAttack) attackSeconds += Math.max(0, deltaSeconds);
    return drainEvents();
  }

  function earnDamageEvent(eventNumber) {
    if (state !== 'combat' || eventNumber !== damageEvents + 1) return false;
    damageEvents = eventNumber;
    activeAttack = null;
    events.push(Object.freeze({
      type: 'damage-event-earned',
      eventNumber,
      description: contract.damageEvents[eventNumber - 1].description
    }));
    if (eventNumber === 2 || eventNumber === 4) {
      const mutation = contract.arenaMutations[eventNumber === 2 ? 0 : 1];
      if (mutation) {
        arenaMutations.push(mutation);
        events.push(Object.freeze({ type: 'arena-mutated', description: mutation }));
      }
    }
    if (damageEvents === 5) {
      state = 'defeated';
      events.push(Object.freeze({ type: 'boss-defeated', boss: canonicalBossName }));
    }
    return true;
  }

  function resetAfterLifeLoss() {
    state = 'approach';
    damageEvents = 0;
    activeAttack = null;
    attackSeconds = 0;
    arenaMutations.length = 0;
    events.push(Object.freeze({ type: 'boss-reset-after-life-loss' }));
  }

  function drainEvents() {
    return Object.freeze(events.splice(0));
  }

  return Object.freeze({
    begin,
    telegraphAttack,
    tick,
    earnDamageEvent,
    resetAfterLifeLoss,
    drainEvents,
    get snapshot() {
      return Object.freeze({
        boss: canonicalBossName,
        archivedBossName: contract.archivedBossName,
        difficulty,
        state,
        damageEvents,
        activeAttack: activeAttack?.name ?? null,
        attackSeconds,
        arenaMutations: Object.freeze([...arenaMutations])
      });
    }
  });
}
