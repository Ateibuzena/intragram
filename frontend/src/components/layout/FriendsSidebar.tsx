import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useAuth } from '@/hooks/useAuth';
import { usePresenceStatus } from '@/hooks/usePresenceContext';
import { useFriendContext, type FriendRelation } from '@/hooks/useFriendContext';
import { useNotificationsContext } from '@/hooks/useNotificationsContext';
import { mapApiPostToPost } from '@/utils/postMappers';
import { formatTime } from '@/utils/formatters';
import { PostDetailModal } from '@/components/feed/PostDetailModal';
import type { Post } from '@/types/feed';

type CommunityFilter = 'all' | 'online' | 'campus_location' | 'requests' | 'notifications';

type DirectoryEntry = {
	id: string;
	login: string;
	display_name?: string | null;
	avatar_url?: string | null;
	campus?: string | null;
	campus_country?: string | null;
	campus_city?: string | null;
	active?: boolean;
	location?: string | null;
	relation: FriendRelation;
};


const PILL_COLORS = {
	cyan:   { active: 'border-ft-cyan/30 bg-ft-cyan/10 text-ft-cyan',         inactive: 'border-ft-border bg-ft-hover/40 text-ft-text hover:border-ft-cyan/20 hover:text-white' },
	green:  { active: 'border-green-400/40 bg-green-500/15 text-green-300',    inactive: 'border-green-400/30 bg-green-500/10 text-green-300 hover:bg-green-500/15' },
	violet: { active: 'border-violet-400/40 bg-violet-500/15 text-violet-200', inactive: 'border-violet-400/20 bg-violet-500/5 text-violet-300 hover:bg-violet-500/15' },
	rose:   { active: 'border-rose-400/40 bg-rose-500/15 text-rose-300',       inactive: 'border-rose-400/20 bg-rose-500/5 text-rose-300 hover:bg-rose-500/15' },
	amber:  { active: 'border-amber-400/40 bg-amber-500/15 text-amber-300',    inactive: 'border-amber-400/20 bg-amber-500/5 text-amber-300 hover:bg-amber-500/15' },
} as const;

type PillColor = keyof typeof PILL_COLORS;

const FilterPill = ({ count, active, color, title, onClick }: {
	count: number;
	active: boolean;
	color: PillColor;
	title: string;
	onClick: () => void;
}) => (
	<button
		type="button"
		onClick={onClick}
		title={title}
		className={`rounded-full border px-2 py-1 text-[10px] font-semibold transition-colors ${active ? PILL_COLORS[color].active : PILL_COLORS[color].inactive}`}
	>
		{count}
	</button>
);

interface FriendsSidebarProps {
	embedded?: boolean;
}

