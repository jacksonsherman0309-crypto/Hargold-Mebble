const MOB_TUNING = Object.freeze({
  status: 'provisional-engineering-tuning',
  camp_critter: Object.freeze({ speed: 0.9, width: 0.82, height: 0.68 }),
  shellback: Object.freeze({ speed: 0.74, rollSpeed: 6.6, width: 0.92, height: 0.76 }),
  spike_beetle: Object.freeze({ speed: 0.68, width: 0.88, height: 0.64 }),
  camp_sentry: Object.freeze({ speed: 0, width: 0.9, height: 1.15, fireInterval: 2.2 }),
  acorn_bomber: Object.freeze({ speed: 0.5, width: 0.92, height: 1.05, fireInterval: 2.7 }),
  dirt_squirt: Object.freeze({ speed: 0, width: 0.78, height: 0.62, fireInterval: 2.4 })
});

const WORLD_ONE_TYPES = Object.freeze(Object.keys(MOB_TUNING));

function tuningFor(type) {
  const tuning = MOB_TUNING[type];
  if (!tuning) throw new Error(`No implemented spatial behavior for ${type}`);
  return tuning;
}

export function createMob({
  id,
  type,
  x,
  direction = -1,
  environment = 'ground'
}) {
  const tuning = tuningFor(type);
  const initialState = type === 'camp_sentry'
    ? 'track'
    : type === 'dirt_squirt' ? 'hidden' : 'patrol';
  return {
    id,
    type,
    x,
    y: 0,
    previousY: 0,
    direction: direction < 0 ? -1 : 1,
    state: initialState,
    stateSeconds: 0,
    attackSeconds: tuning.fireInterval ? tuning.fireInterval * 0.45 : 0,
    width: tuning.width,
    height: tuning.height,
    environment,
    alive: true,
    damaging: type !== 'dirt_squirt',
    defeatedSeconds: 0,
    launchGraceSeconds: 0,
    warning: false,
    shotSequence: 0
  };
}

function turn(mob) {
  mob.direction *= -1;
  mob.stateSeconds = 0;
}

function projectile(mob, target, variant = 'sentry-bolt') {
  const deltaX = target.x - mob.x;
  const deltaY = target.y - (mob.y - mob.height * 0.55);
  const length = Math.max(0.001, Math.hypot(deltaX, deltaY));
  const speed = variant === 'acorn' ? 4.4 : 5.8;
  mob.shotSequence += 1;
  return Object.freeze({
    type: 'projectile-fired',
    projectile: Object.freeze({
      id: `${mob.id}-shot-${mob.shotSequence}`,
      ownerId: mob.id,
      team: 'enemy',
      attackSource: variant === 'acorn' ? 'enemy-impact' : 'enemy-projectile',
      variant,
      x: mob.x,
      y: mob.y - mob.height * 0.55,
      velocityX: deltaX / length * speed,
      velocityY: variant === 'acorn' ? -3.1 : deltaY / length * speed,
      radius: variant === 'acorn' ? 0.22 : 0.14,
      lifetimeSeconds: 4,
      gravity: variant === 'acorn' ? 8.5 : 0
    })
  });
}

