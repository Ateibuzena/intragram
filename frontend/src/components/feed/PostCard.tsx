import './PostCard.css';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { usePost } from '@/hooks/usePost';
import { useAuth } from '@/hooks/useAuth';
import { buildApiUrl } from '@/utils/apiBase';
import type { PostCardProps } from '@/types/props';

export const PostCard = ({ post }: PostCardProps) => {
	const { token } = useAuth();
	const { liked, likes, saved, animatingLike, animatingSave, handleLike, handleSave } = usePost(post.liked, post.likes, post.saved ?? false);

	const toggleFavorite = async () => {
		if (!token) {
			handleSave();
			return;
		}
		try {
			await fetch(buildApiUrl(`/users/feed/favorites/${post.id}`), {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
		} catch {
			// En caso de error de red, solo dejamos la animación local.
		} finally {
			handleSave();
		}
	};

	return (
		<article className="post-card">
			<div className="flex items-center space-x-3 mb-4">
				<Avatar login={post.user.login} imageUrl={post.user.avatarUrl} size="md" />
				<div className="flex-1 min-w-0">
					<p className="text-sm font-semibold text-white truncate">
						{post.user.login}
						<span className="ml-2"><Badge variant="level">Lvl {post.user.level}</Badge></span>
					</p>
					<p className="text-xs text-ft-muted">{post.time}</p>
				</div>
				<button className="text-ft-muted hover:text-white transition-colors p-1 flex-shrink-0">
					<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
					</svg>
				</button>
			</div>

			<p className="text-sm text-ft-text leading-relaxed mb-4">{post.content}</p>

			<div className="flex items-center gap-3 pt-3 border-t border-ft-border">
				<button
					onClick={handleLike}
					className={`post-action-btn ${liked ? 'post-action-btn--like-active' : 'post-action-btn--like-default'}`}
				>
					<svg className={`w-3.5 h-3.5 ${liked ? 'fill-red-400' : ''} ${animatingLike ? 'animate-heartbeat' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
					</svg>
					<span>{likes}</span>
				</button>

				<button className="post-action-btn post-action-btn--comment">
					<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
					<span>{post.comments}</span>
				</button>

				<button
					onClick={() => { void toggleFavorite(); }}
					className={`post-action-btn ml-auto ${saved ? 'post-action-btn--save-active' : 'post-action-btn--save-default'}`}
				>
					<svg className={`w-3.5 h-3.5 ${saved ? 'fill-ft-cyan' : ''} ${animatingSave ? 'animate-heartbeat' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
					</svg>
					<span className="hidden sm:inline">{saved ? 'Guardado' : 'Guardar'}</span>
				</button>

				<button className="post-action-btn post-action-btn--share">
					<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
					</svg>
					<span className="hidden sm:inline">Compartir</span>
				</button>
			</div>
		</article>
	);
};
