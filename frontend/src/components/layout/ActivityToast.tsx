import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { usePresenceStatus } from '@/hooks/usePresenceContext';
import { useFriendContext } from '@/hooks/useFriendContext';
import { ROUTES } from '@/constants/routes';

interface ToastData {
	id: string;
	title: string;
	message: string;
}

const TOAST_DURATION_MS = 4000;

interface FriendRequestPayload {
	from: { id: string; login: string; display_name: string | null };
}

interface NotificationPayload {
	type: 'like' | 'comment';
	post_id: string;
	comment_preview?: string;
	actor: { id: string; login: string; display_name: string | null };
}

interface NewPostPayload {
	author?: { id: string; login: string; display_name: string | null };
}

/**
 * Single global "something happened" toast — friend requests, likes/comments
 * on your posts, and new posts from friends. Mounted once at the app root
 * (not scoped to a single page) so it's visible from anywhere, unlike the
 * previous friend-request-only toast that only rendered inside FriendsSidebar
 * (and therefore only showed up on the home page).
 */
export const ActivityToast = () => {
	const { socketRef, connected } = usePresenceStatus();
	const { getRelation } = useFriendContext();
	const navigate = useNavigate();
	const [queue, setQueue] = useState<ToastData[]>([]);

	const current = queue[0] ?? null;

	useEffect(() => {
		if (!current) return;
		const timer = setTimeout(() => setQueue((q) => q.slice(1)), TOAST_DURATION_MS);
		return () => clearTimeout(timer);
	}, [current?.id]);

	useEffect(() => {
		if (!connected) return;
		const socket = socketRef.current;
		if (!socket) return;

		const pushToast = (toast: ToastData) => setQueue((q) => [...q, toast]);

		const handleFriendRequest = (payload: FriendRequestPayload) => {
			pushToast({
				id: `friend-${payload.from.id}-${Date.now()}`,
				title: 'Nueva solicitud de amistad',
				message: `${payload.from.display_name || payload.from.login} quiere ser tu amigo`,
			});
		};

		const handleNotification = (payload: NotificationPayload) => {
			const name = payload.actor.display_name || payload.actor.login;
			pushToast({
				id: `notif-${payload.post_id}-${payload.actor.id}-${Date.now()}`,
				title: payload.type === 'like' ? 'Nuevo like' : 'Nuevo comentario',
				message: payload.type === 'like'
					? `${name} le dio like a tu publicación`
					: `${name} comentó: "${payload.comment_preview ?? ''}"`,
			});
		};

		const handleNewPost = (post: NewPostPayload) => {
			const authorId = post.author?.id;
			if (!authorId) return;
			// Only friends — a public post from a stranger would be noisy on a
			// campus-wide feed; the feed's own "N new posts" banner still covers
			// everyone once you're actually looking at it.
			if (getRelation(authorId) !== 'friends') return;
			const name = post.author?.display_name || post.author?.login;
			pushToast({
				id: `post-${authorId}-${Date.now()}`,
				title: 'Nueva publicación',
				message: `${name} ha publicado algo nuevo`,
			});
		};

		socket.on('friend:request', handleFriendRequest);
		socket.on('notification:new', handleNotification);
		socket.on('feed:new-post', handleNewPost);
		return () => {
			socket.off('friend:request', handleFriendRequest);
			socket.off('notification:new', handleNotification);
			socket.off('feed:new-post', handleNewPost);
		};
	}, [connected, socketRef, getRelation]);

	if (!current) return null;

	return createPortal(
		<div className="fixed bottom-4 right-4 z-[1000] flex max-w-sm items-center gap-3 rounded-2xl border border-ft-cyan/30 bg-ft-card px-4 py-3 shadow-lg">
			<div className="min-w-0 flex-1">
				<p className="text-xs font-semibold text-white">{current.title}</p>
				<p className="mt-0.5 truncate text-[10px] text-ft-muted">{current.message}</p>
			</div>
			<button
				type="button"
				onClick={() => { navigate(ROUTES.HOME); setQueue((q) => q.slice(1)); }}
				className="flex-shrink-0 rounded-lg bg-ft-cyan/15 px-2.5 py-1 text-[10px] font-semibold text-ft-cyan border border-ft-cyan/30 transition-colors hover:bg-ft-cyan/25"
			>
				Ver
			</button>
			<button
				type="button"
				onClick={() => setQueue((q) => q.slice(1))}
				className="flex-shrink-0 text-ft-muted transition-colors hover:text-white"
			>
				<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>,
		document.body,
	);
};
