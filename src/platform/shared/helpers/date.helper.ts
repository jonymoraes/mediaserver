/**
 * @file date.helper.ts
 * @description Helper class for date transformations, UTC normalization, key generation, and duration parsing
 */
export class DateHelper {
  /**
   * @description Converts a Date object to a string key in UTC format YYYY-MM-DD
   * @param date Input date
   * @returns A string in the format YYYY-MM-DD
   */
  static toDateKey(date: Date): string {
    const utcDate = this.getUtcDateOnly(date);
    return utcDate.toISOString().slice(0, 10);
  }

  /**
   * @description Returns a Date object normalized to UTC with only the date part (time set to 00:00:00)
   * @param date Input date
   * @returns Date object in UTC at 00:00:00
   */
  static getUtcDateOnly(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  /**
   * @description Checks if a date is in the past (UTC)
   * @param date Date to check
   * @returns true if date < today UTC
   */
  static isPast(date: Date): boolean {
    const today = this.getUtcDateOnly(new Date());
    const target = this.getUtcDateOnly(date);
    return target.getTime() < today.getTime();
  }

  /**
   * @description Adds days to a Date object
   * @param date Original date
   * @param days Number of days to add (can be negative)
   * @returns New Date object
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date.getTime());
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  /**
   * @description Returns the difference in full days between two dates (UTC)
   * @param from Start date
   * @param to End date
   * @returns Number of days
   */
  static diffDays(from: Date, to: Date): number {
    const utcFrom = this.getUtcDateOnly(from);
    const utcTo = this.getUtcDateOnly(to);
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((utcTo.getTime() - utcFrom.getTime()) / msPerDay);
  }

  /**
   * @description Parses a duration string like "5s", "10m", "2h", "1d" into seconds
   * @param input Duration string
   * @returns Number of seconds
   */
  static parseTimeToSeconds(input: string): number {
    const match = input.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid time format: ${input}`);

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }

  /**
   * @description Parses a duration string like "5s", "10m", "2h", "1d" into milliseconds
   * @param input Duration string
   * @returns Number of milliseconds
   */
  static parseTimeToMilliseconds(input: string): number {
    const match = input.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid time format: ${input}`);

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 3600 * 1000;
      case 'd':
        return value * 86400 * 1000;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }

  /**
   * @description Returns a Date object "duration" from now
   * @param duration Duration string like "5s", "10m", "2h", "1d"
   * @returns Date object in the future
   */
  static fromNow(duration: string): Date {
    const ms = this.parseTimeToMilliseconds(duration);
    return new Date(Date.now() + ms);
  }

  static currentMonth(date: Date = new Date()): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
      2,
      '0',
    )}`;
  }
}
