import { clamp, lerp } from '../math.js';

function validatePoints(points) {
  if (!Array.isArray(points) || points.length < 2) {
    throw new TypeError('linear ground requires at least two points');
  }

  return points.map((point, index) => {
    if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)) {
      throw new TypeError(`invalid linear-ground point at index ${index}`);
    }
    if (index > 0 && point[0] <= points[index - 1][0]) {
      throw new RangeError('linear-ground x coordinates must be strictly increasing');
    }
    return Object.freeze([...point]);
  });
}

export function createLinearGround(points) {
  const normalized = Object.freeze(validatePoints(points));
  const minimumX = normalized[0][0];
  const maximumX = normalized.at(-1)[0];

  function heightAt(positionX) {
    const x = clamp(positionX, minimumX, maximumX);
    for (let index = 0; index < normalized.length - 1; index += 1) {
      const from = normalized[index];
      const to = normalized[index + 1];
      if (x >= from[0] && x <= to[0]) {
        return lerp(from[1], to[1], (x - from[0]) / (to[0] - from[0]));
      }
    }
    return normalized.at(-1)[1];
  }

  function angleAt(positionX, sampleRadius = 0.12) {
    const left = clamp(positionX - sampleRadius, minimumX, maximumX);
    const right = clamp(positionX + sampleRadius, minimumX, maximumX);
    if (left === right) return 0;
    return Math.atan2(heightAt(right) - heightAt(left), right - left);
  }

  return Object.freeze({
    points: normalized,
    minimumX,
    maximumX,
    heightAt,
    angleAt
  });
}

