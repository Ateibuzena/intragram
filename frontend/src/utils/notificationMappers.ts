import type { NotificationItem, NotificationKind } from '@/types/notifications';

export interface BackendNotification {
	id: string;
	type: NotificationKind;
	post_id: string;
	comment_preview: string | null;
	read: boolean;
	created_at: string;
	actor: {
		id: string;
		login: string;
		display_name: string | null;
		avatar_url: string | null;
	};
}

export interface BackendNotificationsResponse {
	items: BackendNotification[];
	unread_count: number;
}

export const mapNotificationToUI = (notification: BackendNotification): NotificationItem => ({
	id: notification.id,
	type: notification.type,
	postId: notification.post_id,
	commentPreview: notification.comment_preview,
	read: notification.read,
	createdAt: notification.created_at,
	actor: {
		id: notification.actor.id,
		login: notification.actor.login,
		displayName: notification.actor.display_name,
		avatarUrl: notification.actor.avatar_url,
	},
});
