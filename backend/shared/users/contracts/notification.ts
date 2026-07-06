export type NotificationType = 'like' | 'comment' | 'post';

export interface INotification {
	id: string;
	type: NotificationType;
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

export interface INotificationsResponse {
	items: INotification[];
	unread_count: number;
}
