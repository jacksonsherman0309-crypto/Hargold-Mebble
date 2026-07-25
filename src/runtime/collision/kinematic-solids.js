import { overlapsAabb } from './aabb.js';

export function createKinematicSolid({ id, x, y, width, height, path = 'horizontal' }) {
  return { id, x, y, previousX: x, previousY: y, width, height, path, active: true, collapsing: false };
}

export function moveSolid(solid, x, y) {
  solid.previousX = solid.x; solid.previousY = solid.y; solid.x = x; solid.y = y;
  return { x: x - solid.previousX, y: y - solid.previousY };
}

export function transportRider(motion, delta) {
  motion.footX += delta.x; motion.footY += delta.y;
}

export function inheritedPlatformVelocity(delta, dt) {
  return Object.freeze({ x: delta.x / dt, y: delta.y / dt });
}

export function sweptSolidHit(solid, body) {
  const sweep = {
    x: Math.min(solid.previousX, solid.x),
    y: Math.min(solid.previousY, solid.y),
    width: solid.width + Math.abs(solid.x - solid.previousX),
    height: solid.height + Math.abs(solid.y - solid.previousY)
  };
  return overlapsAabb(sweep, body);
}

export function compressionHazard(body, solids) {
  const hits = solids.filter(solid => overlapsAabb(solid, body));
  if (hits.length < 2) return null;
  return Object.freeze({ fatal: true, type: 'compression', solidIds: hits.map(hit => hit.id) });
}
