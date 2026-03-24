// Utilidad centralizada para construir la URL base de la API
// Mantiene la lógica de configuración de forma consistente en todo el frontend.

const normalizeBaseUrl = (baseUrl?: string): string => {
	const candidate = baseUrl?.trim();
	if (!candidate) return '/api';
	return candidate.endsWith('/') ? candidate.slice(0, -1) : candidate;
};

export const getApiBaseUrl = (): string => {
	const envBase = (import.meta as any).env?.VITE_API_URL as string | undefined;
	return normalizeBaseUrl(envBase);
};

export const buildApiUrl = (path: string): string => {
	const base = getApiBaseUrl();
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${base}${normalizedPath}`;
};
