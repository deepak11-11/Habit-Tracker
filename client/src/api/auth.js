import api from './axios.js';

/**
 * Register a new user.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ message: string }>}
 */
export async function register(username, password) {
  const response = await api.post('/api/auth/register', { username, password });
  return response.data;
}

/**
 * Log in and receive a JWT.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ token: string }>}
 */
export async function login(username, password) {
  const response = await api.post('/api/auth/login', { username, password });
  return response.data;
}
