import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePresenceStatus } from '@/hooks/usePresenceContext';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { mapNotificationToUI, type BackendNotificationsResponse } from '@/utils/notificationMappers';
import type { NotificationItem } from '@/types/notifications';

interface NotificationsContextType {
	/** Likes and comments on the current user's posts (friend requests are NOT included here). */
	notifications: NotificationItem[];
	unreadCount: number;
	markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export const useNotificationsContext = (): NotificationsContextType => {
	const ctx = useContext(NotificationsContext);
	if (!ctx) throw new Error('useNotificationsContext must be used within NotificationsProvider');
	return ctx;
};

const NOTIFICATIONS_POLL_INTERVAL_MS = 30_000;

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
	const { token } = useAuth();
	const { socketRef, connected } = usePresenceStatus();

	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);

	const fetchNotifications = useCallback(async () => {
		if (!token) return;
		try {
			const res = await fetchWithAuth('/users/notifications', token);
			if (!res.ok) return;
			const data = (await res.json()) as BackendNotificationsResponse;
			setNotifications(data.items.map(mapNotificationToUI));
			setUnreadCount(data.unread_count);
		} catch {
			// Retain last known state on network error.
		}
	}, [token]);

	// Initial load + fallback poll, exactly like useFriendContext's pending requests.
	useEffect(() => {
		if (!token) {
			setNotifications([]);
			setUnreadCount(0);
			return;
		}
		void fetchNotifications();
		const id = setInterval(() => { void fetchNotifications(); }, NOTIFICATIONS_POLL_INTERVAL_MS);
		return () => clearInterval(id);
	}, [token, fetchNotifications]);

	// Real-time: 'notification:new' only pings us to refetch (same pattern as
	// chat:new-message → syncUnreadChats), it doesn't carry the full list.
	useEffect(() => {
		if (!connected) return;
		const socket = socketRef.current;
		if (!socket) return;
		const handler = () => { void fetchNotifications(); };
		socket.on('notification:new', handler);
		return () => { socket.off('notification:new', handler); };
	}, [connected, socketRef, fetchNotifications]);

	const markAllRead = useCallback(async () => {
		if (!token) return;
		setUnreadCount(0);
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
		try {
			await fetchWithAuth('/users/notifications/read', token, { method: 'POST' });
		} catch {
			// Next poll will reconcile if this failed.
		}
	}, [token]);

	return (
		<NotificationsContext.Provider value={{ notifications, unreadCount, markAllRead }}>
			{children}
		</NotificationsContext.Provider>
	);
};
