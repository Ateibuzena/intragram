import { useEffect, useMemo, useState } from 'react';
import type { IFeedPost } from '@intragram/shared/users';
import type { Post } from '@/types/models';
import { buildApiUrl } from '@/utils/apiBase';
import { formatTime } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';

const mapApiPostToPost = (api: IFeedPost): Post => ({
	id: api.id,
	user: {
		login: api.author?.login ?? 'desconocido',
		level: api.author?.correction_point ?? 0,
	},
	content: api.content ?? '',
	time: formatTime(api.created_at),
	likes: api.likes_count ?? 0,
	comments: api.comments_count ?? 0,
	liked: false,
	saved: api.saved_by_current_user ?? false,
});

interface UseProfilePostsReturn {
	posts: Post[];
	loading: boolean;
	error: string | null;
}

/**
 * Custom hook to fetch and filter posts for a specific user profile
 * @param username - The username to filter posts by
 * @returns Object containing filtered posts, loading state, and error state
 */
export const useProfilePosts = (username: string | null | undefined): UseProfilePostsReturn => {
	const { token } = useAuth();
	const [items, setItems] = useState<Post[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch posts from API
	useEffect(() => {
		if (!token || !username) return;

		const controller = new AbortController();

		const fetchUserPosts = async () => {
			try {
				setLoading(true);
				setError(null);

				const res = await fetch(buildApiUrl('/users/feed'), {
					headers: {
						Authorization: `Bearer ${token}`,
					},
					signal: controller.signal,
				});

				if (!res.ok) {
					const message = await res.text().catch(() => '');
					console.error('Error al cargar las publicaciones', res.status, message);
					setItems([]);
					setError('No se pudieron cargar las publicaciones.');
					return;
				}

				const data: IFeedPost[] = await res.json();
				setItems(data.map(mapApiPostToPost));
			} catch (err: unknown) {
				if ((err as any)?.name === 'AbortError') {
					console.debug('Carga de publicaciones abortada');
					return;
				}
				console.error('Error de red al cargar publicaciones', err);
				setItems([]);
				setError('No se pudieron cargar las publicaciones por un problema de red.');
			} finally {
				setLoading(false);
			}
		};

		fetchUserPosts();
		return () => controller.abort();
	}, [token, username]);

	// Filter posts by username
	const posts = useMemo(() => {
		return items.filter(p => p.user.login === username);
	}, [items, username]);

	return { posts, loading, error };
};
