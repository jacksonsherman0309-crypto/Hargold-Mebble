import assert from 'node:assert/strict';
import { measureMovementCalibration } from '../../src/gameplay/movement/movement-calibration.js';

const result = measureMovementCalibration();
assert.equal(result.fixedStepHz, 120);
for (const [name, value] of Object.entries(result)) {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${name} must be finite`);
}
assert.ok(result.tapJumpHeight < result.fullJumpHeight);
assert.ok(result.twirlAirtimeExtensionSeconds > 0);
assert.ok(result.hargoldDoubleJumpHeight > result.fullJumpHeight);
assert.ok(result.slopeSpeedChanges.downhill > result.slopeSpeedChanges.uphill);

console.log('Movement calibration metric checks passed.');
