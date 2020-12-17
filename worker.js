'use strict'

const { EventEmitter } = require('events')

class Worker extends EventEmitter {
  constructor (data) {
    super(data)

    if (typeof data === 'object' && !Array.isArray(data)) {
      const self = this

      Object.keys(data).forEach(k => {
        self[k] = data[k]
      })
    }
  }
}

module.exports = Worker
