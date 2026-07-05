// Authenticated fetch wrapper shared by every call site that needs a Bearer token.
// On a 401 it transparently refreshes the access token (once, even under concurrent
// requests — the backend rotates the refresh token on every use, so two parallel
// refresh calls would race and one would fail) and retries the original request.
import { buildApiUrl } from './apiBase';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

export const AUTH_TOKEN_REFRESHED_EVENT = 'auth:token-refreshed';
export const AUTH_LOGOUT_REQUIRED_EVENT = 'auth:logout-required';

let inFlightRefresh: Promise<string | null> | null = null;

const performRefresh = async (): Promise<string | null> => {
	const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
	if (!storedRefreshToken) return null;

	try {
		const res = await fetch(buildApiUrl('/auth/refresh'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refresh_token: storedRefreshToken }),
		});
		if (!res.ok) return null;

		const data = (await res.json()) as { access_token: string; refresh_token: string };
		localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
		localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
		window.dispatchEvent(new CustomEvent(AUTH_TOKEN_REFRESHED_EVENT, { detail: data.access_token }));
		return data.access_token;
	} catch {
		return null;
	}
};

/** Renews the access token, sharing a single in-flight request across callers. */
export const refreshAccessToken = (): Promise<string | null> => {
	if (!inFlightRefresh) {
		inFlightRefresh = performRefresh().finally(() => {
			inFlightRefresh = null;
		});
	}
	return inFlightRefresh;
};

/**
 * Fetches `path` (relative, as passed to buildApiUrl) with a Bearer token.
 * Transparently refreshes and retries once on 401; dispatches a logout event
 * if the refresh token is missing/expired too.
 */
export const fetchWithAuth = async (path: string, token: string | null, init: RequestInit = {}): Promise<Response> => {
	const withAuthHeader = (bearer: string | null): RequestInit => ({
		...init,
		headers: {
			...(init.headers ?? {}),
			...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
		},
	});

	const res = await fetch(buildApiUrl(path), withAuthHeader(token));
	if (res.status !== 401) return res;

	const newToken = await refreshAccessToken();
	if (!newToken) {
		window.dispatchEvent(new Event(AUTH_LOGOUT_REQUIRED_EVENT));
		return res;
	}

	return fetch(buildApiUrl(path), withAuthHeader(newToken));
};
