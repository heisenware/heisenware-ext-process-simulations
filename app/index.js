const { VrpcAgent, VrpcAdapter } = require('vrpc')
const Persistor = require('./src/Persistor')
const { domain, username, password, broker } = require('./config')
const pino = require('pino')
const log = pino({ timestamp: pino.stdTimeFunctions.isoTime }).child({
  module: 'index'
})

// ----------------------- ONLY EDIT HERE --------------------------------------

const agent = 'Process Simulations'

const EnergySimulator = require('./src/EnergySimulator')
VrpcAdapter.register(EnergySimulator, { jsdocPath: './src/EnergySimulator.js' })

const SiloSimulator = require('./src/SiloSimulator')
VrpcAdapter.register(SiloSimulator, { jsdocPath: './src/SiloSimulator.js' })

// -----------------------------------------------------------------------------

async function main () {
  // Start vrpc-agent
  const vrpcAgent = new VrpcAgent({
    domain,
    agent,
    username,
    password,
    broker,
    log,
    bestEffort: true
  })
  await vrpcAgent.serve()

  // Create persistor
  const persistor = new Persistor({
    log,
    agentInstance: vrpcAgent
  })

  // Restore all persisted instances
  await persistor.restore()
}

main().catch(err => log.error(`An error happened: ${err.message}`))
