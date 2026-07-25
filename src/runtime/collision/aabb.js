export function overlapsAabb(a, b) {
  return (
    a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y
  );
}

export function bodyAtFoot(profile, footX, footY) {
  return Object.freeze({
    x: footX - profile.width / 2,
    y: footY - profile.height,
    width: profile.width,
    height: profile.height
  });
}

