const CANONICAL_OVERRIDES = Object.freeze({
  camp_chipper: Object.freeze({ oneHit: true }),
  tidebiter: Object.freeze({ requiredEnvironment: 'water' }),
  steamgor: Object.freeze({ requiredDefeatSource: 'ice' })
});

export function buildInteractionRuntime(enemyCatalog, interactionMatrix) {
  const enemies = new Map(Object.entries(enemyCatalog?.enemies ?? {}).map(([id, definition]) => [
    id,
    Object.freeze({ ...structuredClone(definition), ...(CANONICAL_OVERRIDES[id] ?? {}) })
  ]));
  const rules = [...(interactionMatrix?.rules ?? [])];

  function resolve({ source, targetId, targetTags = [], environment = null }) {
    const enemy = targetId ? enemies.get(targetId) : null;
    if (targetId && !enemy) throw new Error(`Unknown enemy ${targetId}`);
    if (enemy?.requiredEnvironment && enemy.requiredEnvironment !== environment) {
      return Object.freeze({ outcome: 'invalid-environment', enemy: targetId });
    }
    if (enemy?.requiredDefeatSource && source !== enemy.requiredDefeatSource) {
      return Object.freeze({ outcome: 'immune', requiredSource: enemy.requiredDefeatSource });
    }
    if (enemy?.requiredDefeatSource === source) {
      return Object.freeze({ outcome: 'defeat', reason: 'canonical-required-defeat-source' });
    }
    if (enemy?.oneHit && ['stomp', 'standard-attack'].includes(source) && !enemy.tags.includes('spiked')) {
      return Object.freeze({ outcome: 'defeat', reason: 'canonical-one-hit-enemy' });
    }
    const tags = new Set([...(enemy?.tags ?? []), ...targetTags, enemy?.massClass].filter(Boolean));
    const rule = rules.find(candidate =>
      candidate.source === source &&
      candidate.targetTags.every(tag => tags.has(tag))
    );
    return rule ? Object.freeze(structuredClone(rule)) : Object.freeze({ outcome: 'no-effect' });
  }

  return Object.freeze({
    enemies,
    rules: Object.freeze(rules.map(rule => Object.freeze(structuredClone(rule)))),
    resolve
  });
}
