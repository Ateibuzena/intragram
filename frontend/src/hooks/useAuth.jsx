import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar usuario al montar
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await authService.getMe();
        setUser(userData);
      } catch (err) {
        console.error('Error loading user:', err);
        setError(err.message);
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Manejar callback de 42 (token en URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('auth_token', token);
      // Limpiar URL sin recargar
      window.history.replaceState({}, '', '/');
      // Recargar para ejecutar loadUser
      window.location.reload();
    }
  }, []);

  const login = () => {
    authService.loginWith42();
  };

  const logout = () => {
    setUser(null);
    authService.logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
