import { MOCK_POSTS } from '@/constants/mockData';
import type { FilterKey } from '@/types/models';
import { CreatePost } from './CreatePost';
import { PostCard } from './PostCard';
import { PostSkeleton } from './PostSkeleton';

interface FeedProps {
	activeFilter: FilterKey;
	loading?: boolean;
}

const FRIENDS_LOGINS = ['mruiz', 'agarcia', 'csmith', 'dperez'];

const filterPosts = (filter: FilterKey) => {
	switch (filter) {
		case 'perfil': return MOCK_POSTS.filter((p) => p.user.login === 'petazz');
		case 'amigos': return MOCK_POSTS.filter((p) => FRIENDS_LOGINS.includes(p.user.login));
		case 'seguidos': return MOCK_POSTS.filter((p) => p.user.level >= 10);
		default: return MOCK_POSTS;
	}
};

export const Feed = ({ activeFilter, loading = false }: FeedProps) => {
	const posts = filterPosts(activeFilter);

	return (
		<div>
			<CreatePost />
			{loading
				? Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
				: posts.map((post, i) => (
					<div key={post.id} className={`animate-fade-in-up-delay-${Math.min(i + 1, 3)}`}>
						<PostCard post={post} />
					</div>
				))
			}
		</div>
	);
};
