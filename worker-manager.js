'use strict'

const Worker = require('./worker')

/**
 * Tracks worker state across runs.
 */
class WorkerManager {
  constructor () {
    this._pollHandle = null
    this.workers = {}
    this.isPolling = false
    this.shouldShutdown = false
  }

  registerWorker (workerData) {
    if (this.workers[workerData.id]) {
      this.unregisterWorker(this.workers[workerData.id])
    }

    const worker = new Worker(workerData)
    worker.emit('status', worker.status)

    this.workers[workerData.id] = worker
    return worker
  }

  unregisterWorker (worker) {
    worker.emit('delete', worker)
    worker.removeAllListeners()

    delete this.workers[worker.id]
    return worker
  }

  updateWorker (workerData) {
    const workers = this.workers

    if (workers[workerData.id]) {
      const worker = workers[workerData.id]
      const prevStatus = worker.status

      Object.keys(workerData).forEach(k => {
        worker[k] = workerData[k]
      })

      if (worker.status !== prevStatus) {
        worker.emit('status', worker.status)
      }
    }
  }

  startPolling (client, pollingTimeout, callback) {
    if (this.isPolling || this.shouldShutdown) {
      return
    }

    const self = this
    this.isPolling = true

    client.getWorkers((err, updatedWorkers) => {
      if (err) {
        self.isPolling = false
        return (callback ? callback(err) : null)
      }

      const activeWorkers = (updatedWorkers || []).reduce((o, worker) => {
        o[worker.id] = worker
        return o
      }, {})

      Object.keys(self.workers).forEach(workerId => {
        if (activeWorkers[workerId]) {
          // process updates
          self.updateWorker(activeWorkers[workerId])
        } else {
          // process deletions
          self.unregisterWorker(self.workers[workerId])
        }
      })

      self._pollHandle = setTimeout(() => {
        self.isPolling = false
        self.startPolling(client, pollingTimeout, callback)
      }, pollingTimeout)
    })
  }

  stopPolling () {
    if (this._pollHandle) {
      clearTimeout(this._pollHandle)
      this._pollHandle = null
    }

    this.shouldShutdown = true
  }
}

// expose a single, shared instance of WorkerManager
module.exports = new WorkerManager()
