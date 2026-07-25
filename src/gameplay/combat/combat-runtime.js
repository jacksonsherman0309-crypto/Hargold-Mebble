function freezeClone(value) {
  return Object.freeze(structuredClone(value));
}

export function createCombatant({
  id,
  team,
  health = 1,
  massClass = 'light',
  tags = [],
  weaknesses = [],
  immunities = []
}) {
  if (!id || !team) throw new TypeError('Combatants require id and team');
  return {
    id,
    team,
    health: Math.max(0, health),
    maximumHealth: Math.max(0, health),
    massClass,
    tags: new Set(tags),
    weaknesses: new Set(weaknesses),
    immunities: new Set(immunities),
    statuses: new Map(),
    alive: health > 0,
    damaging: health > 0,
    invulnerabilitySeconds: 0
  };
}

export function createAttack({
  id,
  ownerId,
  team,
  source = 'standard-attack',
  damage = 1,
  knockback = { x: 0, y: 0 },
  tags = []
}) {
  if (!id || !ownerId || !team) throw new TypeError('Attacks require id, ownerId and team');
  return freezeClone({
    id,
    ownerId,
    team,
    source,
    damage: Math.max(0, damage),
    knockback: { x: knockback.x ?? 0, y: knockback.y ?? 0 },
    tags: [...tags]
  });
}

export function resolveCombatHit(target, attack, {
  interaction = null,
  targetId = target.id,
  environment = null,
  invulnerabilitySeconds = 0.7,
  frozenSeconds = 4
} = {}) {
  if (!target.alive) return freezeClone({ outcome: 'ignored', reason: 'target-defeated' });
  if (target.team === attack.team) return freezeClone({ outcome: 'ignored', reason: 'same-team' });
  if (target.invulnerabilitySeconds > 0) return freezeClone({ outcome: 'ignored', reason: 'invulnerable' });
  if (attack.tags.some(tag => target.immunities.has(tag)) || target.immunities.has(attack.source)) {
    return freezeClone({ outcome: 'immune', reason: 'target-immunity' });
  }

  const rule = interaction?.resolve({
    source: attack.source,
    targetId,
    targetTags: [...target.tags],
    environment
  }) ?? { outcome: 'damage' };

  if (rule.outcome === 'immune' || rule.outcome === 'invalid-environment' ||
      rule.outcome === 'deflect' || rule.outcome === 'no-effect' ||
      rule.outcome === 'no-damage-unless-event' || rule.outcome === 'no-protection') {
    return freezeClone(rule);
  }
  if (rule.outcome.includes('freeze') || attack.source === 'ice') {
    target.statuses.set('frozen', frozenSeconds);
    return freezeClone({ outcome: rule.outcome, seconds: frozenSeconds });
  }
  if (rule.outcome === 'bubble-capture') {
    target.statuses.set('bubble-captured', frozenSeconds);
    target.damaging = false;
    return freezeClone({ outcome: 'bubble-capture', seconds: frozenSeconds });
  }

  const defeats = rule.outcome === 'defeat';
  target.health = defeats ? 0 : Math.max(0, target.health - attack.damage);
  target.alive = target.health > 0;
  target.damaging = target.alive;
  if (target.alive) target.invulnerabilitySeconds = invulnerabilitySeconds;
  return freezeClone({
    outcome: target.alive ? 'damage' : 'defeat',
    health: target.health,
    damaging: target.damaging,
    knockback: attack.knockback,
    rule: rule.reason ?? null
  });
}

export function tickCombatant(target, deltaSeconds) {
  const dt = Math.max(0, deltaSeconds);
  target.invulnerabilitySeconds = Math.max(0, target.invulnerabilitySeconds - dt);
  for (const [status, seconds] of target.statuses) {
    const remaining = seconds - dt;
    if (remaining <= 0) target.statuses.delete(status);
    else target.statuses.set(status, remaining);
  }
  return target;
}
