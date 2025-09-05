const Storage = require('@heisenware/storage')
const { VrpcAdapter } = require('vrpc')

class Persistor {
  constructor ({ agentInstance, log }) {
    this._agentInstance = agentInstance
    this._dir = `/shared/extensions/${agentInstance._agent
      .toLocaleLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')}`
    this._log = log.child({ subModule: 'Persistor' })
    this._storage = new Storage({ log, dir: this._dir })
    this._log.info(`Persisting to: ${this._dir}`)
  }

  async restore () {
    await this._init()
    const ids = this._storage.keys()
    let trial = 0
    while (ids.length > 0 && trial++ < 10) {
      const id = ids.shift()
      const { className, args } = await this._storage.getItem(id)
      this._log.info(`Restoring persisted instance: ${id} (${className})`)
      try {
        this._agentInstance.create({
          className,
          args,
          instance: id
        })
      } catch (err) {
        this._log.warn(
          `Failed to restore persisted instance: ${id} (${className}) because: ${err}`
        )
        // never go full-speed on a while loop
        await new Promise(resolve => setTimeout(resolve, 500))
        if (id !== undefined) {
          ids.push(id)
        }
      }
    }
    try {
      await Promise.all(
        ids.map(id => {
          this._log.warn(`Deleting broken instance ${id}`)
          return this._storage.removeItem(id)
        })
      )
    } catch (err) {
      this._log.warn(`Failed deleting broken instances, because ${err.message}`)
    }
  }

  // private

  async _init () {
    try {
      // persist creation
      VrpcAdapter.on('create', ({ instance, className, args }) => {
        this._log.info(`Persisting new instance: ${instance} (${className})`)
        this._persist(instance, className, args).catch(err =>
          this._log.warn(
            `Failed persisting new instance ${instance} (${className}), because ${err.message}`
          )
        )

        // persist updates
        const obj = VrpcAdapter.getInstance(instance)
        if (!obj.on) return
        obj.on('update', data => {
          this._log.info(`Persisting update for: ${instance} (${className})`)
          this._persist(instance, className, [data]).catch(err =>
            this._log.warn(
              `Failed persisting update of ${instance} (${className}), because ${err.message}`
            )
          )
        })
      })

      // persist deletion
      VrpcAdapter.on('delete', ({ instance, className }) => {
        this._log.info(
          `Deleting persisted instance: ${instance} (${className})`
        )
        this._delete(instance)
      })
    } catch (err) {
      this._log.error(
        err,
        `Could not initialize persist-layer because: ${err.message}`
      )
    }
  }

  async _persist (id, className, args) {
    await this._isInitialized
    await this._storage.setItem(id, { className, args }, { folder: className })
  }

  async _delete (id) {
    await this._isInitialized
    await this._storage.removeItem(id)
  }
}

module.exports = Persistor
