// User session hook and context for the frontend.
// Responsible for reading/saving the token from the URL/localStorage
// and exposing a simple "I am authenticated" state to the app.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
	background_theme: string | null;
	wallet: number;
	correction_point: number;
	levels?: Array<{
		id: number;
		name: string;
		slug?: string | null;
		level?: number;
		grade?: string | null;
	}>;
	achievements?: Array<{
		id: number;
		name: string;
		kind?: string | null;
		tier?: string | null;
	}>;
}

export type { UserProfile };

interface AuthContextType {
	token: string | null;
	isAuthenticated: boolean;
	user: AuthUser | null;
	profile: UserProfile | null;
	loadingProfile: boolean;
	logout: () => void;
	patchAuthProfile: (partial: Partial<UserProfile>) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within AuthProvider');
	return context;
};

// Global session state that is injected into the React tree
// via AuthContext.Provider in App.tsx.
export const useAuthState = () => {
	const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
	const [user, setUser] = useState<AuthUser | null>(() => {
		try {
			const saved = localStorage.getItem('auth_user');
			return saved ? (JSON.parse(saved) as AuthUser) : null;
		} catch {
			return null;
		}
	});
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loadingProfile, setLoadingProfile] = useState(false);
	const fetchingProfileRef = useRef(false);
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const urlToken = params.get('token');
		const urlUser = params.get('user');

		if (urlToken) {
			localStorage.setItem('auth_token', urlToken);
			setToken(urlToken);
			if (urlUser) {
				try {
					const parsed: AuthUser = JSON.parse(urlUser);
					setUser(parsed);
					localStorage.setItem('auth_user', JSON.stringify(parsed));
				} catch {
					// If the user parameter is corrupted, we simply ignore it.
				}
			}
			params.delete('token');
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
		if (!token || !user || profile || fetchingProfileRef.current) return;

		fetchingProfileRef.current = true;
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
				// We silence profile errors to avoid breaking the main app.
			} finally {
				fetchingProfileRef.current = false;
				setLoadingProfile(false);
			}
		};

		void fetchProfile();
		return () => {
			controller.abort();
			fetchingProfileRef.current = false;
		};
	}, [token, user, profile]);

	const logout = () => {
		localStorage.removeItem('auth_token');
		localStorage.removeItem('auth_user');
		setToken(null);
		setUser(null);
		setProfile(null);
	};

	const patchAuthProfile = (partial: Partial<UserProfile>) => {
		setProfile((prev) => prev ? { ...prev, ...partial } : prev);
	};

	return { token, isAuthenticated: !!token, user, profile, loadingProfile, logout, patchAuthProfile };
};