export const FriendsSidebar = ({ embedded = false }: FriendsSidebarProps) => {
	const { token, profile } = useAuth();
	const navigate = useNavigate();
	const { presenceMap } = usePresenceStatus();
	const { pendingReceived, getRelation, seedRelations, sendRequest, acceptRequest, rejectRequest, removeFriend } =
		useFriendContext();
	const { notifications, unreadCount: unreadNotifications, markAllRead } = useNotificationsContext();

	const [entries, setEntries] = useState<DirectoryEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState<Set<string>>(new Set());
	const [filter, setFilter] = useState<CommunityFilter>('all');
	const [openedPost, setOpenedPost] = useState<Post | null>(null);
	const [openingPostId, setOpeningPostId] = useState<string | null>(null);

	const handleOpenNotification = async (postId: string) => {
		if (!token || openingPostId) return;
		setOpeningPostId(postId);
		try {
			const res = await fetchWithAuth(`/posts/feed/post/${postId}`, token);
			if (res.ok) setOpenedPost(mapApiPostToPost(await res.json()));
		} finally {
			setOpeningPostId(null);
		}
	};

	const handleSelectNotifications = () => {
		setFilter('notifications');
		if (unreadNotifications > 0) void markAllRead();
	};

	const fetchDirectory = useCallback(async () => {
		if (!token) return;
		setLoading(true);
		try {
			const res = await fetchWithAuth('/users/directory', token);
			if (!res.ok) return;
			const data: DirectoryEntry[] = await res.json();
			setEntries(data);
			seedRelations(data.map(({ id, relation }) => ({ id, relation })));
		} catch {
			// ignore
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => { void fetchDirectory(); }, [fetchDirectory]);

	// ── Processing set helpers ─────────────────────────────────────────────────

	const setProcessingId = (id: string, active: boolean) =>
		setProcessing((prev: Set<string>) => {
			const next = new Set(prev);
			if (active) next.add(id); else next.delete(id);
			return next;
		});

	// ── Action wrappers ────────────────────────────────────────────────────────

	const handleAdd = async (id: string, login: string) => {
		if (processing.has(id)) return;
		setProcessingId(id, true);
		try { await sendRequest(id, login); }
		finally { setProcessingId(id, false); }
	};

	const handleAccept = async (id: string) => {
		if (processing.has(id)) return;
		setProcessingId(id, true);
		try { await acceptRequest(id); }
		finally { setProcessingId(id, false); }
	};

	const handleReject = async (id: string) => {
		if (processing.has(id)) return;
		setProcessingId(id, true);
		try { await rejectRequest(id); }
		finally { setProcessingId(id, false); }
	};

	const handleRemove = async (id: string) => {
		if (processing.has(id)) return;
		setProcessingId(id, true);
		try { await removeFriend(id); }
		finally { setProcessingId(id, false); }
	};

	// ── Derived values ─────────────────────────────────────────────────────────

	const directoryEntries = profile
		? entries.filter((entry) => entry.id !== profile.id)
		: entries;

	const isEntryOnline = (entry: DirectoryEntry) =>
		presenceMap[entry.id] ?? entry.active ?? false;

	const myCampus = profile?.campus ?? null;
	const isCampusLocation = (entry: DirectoryEntry) =>
		!!entry.location && !!myCampus && entry.campus === myCampus;

	const totalUsers = directoryEntries.length;
	const onlineUsers = directoryEntries.filter(isEntryOnline).length;
	const campusLocationUsers = directoryEntries.filter(isCampusLocation).length;
	const visibleEntries =
		filter === 'online' ? directoryEntries.filter(isEntryOnline) :
		filter === 'campus_location' ? directoryEntries.filter(isCampusLocation) :
		directoryEntries;
	const showDirectory = filter !== 'requests' && filter !== 'notifications';
	return (
		<aside className={embedded ? '' : 'border border-ft-border rounded-2xl bg-transparent p-4 mb-4 hover:border-ft-cyan/20 transition-all duration-200'}>
			<div className="mb-4 flex items-start justify-between gap-3">
				<div>
					<h2 className="text-xs font-bold text-ft-muted uppercase tracking-wider">Comunidad</h2>
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					<FilterPill count={totalUsers} active={filter === 'all'} color="cyan" title="Mostrar todos los perfiles" onClick={() => setFilter('all')} />
					<FilterPill count={onlineUsers} active={filter === 'online'} color="green" title="Mostrar perfiles online" onClick={() => setFilter('online')} />
					{myCampus && <FilterPill count={campusLocationUsers} active={filter === 'campus_location'} color="violet" title={`Usuarios de ${myCampus} en campus ahora`} onClick={() => setFilter('campus_location')} />}
					<FilterPill count={pendingReceived.length} active={filter === 'requests'} color="rose" title="Solicitudes de amistad" onClick={() => setFilter('requests')} />
					<FilterPill count={unreadNotifications} active={filter === 'notifications'} color="amber" title="Me gusta y comentarios" onClick={handleSelectNotifications} />
				</div>
			</div>

			{/* ── Vista: solicitudes de amistad ── */}
			{filter === 'requests' && pendingReceived.length === 0 && (
				<div className="rounded-xl border border-dashed border-ft-border px-4 py-5 text-center">
					<p className="text-xs font-semibold text-ft-text">No tienes solicitudes pendientes</p>
				</div>
			)}
			{filter === 'requests' && pendingReceived.length > 0 && (
				<ul className="-mx-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
					{pendingReceived.map((req) => {
						const busy = processing.has(req.id);
						return (
							<li key={req.id} className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-ft-hover">
								<button type="button" onClick={() => navigate(`/profile/${req.login}`)} className="flex-shrink-0 hover:opacity-80 transition-opacity">
									<Avatar login={req.login} imageUrl={req.avatar_url ?? null} size="sm" />
								</button>
								<button type="button" onClick={() => navigate(`/profile/${req.login}`)} className="flex-1 min-w-0 text-left hover:text-ft-cyan transition-colors">
									<p className="text-xs font-medium text-ft-text truncate">{req.login}</p>
								</button>
								<div className="flex gap-1 flex-shrink-0">
									<button type="button" disabled={busy} onClick={() => void handleAccept(req.id)} className="text-[10px] font-semibold px-2 py-1 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors">
										{busy ? '...' : 'Aceptar'}
									</button>
									<button type="button" disabled={busy} onClick={() => void handleReject(req.id)} className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-ft-border text-ft-muted hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/10 disabled:opacity-50 transition-colors">
										{busy ? '...' : 'Ignorar'}
									</button>
								</div>
							</li>
						);
					})}
				</ul>
			)}

			{/* ── Vista: me gusta y comentarios ── */}
			{filter === 'notifications' && notifications.length === 0 && (
				<div className="rounded-xl border border-dashed border-ft-border px-4 py-5 text-center">
					<p className="text-xs font-semibold text-ft-text">No tienes notificaciones todavía</p>
				</div>
			)}
			{filter === 'notifications' && notifications.length > 0 && (
				<ul className="-mx-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
					{notifications.map((n) => (
						<li key={n.id}>
							<button
								type="button"
								disabled={openingPostId === n.postId}
								onClick={() => void handleOpenNotification(n.postId)}
								className={`w-full flex items-start gap-2.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-ft-hover disabled:opacity-50 ${!n.read ? 'bg-amber-500/5' : ''}`}
							>
								<Avatar login={n.actor.login} imageUrl={n.actor.avatarUrl} size="sm" />
								<div className="min-w-0 flex-1">
									<p className="text-xs text-ft-text">
										<span className="font-semibold">{n.actor.displayName || n.actor.login}</span>{' '}
										{n.type === 'like' && <span className="text-ft-muted">le dio like a tu publicación</span>}
										{n.type === 'comment' && <span className="text-ft-muted">comentó: "{n.commentPreview}"</span>}
										{n.type === 'post' && <span className="text-ft-muted">ha publicado algo nuevo</span>}
									</p>
									<p className="mt-0.5 text-[10px] text-ft-muted">{formatTime(n.createdAt)}</p>
								</div>
								<svg
									className={`mt-0.5 h-4 w-4 flex-shrink-0 ${n.type === 'like' ? 'text-rose-400' : 'text-ft-cyan'}`}
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									{n.type === 'like' && (
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
									)}
									{n.type === 'comment' && (
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
									)}
									{n.type === 'post' && (
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									)}
								</svg>
							</button>
						</li>
					))}
				</ul>
			)}

			{/* ── Vista: directorio de comunidad ── */}
			{showDirectory && loading && (
				<div className="space-y-2">
					{Array.from({ length: 3 }, (_, index) => (
						<div key={index} className="flex items-center gap-2.5 rounded-xl px-2 py-2.5">
							<div className="h-8 w-8 rounded-full bg-ft-hover" />
							<div className="min-w-0 flex-1 space-y-1.5">
								<div className="h-2.5 w-24 rounded-full bg-ft-hover" />
								<div className="h-2 w-16 rounded-full bg-ft-hover" />
							</div>
						</div>
					))}
				</div>
			)}
			{showDirectory && !loading && visibleEntries.length === 0 && (
				<div className="rounded-xl border border-dashed border-ft-border px-4 py-5 text-center">
					<div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-ft-border bg-ft-hover/40">
						<svg className="h-5 w-5 text-ft-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m0-4a4 4 0 100-8 4 4 0 000 8zm8 0a4 4 0 100-8 4 4 0 000 8z" />
						</svg>
					</div>
					<p className="text-xs font-semibold text-ft-text">
						{filter === 'online'
						? 'No hay usuarios online'
						: filter === 'campus_location'
							? `Nadie de intragram está en tu campus ahora`
							: 'No hay usuarios disponibles'}
					</p>
				</div>
			)}
			{showDirectory && visibleEntries.length > 0 && (
				<ul className="-mx-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
					{visibleEntries.map((entry) => {
						const rel = getRelation(entry.id);
						const busy = processing.has(entry.id);
						const isOnline = isEntryOnline(entry);
						const campusLabel = [entry.campus_city, entry.campus_country].filter(Boolean).join(', ') || entry.campus;

						return (
							<li key={entry.id} className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-ft-hover">
								<button
									type="button"
									onClick={() => navigate(`/profile/${entry.login}`)}
									className="flex-shrink-0 hover:opacity-80 transition-opacity"
								>
									<Avatar login={entry.login} imageUrl={entry.avatar_url ?? null} size="sm" online={isOnline} />
								</button>

								<div className="flex-1 min-w-0">
									<button
										type="button"
										onClick={() => navigate(`/profile/${entry.login}`)}
										className="text-xs font-medium text-ft-text truncate block text-left hover:text-ft-cyan transition-colors w-full"
									>
										{entry.login}
									</button>
									{entry.campus && (
										<p className="truncate text-[10px] text-ft-muted" title={campusLabel ?? undefined}>
											{entry.campus}
											{campusLabel && campusLabel !== entry.campus ? ` · ${campusLabel}` : ''}
										</p>
									)}
								</div>

								{rel === 'none' && (
									<button
										type="button"
										disabled={busy}
										onClick={() => void handleAdd(entry.id, entry.login)}
										className="flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg border bg-ft-cyan/10 text-ft-cyan border-ft-cyan/30 hover:bg-ft-cyan/20 disabled:opacity-50 transition-colors"
									>
										{busy ? '...' : 'Agregar'}
									</button>
								)}
								{rel === 'pending_sent' && (
									<span className="flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg border border-ft-border text-ft-muted">
										Enviada
									</span>
								)}
								{rel === 'pending_received' && (
									<div className="flex gap-1 flex-shrink-0">
										<button
											type="button"
											disabled={busy}
											onClick={() => void handleAccept(entry.id)}
											className="text-[10px] font-semibold px-2 py-1 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
										>
											{busy ? '...' : 'Aceptar'}
										</button>
										<button
											type="button"
											disabled={busy}
											onClick={() => void handleReject(entry.id)}
											className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-ft-border text-ft-muted hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
										>
											{busy ? '...' : 'Ignorar'}
										</button>
									</div>
								)}
								{rel === 'friends' && (
									<button
										type="button"
										disabled={busy}
										onClick={() => void handleRemove(entry.id)}
										className="flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg border border-ft-border text-ft-muted hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
									>
										{busy ? '...' : 'Eliminar'}
									</button>
								)}
							</li>
						);
					})}
				</ul>
			)}

			{openedPost && (
				<PostDetailModal
					post={openedPost}
					likes={openedPost.likes}
					liked={openedPost.liked}
					initialCommentCount={openedPost.comments}
					onClose={() => setOpenedPost(null)}
					onCommentCountChange={() => {}}
				/>
			)}
		</aside>
	);
};
