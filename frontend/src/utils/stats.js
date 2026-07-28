/**
 * Returns today's date as a YYYY-MM-DD string using local time.
 * @returns {string}
 */
function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes aggregate statistics from the habits array.
 * @param {Array<{ completions: string[] }>} habits
 * @returns {{ dailyPct: number, completedToday: number, total: number, monthly: number, yearly: number }}
 */
export function computeStats(habits) {
  const today = getTodayString();
  const month = today.slice(0, 7); // YYYY-MM
  const year = today.slice(0, 4);  // YYYY

  const completedToday = habits.filter((h) =>
    h.completions.includes(today)
  ).length;

  const total = habits.length;
  const dailyPct = total === 0 ? 0 : Math.round((completedToday / total) * 100);

  const monthly = habits.reduce(
    (acc, h) => acc + h.completions.filter((d) => d.startsWith(month)).length,
    0
  );

  const yearly = habits.reduce(
    (acc, h) => acc + h.completions.filter((d) => d.startsWith(year)).length,
    0
  );

  return { dailyPct, completedToday, total, monthly, yearly };
}
