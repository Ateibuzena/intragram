import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

/**
 * Fetches an image that requires the session token (e.g. post images, which
 * respect the post's visibility) and exposes it as an object URL an <img>
 * can use — a plain <img src="..."> can't send an Authorization header.
 */
export const useAuthenticatedImage = (path: string | null | undefined): string | null => {
	const { token } = useAuth();
	const [objectUrl, setObjectUrl] = useState<string | null>(null);

	useEffect(() => {
		if (!path || !token) {
			setObjectUrl(null);
			return;
		}

		let cancelled = false;
		let createdUrl: string | null = null;

		const load = async () => {
			try {
				const res = await fetchWithAuth(path, token);
				if (!res.ok || cancelled) return;
				const blob = await res.blob();
				if (cancelled) return;
				createdUrl = URL.createObjectURL(blob);
				setObjectUrl(createdUrl);
			} catch {
				// Leave objectUrl unset — caller just won't render an image.
			}
		};

		void load();
		return () => {
			cancelled = true;
			if (createdUrl) URL.revokeObjectURL(createdUrl);
		};
	}, [path, token]);

	return objectUrl;
};
