import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

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
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
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
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error al cargar usuario guardado:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  const login = () => {
    // Redirigir al backend para iniciar OAuth
    window.location.href = 'http://localhost:3000/auth/42';
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
