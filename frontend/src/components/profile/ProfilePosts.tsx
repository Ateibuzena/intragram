import { PostCard } from '@/components/feed/PostCard';
import { PostSkeleton } from '@/components/feed/PostSkeleton';
import { useProfilePosts } from './useProfilePosts';

interface ProfilePostsProps {
	username: string | null | undefined;
}

/**
 * Component to display user's posts on their profile page
 * Fetches, filters, and renders posts specific to the given username
 */
export const ProfilePosts = ({ username }: ProfilePostsProps) => {
	const { posts, loading, error } = useProfilePosts(username);

	return (
		<div>
			{error && !loading && (
				<p className="mb-3 text-xs text-red-400">
					{error}
				</p>
			)}
			{loading
				? Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
				: posts.length === 0
				? (
					<div className="surface-glass border border-ft-border rounded-2xl p-5 text-center">
						<p className="text-sm text-ft-muted">Aun no hay publicaciones de @{username}.</p>
					</div>
				)
				: posts.map((post, i) => (
					<div key={post.id} className={`animate-fade-in-up-delay-${Math.min(i + 1, 3)}`}>
						<PostCard post={post} />
					</div>
				))
			}
		</div>
	);
};
