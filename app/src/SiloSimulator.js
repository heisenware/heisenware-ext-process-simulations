/**
 * Simulates a silo level sensor with configurable emptying and automatic refilling.
 * Emits level updates at regular intervals through registered listeners.
 */
class SiloSimulator {
  /**
   * @param {Object} options - Configuration options for the simulation.
   * @param {number} [options.capacity=100] - Maximum fill level of the silo.
   * @param {number} [options.timeToEmpty=60] - Approximate time (in seconds) to empty the silo from full to empty.
   */
  constructor ({ capacity = 100, timeToEmpty = 60 } = {}) {
    this.capacity = capacity
    this.baseTimeToEmpty = timeToEmpty * 1000 // ms
    this.timeToRefill = this.baseTimeToEmpty / 10
    this.level = capacity
    this.interval = 1000 // ms update interval
    this.mode = 'emptying' // or 'refilling'
    this.running = false

    /** @type {Function[]} */
    this.levelUpdateListeners = []

    this._setRandomEmptyingStep()
    this.stepUp = this.capacity / (this.timeToRefill / this.interval)

    // auto-start the simulation
    this.start()
  }

  /**
   * Starts the simulation loop. Emits level updates at regular intervals.
   */
  start () {
    this.running = true

    this.timer = setInterval(() => {
      if (!this.running) return

      if (this.mode === 'emptying') {
        this.level -= this.stepDown
        if (this.level <= this.capacity * 0.1) {
          this.mode = 'refilling'
          this.level = Math.max(0, this.level)
        }
      } else if (this.mode === 'refilling') {
        this.level += this.stepUp
        if (this.level >= this.capacity) {
          this.mode = 'emptying'
          this.level = this.capacity
          this._setRandomEmptyingStep() // re-randomize for next cycle
        }
      }

      this._emitLevelUpdate(parseFloat(this.level.toFixed(2)))
    }, this.interval)
    return true
  }

  /**
   * Retrieves the current filling level
   * @returns filling level
   */
  getLevel () {
    return parseFloat(this.level.toFixed(2))
  }

  /**
   * Registers a callback to receive level updates.
   * @param {Function} callback - Function called with the current silo level (0–capacity).
   */
  onLevelUpdate (callback) {
    this.levelUpdateListeners.push(callback)
    return 'subscribed'
  }

  /**
   * Stops the simulation loop.
   */
  stop () {
    clearInterval(this.timer)
    this.running = false
    return true
  }

  /**
   * Emits the current level to all registered listeners.
   * @private
   * @param {number} level - The current fill level.
   */
  _emitLevelUpdate (level) {
    this.levelUpdateListeners.forEach(cb => cb(level))
  }

  /**
   * Randomizes the rate of emptying based on ±10% of the base time.
   * @private
   */
  _setRandomEmptyingStep () {
    const variance = 0.1
    const randomFactor = 1 + (Math.random() * 2 - 1) * variance
    const adjustedTimeToEmpty = this.baseTimeToEmpty * randomFactor
    this.stepDown = this.capacity / (adjustedTimeToEmpty / this.interval)
  }
}

module.exports = SiloSimulator
