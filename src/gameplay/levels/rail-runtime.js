import { approach, clamp } from '../../runtime/math.js';

export const RAIL_LOOP_MODES = Object.freeze(['once', 'loop', 'ping-pong']);
export const RAIL_EASING_MODES = Object.freeze(['linear', 'smoothstep', 'ease-in', 'ease-out']);

function finite(value, label) {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
  return value;
}

export function normalizeRailNode(node, index, rail = {}) {
  const position = node?.position ?? node;
  return Object.freeze({
    id: node?.id ?? `${rail.id ?? 'rail'}-node-${index}`,
    position: Object.freeze({
      x: finite(position?.x, `rail node ${index} position.x`),
      y: finite(position?.y, `rail node ${index} position.y`),
      z: finite(position?.z ?? 0, `rail node ${index} position.z`)
    }),
    arrivalSpeed: Math.max(0, finite(node?.arrivalSpeed ?? node?.speed ?? 1, `rail node ${index} arrivalSpeed`)),
    exitSpeed: Math.max(0, finite(node?.exitSpeed ?? node?.speed ?? 1, `rail node ${index} exitSpeed`)),
    acceleration: Math.max(0.001, finite(node?.acceleration ?? 2, `rail node ${index} acceleration`)),
    waitDuration: Math.max(0, finite(node?.waitDuration ?? node?.delay ?? 0, `rail node ${index} waitDuration`)),
    easing: node?.easing ?? 'linear',
    loopMode: node?.loopMode ?? rail.loopMode ?? 'loop',
    facingRule: node?.facingRule ?? 'follow-path',
    triggerRequirement: node?.triggerRequirement ?? null,
    flags: Object.freeze([...(node?.flags ?? [])])
  });
}

export function validateRailDefinition(rail) {
  if (!rail?.id) throw new TypeError('rail.id is required');
  if (!Array.isArray(rail.nodes) || rail.nodes.length < 2) {
    throw new TypeError(`rail ${rail.id} requires at least two nodes`);
  }
  if (!RAIL_LOOP_MODES.includes(rail.loopMode ?? 'loop')) {
    throw new RangeError(`rail ${rail.id} has unsupported loop mode`);
  }
  const nodes = rail.nodes.map((node, index) => normalizeRailNode(node, index, rail));
  for (const node of nodes) {
    if (!RAIL_EASING_MODES.includes(node.easing)) {
      throw new RangeError(`rail ${rail.id} node ${node.id} has unsupported easing`);
    }
    if (!RAIL_LOOP_MODES.includes(node.loopMode)) {
      throw new RangeError(`rail ${rail.id} node ${node.id} has unsupported loop mode`);
    }
    if (node.position.z !== 0 && rail.gameplayPlane !== false) {
      throw new Error(`rail ${rail.id} leaves the strict gameplay plane`);
    }
  }
  return Object.freeze({
    id: rail.id,
    purpose: rail.purpose ?? 'moving-platform',
    gameplayPlane: rail.gameplayPlane !== false,
    loopMode: rail.loopMode ?? 'loop',
    nodes: Object.freeze(nodes)
  });
}

export function createRailFollower(railDefinition, {
  startNodeIndex = 0,
  direction = 1
} = {}) {
  const rail = validateRailDefinition(railDefinition);
  const nodeIndex = clamp(Math.trunc(startNodeIndex), 0, rail.nodes.length - 1);
  const node = rail.nodes[nodeIndex];
  return {
    rail,
    nodeIndex,
    targetNodeIndex: nodeIndex === rail.nodes.length - 1 ? nodeIndex - 1 : nodeIndex + 1,
    direction: direction < 0 ? -1 : 1,
    position: { ...node.position },
    velocity: { x: 0, y: 0, z: 0 },
    speed: node.exitSpeed,
    waitSeconds: node.waitDuration,
    complete: false,
    segmentProgress: 0
  };
}