export function stepMob(mob, deltaSeconds, {
  groundHeightAt,
  hasGroundAhead = () => true,
  minimumX = 0,
  maximumX = Infinity,
  target = null
}) {
  const events = [];
  if (!(deltaSeconds > 0)) return Object.freeze(events);
  if (!mob.alive) {
    mob.defeatedSeconds += deltaSeconds;
    mob.damaging = false;
    return Object.freeze(events);
  }
  const tuning = tuningFor(mob.type);
  mob.stateSeconds += deltaSeconds;
  mob.attackSeconds = Math.max(0, mob.attackSeconds - deltaSeconds);
  mob.launchGraceSeconds = Math.max(0, mob.launchGraceSeconds - deltaSeconds);
  mob.previousY = mob.y;

  if (mob.type === 'camp_sentry') {
    if (target) mob.direction = target.x < mob.x ? -1 : 1;
    if (target && Math.abs(target.x - mob.x) <= 8.5 && mob.attackSeconds <= 0) {
      mob.state = 'fire';
      mob.stateSeconds = 0;
      mob.attackSeconds = tuning.fireInterval;
      events.push(projectile(mob, target));
    } else if (mob.state === 'fire' && mob.stateSeconds >= 0.22) {
      mob.state = 'recover';
      mob.stateSeconds = 0;
    } else if (mob.state === 'recover' && mob.stateSeconds >= 0.38) {
      mob.state = 'track';
      mob.stateSeconds = 0;
    }
  } else if (mob.type === 'dirt_squirt') {
    const targetNear = target && Math.abs(target.x - mob.x) < 2.8;
    if (mob.state === 'hidden' && targetNear && mob.attackSeconds <= 0) {
      mob.state = 'telegraph';
      mob.stateSeconds = 0;
      mob.warning = true;
    } else if (mob.state === 'telegraph' && mob.stateSeconds >= 0.55) {
      mob.state = 'emerge';
      mob.stateSeconds = 0;
      mob.warning = false;
      mob.damaging = true;
    } else if (mob.state === 'emerge' && mob.stateSeconds >= 1.1) {
      mob.state = 'retreat';
      mob.stateSeconds = 0;
    } else if (mob.state === 'retreat' && mob.stateSeconds >= 0.35) {
      mob.state = 'hidden';
      mob.stateSeconds = 0;
      mob.attackSeconds = tuning.fireInterval;
      mob.damaging = false;
    }
  } else if (mob.type === 'acorn_bomber') {
    if (target) mob.direction = target.x < mob.x ? -1 : 1;
    if (target && Math.abs(target.x - mob.x) <= 7 && mob.attackSeconds <= 0) {
      mob.state = 'throw';
      mob.stateSeconds = 0;
      mob.attackSeconds = tuning.fireInterval;
      events.push(projectile(mob, target, 'acorn'));
    } else if (mob.state === 'throw' && mob.stateSeconds >= 0.3) {
      mob.state = 'patrol';
      mob.stateSeconds = 0;
    }
  } else {
    if (mob.type === 'shellback') {
      if (mob.state === 'shell-idle' && mob.stateSeconds >= 4.85) {
        mob.state = 'shell-wake';
        mob.stateSeconds = 0;
        mob.warning = true;
        events.push(Object.freeze({ type: 'shell-wake-warning', mobId: mob.id }));
      } else if (mob.state === 'shell-wake' && mob.stateSeconds >= 1.15) {
        mob.state = 'emerge';
        mob.stateSeconds = 0;
        mob.warning = false;
      } else if (mob.state === 'emerge' && mob.stateSeconds >= 0.34) {
        mob.state = 'patrol';
        mob.stateSeconds = 0;
      }
    }
    const moving = mob.state === 'patrol' || mob.state === 'shell-roll';
    if (moving) {
      const speed = mob.state === 'shell-roll' ? tuning.rollSpeed : tuning.speed;
      const nextX = mob.x + mob.direction * speed * deltaSeconds;
      const blocked = nextX < minimumX || nextX > maximumX ||
        (mob.state !== 'shell-roll' && !hasGroundAhead(nextX + mob.direction * mob.width * 0.55));
      if (blocked) {
        turn(mob);
        if (mob.state === 'shell-roll') {
          events.push(Object.freeze({ type: 'shell-rebound', mobId: mob.id, direction: mob.direction }));
        }
      } else {
        mob.x = nextX;
      }
    }
  }
  mob.y = groundHeightAt(mob.x);
  return Object.freeze(events);
}

export function stompMob(mob, { protectedStomp = false } = {}) {
  if (!mob.alive) return Object.freeze({ outcome: 'ignored' });
  if (mob.type === 'spike_beetle' && !protectedStomp) {
    return Object.freeze({ outcome: 'damage-player', reason: 'unsafe-spiked-stomp' });
  }
  if (mob.type === 'shellback') {
    if (mob.state === 'shell-roll') {
      mob.state = 'shell-idle';
      mob.stateSeconds = 0;
      mob.warning = false;
      return Object.freeze({ outcome: 'shell-stopped' });
    }
    if (['patrol', 'emerge'].includes(mob.state)) {
      mob.state = 'shell-idle';
      mob.stateSeconds = 0;
      return Object.freeze({ outcome: 'shell-retracted' });
    }
  }
  defeatMob(mob);
  return Object.freeze({ outcome: 'defeat' });
}

export function attackMob(mob, {
  source = 'standard-attack',
  direction = 1
} = {}) {
  if (!mob.alive) return Object.freeze({ outcome: 'ignored' });
  if (mob.type === 'shellback' && ['shell-idle', 'shell-wake'].includes(mob.state)) {
    mob.state = 'shell-roll';
    mob.stateSeconds = 0;
    mob.direction = direction < 0 ? -1 : 1;
    mob.launchGraceSeconds = 0.22;
    mob.warning = false;
    return Object.freeze({ outcome: 'shell-launched', direction: mob.direction });
  }
  if (mob.type === 'spike_beetle' && source === 'stomp') {
    return Object.freeze({ outcome: 'damage-player', reason: 'unsafe-spiked-stomp' });
  }
  defeatMob(mob);
  return Object.freeze({ outcome: 'defeat' });
}

export function defeatMob(mob) {
  mob.alive = false;
  mob.damaging = false;
  mob.state = 'defeated';
  mob.stateSeconds = 0;
}

export function createProjectile(source) {
  return { ...structuredClone(source), alive: true };
}

export function stepProjectile(projectile, deltaSeconds, {
  terrainCollision = () => false
} = {}) {
  if (!projectile.alive || !(deltaSeconds > 0)) return projectile;
  projectile.velocityY += (projectile.gravity ?? 0) * deltaSeconds;
  projectile.x += projectile.velocityX * deltaSeconds;
  projectile.y += projectile.velocityY * deltaSeconds;
  projectile.lifetimeSeconds -= deltaSeconds;
  if (projectile.lifetimeSeconds <= 0 || terrainCollision(projectile)) projectile.alive = false;
  return projectile;
}

export { MOB_TUNING, WORLD_ONE_TYPES };
