/**
 * Calculates start and end of "Today" normalized to the operational timezone (Africa/Cairo - UTC+2/UTC+3).
 * Ensures consistency across server environments (Linux/cPanel vs Local).
 */
export function getCairoTodayRange(referenceDate: Date = new Date()): { startOfToday: Date; endOfToday: Date } {
  const cairoDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(referenceDate);

  // Cairo is UTC+2 (standard time) / UTC+3 (daylight saving time).
  // Creating dates via ISO string ensures exact local boundary:
  const startOfToday = new Date(`${cairoDateStr}T00:00:00.000+02:00`);
  const endOfToday = new Date(`${cairoDateStr}T23:59:59.999+02:00`);

  return { startOfToday, endOfToday };
}
