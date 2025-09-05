/**
 * Realistically simulates the consumption of power, gas, and hot water.
 *
 * The simulation is based on a daily cyclical pattern (sine wave) with
 * added randomization, updating its internal state every second.
 */

const SECONDS_IN_YEAR = 365 * 24 * 3600
const SECONDS_IN_DAY = 24 * 3600

class EnergySimulator {
  /**
   * @param {object} config Configuration object for annual consumption.
   * @param {number} config.power Total annual power consumption in kWh.
   * @param {number} config.gas Total annual gas consumption in cubic meters (m³).
   * @param {number} config.water Total annual hot water consumption in cubic meters (m³).
   */
  constructor ({ power, gas, water }) {
    // --- Media Configuration ---
    // This structure holds the core parameters for each utility.
    // - avgPerSecond: The baseline consumption for each second.
    // - phaseShift: Shifts the daily peak consumption time. For example, a shift of
    //   -PI/2 (around 6 PM) for power, and PI/2 (around 6 AM) for hot water.
    // - amplitude: The factor by which consumption deviates from the average.
    this.media = {
      power: {
        annual: power,
        avgPerSecond: power / SECONDS_IN_YEAR, // kWh per second
        phaseShift: -Math.PI / 2, // Peak in the evening
        amplitude: 0.6 // Varies by +/- 60%
      },
      gas: {
        annual: gas,
        avgPerSecond: gas / SECONDS_IN_YEAR, // m³ per second
        phaseShift: -Math.PI / 3, // Peak in the evening (cooking/heating)
        amplitude: 0.5
      },
      water: {
        annual: water,
        avgPerSecond: water / SECONDS_IN_YEAR, // m³ per second
        phaseShift: Math.PI / 2, // Peak in the morning
        amplitude: 0.8
      }
    }

    // --- State Variables ---
    // Stores live consumption rates (kW or m³/h).
    this.liveValues = { power: 0, gas: 0, water: 0 }

    // Stores total accumulated consumption since the simulation started.
    this.aggregatedValues = { power: 0, gas: 0, water: 0 }

    this.running = false

    // auto-start the simulation
    this.start()
  }

  /**
   * Internal method to update consumption values every second.
   * @param {number} secondsInDay The number of seconds in a full day cycle.
   * @private
   */
  _updateValues (secondsInDay) {
    const now = new Date()
    const secondsIntoDay =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()

    for (const mediaType in this.media) {
      const config = this.media[mediaType]

      // 1. Calculate the cyclical factor based on time of day (sine wave)
      const cycleFactor = Math.sin(
        (secondsIntoDay * 2 * Math.PI) / secondsInDay + config.phaseShift
      )

      // 2. Introduce random noise for realism
      const noise = (Math.random() - 0.5) * 0.2 // +/- 10% random jitter

      // 3. Calculate the consumption for this specific second
      const consumptionThisSecond =
        config.avgPerSecond * (1 + cycleFactor * config.amplitude + noise)
      const positiveConsumption = Math.max(0, consumptionThisSecond) // Ensure consumption is non-negative

      // 4. Update aggregated and live values
      this.aggregatedValues[mediaType] += positiveConsumption

      // Live value is a rate: kW for power, m³/h for gas/water
      // To get the hourly rate, multiply the per-second value by 3600.
      this.liveValues[mediaType] = positiveConsumption * 3600
    }
  }

  /**
   * Validates the media type.
   * @param {string} mediaType The media type to check ('power', 'gas', 'water').
   * @private
   */
  _validateMediaType (mediaType) {
    if (!this.media[mediaType]) {
      throw new Error(
        `Invalid media type "${mediaType}". Please use one of: ${Object.keys(
          this.media
        ).join(', ')}.`
      )
    }
  }

  /**
   * Starts the simulation
   */
  start () {
    this.running = true
    this.simulationInterval = setInterval(() => {
      if (!this.running) return
      this._updateValues(SECONDS_IN_DAY)
    }, 1000)
    console.log('⚡️ Energy Simulator started.')
    return true
  }

  /**
   * Gets the live consumption rate.
   * @param {'power' | 'gas' | 'water'} mediaType The type of medium.
   * @returns {number} For power: live consumption in kilowatts (kW). For gas/hot water: live consumption in cubic meters per hour (m³/h).
   */
  getLiveValue (mediaType) {
    this._validateMediaType(mediaType)
    return this.liveValues[mediaType]
  }

  /**
   * Gets the total aggregated consumption since the simulator started.
   * @param {'power' | 'gas' | 'water'} mediaType The type of medium.
   * @returns {number} For power: total consumption in kilowatt-hours (kWh). For gas/hot water: total consumption in cubic meters (m³).
   */
  getAggregatedValue (mediaType) {
    this._validateMediaType(mediaType)
    return this.aggregatedValues[mediaType]
  }

  /**
   * Stops the simulation interval.
   */
  stop () {
    clearInterval(this.simulationInterval)
    this.running = false
    console.log('🛑 Energy Simulator stopped.')
    return true
  }
}

module.exports = EnergySimulator
