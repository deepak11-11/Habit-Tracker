/**
 * Calculates the current and best streak from an array of completion date strings.
 * @param {string[]} completions - Array of YYYY-MM-DD date strings
 * @returns {{ current: number, best: number }}
 */
export function calculateStreaks(completions) {
  if (!completions || completions.length === 0) return { current: 0, best: 0 };

  // Deduplicate and sort ascending
  const sorted = [...new Set(completions)].sort();

  const parseLocal = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Best streak ──────────────────────────────────────────────────────────────
  let best = 1;
  let tempBest = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (parseLocal(sorted[i]) - parseLocal(sorted[i - 1])) / 86400000
    );
    if (diff === 1) {
      tempBest++;
      if (tempBest > best) best = tempBest;
    } else if (diff > 1) {
      tempBest = 1;
    }
    // diff === 0 is impossible after deduplication
  }

  // ── Current streak ───────────────────────────────────────────────────────────
  const lastDate = parseLocal(sorted[sorted.length - 1]);
  const diffFromToday = Math.round((today - lastDate) / 86400000);

  let current = 0;
  if (diffFromToday <= 1) {
    current = 1;
    for (let i = sorted.length - 1; i > 0; i--) {
      const diff = Math.round(
        (parseLocal(sorted[i]) - parseLocal(sorted[i - 1])) / 86400000
      );
      if (diff === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, best };
}
