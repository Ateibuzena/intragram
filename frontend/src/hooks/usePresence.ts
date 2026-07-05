import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

export const usePresence = () => {
	const { token } = useAuth();
	const socketRef = useRef<Socket | null>(null);
	const [connected, setConnected] = useState(false);
	const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
	const [unreadChats, setUnreadChats] = useState(0);
	// Tracks which conversation is currently open so we don't badge it
	const currentChatRef = useRef<string | null>(null);

	const syncUnreadChats = useCallback(async (): Promise<void> => {
		if (!token) {
			setUnreadChats(0);
			return;
		}
		try {
			const response = await fetchWithAuth('/chat/conversations', token);
			if (!response.ok) return;
			const conversations = await response.json() as Array<{ unread_count?: number }>;
			setUnreadChats(conversations.filter((conversation) => (conversation.unread_count ?? 0) > 0).length);
		} catch {
			// Keep the last known badge count until the next successful synchronization.
		}
	}, [token]);

	// Fetch initial unread chat count whenever the user authenticates
	useEffect(() => {
		if (!token) {
			setUnreadChats(0);
			return;
		}
		void syncUnreadChats();
	}, [token, syncUnreadChats]);

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

		// Badge only for conversations the user is NOT currently viewing
		socket.on('chat:new-message', ({ conversationId }: { conversationId: string }) => {
			if (conversationId !== currentChatRef.current) {
				void syncUnreadChats();
			} else {
				// User is viewing this chat: keep last_read_at current so polling stays clean
				void fetchWithAuth(`/chat/conversations/${conversationId}/read`, token, { method: 'POST' }).catch(() => {});
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

	return { connected, presenceMap, socketRef, emit, unreadChats, setUnreadChats, syncUnreadChats, currentChatRef };
};
