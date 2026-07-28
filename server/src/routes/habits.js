import { Router } from 'express';
import { pool } from '../db/pool.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Apply authentication to all routes in this file
router.use(authenticate);

// ─── Helper: calculate streaks from an array of YYYY-MM-DD date strings ───────
function calculateStreaks(completions) {
  if (!completions || completions.length === 0) return { current: 0, best: 0 };

  const sorted = [...new Set(completions)].sort();

  const parseLocal = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Best streak
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
  }

  // Current streak
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

// ─── Helper: format a Date object or date string to YYYY-MM-DD ────────────────
function toDateString(date) {
  if (typeof date === 'string') return date.slice(0, 10);
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

// ─── GET /api/habits ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const habitsResult = await pool.query(
      'SELECT id, name, created_at FROM habits WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    const habits = await Promise.all(
      habitsResult.rows.map(async (habit) => {
        const completionsResult = await pool.query(
          'SELECT completed_date FROM completions WHERE habit_id = $1 ORDER BY completed_date ASC',
          [habit.id]
        );
        const completions = completionsResult.rows.map((r) => toDateString(r.completed_date));
        const { current: currentStreak, best: bestStreak } = calculateStreaks(completions);

        return {
          id: habit.id,
          name: habit.name,
          created_at: habit.created_at,
          completions,
          currentStreak,
          bestStreak,
        };
      })
    );

    return res.status(200).json(habits);
  } catch (err) {
    console.error('GET /habits error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/habits ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Habit name is required' });
  }
  const trimmedName = name.trim();
  if (trimmedName.length > 200) {
    return res.status(400).json({ error: 'Habit name must be 200 characters or fewer' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO habits (user_id, name) VALUES ($1, $2) RETURNING id, name, created_at',
      [req.userId, trimmedName]
    );
    const habit = result.rows[0];

    return res.status(201).json({
      id: habit.id,
      name: habit.name,
      created_at: habit.created_at,
      completions: [],
      currentStreak: 0,
      bestStreak: 0,
    });
  } catch (err) {
    console.error('POST /habits error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/habits/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const habitId = parseInt(req.params.id, 10);
  if (isNaN(habitId)) {
    return res.status(400).json({ error: 'Invalid habit ID' });
  }

  try {
    // Check ownership
    const ownerCheck = await pool.query(
      'SELECT id FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, req.userId]
    );
    if (ownerCheck.rows.length === 0) {
      // Distinguish between "not found" and "wrong user"
      const exists = await pool.query('SELECT id FROM habits WHERE id = $1', [habitId]);
      if (exists.rows.length === 0) {
        return res.status(404).json({ error: 'Habit not found' });
      }
      return res.status(403).json({ error: 'Forbidden' });
    }

    await pool.query('DELETE FROM habits WHERE id = $1', [habitId]);
    return res.status(200).json({ message: 'Habit deleted' });
  } catch (err) {
    console.error('DELETE /habits/:id error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/habits/:id/toggle ─────────────────────────────────────────────
router.post('/:id/toggle', async (req, res) => {
  const habitId = parseInt(req.params.id, 10);
  if (isNaN(habitId)) {
    return res.status(400).json({ error: 'Invalid habit ID' });
  }

  try {
    // Check ownership
    const ownerCheck = await pool.query(
      'SELECT id FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, req.userId]
    );
    if (ownerCheck.rows.length === 0) {
      const exists = await pool.query('SELECT id FROM habits WHERE id = $1', [habitId]);
      if (exists.rows.length === 0) {
        return res.status(404).json({ error: 'Habit not found' });
      }
      return res.status(403).json({ error: 'Forbidden' });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD UTC

    // Check if already completed today
    const existing = await pool.query(
      'SELECT id FROM completions WHERE habit_id = $1 AND completed_date = $2',
      [habitId, today]
    );

    if (existing.rows.length > 0) {
      // Remove completion
      await pool.query(
        'DELETE FROM completions WHERE habit_id = $1 AND completed_date = $2',
        [habitId, today]
      );
    } else {
      // Add completion
      await pool.query(
        'INSERT INTO completions (habit_id, completed_date) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [habitId, today]
      );
    }

    // Return updated completions
    const completionsResult = await pool.query(
      'SELECT completed_date FROM completions WHERE habit_id = $1 ORDER BY completed_date ASC',
      [habitId]
    );
    const completions = completionsResult.rows.map((r) => toDateString(r.completed_date));
    const { current: currentStreak, best: bestStreak } = calculateStreaks(completions);

    return res.status(200).json({ completions, currentStreak, bestStreak });
  } catch (err) {
    console.error('POST /habits/:id/toggle error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
