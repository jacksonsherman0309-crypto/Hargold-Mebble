/** Fit five existing authored props to their actual support plane. Reuses the
 * existing root/rock/timber support art; never substitutes collision meshes. */
const SUPPORT_STYLES = Object.freeze({
  'opening-stump-step': 'root',
  'fallen-log-launch': 'boulder',
  'timber-stack-climb': 'timber',
  'bramble-clue-step': 'root',
  'final-hill-stump': 'root'
});

export function groundedPlatformArt(definition, heightAt) {
  const supportStyle = SUPPORT_STYLES[definition.id];
  if (!supportStyle || typeof heightAt !== 'function') return definition;
  const ground = Math.max(
    heightAt(definition.x - definition.width / 2),
    heightAt(definition.x),
    heightAt(definition.x + definition.width / 2)
  );
  return {
    ...definition,
    supportStyle,
    // Bury the last few centimetres of the existing braces in the earth.
    supportDrop: Math.max(0.05, ground - definition.y - definition.height / 2 + 0.12),
    staticFooting: Boolean(definition.motion)
  };
}

export function alignGroundedPlatformCrown(root, definition, scale = 70) {
  if (!SUPPORT_STYLES[definition.id]) return 0;
  const top = definition.height * scale / 2;
  let visibleTop;
  if (definition.visual === 'stump') {
    const crown = root.children.find(child => child.name === 'stump-growth-ring-top');
    if (!crown) return 0;
    visibleTop = crown.position.y + crown.geometry.parameters.height / 2;
  } else if (definition.visual === 'fallen-log') {
    const log = root.children.find(child => child.name === 'rounded-fallen-log');
    if (!log) return 0;
    visibleTop = log.position.y + Math.max(log.geometry.parameters.radiusTop, log.geometry.parameters.radiusBottom);
  } else if (definition.visual === 'timber-stack') {
    const cap = root.children.find(child => child.name === 'timber-stack-walkable-cap');
    if (!cap) return 0;
    visibleTop = cap.position.y + 5;
  } else return 0;
  const correction = top - visibleTop;
  for (const child of root.children) child.position.y += correction;
  if (definition.visual === 'timber-stack') {
    for (const child of root.children.filter(child => child.name === 'traversable-stacked-camp-timber')) {
      const radius = Math.max(child.geometry.parameters.radiusTop, child.geometry.parameters.radiusBottom);
      child.position.y = Math.min(child.position.y, top - radius);
    }
  }
  return correction;
}
