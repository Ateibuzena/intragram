import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { buildApiUrl } from '@/utils/apiBase';

export const usePresence = () => {
	const { token } = useAuth();
	const socketRef = useRef<Socket | null>(null);
	const [connected, setConnected] = useState(false);
	const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
	const [unreadChats, setUnreadChats] = useState(0);
	const [unreadRequests, setUnreadRequests] = useState(0);
	// Tracks which conversation is currently open so we don't badge it
	const currentChatRef = useRef<string | null>(null);

	const syncUnreadChats = useCallback(async (): Promise<void> => {
		if (!token) {
			setUnreadChats(0);
			return;
		}
		try {
			const response = await fetch(buildApiUrl('/chat/conversations'), {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!response.ok) return;
			const conversations = await response.json() as Array<{ unread_count?: number }>;
			setUnreadChats(conversations.filter((conversation) => (conversation.unread_count ?? 0) > 0).length);
		} catch {
			// Keep the last known badge count until the next successful synchronization.
		}
	}, [token]);

	// Fetch initial unread counts whenever the user authenticates
	useEffect(() => {
		if (!token) {
			setUnreadChats(0);
			setUnreadRequests(0);
			return;
		}
		let cancelled = false;
		const headers = { Authorization: `Bearer ${token}` };

		void syncUnreadChats();

		fetch(buildApiUrl('/users/friends/pending'), { headers })
			.then((r) => r.ok ? r.json() as Promise<unknown[]> : [])
			.then((reqs) => { if (!cancelled) setUnreadRequests(reqs.length); })
			.catch(() => {});

		return () => { cancelled = true; };
	}, [token, syncUnreadChats]);

	// Poll friend requests every 30 s to keep the badge current
	useEffect(() => {
		if (!token) return;
		const poll = () => {
			fetch(buildApiUrl('/users/friends/pending'), {
				headers: { Authorization: `Bearer ${token}` },
			})
				.then((r) => r.ok ? r.json() as Promise<unknown[]> : [])
				.then((reqs) => setUnreadRequests(reqs.length))
				.catch(() => {});
		};
		const id = setInterval(poll, 30_000);
		return () => clearInterval(id);
	}, [token]);

	useEffect(() => {
		if (!token) {
			socketRef.current?.disconnect();
			socketRef.current = null;
			setConnected(false);
			setPresenceMap({});
			return;
		}

		if (socketRef.current?.connected) return;

		const socket = io(window.location.origin, {
			path: '/api/socket.io',
			auth: { token },
			reconnection: true,
			reconnectionDelay: 5000,
			reconnectionAttempts: 10,
			transports: ['polling', 'websocket'],
		});

		socket.on('connect', () => setConnected(true));
		socket.on('disconnect', () => setConnected(false));
		socket.on('connect_error', () => setConnected(false));

		socket.on('online:users', (userIds: string[]) => {
			const next: Record<string, boolean> = {};
			userIds.forEach((id) => { next[id] = true; });
			setPresenceMap(next);
		});

		socket.on('user:status', ({ userId, active }: { userId: string; active: boolean }) => {
			setPresenceMap((prev) => ({ ...prev, [userId]: active }));
		});

		socket.on('friend:request', () => {
			setUnreadRequests((prev) => prev + 1);
		});

		// Badge only for conversations the user is NOT currently viewing
		socket.on('chat:new-message', ({ conversationId }: { conversationId: string }) => {
			if (conversationId !== currentChatRef.current) {
				void syncUnreadChats();
			} else {
				// User is viewing this chat: keep last_read_at current so polling stays clean
				void fetch(buildApiUrl(`/chat/conversations/${conversationId}/read`), {
					method: 'POST',
					headers: { Authorization: `Bearer ${token}` },
				}).catch(() => {});
			}
		});

		socketRef.current = socket;

		return () => {
			socket.disconnect();
			socketRef.current = null;
			setConnected(false);
			setPresenceMap({});
		};
	}, [token, syncUnreadChats]);

	const emit = (event: string, data: unknown) => {
		socketRef.current?.emit(event, data);
	};

	return { connected, presenceMap, socketRef, emit, unreadChats, setUnreadChats, syncUnreadChats, currentChatRef, unreadRequests, setUnreadRequests };
};
