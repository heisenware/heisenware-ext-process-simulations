const { VrpcAgent, VrpcAdapter } = require('vrpc')
const Persistor = require('./src/Persistor')
const EnergySimulator = require('./src/EnergySimulator')
const { domain, agent, username, password, broker } = require('./config')
const pino = require('pino')

const log = pino({ timestamp: pino.stdTimeFunctions.isoTime }).child({
  module: 'index'
})

// Register Konsole
VrpcAdapter.register(EnergySimulator, { jsdocPath: './src/EnergySimulator.js' })

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
    log: log.child({ subModule: 'Persistor' }),
    agentInstance: vrpcAgent,
    dir: '/shared/ext/heisenware-konsole'
  })

  // Restore all persisted instances
  await persistor.restore()
}

main().catch(err => log.error(`An error happened: ${err.message}`))
