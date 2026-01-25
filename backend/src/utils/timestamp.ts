/**
 * Timestamp Handling Utilities
 * Consistent date/time operations across the application
 */

/**
 * Get current UTC timestamp
 * @returns Current date/time in UTC
 */
export function now(): Date {
  return new Date();
}

/**
 * Format a date for API responses (ISO 8601)
 * @param date - Date to format
 * @returns ISO 8601 formatted string
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Format a date for display (human readable)
 * @param date - Date to format
 * @returns Formatted date string (e.g., "January 17, 2026")
 */
export function toDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date for sitemap (W3C format)
 * @param date - Date to format
 * @returns W3C formatted date string (YYYY-MM-DD)
 */
export function toSitemapDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate time elapsed since a date
 * @param date - Start date
 * @returns Object with elapsed time in various units
 */
export function getElapsedTime(date: Date): {
  seconds: number;
  minutes: number;
  hours: number;
} {
  const elapsed = now().getTime() - date.getTime();
  return {
    seconds: Math.floor(elapsed / 1000),
    minutes: Math.floor(elapsed / (1000 * 60)),
    hours: Math.floor(elapsed / (1000 * 60 * 60)),
  };
}

/**
 * Check if a date is within the last N days
 * @param date - Date to check
 * @param days - Number of days
 * @returns True if date is within the last N days
 */
export function isWithinDays(date: Date, days: number): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}
