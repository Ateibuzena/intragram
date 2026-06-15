// Centralized utility for building the API base URL.
// Keeps configuration logic consistent throughout the frontend.

const normalizeBaseUrl = (baseUrl?: string): string => {
	const candidate = baseUrl?.trim();
	if (!candidate) return '/api';
	return candidate.endsWith('/') ? candidate.slice(0, -1) : candidate;
};

const shouldForceRelativeApiBase = (baseUrl: string): boolean => {
	if (typeof window === 'undefined') return false;

	const runningOnLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
	const pointsToLocalhost = /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(baseUrl);

	return pointsToLocalhost && !runningOnLocalhost;
};

export const getApiBaseUrl = (): string => {
	const envBase = (import.meta as any).env?.VITE_API_URL as string | undefined;
	const normalizedBase = normalizeBaseUrl(envBase);

	// If a stale env/build points to localhost while app runs on a public/tunnel host,
	// force relative API base to prevent certificate and cross-host redirect issues.
	if (shouldForceRelativeApiBase(normalizedBase)) {
		return '/api';
	}

	return normalizedBase;
};

export const buildApiUrl = (path: string): string => {
	const base = getApiBaseUrl();
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${base}${normalizedPath}`;
};
