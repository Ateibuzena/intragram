import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token en cada request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Redirigir al login de 42
  loginWith42: () => {
    window.location.href = `${API_URL}/auth/42/login`;
  },
  
  // Obtener datos del usuario autenticado
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  
  // Logout
  logout: () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/';
  },
};

export default apiClient;
