/**
 * Compute the next occurrence date for a recurring transaction.
 * Shared between server actions and client components to eliminate duplication.
 *
 * @param fromDate - ISO date string (YYYY-MM-DD)
 * @param interval - Positive integer (e.g. 1, 2, 7)
 * @param unit - "day" | "week" | "month"
 * @returns ISO date string of the next occurrence (YYYY-MM-DD)
 */
export function computeNextDate(
  fromDate: string,
  interval: number,
  unit: string
): string {
  const date = new Date(fromDate);
  if (unit === "month") {
    date.setMonth(date.getMonth() + interval);
  } else if (unit === "week") {
    date.setDate(date.getDate() + interval * 7);
  } else if (unit === "day") {
    date.setDate(date.getDate() + interval);
  }
  return date.toISOString().slice(0, 10);
}
