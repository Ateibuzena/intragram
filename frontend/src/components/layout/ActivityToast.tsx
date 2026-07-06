import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { FriendRequestPayload, NotificationPushPayload } from '@intragram/shared/realtime';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { ROUTES } from '@/constants/routes';

interface ToastData {
	id: string;
	title: string;
	message: string;
}

const TOAST_DURATION_MS = 4000;

const NOTIFICATION_TITLES: Record<NotificationPushPayload['type'], string> = {
	like: 'Nuevo like',
	comment: 'Nuevo comentario',
	post: 'Nueva publicación',
};

/**
 * Single global "something happened" toast — friend requests, likes/comments
 * on your posts, and new posts from friends. Mounted once at the app root
 * (not scoped to a single page) so it's visible from anywhere, unlike the
 * previous friend-request-only toast that only rendered inside FriendsSidebar
 * (and therefore only showed up on the home page).
 */
export const ActivityToast = () => {
	const navigate = useNavigate();
	const [queue, setQueue] = useState<ToastData[]>([]);

	const current = queue[0] ?? null;
	const pushToast = (toast: ToastData) => setQueue((q) => [...q, toast]);

	useEffect(() => {
		if (!current) return;
		const timer = setTimeout(() => setQueue((q) => q.slice(1)), TOAST_DURATION_MS);
		return () => clearTimeout(timer);
	}, [current?.id]);

	useSocketEvent('friend:request', (payload: FriendRequestPayload) => {
		pushToast({
			id: `friend-${payload.from.id}-${Date.now()}`,
			title: 'Nueva solicitud de amistad',
			message: `${payload.from.display_name || payload.from.login} quiere ser tu amigo`,
		});
	});

	useSocketEvent('notification:new', (payload: NotificationPushPayload) => {
		const name = payload.actor.display_name || payload.actor.login;
		const message =
			payload.type === 'like' ? `${name} le dio like a tu publicación` :
			payload.type === 'comment' ? `${name} comentó: "${payload.comment_preview ?? ''}"` :
			`${name} ha publicado algo nuevo`;
		pushToast({
			id: `notif-${payload.post_id}-${payload.actor.id}-${Date.now()}`,
			title: NOTIFICATION_TITLES[payload.type],
			message,
		});
	});

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
