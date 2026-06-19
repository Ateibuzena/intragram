import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { buildApiUrl } from '@/utils/apiBase';
import { renderContent } from '@/utils/renderContent';
import { useAuth } from '@/hooks/useAuth';
import { usePresenceStatus } from '@/hooks/usePresenceContext';
import type { Post, PostComment } from '@/types/models';

interface PostDetailModalProps {
	post: Post;
	likes: number;
	liked: boolean;
	initialCommentCount: number;
	onClose: () => void;
	onCommentCountChange: (delta: number) => void;
}

export const PostDetailModal = ({
	post,
	likes,
	liked,
	initialCommentCount,
	onClose,
	onCommentCountChange,
}: PostDetailModalProps) => {
	const { token, profile } = useAuth();
	const navigate = useNavigate();
	const { presenceMap } = usePresenceStatus();

	const [comments, setComments] = useState<PostComment[]>([]);
	const [loading, setLoading] = useState(true);
	const [newComment, setNewComment] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const commentsEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!token) return;
		const fetchComments = async () => {
			try {
				const res = await fetch(buildApiUrl(`/users/feed/post/${post.id}/comments`), {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.ok) setComments((await res.json()) as PostComment[]);
			} catch {
				// silently fail
			} finally {
				setLoading(false);
			}
		};
		void fetchComments();
	}, [post.id, token]);

	useEffect(() => {
		commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [comments]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [onClose]);

	const submitComment = async (e: React.FormEvent) => {
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
				onCommentCountChange(1);
			}
		} catch {
			// silently ignore
		} finally {
			setSubmitting(false);
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
				setComments((prev) => prev.filter((c) => c.id !== commentId));
				onCommentCountChange(-1);
			}
		} catch {
			// silently ignore
		}
	};

	const navigateToProfile = (login: string) => {
		onClose();
		navigate(`/profile/${login}`);
	};

	const commentsCount = comments.length || initialCommentCount;

	return createPortal(
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
			onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
		>
			<div className="bg-ft-card border border-ft-border rounded-2xl w-full max-w-xl flex flex-col max-h-[90vh] shadow-2xl">

				{/* Header */}
				<div className="flex items-center justify-between px-5 py-3 border-b border-ft-border flex-shrink-0">
					<h2 className="text-sm font-bold text-white">Publicación</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-ft-muted hover:text-white transition-colors p-1"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Post */}
				<div className="px-5 pt-4 pb-3 flex-shrink-0">
					<button
						type="button"
						onClick={() => navigateToProfile(post.user.login)}
						className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity text-left"
					>
						<Avatar login={post.user.login} imageUrl={post.user.avatarUrl} size="md" online={post.user.active} />
						<div>
							<p className="text-sm font-semibold text-white">{post.user.login}</p>
							<p className="text-xs text-ft-muted">{post.time}</p>
						</div>
					</button>
					<div className="text-sm text-ft-text leading-relaxed">{renderContent(post.content)}</div>
				</div>

				{/* Stats */}
				<div className="px-5 py-2.5 border-t border-ft-border flex items-center gap-4 flex-shrink-0">
					<span className="text-xs text-ft-muted flex items-center gap-1.5">
						<svg className={`w-3.5 h-3.5 ${liked ? 'fill-red-400 text-red-400' : 'text-ft-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
						</svg>
						<span className="font-semibold text-ft-text">{likes}</span> me gusta
					</span>
					<span className="text-xs text-ft-muted flex items-center gap-1.5">
						<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
						<span className="font-semibold text-ft-text">{commentsCount}</span> comentarios
					</span>
				</div>

				{/* Comments scroll */}
				<div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 min-h-0">
					{loading && (
						<p className="text-xs text-ft-muted text-center py-4">Cargando comentarios...</p>
					)}
					{!loading && comments.length === 0 && (
						<p className="text-xs text-ft-muted text-center py-4">
							No hay comentarios aún. ¡Sé el primero!
						</p>
					)}
					{comments.map((comment) => (
						<div key={comment.id} className="flex gap-2.5 group">
							<button
								type="button"
								onClick={() => navigateToProfile(comment.author.login)}
								className="flex-shrink-0 hover:opacity-80 transition-opacity"
							>
								<Avatar
									login={comment.author.login}
									imageUrl={comment.author.avatar_url}
									size="sm"
									online={presenceMap[comment.author.id] ?? comment.author.active}
								/>
							</button>
							<div className="flex-1 min-w-0">
								<div className="bg-ft-hover rounded-xl px-3 py-2">
									<button
										type="button"
										onClick={() => navigateToProfile(comment.author.login)}
										className="text-xs font-semibold text-white mb-0.5 hover:text-ft-cyan transition-colors"
									>
										{comment.author.login}
									</button>
									<p className="text-xs text-ft-text leading-relaxed">{comment.content}</p>
								</div>
								<div className="flex items-center gap-2 mt-1 px-1">
									<span className="text-[10px] text-ft-muted">
										{new Date(comment.created_at).toLocaleString('es-ES', {
											day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
										})}
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
					<div ref={commentsEndRef} />
				</div>

				{/* Comment input */}
				<div className="px-5 py-3 border-t border-ft-border flex-shrink-0">
					<form onSubmit={(e) => { void submitComment(e); }} className="flex gap-2">
						<Avatar login={profile?.login ?? '?'} imageUrl={profile?.avatar_url ?? null} size="sm" />
						<div className="flex-1 flex gap-2">
							<input
								ref={inputRef}
								type="text"
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
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
			</div>
		</div>,
		document.body,
	);
};
