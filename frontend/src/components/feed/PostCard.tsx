import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PostCard.css';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { usePost } from '@/hooks/usePost';
import { useAuth } from '@/hooks/useAuth';
import { buildApiUrl } from '@/utils/apiBase';
import { renderContent } from '@/utils/renderContent';
import { usePresenceStatus } from '@/hooks/usePresenceContext';
import type { PostCardProps } from '@/types/props';
import type { PostComment } from '@/types/models';

export const PostCard = ({ post, onDelete }: PostCardProps) => {
	const { token, profile } = useAuth();
	const navigate = useNavigate();
	const { presenceMap } = usePresenceStatus();
	const { liked, likes, saved, animatingLike, animatingSave, handleLike, handleSave } = usePost(post.liked, post.likes, post.saved ?? false);

	const [showComments, setShowComments] = useState(false);
	const [comments, setComments] = useState<PostComment[]>([]);
	const [commentsLoaded, setCommentsLoaded] = useState(false);
	const [newComment, setNewComment] = useState('');
	const commentsCount = commentsLoaded ? comments.length : post.comments;
	const [submitting, setSubmitting] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const isAuthor = !!profile?.login && profile.login === post.user.login;

	useEffect(() => {
		if (!menuOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [menuOpen]);

	const toggleLike = async () => {
		if (!token) {
			handleLike();
			return;
		}
		try {
			await fetch(buildApiUrl(`/users/feed/like/${post.id}`), {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
			});
		} catch {
			// On network error keep the optimistic local toggle.
		} finally {
			handleLike();
		}
	};

	const toggleFavorite = async () => {
		if (!token) {
			handleSave();
			return;
		}
		try {
			await fetch(buildApiUrl(`/users/feed/favorites/${post.id}`), {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
			});
		} catch {
			// On network error keep the local animation only.
		} finally {
			handleSave();
		}
	};

	const loadComments = async () => {
		if (commentsLoaded || !token) return;
		try {
			const res = await fetch(buildApiUrl(`/users/feed/post/${post.id}/comments`), {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = (await res.json()) as PostComment[];
				setComments(data);
				setCommentsLoaded(true);
			}
		} catch {
			// Silently fail — comments will be empty.
		}
	};

	const toggleComments = () => {
		if (!showComments) void loadComments();
		setShowComments((v) => !v);
	};

	const submitComment = async (e: { preventDefault(): void }) => {
		e.preventDefault();
		const content = newComment.trim();
		if (!content || !token || submitting) return;
		setSubmitting(true);
		try {
			const res = await fetch(buildApiUrl(`/users/feed/post/${post.id}/comments`), {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({ content }),
			});
			if (res.ok) {
				const comment = (await res.json()) as PostComment;
				setComments((prev) => [...prev, comment]);
				setNewComment('');
			}
		} catch {
			// Silently ignore network errors.
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeletePost = async () => {
		if (!token) return;
		setMenuOpen(false);
		try {
			const res = await fetch(buildApiUrl(`/users/feed/post/${post.id}`), {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) onDelete?.(post.id);
		} catch {
			// ignore
		}
	};

	const deleteComment = async (commentId: string) => {
		if (!token) return;
		try {
			const res = await fetch(buildApiUrl(`/users/feed/post/${post.id}/comments/${commentId}`), {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				setComments((prev: PostComment[]) => prev.filter((c: PostComment) => c.id !== commentId));
			}
		} catch {
			// Silently ignore network errors.
		}
	};

	return (
		<article className="post-card">
			<div className="flex items-center space-x-3 mb-4">
				<button
					type="button"
					onClick={() => navigate(`/profile/${post.user.login}`)}
					className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
				>
					<Avatar login={post.user.login} imageUrl={post.user.avatarUrl} size="md" online={post.user.active} />
					<div className="flex-1 min-w-0">
						<p className="text-sm font-semibold text-white truncate">
							{post.user.login}
							<span className="ml-2"><Badge variant="level">Lvl {post.user.level}</Badge></span>
						</p>
						<p className="text-xs text-ft-muted">{post.time}</p>
					</div>
				</button>
				{isAuthor && (
					<div className="relative flex-shrink-0" ref={menuRef}>
						<button
							onClick={() => setMenuOpen((v) => !v)}
							className="text-ft-muted hover:text-white transition-colors p-1"
						>
							<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
							</svg>
						</button>
						{menuOpen && (
							<div className="absolute right-0 top-7 z-10 bg-ft-card border border-ft-border rounded-xl shadow-lg overflow-hidden w-44">
								<button
									type="button"
									onClick={() => void handleDeletePost()}
									className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left"
								>
									<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
									Eliminar publicación
								</button>
							</div>
						)}
					</div>
				)}
			</div>

			<div className="text-sm text-ft-text leading-relaxed mb-4">{renderContent(post.content)}</div>

			<div className="flex items-center gap-3 pt-3 border-t border-ft-border">
				<button
					onClick={() => { void toggleLike(); }}
					className={`post-action-btn ${liked ? 'post-action-btn--like-active' : 'post-action-btn--like-default'}`}
				>
					<svg className={`w-3.5 h-3.5 ${liked ? 'fill-red-400' : ''} ${animatingLike ? 'animate-heartbeat' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
					</svg>
					<span>{likes}</span>
				</button>

				<button
					onClick={toggleComments}
					className={`post-action-btn ${showComments ? 'post-action-btn--save-active' : 'post-action-btn--comment'}`}
				>
					<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
					<span>{commentsCount}</span>
				</button>

				<button
					onClick={() => { void toggleFavorite(); }}
					className={`post-action-btn ml-auto ${saved ? 'post-action-btn--save-active' : 'post-action-btn--save-default'}`}
				>
					<svg className={`w-3.5 h-3.5 ${saved ? 'fill-ft-cyan' : ''} ${animatingSave ? 'animate-heartbeat' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
					</svg>
				</button>
			</div>

			{showComments && (
				<div className="mt-4 pt-4 border-t border-ft-border space-y-3">
					{comments.length === 0 && commentsLoaded && (
						<p className="text-xs text-ft-muted text-center py-2">No hay comentarios aún. ¡Sé el primero!</p>
					)}

					{comments.map((comment) => (
						<div key={comment.id} className="flex gap-2.5 group">
							<button
								type="button"
								onClick={() => navigate(`/profile/${comment.author.login}`)}
								className="flex-shrink-0 hover:opacity-80 transition-opacity"
							>
								<Avatar login={comment.author.login} imageUrl={comment.author.avatar_url} size="sm" online={presenceMap[comment.author.id] ?? comment.author.active} />
							</button>
							<div className="flex-1 min-w-0">
								<div className="bg-ft-hover rounded-xl px-3 py-2">
									<button
										type="button"
										onClick={() => navigate(`/profile/${comment.author.login}`)}
										className="text-xs font-semibold text-white mb-0.5 hover:text-ft-cyan transition-colors"
									>
										{comment.author.login}
									</button>
									<p className="text-xs text-ft-text leading-relaxed">{comment.content}</p>
								</div>
								<div className="flex items-center gap-2 mt-1 px-1">
									<span className="text-[10px] text-ft-muted">
										{new Date(comment.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
									</span>
									{profile?.id === comment.author.id && (
										<button
											onClick={() => void deleteComment(comment.id)}
											className="text-[10px] text-ft-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
										>
											Eliminar
										</button>
									)}
								</div>
							</div>
						</div>
					))}

					<form onSubmit={(e: SubmitEvent) => { void submitComment(e); }} className="flex gap-2 pt-1">
						<Avatar login={profile?.login ?? '?'} imageUrl={profile?.avatar_url ?? null} size="sm" />
						<div className="flex-1 flex gap-2">
							<input
								type="text"
								value={newComment}
								onChange={(e: Event) => setNewComment((e.target as HTMLInputElement).value)}
								placeholder="Escribe un comentario..."
								maxLength={500}
								className="flex-1 bg-ft-hover border border-ft-border rounded-xl px-3 py-1.5 text-xs text-ft-text placeholder-ft-muted focus:outline-none focus:border-ft-cyan/50 transition-colors"
							/>
							<button
								type="submit"
								disabled={!newComment.trim() || submitting}
								className="px-3 py-1.5 bg-ft-cyan/10 text-ft-cyan border border-ft-cyan/30 rounded-xl text-xs font-medium hover:bg-ft-cyan/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
							>
								{submitting ? '...' : 'Enviar'}
							</button>
						</div>
					</form>
				</div>
			)}
		</article>
	);
};
