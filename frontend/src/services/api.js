import axios from 'axios';

const api = axios.create({ baseURL: 'https://calls-management-1.onrender.com/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only redirect to login if unauthorized on protected pages, NOT on the login page itself
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
