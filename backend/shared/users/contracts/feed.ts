export interface IFeedPostAuthorSummary {
	id: string;
	login: string;
	display_name: string | null;
	avatar_url: string | null;
	correction_point: number;
	campus: string | null;
	campus_country?: string | null;
	level?: number | null;
	cursus_grade?: string | null;
	common_projects_count?: number;
	common_projects?: string[];
	last_login_at: string | null;
	active: boolean;
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

export interface IPostComment {
	id: string;
	post_id: string;
	content: string;
	created_at: string;
	author: IFeedPostAuthorSummary;
}
