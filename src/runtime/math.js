export function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

export function approach(value, target, rate, deltaSeconds) {
  if (value < target) return Math.min(target, value + rate * deltaSeconds);
  return Math.max(target, value - rate * deltaSeconds);
}

