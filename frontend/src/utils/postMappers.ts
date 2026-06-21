import type { IFeedPost } from '@intragram/shared/users/contracts/feed';
import type { Post } from '@/types/models';
import { formatTime } from '@/utils/formatters';

export const mapApiPostToPost = (api: IFeedPost): Post => ({
	id: api.id,
	user: {
		login: api.author?.login ?? 'desconocido',
		level: api.author?.correction_point ?? 0,
		avatarUrl: api.author?.avatar_url ?? null,
		active: api.author?.active ?? false,
	},
	content: api.content ?? '',
	time: formatTime(api.created_at),
	likes: api.likes_count ?? 0,
	comments: api.comments_count ?? 0,
	liked: api.liked_by_current_user ?? false,
	saved: api.saved_by_current_user ?? false,
});
