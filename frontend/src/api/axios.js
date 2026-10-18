import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============================================================
// Request interceptor — token attach karo
// ============================================================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================
// Response interceptor — 401 par logout
// ============================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    
    // ⚠️ Login endpoints par redirect NAHI karna
    // Warna galat credentials par user admin login par chala jayega
    const isLoginEndpoint = url.includes('/login');
    
    if (error.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Role ke hisaab se sahi login page par bhejo
      const path = window.location.pathname;
      if (path.startsWith('/receptionist')) {
        if (path !== '/receptionist/login') {
          window.location.href = '/receptionist/login';
        }
      } else if (path.startsWith('/doctor')) {
        if (path !== '/doctor/login') {
          window.location.href = '/doctor/login';
        }
      } else {
        if (path !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;