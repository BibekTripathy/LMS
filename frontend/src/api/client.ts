import axios from 'axios';

// Production builds call the API on the same origin (Vercel routes /api to the Django service);
// local dev talks to the Django dev server unless VITE_API_URL overrides it.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '/api/v1');

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Basic retry logic for 401 using refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh: refreshToken });
          localStorage.setItem('access_token', data.access);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
          return apiClient(originalRequest);
        }
      } catch {
        // Refresh token invalid, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
