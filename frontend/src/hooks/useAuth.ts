// User session hook and context for the frontend.
// Responsible for reading/saving the token from the URL/localStorage
// and exposing a simple "I am authenticated" state to the app.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { buildApiUrl } from '@/utils/apiBase';
import { decodeTokenPayload } from '@/utils/auth';
import { AUTH_LOGOUT_REQUIRED_EVENT, AUTH_TOKEN_REFRESHED_EVENT, fetchWithAuth, refreshAccessToken } from '@/utils/fetchWithAuth';

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
	campus?: string | null;
	campus_country?: string | null;
	campus_city?: string | null;
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
		const urlRefreshToken = params.get('refresh_token');
		const urlUser = params.get('user');

		if (urlToken) {
			localStorage.setItem('auth_token', urlToken);
			setToken(urlToken);
			if (urlRefreshToken) {
				localStorage.setItem('auth_refresh_token', urlRefreshToken);
			}
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
			params.delete('refresh_token');
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

	const logout = () => {
		const storedRefreshToken = localStorage.getItem('auth_refresh_token');
		if (storedRefreshToken) {
			// Best-effort server-side revocation — don't block the local logout on it.
			void fetch(buildApiUrl('/auth/logout'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh_token: storedRefreshToken }),
			}).catch(() => {});
		}
		localStorage.removeItem('auth_token');
		localStorage.removeItem('auth_refresh_token');
		localStorage.removeItem('auth_user');
		setToken(null);
		setUser(null);
		setProfile(null);
	};

	// ── Cross-tab / cross-module sync ──────────────────────────────────────────
	// fetchWithAuth() runs outside React (shared by 17+ call sites) and refreshes
	// the token directly in localStorage; mirror that into state here so every
	// consumer (including the presence socket) picks up the fresh token.
	useEffect(() => {
		const handleRefreshed = (event: Event) => {
			const newToken = (event as CustomEvent<string>).detail;
			setToken(newToken);
		};
		const handleLogoutRequired = () => {
			logout();
			navigate(`${ROUTES.LOGIN}?reason=expired`);
		};
		window.addEventListener(AUTH_TOKEN_REFRESHED_EVENT, handleRefreshed);
		window.addEventListener(AUTH_LOGOUT_REQUIRED_EVENT, handleLogoutRequired);
		return () => {
			window.removeEventListener(AUTH_TOKEN_REFRESHED_EVENT, handleRefreshed);
			window.removeEventListener(AUTH_LOGOUT_REQUIRED_EVENT, handleLogoutRequired);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [navigate]);

	// ── Silent refresh ───────────────────────────────────────────────────────
	// Proactively renew the access token before it expires so an active user
	// never actually hits a 401 in normal usage.
	useEffect(() => {
		if (!token) return;
		const exp = decodeTokenPayload(token)?.exp;
		if (!exp) return;

		const msUntilExpiry = exp * 1000 - Date.now();
		const msUntilRefresh = Math.max(msUntilExpiry * 0.8, 5_000);

		const id = setTimeout(() => {
			void refreshAccessToken();
		}, msUntilRefresh);

		return () => clearTimeout(id);
	}, [token]);

	useEffect(() => {
		if (!token || !user || profile || fetchingProfileRef.current) return;

		fetchingProfileRef.current = true;
		const controller = new AbortController();
		const fetchProfile = async () => {
			try {
				setLoadingProfile(true);
				const res = await fetchWithAuth(`/users/login/${encodeURIComponent(user.username.toLowerCase())}`, token, {
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

	const patchAuthProfile = (partial: Partial<UserProfile>) => {
		setProfile((prev) => prev ? { ...prev, ...partial } : prev);
	};

	return { token, isAuthenticated: !!token, user, profile, loadingProfile, logout, patchAuthProfile };
};
