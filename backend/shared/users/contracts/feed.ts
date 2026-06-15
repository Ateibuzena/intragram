import type { IUserProfile } from './user-profile';

export interface IFeedPostAuthorSummary {
	id: string;
	login: string;
	display_name: string | null;
	avatar_url: string | null;
	correction_point: number;
	last_login_at: string | null;
}

export type FeedVisibility = 'public' | 'friends' | 'private';

export interface IFeedPost {
	id: string;
	content: string;
	visibility: FeedVisibility;
	likes_count: number;
	comments_count: number;
	created_at: string;
	updated_at: string;
	author: IFeedPostAuthorSummary;
	/**
	 * Indicates whether the authenticated user has saved this post as a favourite.
	 * Optional to maintain compatibility with feeds that do not depend on the user.
	 */
	saved_by_current_user?: boolean;
	/**
	 * Indicates whether the authenticated user has liked this post.
	 */
	liked_by_current_user?: boolean;
}
