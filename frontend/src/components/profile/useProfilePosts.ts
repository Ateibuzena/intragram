import { useEffect, useMemo, useState } from 'react';
import type { IFeedPost } from '@intragram/shared/users/contracts/feed';
import type { Post } from '@/types/models';
import { buildApiUrl } from '@/utils/apiBase';
import { useAuth } from '@/hooks/useAuth';
import { mapApiPostToPost } from '@/utils/postMappers';

interface UseProfilePostsReturn {
	posts: Post[];
	loading: boolean;
	error: string | null;
}

export const useProfilePosts = (username: string | null | undefined): UseProfilePostsReturn => {
	const { token } = useAuth();
	const [items, setItems] = useState<Post[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!token || !username) return;

		const controller = new AbortController();

		const fetchUserPosts = async () => {
			try {
				setLoading(true);
				setError(null);

				const res = await fetch(buildApiUrl('/users/feed'), {
					headers: { Authorization: `Bearer ${token}` },
					signal: controller.signal,
				});

				if (!res.ok) {
					setItems([]);
					setError('No se pudieron cargar las publicaciones.');
					return;
				}

				const data: IFeedPost[] = await res.json();
				setItems(data.map(mapApiPostToPost));
			} catch (err: unknown) {
				if (err instanceof Error && err.name === 'AbortError') return;
				setItems([]);
				setError('No se pudieron cargar las publicaciones por un problema de red.');
			} finally {
				setLoading(false);
			}
		};

		void fetchUserPosts();
		return () => controller.abort();
	}, [token, username]);

	const posts = useMemo(
		() => items.filter((p) => p.user.login === username),
		[items, username],
	);

	return { posts, loading, error };
};
