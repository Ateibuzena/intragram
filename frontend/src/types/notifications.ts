export type NotificationKind = 'like' | 'comment';

export interface NotificationItem {
	id: string;
	type: NotificationKind;
	postId: string;
	commentPreview: string | null;
	read: boolean;
	createdAt: string;
	actor: {
		id: string;
		login: string;
		displayName: string | null;
		avatarUrl: string | null;
	};
}
