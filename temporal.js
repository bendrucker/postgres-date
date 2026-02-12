const MSG_MISSING_TEMPORAL = 'The Temporal API is required to convert time zones. If your platform does not ship with Temporal, install a polyfill.'

function temporal () {
  if (globalThis.Temporal !== undefined) {
    return globalThis.Temporal
  }
  return loadFirstAvailable(['temporal-polyfill', '@js-temporal/polyfill']).Temporal
}

function loadFirstAvailable (paths) {
  let error = null
  let module = null
  let i
  for (i = 0; i < paths.length && module === null; i++) {
    try {
      module = require(paths[i])
    } catch (e) {
      // Error precedence:
      // 1. First error other than MODULE_NOT_FOUND for supported polyfills
      // 2. MODULE_NOT_FOUND for most preferred polyfill (first in list)
      if (e.code === 'MODULE_NOT_FOUND' && e.message.includes(`'${paths[i]}'`)) {
        error = error ?? new Error(MSG_MISSING_TEMPORAL, { cause: e })
      } else {
        error = error?.message === MSG_MISSING_TEMPORAL ? e : (error ?? e)
      }
    }
  }
  if (module === null) {
    throw error
  }
  return module
}

module.exports = temporal
