import type { User } from './chat';

export type FilterKey = 'reciente' | 'amigos' | 'favoritos' | 'trending' | 'perfil';

export interface Post {
	id: string | number;
	user: Pick<User, 'id' | 'login' | 'level' | 'avatarUrl'> & {
		active?: boolean;
		campus?: string | null;
		campusCountry?: string | null;
		cursusGrade?: string | null;
		commonProjectsCount?: number;
		commonProjects?: string[];
	};
	content: string;
	time: string;
	likes: number;
	comments: number;
	liked: boolean;
	saved?: boolean;
	/** Relative API path to fetch this post's image, or null/undefined if it has none. */
	imageUrl?: string | null;
}

export interface PostComment {
	id: string;
	post_id: string;
	content: string;
	created_at: string;
	author: {
		id: string;
		login: string;
		display_name: string | null;
		avatar_url: string | null;
		active?: boolean;
	};
}
