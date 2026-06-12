import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IFeedPost } from '@intragram/shared/users';
import type { FilterKey, Post } from '@/types/models';
import { buildApiUrl } from '@/utils/apiBase';
import { formatTime } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { CreatePost } from './CreatePost';
import { PostCard } from './PostCard';
import { PostSkeleton } from './PostSkeleton';

interface FeedProps {
	activeFilter: FilterKey;
	currentLogin?: string;
	loading?: boolean;
}

const mapApiPostToPost = (api: IFeedPost): Post => ({
	id: api.id,
	user: {
		login: api.author?.login ?? 'desconocido',
		level: api.author?.correction_point ?? 0,
		avatarUrl: api.author?.avatar_url ?? null,
	},
	content: api.content ?? '',
	time: formatTime(api.created_at),
	likes: api.likes_count ?? 0,
	comments: api.comments_count ?? 0,
	liked: false,
	saved: api.saved_by_current_user ?? false,
});

export const Feed = ({ activeFilter, currentLogin, loading = false }: FeedProps) => {
	const { token, logout } = useAuth();
	const [items, setItems] = useState<Post[]>([]);
	const [loadingFeed, setLoadingFeed] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		if (!token) return;

		const controller = new AbortController();
		const fetchFeed = async () => {
			try {
				setLoadingFeed(true);
				setError(null);
				let path = '/users/feed'; // "Reciente": propias + amigos
				if (activeFilter === 'perfil') {
					path = '/users/feed/me'; // "Mis publicaciones"
				} else if (activeFilter === 'amigos') {
					path = '/users/feed/friends'; // Solo amigos
				} else if (activeFilter === 'favoritos') {
					path = '/users/feed/favorites'; // Posts guardados por el usuario
				} else if (activeFilter === 'trending') {
					path = '/users/feed/trending'; // Tendencias: otros usuarios, ordenado por popularidad
				}

				const res = await fetch(buildApiUrl(path), {
					headers: {
						Authorization: `Bearer ${token}`,
					},
					signal: controller.signal,
				});
				if (!res.ok) {
					const message = await res.text().catch(() => '');
					console.error('Error al cargar el feed', res.status, message);
					setItems([]);
					if (res.status === 401) {
						// Token expirado o no válido: forzamos cierre de sesión y redirección a login.
						logout();
						navigate(ROUTES.LOGIN + '?reason=expired');
						return;
					}
					setError('No se pudo cargar el feed. Inténtalo de nuevo más tarde.');
					return;
				}
				const data: IFeedPost[] = await res.json();
				setItems(data.map(mapApiPostToPost));
			} catch (err: unknown) {
				// Ignoramos abortos provocados por el ciclo de montaje/desmontaje de React
				// (por ejemplo en modo Strict) para no mostrarlos como errores de red.
				if ((err as any)?.name === 'AbortError') {
					console.debug('Carga de feed abortada antes de completarse (no es un error real)');
					return;
				}
				console.error('Error de red al cargar el feed', err);
				setItems([]);
				setError('No se pudo cargar el feed por un problema de red.');
			} finally {
				setLoadingFeed(false);
			}
		};

		fetchFeed();
		return () => controller.abort();
	}, [token, activeFilter, refreshKey]);

	const posts = useMemo(() => {
		if (activeFilter === 'perfil' && currentLogin) {
			return items.filter(p => p.user.login === currentLogin);
		}
		return items;
	}, [items, activeFilter, currentLogin]);

	return (
		<div>
			<CreatePost onPostCreated={() => setRefreshKey((v) => v + 1)} />
			{error && !loading && !loadingFeed && (
				<p className="mb-3 text-xs text-red-400">
					{error}
				</p>
			)}
			{loading || loadingFeed
				? Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
				: posts.map((post, i) => (
					<div key={post.id} className={`animate-fade-in-up-delay-${Math.min(i + 1, 3)}`}>
						<PostCard post={post} />
					</div>
				))
			}
		</div>
	);
};
