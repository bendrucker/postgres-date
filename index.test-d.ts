import { expectType, expectError } from 'tsd'

import parse from '.'

expectType<Date | number | null>(parse('2010-12-11 09:09:04'))
expectType<Date | number | null>(parse('infinity'))
expectType<Date | number | null>(parse('garbage'))
expectType<null>(parse(null))
expectType<null>(parse(undefined))
expectError(parse(1625042787))
expectError(parse(new Date()))
