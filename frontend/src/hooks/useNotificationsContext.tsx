import { createContext, useCallback, useContext, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { usePolledResource } from '@/hooks/usePolledResource';
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

	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);

	const fetchNotifications = useCallback(async (): Promise<BackendNotificationsResponse | null> => {
		if (!token) return null;
		try {
			const res = await fetchWithAuth('/users/notifications', token);
			if (!res.ok) return null;
			return (await res.json()) as BackendNotificationsResponse;
		} catch {
			return null;
		}
	}, [token]);

	const applyNotifications = useCallback((data: BackendNotificationsResponse) => {
		setNotifications(data.items.map(mapNotificationToUI));
		setUnreadCount(data.unread_count);
	}, []);

	// Initial load + fallback reconciliation poll, exactly like useFriendContext's pending requests.
	const { refetch: refetchNotifications } = usePolledResource<BackendNotificationsResponse>({
		enabled: !!token,
		fetcher: fetchNotifications,
		onData: applyNotifications,
		onDisabled: () => { setNotifications([]); setUnreadCount(0); },
		intervalMs: NOTIFICATIONS_POLL_INTERVAL_MS,
	});

	// Real-time: 'notification:new' only pings us to refetch (same pattern as
	// chat:new-message → syncUnreadChats), it doesn't carry the full list.
	useSocketEvent('notification:new', () => { void refetchNotifications(); });

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
