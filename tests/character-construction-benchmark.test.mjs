import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const benchmark = JSON.parse(
  readFileSync(
    new URL('../assets/blender/character-construction-benchmark.json', import.meta.url),
    'utf8'
  )
);

assert.equal(benchmark.status, 'locked-clean-room-observable-construction-benchmark');
assert.equal(benchmark.cleanRoomBoundary.repositoryCopiesOfBenchmarkArt, false);
assert.ok(benchmark.cleanRoomBoundary.permittedAnalysis.includes('limb taper'));
assert.ok(benchmark.cleanRoomBoundary.forbiddenTransfer.includes('character identity'));
assert.ok(benchmark.cleanRoomBoundary.forbiddenTransfer.includes('mesh vertices'));
assert.ok(benchmark.sharedConstructionLanguage.includes('one connected watertight deforming body'));
assert.equal(benchmark.characters.Hargold.frame, 'compact');
assert.equal(benchmark.characters.Hargold.headsTall, 2.94);
assert.equal(benchmark.characters.Mebble.frame, 'tall');
assert.equal(benchmark.characters.Mebble.heightRelativeToHargold, 1.26);
assert.ok(benchmark.characters.Mebble.normalized.neckHeight > 0.15);
assert.ok(benchmark.characters.Mebble.normalized.visibleLegLength > benchmark.characters.Hargold.normalized.visibleLegLength);

for (const hero of ['hargold', 'mebble']) {
  const board = new URL(
    `../assets/previews/construction-reference/${hero}-construction-reference.png`,
    import.meta.url
  );
  const audit = new URL(
    `../assets/previews/construction-reference/${hero}-current-body-audit.png`,
    import.meta.url
  );
  assert.ok(
    statSync(board).size > 250_000,
    `${hero} construction reference board must be rendered`
  );
  assert.ok(
    statSync(audit).size > 250_000,
    `${hero} current body audit board must be rendered`
  );
}

console.log('clean-room character construction benchmark checks passed');
