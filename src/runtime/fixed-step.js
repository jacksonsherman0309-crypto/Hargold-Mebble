export class FixedStepLoop {
  constructor({ hz = 120, maximumFrameSeconds = 0.25, maximumStepsPerFrame = 30 } = {}) {
    if (!Number.isFinite(hz) || hz <= 0) throw new TypeError('hz must be a positive finite number');
    if (!Number.isFinite(maximumFrameSeconds) || maximumFrameSeconds <= 0) {
      throw new TypeError('maximumFrameSeconds must be positive');
    }
    if (!Number.isInteger(maximumStepsPerFrame) || maximumStepsPerFrame <= 0) {
      throw new TypeError('maximumStepsPerFrame must be a positive integer');
    }

    this.hz = hz;
    this.stepSeconds = 1 / hz;
    this.maximumFrameSeconds = maximumFrameSeconds;
    this.maximumStepsPerFrame = maximumStepsPerFrame;
    this.accumulator = 0;
    this.simulationTime = 0;
    this.totalSteps = 0;
    this.clampedFrameCount = 0;
  }

  reset() {
    this.accumulator = 0;
    this.simulationTime = 0;
    this.totalSteps = 0;
    this.clampedFrameCount = 0;
  }

  advance(elapsedSeconds, step) {
    if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
      throw new TypeError('elapsedSeconds must be a non-negative finite number');
    }
    if (typeof step !== 'function') throw new TypeError('step must be a function');

    const boundedElapsed = Math.min(elapsedSeconds, this.maximumFrameSeconds);
    if (boundedElapsed !== elapsedSeconds) this.clampedFrameCount += 1;
    this.accumulator += boundedElapsed;

    let executedSteps = 0;
    while (this.accumulator + Number.EPSILON >= this.stepSeconds && executedSteps < this.maximumStepsPerFrame) {
      step(this.stepSeconds, this.totalSteps);
      this.accumulator -= this.stepSeconds;
      this.simulationTime += this.stepSeconds;
      this.totalSteps += 1;
      executedSteps += 1;
    }

    const droppedCatchUp = this.accumulator >= this.stepSeconds;
    if (droppedCatchUp) {
      this.accumulator %= this.stepSeconds;
    }

    return Object.freeze({
      executedSteps,
      interpolationAlpha: this.accumulator / this.stepSeconds,
      simulationTime: this.simulationTime,
      totalSteps: this.totalSteps,
      frameWasClamped: boundedElapsed !== elapsedSeconds,
      droppedCatchUp
    });
  }
}
