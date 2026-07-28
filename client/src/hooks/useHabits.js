import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchHabits,
  createHabit,
  toggleHabit as apiToggle,
  deleteHabit as apiDelete,
} from '../api/habits.js';

export function useHabits() {
  const { logout } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle 401 — clear token and redirect to login
  const handle401 = useCallback(
    (err) => {
      if (err?.response?.status === 401) {
        logout();
        return true;
      }
      return false;
    },
    [logout]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHabits();
      setHabits(data);
    } catch (err) {
      if (!handle401(err)) {
        setError('Failed to load habits.');
        console.error('fetchHabits error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [handle401]);

  useEffect(() => {
    load();
  }, [load]);

  const addHabit = useCallback(
    async (name) => {
      const trimmed = typeof name === 'string' ? name.trim() : '';
      if (!trimmed) return;

      try {
        const newHabit = await createHabit(trimmed);
        setHabits((prev) => [newHabit, ...prev]);
      } catch (err) {
        if (!handle401(err)) {
          console.error('createHabit error:', err);
        }
      }
    },
    [handle401]
  );

  const toggleHabit = useCallback(
    async (id) => {
      try {
        const updated = await apiToggle(id);
        setHabits((prev) =>
          prev.map((h) =>
            h.id === id
              ? {
                  ...h,
                  completions: updated.completions,
                  currentStreak: updated.currentStreak,
                  bestStreak: updated.bestStreak,
                }
              : h
          )
        );
      } catch (err) {
        if (!handle401(err)) {
          console.error('toggleHabit error:', err);
        }
      }
    },
    [handle401]
  );

  const deleteHabit = useCallback(
    async (id) => {
      try {
        await apiDelete(id);
        setHabits((prev) => prev.filter((h) => h.id !== id));
      } catch (err) {
        if (!handle401(err)) {
          console.error('deleteHabit error:', err);
        }
      }
    },
    [handle401]
  );

  return { habits, loading, error, addHabit, toggleHabit, deleteHabit };
}
