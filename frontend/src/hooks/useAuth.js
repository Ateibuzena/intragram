import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:8443/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Al cargar, verificar si hay un token en la URL (callback de OAuth)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    const errorParam = params.get('error');

    if (errorParam) {
      setError('Error al iniciar sesión con 42');
      setLoading(false);
      window.history.replaceState({}, document.title, '/');
      return;
    }

    if (token && userStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userStr));
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setUser(userData);
        setLoading(false);
        // Limpiar la URL
        window.history.replaceState({}, document.title, '/');
      } catch (err) {
        console.error('Error al parsear usuario:', err);
        setError('Error al procesar datos de usuario');
        setLoading(false);
      }
      return;
    }

    // Si no hay token en URL, verificar localStorage
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error al cargar usuario guardado:', err);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }

    setLoading(false);
  }, []);

  const login = () => {
    // Redirigir al backend para iniciar OAuth
    window.location.href = `${API_URL}/auth/42/login`;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
