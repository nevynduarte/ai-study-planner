/**
 * Returns the current study streak: the number of consecutive calendar days
 * (ending with today or yesterday) on which at least one session was logged.
 *
 * Streak anchoring:
 *   - If today is logged, the streak includes today and walks backward.
 *   - If today is not yet logged, the streak walks back from yesterday; today
 *     is still "alive" (the day hasn't ended) but doesn't inflate the count.
 *
 * @param {string[]} dates     - Array of "YYYY-MM-DD" strings from study_log.
 * @param {string}  [todayStr] - Override today as "YYYY-MM-DD" (for testing).
 * @returns {number} Streak length; 0 if nothing was logged recently.
 */
export function calcStreak(dates, todayStr) {
  const set = new Set(dates);

  const localISO = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Parse the reference date at local noon to stay clear of DST edge cases.
  const cursor = todayStr
    ? new Date(todayStr + "T12:00:00")
    : (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; })();

  // If today hasn't been logged yet, begin the walk from yesterday.
  if (!set.has(localISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (set.has(localISO(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Sums hours logged on a given date.
 *
 * @param {Array<{date: string, hours: number | string}>} log
 * @param {string} [dateStr] - "YYYY-MM-DD" (defaults to today's local date).
 * @returns {number}
 */
export function todayHours(log, dateStr) {
  const d = dateStr
    ? new Date(dateStr + "T12:00:00")
    : new Date();
  const target = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return log
    .filter((e) => e.date === target)
    .reduce((s, e) => s + Number(e.hours), 0);
}
