"""One-use transfer of the tested, narrowly scoped shell-route corrections."""
from pathlib import Path
import hashlib
import json
root = Path(__file__).resolve().parents[1]
allowed = {'src/game.js', 'src/content/meadow-wake-level-data.js', 'src/gameplay/enemies/mob-simulation.js'}
entries = json.loads((root / 'tools/meadow-wake-shell-layout-transfer.json').read_text())
if len(entries) != len(allowed) or {entry['path'] for entry in entries} != allowed:
    raise RuntimeError('Invalid transfer file inventory')
writes = []
for entry in entries:
    target = root / entry['path']
    original = target.read_bytes()
    before = hashlib.sha256(original).hexdigest()
    if before == entry['after']:
        continue
    if before != entry['before']:
        raise RuntimeError(f"Concurrent source change: {entry['path']}")
    lines = original.decode().splitlines(keepends=True)
    for start, end, replacement in reversed(entry['edits']):
        lines[start:end] = [replacement]
    result = ''.join(lines).encode()
    if hashlib.sha256(result).hexdigest() != entry['after']:
        raise RuntimeError(f"Transfer hash mismatch: {entry['path']}")
    writes.append((target, result))
for target, result in writes:
    target.write_bytes(result)
    print(f'Verified source written: {target.relative_to(root)}')
