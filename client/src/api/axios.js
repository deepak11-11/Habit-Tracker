import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach JWT Bearer token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('habitTrackerToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
