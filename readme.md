# postgres-date [![tests](https://github.com/bendrucker/postgres-date/workflows/tests/badge.svg)](https://github.com/bendrucker/postgres-date/actions?query=workflow%3Atests)

> Postgres date output parser

This package parses [date/time outputs](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME-OUTPUT) from Postgres into Javascript `Date` objects. Its goal is to match Postgres behavior and preserve data accuracy.

If you find a case where a valid Postgres output results in incorrect parsing (including loss of precision), please [create a pull request](https://github.com/bendrucker/postgres-date/compare) and provide a failing test.

**Supported Postgres Versions:** `>= 9.6`

All prior versions of Postgres are likely compatible but not officially supported.

## Install

```
npm install --save postgres-date
```

## Usage

```js
const parse = require('postgres-date')
parse('2011-01-23 22:15:51Z')
// => 2011-01-23T22:15:51.000Z
parse('2011-01-23 22:15:51', 'America/New_York')
// => 2011-01-23T22:15:51.000-05:00
```

## Time Zone parsing

If the Postgres date or time string is provided without a time zone,
`postgres-date` will interpret it with the JS environment's local time
zone by default. Parsing to an alternate time zone requires the
`Temporal` API. If `Temporal` is not available globally in your
environment, install [`temporal-polyfill`](https://www.npmjs.com/package/temporal-polyfill)
or [`@js-temporal/polyfill`](https://www.npmjs.com/package/@js-temporal/polyfill).

## API

#### `parse(isoDate)` -> `date`
#### `parse(isoDate, tzNameOrOffset)` -> `date`
#### `parse(isoDate, { timeZone: str, disambiguation: str})` -> `date`
#### `parse(isoDate, { offset: number, disambiguation: str})` -> `date`

##### isoDate

*Required*  
Type: `string`

A date string from Postgres.

##### tzNameOrOffset

*Optional*  
Type: `string` or `number`  
Default: Local time zone

Time zone for interpretation of Postgres timestamps without time zone.

If a string, any IANA time zone name (such as `America/Los_Angeles`). If
a string is provided, `postgres-date` will attempt to import
`temporal-polyfill` to perform the offset calculation.

If a number, a numeric offset in minutes ahead of UTC.

##### timeZone

*Optional*  
Type: `string`
Default: Local time zone

Time zone string, interpreted as in `tzNameOrOffset` above. Cannot be
combined with `offset`.

##### offset

*Optional*  
Type: `number`
Default: Local time zone

Numeric offset in minutes ahead of UTC. Cannot be combined with
`timeZone`.

##### disambiguation

*Optional*  
Type: `'postgres'`, `'javascript'`, `'earlier'`, `'later'`, or
  `'reject'`  
Default: `postgres`

Specifies how the parser should disambiguate local time strings that do
not correspond to any time in the given time zone, or that correspond to
multiple times (e.g. Daylight Saving Time).

- `postgres`: Imitate the behavior of casting a `timestamp without time
  zone` to a `timestamp with time zone` with the given time zone.
  (equivalent to `later`)
- `javascript`: Imitate the behavior of the `Date` constructor.
  (Equivalent to `later` for forward transitions, and `earlier` for
  backward transitions)
- `earlier`: Use the earlier possible date
- `later`: Use the later possible date
- `reject`: Throw a `RangeError`

The allowed values are similar to, but not exactly the same as, the
corresponding option in
[`Temporal.ZonedDateTime`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime#ambiguity_and_gaps_from_local_time_to_utc_time).

## Releases

The following semantic versioning increments will be used for changes:

* **Major**: Removal of support for Node.js versions or Postgres versions (not expected)
* **Minor**: Unused, since Postgres returns dates in standard ISO 8601 format
* **Patch**: Any fix for parsing behavior

## License

MIT © [Ben Drucker](http://bendrucker.me)
