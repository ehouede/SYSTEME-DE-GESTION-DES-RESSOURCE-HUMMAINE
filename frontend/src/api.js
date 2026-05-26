import axios from 'axios';

// Base API instance – adjust the baseURL if your Django server runs on another host/port
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  // Include credentials for potential cookie based auth (not needed for JWT but harmless)
  withCredentials: true,
});

// Request interceptor – attach access token if present
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor – handle token expiration (401) by attempting refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        // No refresh token – force logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const resp = await axios.post('http://localhost:8000/api/auth/token/refresh/', { refresh: refreshToken });
        const newAccess = resp.data.access;
        localStorage.setItem('access_token', newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed – logout the user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
