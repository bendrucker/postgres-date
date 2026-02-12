'use strict'

const test = require('tape')
const parse = require('./')
const timezoneMock = require('timezone-mock')
const proxyquire = require('proxyquire').noPreserveCache()
const { Temporal } = require('temporal-polyfill')

test('date parser', function (t) {
  t.equal(parse('garbage'), null)

  t.equal(
    parse('2010-12-11 09:09:04').toString(),
    new Date('2010-12-11 09:09:04').toString()
  )

  t.equal(
    parse('2011-12-11 09:09:04 BC').toString(),
    new Date('-002010-12-11T09:09:04').toString()
  )

  t.equal(
    parse('0001-12-11 09:09:04 BC').toString(),
    new Date('0000-12-11T09:09:04').toString()
  )

  t.equal(
    parse('0001-12-11 BC').getFullYear(),
    0
  )

  t.equal(
    parse('0013-06-01').getFullYear(),
    13
  )

  t.equal(
    parse('1800-06-01').getFullYear(),
    1800
  )

  const summer = '2025-06-30 11:57:23'
  const winter = '2026-01-13 23:53:08'

  withLocalTimeZone('US/Eastern', () => {
    t.equal(
      parse(winter, null).getTime(),
      new Date('2026-01-13T23:53:08-05:00').getTime(),
      'Accepts null time zone'
    )

    t.throws(
      () => parse(winter, false),
      /Unexpected value of type 'boolean' for postgres-date parser options/,
      'Rejects invalid option type (boolean)'
    )

    t.throws(
      () => parse(winter, () => {}),
      /Unexpected value of type 'function' for postgres-date parser options/,
      'Rejects invalid option type (function)'
    )

    t.equal(
      parse(winter, 'UTC').getTime(),
      new Date('2026-01-13T23:53:08Z').getTime(),
      'client behind server'
    )
    t.equal(
      parse(summer, 'UTC').getTime(),
      new Date('2025-06-30T11:57:23Z').getTime(),
      'client behind server (DST)'
    )
    t.equal(
      parse(winter, 'America/New_York').getTime(),
      new Date('2026-01-13T23:53:08-05:00').getTime(),
      'client same time as server'
    )
    t.equal(
      parse(winter, 123).getTime(),
      new Date('2026-01-13T23:53:08+02:03').getTime(),
      'Arbitrary offset in minutes'
    )
    t.equal(
      parse(winter, 1440).getTime(),
      new Date('2026-01-12T23:53:08Z').getTime(),
      'Extreme offset in minutes (UTC +24h)'
    )
    t.equal(
      parse(summer, 'Pacific/Kiritimati').getTime(),
      new Date('2025-06-30T11:57:23+14:00').getTime(),
      'Server in Kiritimati'
    )
    // Etc zones have inverted signs for POSIX compliance, so this is UTC-12.
    t.equal(
      parse(summer, 'Etc/GMT+12').getTime(),
      new Date('2025-06-30T11:57:23-12:00').getTime(),
      'Server on Baker Island'
    )
  })

  withLocalTimeZone('Etc/GMT-14', () => {
    t.equal(
      parse(summer, 'Etc/GMT+12').getTime(),
      new Date('2025-06-30T11:57:23-12:00').getTime(),
      'Server extremely behind'
    )
  })

  withLocalTimeZone('Etc/GMT+12', () => {
    t.equal(
      parse(summer, 'Etc/GMT+12').getTime(),
      new Date('2025-06-30T11:57:23-12:00').getTime(),
      'Server extremely ahead'
    )
  })

  withLocalTimeZone('Australia/Adelaide', () => {
    t.equal(
      parse(summer, 'Asia/Kathmandu').getTime(),
      new Date('2025-06-30T11:57:23+05:45').getTime(),
      'Funky offsets'
    )
  })

  const springForwardLocalStr = '2025-03-09 02:30:00' // Never occurred in the U.S.
  const springForwardEarlyTime = new Date('2025-03-09T02:30:00-04:00').getTime()
  const springForwardLateTime = new Date('2025-03-09T02:30:00-05:00').getTime()

  const fallBackLocalStr = '2025-11-02 01:30:00' // Occurred twice in the U.S.
  const fallBackEarlyTime = new Date('2025-11-02T01:30:00-04:00').getTime()
  const fallBackLateTime = new Date('2025-11-02T01:30:00-05:00').getTime()

  const postgresTzOptions = { timeZone: 'America/New_York', disambiguation: 'postgres' }

  t.equal(
    parse(winter, { timeZone: 'America/New_York' }).getTime(),
    new Date('2026-01-13T23:53:08-05:00').getTime(),
    'Accepts options object with timeZone'
  )

  t.throws(
    () => parse(winter, { timeZone: 300 }),
    /options.timeZone expected type 'string'/,
    'Enforces timeZone type in options object'
  )

  t.equal(
    parse(winter, { offset: -300 }).getTime(),
    new Date('2026-01-13T23:53:08-05:00').getTime(),
    'Accepts options object with offset'
  )

  t.throws(
    () => parse(winter, { offset: 'America/New_York' }),
    /options.offset expected numeric /,
    'Enforces offset type in options object'
  )

  t.throws(
    () => parse(winter, { timeZone: 'America/New_York', offset: -300 }),
    /'offset' cannot be combined with 'timeZone'/,
    'Offset and timeZone are mutually exclusive'
  )

  t.equal(
    parse(springForwardLocalStr, postgresTzOptions).getTime(),
    springForwardLateTime,
    '"postgres" disambiguation uses later time (spring forward)'
  )

  t.equal(
    parse(fallBackLocalStr, postgresTzOptions).getTime(),
    fallBackLateTime,
    '"postgres" disambiguation uses later time (fall back)'
  )

  const javascriptTzOptions = { timeZone: 'America/New_York', disambiguation: 'javascript' }

  t.equal(
    parse(springForwardLocalStr, javascriptTzOptions).getTime(),
    springForwardLateTime,
    '"javascript" disambiguation uses later time (spring forward)'
  )

  t.equal(
    parse(fallBackLocalStr, javascriptTzOptions).getTime(),
    fallBackEarlyTime,
    '"javascript" disambiguation uses earlier time (fall back)'
  )

  const earlierTzOptions = { timeZone: 'America/New_York', disambiguation: 'earlier' }
  t.equal(
    parse(springForwardLocalStr, earlierTzOptions).getTime(),
    springForwardEarlyTime,
    '"earlier" disambiguation (spring forward)'
  )

  t.equal(
    parse(fallBackLocalStr, earlierTzOptions).getTime(),
    fallBackEarlyTime,
    '"earlier" disambiguation (fall back)'
  )

  const laterTzOptions = { timeZone: 'America/New_York', disambiguation: 'later' }
  t.equal(
    parse(springForwardLocalStr, laterTzOptions).getTime(),
    springForwardLateTime,
    '"later" disambiguation (spring forward)'
  )

  t.equal(
    parse(fallBackLocalStr, laterTzOptions).getTime(),
    fallBackLateTime,
    '"later" disambiguation (fall back)'
  )

  const rejectTzOptions = { timeZone: 'America/New_York', disambiguation: 'reject' }

  t.throws(
    () => parse(springForwardLocalStr, rejectTzOptions),
    (e) => e instanceof RangeError,
    '"reject" disambiguation rejects illegal timestamp'
  )

  t.throws(
    () => parse(fallBackLocalStr, rejectTzOptions),
    (e) => e instanceof RangeError,
    '"reject" disambiguation rejects ambiguous timestamp'
  )

  t.throws(
    () => parse(springForwardLocalStr, { offset: 123, disambiguation: 'later' }),
    /'disambiguation' cannot be specified with a fixed offset/,
    'disambiguation and offset are mutually exclusive'
  )

  t.equal(
    parse(springForwardLocalStr, 'America/New_York').getTime(),
    parse(springForwardLocalStr, { timeZone: 'America/New_York', disambiguation: 'postgres' }).getTime(),
    'disambiguation defaults to postgres (spring forward, no options object)'
  )

  t.equal(
    parse(springForwardLocalStr, { timeZone: 'America/New_York' }).getTime(),
    parse(springForwardLocalStr, { timeZone: 'America/New_York', disambiguation: 'postgres' }).getTime(),
    'disambiguation defaults to postgres (spring forward, disambiguation omitted from options object)'
  )

  t.equal(
    parse(fallBackLocalStr, 'America/New_York').getTime(),
    parse(fallBackLocalStr, { timeZone: 'America/New_York', disambiguation: 'postgres' }).getTime(),
    'disambiguation defaults to postgres (fall back, no options object)'
  )

  t.equal(
    parse(fallBackLocalStr, { timeZone: 'America/New_York' }).getTime(),
    parse(fallBackLocalStr, { timeZone: 'America/New_York', disambiguation: 'postgres' }).getTime(),
    'disambiguation defaults to postgres (fall back, disambiguation omitted from options object)'
  )

  const parseWithNoTemporal = proxyquire('./', {
    './temporal': null
  })
  t.equal(
    parseWithNoTemporal(winter, {
      timeZone: 'America/New_York',
      temporal: Temporal
    }).getTime(),
    new Date('2026-01-13T23:53:08-05:00').getTime()
  )

  function ms (string) {
    const base = '2010-01-01 01:01:01'
    return parse(base + string).getMilliseconds()
  }

  t.equal(ms('.1'), 100)
  t.equal(ms('.01'), 10)
  t.equal(ms('.74'), 740)

  function iso (string) {
    return parse(string).toISOString()
  }

  t.equal(
    iso('2010-12-11 09:09:04.1'),
    new Date(2010, 11, 11, 9, 9, 4, 100).toISOString(),
    'no timezones'
  )

  t.equal(
    iso('2011-01-23 22:15:51.280843-06'),
    '2011-01-24T04:15:51.280Z',
    'huge ms value'
  )

  t.equal(
    iso('2011-01-23 22:15:51Z'),
    '2011-01-23T22:15:51.000Z',
    'zulu time offset'
  )

  t.equal(
    iso('2011-01-23 10:15:51-04'),
    '2011-01-23T14:15:51.000Z',
    'negative hour offset'
  )

  t.equal(
    iso('2011-01-23 10:15:51+06:10'),
    '2011-01-23T04:05:51.000Z',
    'positive HH:mm offset'
  )

  t.equal(
    iso('2011-01-23 10:15:51-06:10'),
    '2011-01-23T16:25:51.000Z',
    'negative HH:mm offset'
  )

  t.equal(
    iso('0005-02-03 10:53:28+01:53:28'),
    '0005-02-03T09:00:00.000Z',
    'positive HH:mm:ss offset'
  )

  t.equal(
    iso('0005-02-03 09:58:45-02:01:15'),
    '0005-02-03T12:00:00.000Z',
    'negative HH:mm:ss offset'
  )

  t.equal(
    iso('0076-01-01 01:30:15+12'),
    '0075-12-31T13:30:15.000Z',
    '0 to 99 year boundary'
  )

  t.equal(parse('infinity'), Infinity)
  t.equal(parse('-infinity'), -Infinity)

  t.end()
})

function withLocalTimeZone (tz, f) {
  timezoneMock.register(tz)
  try {
    f()
  } finally {
    timezoneMock.unregister()
  }
}