function requirementMet(requirement, triggers) {
  if (!requirement) return true;
  if (typeof requirement === 'string') return Boolean(triggers?.[requirement]);
  if (requirement.event) return Boolean(triggers?.[requirement.event]);
  return true;
}

function eased(progress, easing) {
  const value = clamp(progress, 0, 1);
  if (easing === 'smoothstep') return value * value * (3 - 2 * value);
  if (easing === 'ease-in') return value * value;
  if (easing === 'ease-out') return 1 - (1 - value) * (1 - value);
  return value;
}

function nextTarget(follower) {
  const { rail } = follower;
  const mode = rail.nodes[follower.nodeIndex].loopMode ?? rail.loopMode;
  let next = follower.nodeIndex + follower.direction;
  if (next >= 0 && next < rail.nodes.length) return next;
  if (mode === 'loop') return follower.direction > 0 ? 0 : rail.nodes.length - 1;
  if (mode === 'ping-pong') {
    follower.direction *= -1;
    return follower.nodeIndex + follower.direction;
  }
  follower.complete = true;
  return follower.nodeIndex;
}

export function stepRailFollower(follower, deltaSeconds, {
  triggers = {}
} = {}) {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0 || follower.complete) {
    return Object.freeze({ moved: false, arrived: false, position: Object.freeze({ ...follower.position }) });
  }
  const current = follower.rail.nodes[follower.nodeIndex];
  if (!requirementMet(current.triggerRequirement, triggers)) {
    follower.velocity = { x: 0, y: 0, z: 0 };
    return Object.freeze({ moved: false, arrived: false, waitingForTrigger: true, position: Object.freeze({ ...follower.position }) });
  }
  if (follower.waitSeconds > 0) {
    follower.waitSeconds = Math.max(0, follower.waitSeconds - deltaSeconds);
    follower.velocity = { x: 0, y: 0, z: 0 };
    return Object.freeze({ moved: false, arrived: false, waiting: true, position: Object.freeze({ ...follower.position }) });
  }

  const target = follower.rail.nodes[follower.targetNodeIndex];
  const dx = target.position.x - follower.position.x;
  const dy = target.position.y - follower.position.y;
  const dz = target.position.z - follower.position.z;
  const distance = Math.hypot(dx, dy, dz);
  if (distance <= 1e-7) {
    follower.nodeIndex = follower.targetNodeIndex;
    follower.waitSeconds = target.waitDuration;
    follower.speed = target.exitSpeed;
    follower.targetNodeIndex = nextTarget(follower);
    follower.segmentProgress = 0;
    return Object.freeze({ moved: false, arrived: true, nodeId: target.id, position: Object.freeze({ ...follower.position }) });
  }

  const requestedSpeed = Math.max(0.001, target.arrivalSpeed);
  follower.speed = approach(follower.speed, requestedSpeed, target.acceleration, deltaSeconds);
  const distanceStep = Math.min(distance, follower.speed * deltaSeconds);
  const rawProgress = distanceStep / distance;
  const progress = eased(rawProgress, target.easing);
  const previous = { ...follower.position };
  follower.position.x += dx * progress;
  follower.position.y += dy * progress;
  follower.position.z += dz * progress;
  follower.segmentProgress = clamp(follower.segmentProgress + rawProgress, 0, 1);
  follower.velocity = {
    x: (follower.position.x - previous.x) / deltaSeconds,
    y: (follower.position.y - previous.y) / deltaSeconds,
    z: (follower.position.z - previous.z) / deltaSeconds
  };
  const arrived = distanceStep >= distance - 1e-7;
  if (arrived) {
    follower.position = { ...target.position };
    follower.nodeIndex = follower.targetNodeIndex;
    follower.waitSeconds = target.waitDuration;
    follower.speed = target.exitSpeed;
    follower.targetNodeIndex = nextTarget(follower);
    follower.segmentProgress = 0;
  }
  return Object.freeze({
    moved: true,
    arrived,
    nodeId: arrived ? target.id : null,
    position: Object.freeze({ ...follower.position }),
    velocity: Object.freeze({ ...follower.velocity })
  });
}
