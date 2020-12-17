'use strict'

const Browserstack = require('browserstack')

const BrowserStackReporter = function (logger, /* BrowserStack:sessionMapping */ sessionMapping) {
  const log = logger.create('reporter.browserlabs')

  let pendingUpdates = 0
  let callWhenFinished = function () {}

  const exitIfAllFinished = function () {
    if (pendingUpdates === 0) {
      callWhenFinished()
    }
  }

  // We're only interested in the final results per browser
  this.onBrowserComplete = function (browser) {
    const result = browser.lastResult

    if (result.disconnected) {
      log.error('✖ Test Disconnected')
    }

    if (result.error) {
      log.error('✖ Test Errored')
    }

    const browserId = browser.launchId || browser.id
    if (browserId in sessionMapping) {
      pendingUpdates++
      const browserstackClient = Browserstack.createAutomateClient(sessionMapping.credentials)
      const apiStatus = !(result.failed || result.error || result.disconnected) ? 'completed' : 'error'

      browserstackClient.updateSession(sessionMapping[browserId], {
        status: apiStatus
      }, error => {
        if (error) {
          log.error('✖ Could not update BrowserStack status')
          log.debug(error)
        }

        pendingUpdates--
        exitIfAllFinished()
      })
    }
  }

  // Wait until all updates have been pushed to Browserstack
  this.onExit = function (done) {
    callWhenFinished = done
    exitIfAllFinished()
  }
}

module.exports = BrowserStackReporter
