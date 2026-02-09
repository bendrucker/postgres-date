export type PgDateDisambiguation = 'earlier' | 'later' | 'reject' | 'postgres' | 'javascript'

interface ParseDateTimeZoneOptions {
  timeZone?: string,
  disambiguation?: PgDateDisambiguation,
}

interface ParseDateOffsetOptions {
  offset?: number;
  disambiguation?: PgDateDisambiguation;
}

export type ParseDateOptions = ParseDateTimeZoneOptions | ParseDateOffsetOptions;

declare function parseDate(isoDate: string): Date | number | null
declare function parseDate(isoDate: string, timeZone: string): Date | number | null
declare function parseDate(isoDate: string, offset: number): Date | number | null
declare function parseDate(isoDate: string, options: ParseDateTimeZoneOptions): Date | number | null
declare function parseDate(isoDate: string, options: ParseDateOffsetOptions): Date | number | null
declare function parseDate(isoDate: null | undefined, options?: string | number | ParseDateOptions): null
export default parseDate
