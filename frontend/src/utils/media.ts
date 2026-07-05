import { buildApiUrl } from './apiBase';

export const resolveMediaUrl = (url: string | null | undefined): string | null => {
	if (!url) return null;
	if (/^https?:\/\//i.test(url)) return url;
	if (url.startsWith('/users/')) return buildApiUrl(url);
	return url;
};