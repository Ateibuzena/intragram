// Hook y contexto de sesión de usuario en el frontend.
// Se encarga de leer/guardar el token de la URL/localStorage
// y exponer un estado simple de "estoy autenticado" a la app.
import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

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

// Estado global de sesión que se inyecta en el árbol de React
// mediante AuthContext.Provider en App.tsx.
export const useAuthState = () => {
	const [token, setToken] = useState<string | null>(null);
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const urlToken = params.get('token');

		if (urlToken) {
			localStorage.setItem('auth_token', urlToken);
			setToken(urlToken);
			params.delete('token');
			navigate({ pathname: ROUTES.HOME, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
		} else {
			const saved = localStorage.getItem('auth_token');
			if (saved) setToken(saved);
		}
	}, [location.search, navigate]);

	const logout = () => {
		localStorage.removeItem('auth_token');
		setToken(null);
	};

	return { token, isAuthenticated: !!token, logout };
};
