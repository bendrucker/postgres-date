interface ParseDateOptions {
  timeZone?: string | number;
  disambiguation?: 'earlier' | 'later' | 'reject' | 'postgres' | 'javascript';
}

declare function parseDate(isoDate: string): Date | number | null
declare function parseDate(isoDate: string, timeZone: string): Date | number | null
declare function parseDate(isoDate: string, offset: number): Date | number | null
declare function parseDate(isoDate: string, options: ParseDateOptions): Date | number | null
declare function parseDate(isoDate: null | undefined, options?: string | number | ParseDateOptions): null
export default parseDate
