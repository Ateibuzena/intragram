import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IFeedPost } from '@intragram/shared/users';
import type { FilterKey, Post } from '@/types/models';
import { buildApiUrl } from '@/utils/apiBase';
import { useAuth } from '@/hooks/useAuth';
import { usePresenceStatus } from '@/hooks/usePresenceContext';

import { ROUTES } from '@/constants/routes';
import { mapApiPostToPost } from '@/utils/postMappers';
import { CreatePost } from './CreatePost';
import { PostCard } from './PostCard';
import { PostSkeleton } from './PostSkeleton';

interface FeedProps {
	activeFilter: FilterKey;
	currentLogin?: string;
	loading?: boolean;
}

export const Feed = ({ activeFilter, currentLogin, loading = false }: FeedProps) => {
	const { token, logout, profile: authProfile } = useAuth();
	const { socketRef, connected } = usePresenceStatus();
	const [items, setItems] = useState<Post[]>([]);
	const [pendingCount, setPendingCount] = useState(0);
	const pendingRef = useRef<Post[]>([]);
	// IDs of posts that arrived via WebSocket — highlighted until published or banner clicked
	const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
	const [loadingFeed, setLoadingFeed] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);
	// IDs to highlight after publish-triggered refresh
	const pendingIdsOnPublishRef = useRef<Set<string>>(new Set());
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const activeFilterRef = useRef(activeFilter);
	const myLoginRef = useRef<string | null>(authProfile?.login ?? null);

	useEffect(() => { activeFilterRef.current = activeFilter; }, [activeFilter]);
	useEffect(() => { myLoginRef.current = authProfile?.login ?? null; }, [authProfile?.login]);

	useEffect(() => {
		if (!token) return;

		// Save pending IDs before clearing so we can highlight them after the refresh
		pendingIdsOnPublishRef.current = new Set(pendingRef.current.map((p) => p.id));
		pendingRef.current = [];
		setPendingCount(0);
		setHighlightedIds(new Set());

		const controller = new AbortController();
		const fetchFeed = async () => {
			try {
				setLoadingFeed(true);
				setError(null);
				let path = '/users/feed';
				if (activeFilter === 'perfil') {
					path = '/users/feed/me';
				} else if (activeFilter === 'amigos') {
					path = '/users/feed/friends';
				} else if (activeFilter === 'favoritos') {
					path = '/users/feed/favorites';
				} else if (activeFilter === 'trending') {
					path = '/users/feed/trending';
				}

				const res = await fetch(buildApiUrl(path), {
					headers: { Authorization: `Bearer ${token}` },
					signal: controller.signal,
				});
				if (!res.ok) {
					const message = await res.text().catch(() => '');
					console.error('Error al cargar el feed', res.status, message);
					setItems([]);
					if (res.status === 401) {
						logout();
						navigate(ROUTES.LOGIN + '?reason=expired');
						return;
					}
					setError('No se pudo cargar el feed. Inténtalo de nuevo más tarde.');
					return;
				}
				const data: IFeedPost[] = await res.json();
				const mapped = data.map(mapApiPostToPost);
				setItems(mapped);
				// Highlight posts that were pending when the user published
				if (pendingIdsOnPublishRef.current.size > 0) {
					const toHighlight = new Set(mapped.filter((p) => pendingIdsOnPublishRef.current.has(p.id)).map((p) => p.id));
					if (toHighlight.size > 0) setHighlightedIds(toHighlight);
					pendingIdsOnPublishRef.current = new Set();
				}
			} catch (err: unknown) {
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

	// Real-time: new post from another user
	useEffect(() => {
		const socket = socketRef.current;
		if (!socket || !connected) return;

		const handler = (newPost: IFeedPost) => {
			// Own posts already appear via CreatePost's onPostCreated refresh
			if (newPost.author?.login === myLoginRef.current) return;
			// Only show banner in feeds where other users' posts appear
			const filter = activeFilterRef.current;
			if (filter === 'perfil' || filter === 'favoritos' || filter === 'trending') return;

			const mapped = mapApiPostToPost(newPost);
			pendingRef.current = [mapped, ...pendingRef.current.filter((p) => p.id !== mapped.id)];
			setPendingCount(pendingRef.current.length);
		};

		socket.on('feed:new-post', handler);
		return () => { socket.off('feed:new-post', handler); };
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [connected]);

	// Clear pending and highlights when filter changes
	useEffect(() => {
		pendingRef.current = [];
		setPendingCount(0);
		setHighlightedIds(new Set());
	}, [activeFilter]);

	const showPending = () => {
		const toAdd = pendingRef.current;
		setItems((prev) => {
			const ids = new Set(prev.map((p) => p.id));
			return [...toAdd.filter((p) => !ids.has(p.id)), ...prev];
		});
		// Mark these posts as highlighted
		setHighlightedIds(new Set(toAdd.map((p) => p.id)));
		pendingRef.current = [];
		setPendingCount(0);
	};

	const posts = useMemo(() => {
		if (activeFilter === 'perfil' && currentLogin) {
			return items.filter(p => p.user.login === currentLogin);
		}
		return items;
	}, [items, activeFilter, currentLogin]);

	return (
		<div>
			<CreatePost onPostCreated={() => setRefreshKey((v) => v + 1)} />
			{pendingCount > 0 && (
				<button
					onClick={showPending}
					className="w-full mb-3 py-2 px-4 rounded-xl bg-ft-cyan/15 border border-ft-cyan/30 text-ft-cyan text-sm font-semibold hover:bg-ft-cyan/25 transition-colors"
				>
					↑ {pendingCount} {pendingCount === 1 ? 'nueva publicación' : 'nuevas publicaciones'}
				</button>
			)}
			{error && !loading && !loadingFeed && (
				<p className="mb-3 text-xs text-red-400">
					{error}
				</p>
			)}
			{loading || loadingFeed
				? Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
				: posts.map((post, i) => (
					<div key={post.id} className={`animate-fade-in-up-delay-${Math.min(i + 1, 3)}`}>
						<PostCard
							post={post}
							isNew={highlightedIds.has(post.id)}
							onDelete={(id) => setItems((prev) => prev.filter((p) => p.id !== id))}
						/>
					</div>
				))
			}
		</div>
	);
};
