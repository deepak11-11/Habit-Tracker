import api from './axios.js';

/**
 * Fetch all habits for the authenticated user.
 * @returns {Promise<Array>}
 */
export async function fetchHabits() {
  const response = await api.get('/api/habits');
  return response.data;
}

/**
 * Create a new habit.
 * @param {string} name
 * @returns {Promise<Object>}
 */
export async function createHabit(name) {
  const response = await api.post('/api/habits', { name });
  return response.data;
}

/**
 * Toggle today's completion for a habit.
 * @param {number} id
 * @returns {Promise<{ completions: string[], currentStreak: number, bestStreak: number }>}
 */
export async function toggleHabit(id) {
  const response = await api.post(`/api/habits/${id}/toggle`);
  return response.data;
}

/**
 * Delete a habit permanently.
 * @param {number} id
 * @returns {Promise<{ message: string }>}
 */
export async function deleteHabit(id) {
  const response = await api.delete(`/api/habits/${id}`);
  return response.data;
}
