import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const gameSource = await readFile(new URL('../src/game.js', import.meta.url), 'utf8');
const inputSource = await readFile(
  new URL('../src/gameplay/movement/movement-input-buffer.js', import.meta.url),
  'utf8'
);
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

assert.match(
  gameSource,
  /doubleJumpUnlocked: false/,
  'Hargold double jump must remain locked until progression enables it'
);
assert.match(gameSource, /createMovementInputBuffer/);
assert.match(gameSource, /stepUnifiedCharacterController/);
assert.doesNotMatch(gameSource, /function stepMotion\s*\(/);
assert.match(gameSource, /inputBuffer\.sample\(rawInputSnapshot\(\), elapsed\)/);
assert.match(gameSource, /navigator\.getGamepads/);
assert.match(inputSource, /groundSlamPressed: pressed\.down/);
assert.match(html, /data-action="slam"/);
assert.match(html, /Jump \/ twirl \/ glide: Space/);
assert.doesNotMatch(html, /data-action="sprint"/);
assert.doesNotMatch(html, /data-action="run"/);
assert.doesNotMatch(gameSource, /touch\.sprint|gamepad\.sprint|input\.sprint/);
assert.match(gameSource, /AnimationDebugPanel/);
assert.match(gameSource, /animationDebugDrive === 'right'/);

console.log('Live unified movement wiring checks passed.');
