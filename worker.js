'use strict'

const { EventEmitter } = require('events')
const { inherits } = require('util')

function Worker (data) {
  EventEmitter.call(this)

  if (typeof data === 'object' && !Array.isArray(data)) {
    const self = this

    Object.keys(data).forEach(k => {
      self[k] = data[k]
    })
  }
}

inherits(Worker, EventEmitter)

module.exports = Worker
