// Hook y contexto de sesión de usuario en el frontend.
// Se encarga de leer/guardar el token de la URL/localStorage
// y exponer un estado simple de "estoy autenticado" a la app.
import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { buildApiUrl } from '@/utils/apiBase';

interface AuthUser {
	id: string;
	username: string;
	email: string;
	display_name: string | null;
}

interface UserProfile {
	id: string;
	login: string;
	email: string | null;
	display_name: string | null;
	avatar_url: string | null;
	wallet: number;
	correction_point: number;
}

interface AuthContextType {
	token: string | null;
	isAuthenticated: boolean;
	user: AuthUser | null;
	profile: UserProfile | null;
	loadingProfile: boolean;
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
	const [user, setUser] = useState<AuthUser | null>(null);
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loadingProfile, setLoadingProfile] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const urlToken = params.get('token');
		const urlOauth42Token = params.get('oauth42_access_token');
		const urlUser = params.get('user');

		if (urlToken) {
			localStorage.setItem('auth_token', urlToken);
			setToken(urlToken);
			if (urlOauth42Token) {
				localStorage.setItem('oauth42_access_token', urlOauth42Token);
			}
			if (urlUser) {
				try {
					const parsed: AuthUser = JSON.parse(urlUser);
					setUser(parsed);
					localStorage.setItem('auth_user', JSON.stringify(parsed));
				} catch {
					// Si el parámetro user viene corrupto, simplemente lo ignoramos.
				}
			}
			params.delete('token');
			params.delete('oauth42_access_token');
			params.delete('user');
			navigate({ pathname: ROUTES.HOME, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
		} else {
			const savedToken = localStorage.getItem('auth_token');
			const savedUser = localStorage.getItem('auth_user');
			if (savedToken) setToken(savedToken);
			if (savedUser) {
				try {
					setUser(JSON.parse(savedUser));
				} catch {
					localStorage.removeItem('auth_user');
				}
			}
		}
	}, [location.search, navigate]);

	useEffect(() => {
		if (!token || !user || profile || loadingProfile) return;

		const controller = new AbortController();
		const fetchProfile = async () => {
			try {
				setLoadingProfile(true);
				const url = buildApiUrl(`/users/login/${encodeURIComponent(user.username.toLowerCase())}`);
				const res = await fetch(url, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
					signal: controller.signal,
				});
				if (!res.ok) return;
				const data: UserProfile = await res.json();
				setProfile(data);
			} catch {
				// Silenciamos errores de perfil para no romper la app principal.
			} finally {
				setLoadingProfile(false);
			}
		};

		fetchProfile();
		return () => controller.abort();
	}, [token, user, profile, loadingProfile]);

	const logout = () => {
		localStorage.removeItem('auth_token');
		localStorage.removeItem('oauth42_access_token');
		localStorage.removeItem('auth_user');
		setToken(null);
		setUser(null);
		setProfile(null);
	};

	return { token, isAuthenticated: !!token, user, profile, loadingProfile, logout };
};
