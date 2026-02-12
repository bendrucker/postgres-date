const test = require('tape')
const proxyquire = require('proxyquire').noPreserveCache()
const Module = require('module')
const { Temporal } = require('temporal-polyfill')

const supportedPolyfills = [
  'temporal-polyfill',
  '@js-temporal/polyfill'
]

// Temporal.ZonedDateTime.from does not accept ISO 8601
const testTimeStrTemporal = '2026-02-09T10:14:34[UTC]'
const testTimeStrIso = '2026-02-09T10:14:34Z'

test('temporal polyfill loader', t => {
  const oldTemporal = globalThis.Temporal
  globalThis.Temporal = undefined
  try {
    const stubs = {}
    for (const polyfill of supportedPolyfills) {
      stubs[polyfill] = null
    }
    const noTemporal = proxyquire('./temporal', stubs)
    const expectedCause = new Error("Cannot find module 'temporal-polyfill'")
    expectedCause.code = 'MODULE_NOT_FOUND'
    t.throws(
      () => noTemporal(),
      {
        message: 'The Temporal API is required to convert time zones. If your platform does not ship with Temporal, install a polyfill.',
        cause: expectedCause
      },
      'Helpful error message if no Temporal is available'
    )

    for (const polyfillToTest of supportedPolyfills) {
      for (const polyfillToStub of supportedPolyfills) {
        stubs[polyfillToStub] =
          polyfillToTest === polyfillToStub ? require(polyfillToTest) : null
      }
      const withPolyfill = proxyquire('./temporal', stubs)
      t.equal(
        withPolyfill().ZonedDateTime.from(testTimeStrTemporal).epochMilliseconds,
        new Date(testTimeStrIso).getTime(),
        `Passing time zone with Temporal provided by ${polyfillToTest}`
      )
    }

    const e = new Error('require failed for some reason')
    const restoreModuleLoader = throwErrorOnLoad(supportedPolyfills, e)
    try {
      const withFailingRequire = proxyquire('./temporal', {})
      t.throws(
        () => withFailingRequire(),
        e,
        "Don't use the missing-Temporal message for unrelated problems"
      )
    } finally {
      restoreModuleLoader()
    }

    if (supportedPolyfills.length > 1) {
      const restoreModuleLoader = throwErrorOnLoad([supportedPolyfills[1]], e)
      try {
        for (let i = 0; i < supportedPolyfills.length; i++) {
          if (i !== 1) {
            stubs[supportedPolyfills[i]] = null
          }
        }
        const withFailingRequire = proxyquire('./temporal', stubs)
        t.throws(
          () => withFailingRequire(),
          e,
          'Prefer to show errors related to polyfills that are installed but failed to load'
        )
      } finally {
        restoreModuleLoader()
      }
    }

    globalThis.Temporal = Temporal
    for (const polyfill of supportedPolyfills) {
      stubs[polyfill] = {
        get Temporal () {
          throw new Error('shouldn\'t be used')
        }
      }
    }
    const withBrokenPolyfill = proxyquire('./temporal', stubs)
    t.equal(
      withBrokenPolyfill().ZonedDateTime.from(testTimeStrTemporal).epochMilliseconds,
      new Date(testTimeStrIso).getTime(),
      'Prefers global Temporal over polyfill'
    )
  } finally {
    globalThis.Temporal = oldTemporal
  }

  t.end()
})

function throwErrorOnLoad (modules, error) {
  const originalLoad = Module._load
  Module._load = function (request, parent, isMain) {
    if (modules.includes(request)) {
      throw error
    }
    return originalLoad.call(this, request, parent, isMain)
  }

  return () => {
    Module._load = originalLoad
  }
}
