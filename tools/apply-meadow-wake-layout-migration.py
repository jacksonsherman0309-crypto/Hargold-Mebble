"""One-use, hash-checked transfer of the locally tested Level 1 source edits."""
from pathlib import Path
import gzip
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
ALLOWED = {
    'index.html', 'src/character-renderer.js', 'src/content/meadow-wake-course.js',
    'src/content/meadow-wake-level-data.js', 'src/game.js',
    'src/gameplay/levels/platform-block-runtime.js', 'tests/level-foundation.test.mjs'
}

def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()

entries = json.loads(gzip.decompress(Path(__file__).with_name('meadow-wake-layout-migration.json.gz').read_bytes()))
assert len(entries) == len(ALLOWED) and {entry['path'] for entry in entries} == ALLOWED
writes = []
for entry in entries:
    target = ROOT / entry['path']
    original = target.read_bytes()
    if digest(original) == entry['after']:
        continue
    if digest(original) != entry['before']:
        raise RuntimeError(f"Concurrent change detected; refusing overwrite: {entry['path']}")
    lines = original.decode('utf-8').splitlines(keepends=True)
    for start, end, replacement in reversed(entry['edits']):
        lines[start:end] = [replacement]
    result = ''.join(lines).encode('utf-8')
    if digest(result) != entry['after']:
        raise RuntimeError(f"Transfer verification failed: {entry['path']}")
    writes.append((target, result))
for target, result in writes:
    target.write_bytes(result)
    print(f'Applied verified source: {target.relative_to(ROOT)}')
print(f'Validated {len(entries)} files; wrote {len(writes)} files.')
