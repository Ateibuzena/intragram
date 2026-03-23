import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const useAuthState = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (urlToken) {
      localStorage.setItem('auth_token', urlToken);
      setToken(urlToken);
      params.delete('token');
      const newUrl = window.location.origin + window.location.pathname +
        (params.toString() ? `?${params.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
    } else {
      const saved = localStorage.getItem('auth_token');
      if (saved) setToken(saved);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
  };

  return { token, isAuthenticated: !!token, logout };
};
