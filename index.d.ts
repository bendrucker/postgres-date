type MaybeTemporal = typeof globalThis extends { Temporal: infer T } ? T : unknown;

interface ParseDateBaseOptions {
  disambiguation?: 'earlier' | 'later' | 'reject' | 'postgres' | 'javascript';
  temporal?: MaybeTemporal;
}

type ParseDateTimeZoneOptions = ParseDateBaseOptions & { timeZone?: string, offset?: never };
type ParseDateOffsetOptions = ParseDateBaseOptions & { offset?: number, timeZone?: never };

export type ParseDateOptions = ParseDateTimeZoneOptions | ParseDateOffsetOptions;

declare function parseDate(isoDate: string): Date | number | null
declare function parseDate(isoDate: string, timeZone: string): Date | number | null
declare function parseDate(isoDate: string, offset: number): Date | number | null
declare function parseDate(isoDate: string, options: ParseDateOptions): Date | number | null
declare function parseDate(isoDate: null | undefined, options?: string | number | ParseDateOptions): null
export default parseDate
