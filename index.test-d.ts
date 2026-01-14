import { expectType, expectError } from 'tsd'

import parse from '.'

expectType<Date | number | null>(parse('2010-12-11 09:09:04'))
expectType<Date | number | null>(parse('infinity'))
expectType<Date | number | null>(parse('garbage'))
expectType<Date | number | null>(parse('2010-12-11 09:09:04', 'America/New York'))
expectType<Date | number | null>(parse('2010-12-11 09:09:04', 'UTC'))
expectType<Date | number | null>(parse('2010-12-11 09:09:04', 'Australia/Adelaide'))
expectType<Date | number | null>(parse('2010-12-11 09:09:04', 0))
expectType<Date | number | null>(parse('2010-12-11 09:09:04', 840)) // UTC +14 (Line Islands)
expectType<Date | number | null>(parse('2010-12-11 09:09:04', -720)) // UTC -12 (Baker Island)
expectType<Date | number | null>(parse('2010-12-11 09:09:04', {}))
expectType<Date | number | null>(parse('2010-12-11 09:09:04', { timeZone: 'America/New York' }))
expectType<Date | number | null>(parse('2010-12-11 09:09:04', { timeZone: 123 }))
expectType<Date | number | null>(parse('2010-12-11 09:09:04', { disambiguation: 'javascript' }))
expectType<Date | number | null>(parse('2010-12-11 09:09:04', { timeZone: 'America/New York', disambiguation: 'reject' }))
expectType<Date | number | null>(parse('2010-12-11 09:09:04', { disambiguation: 'postgres' }))
expectType<Date | number | null>(parse('2010-12-11 09:09:04', { disambiguation: 'earlier' }))
expectType<Date | number | null>(parse('2010-12-11 09:09:04', { disambiguation: 'later' }))
expectType<null>(parse(null))
expectType<null>(parse(undefined))
expectError(parse(1625042787))
expectError(parse(new Date()))

// 'compatible' is too ambiguous in this context; 'compatible with postgres' or 'compatible with JavaScript'?
expectError(parse('2010-12-11 09:09:04', { disambiguation: 'compatible' }))
