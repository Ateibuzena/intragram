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
	saved_by_current_user?: boolean;
	liked_by_current_user?: boolean;
	/** Relative API path to fetch the post's image, or null if it has none. */
	image_url?: string | null;
}

export interface IPostComment {
	id: string;
	post_id: string;
	content: string;
	created_at: string;
	author: IFeedPostAuthorSummary;
	/** Only set on the addComment response, to notify the post's author. */
	post_author_id?: string;
	/** Only set on the addComment response, to broadcast the post's new total. */
	comments_count?: number;
}
