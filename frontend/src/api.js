import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.clear();
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
      // Return a pending promise to swallow the error and prevent React/Axios console spam
      return new Promise(() => {});
    }
    return Promise.reject(error);
  }
);

export default api;
