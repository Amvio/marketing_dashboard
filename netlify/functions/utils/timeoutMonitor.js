class TimeoutMonitor {
  constructor(timeoutThresholdMs = 5500) {
    this.startTime = Date.now();
    this.timeoutThreshold = timeoutThresholdMs;
    this.lastProcessedId = null;
  }

  hasTimeRemaining() {
    const elapsed = Date.now() - this.startTime;
    return elapsed < this.timeoutThreshold;
  }

  getElapsedTime() {
    return Date.now() - this.startTime;
  }

  getRemainingTime() {
    const elapsed = this.getElapsedTime();
    return Math.max(0, this.timeoutThreshold - elapsed);
  }

  setLastProcessedId(id) {
    this.lastProcessedId = id;
  }

  getStatus() {
    return {
      elapsedMs: this.getElapsedTime(),
      remainingMs: this.getRemainingTime(),
      hasTimeRemaining: this.hasTimeRemaining(),
      lastProcessedId: this.lastProcessedId
    };
  }
}

module.exports = { TimeoutMonitor };
