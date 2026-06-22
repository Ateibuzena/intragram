import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { buildApiUrl } from '@/utils/apiBase';
import { useAuth } from '@/hooks/useAuth';
import { usePresenceStatus } from '@/hooks/usePresenceContext';

type Relation = 'none' | 'friends' | 'pending_sent' | 'pending_received';
type CommunityFilter = 'all' | 'online' | 'campus' | 'country' | 'projects' | 'level' | 'cursus' | 'achievements';

type DirectoryEntry = {
	id: string;
	login: string;
	display_name?: string | null;
	avatar_url?: string | null;
	campus?: string | null;
	campus_id?: number | null;
	campus_country?: string | null;
	campus_city?: string | null;
	campus_match?: 'campus' | 'country' | 'worldwide';
	common_projects_count?: number;
	common_projects?: string[];
	active?: boolean;
	relation: Relation;
};

export const FriendsSidebar = () => {
	const { token, profile } = useAuth();
	const navigate = useNavigate();
	const { presenceMap } = usePresenceStatus();

	const [entries, setEntries] = useState<DirectoryEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [relOverrides, setRelOverrides] = useState<Record<string, Relation>>({});
	const [processing, setProcessing] = useState<Set<string>>(new Set());
	const [filter, setFilter] = useState<CommunityFilter>('all');

	const fetchDirectory = useCallback(async () => {
		if (!token) return;
		setLoading(true);
		try {
			const mainLevel = profile?.levels?.[0] ?? null;
			const level = typeof mainLevel?.level === 'number' ? mainLevel.level : null;
			const achievement = profile?.achievements?.find((item) => item.tier || item.kind || item.name) ?? null;
			const scopeByFilter: Partial<Record<CommunityFilter, string>> = {
				campus: 'mine',
				country: 'country',
				projects: 'projects',
			};
			const scope = scopeByFilter[filter];
			const params = new URLSearchParams();
			if (scope) params.set('campus_scope', scope);
			if (filter === 'level' && level !== null) {
				const baseLevel = Math.floor(level);
				params.set('min_level', String(baseLevel));
				params.set('max_level', String(baseLevel + 0.999));
			}
			if (filter === 'cursus' && mainLevel) {
				params.set('cursus', mainLevel.slug || mainLevel.name || String(mainLevel.id));
			}
			if (filter === 'achievements' && achievement) {
				params.set('achievement', achievement.tier || achievement.kind || achievement.name);
			}
			const query = params.toString();
			const path = query ? `/users/directory?${query}` : '/users/directory';
			const res = await fetch(buildApiUrl(path), {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) return;
			const data: DirectoryEntry[] = await res.json();
			setEntries(data);
		} catch {
			// ignore
		} finally {
			setLoading(false);
		}
	}, [filter, profile?.achievements, profile?.levels, token]);

	useEffect(() => { void fetchDirectory(); }, [fetchDirectory]);

	const setProcessingId = (id: string, active: boolean) =>
		setProcessing((prev) => {
			const next = new Set(prev);
			if (active) next.add(id); else next.delete(id);
			return next;
		});

	const handleAdd = async (id: string, login: string) => {
		if (processing.has(id)) return;
		setProcessingId(id, true);
		try {
			const res = await fetch(buildApiUrl('/users/friends/me'), {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({ friend_login: login }),
			});
			if (res.ok) {
				const data = await res.json() as { status: 'pending' | 'accepted' };
				setRelOverrides((prev) => ({ ...prev, [id]: data.status === 'accepted' ? 'friends' : 'pending_sent' }));
			}
		} catch { /* ignore */ } finally { setProcessingId(id, false); }
	};

	const handleAccept = async (id: string) => {
		if (processing.has(id)) return;
		setProcessingId(id, true);
		try {
			const res = await fetch(buildApiUrl(`/users/friends/me/${id}/accept`), {
				method: 'PATCH',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) setRelOverrides((prev) => ({ ...prev, [id]: 'friends' }));
		} catch { /* ignore */ } finally { setProcessingId(id, false); }
	};

	const handleRemove = async (id: string) => {
		if (processing.has(id)) return;
		setProcessingId(id, true);
		try {
			const res = await fetch(buildApiUrl(`/users/friends/me/${id}`), {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) setRelOverrides((prev) => ({ ...prev, [id]: 'none' }));
		} catch { /* ignore */ } finally { setProcessingId(id, false); }
	};

	const directoryEntries = profile ? entries.filter((entry) => entry.id !== profile.id) : entries;
	const isEntryOnline = (entry: DirectoryEntry) => presenceMap[entry.id] ?? entry.active ?? false;
	const totalUsers = directoryEntries.length;
	const onlineUsers = directoryEntries.filter(isEntryOnline).length;
	const pendingReceived = directoryEntries.filter((entry) => (relOverrides[entry.id] ?? entry.relation) === 'pending_received').length;
	const visibleEntries = filter === 'online' ? directoryEntries.filter(isEntryOnline) : directoryEntries;
	const buttonBase = 'rounded-full border px-2 py-1 text-[10px] font-semibold transition-colors';

	return (
		<aside className="border border-ft-border rounded-2xl bg-transparent p-4 mb-4 hover:border-ft-cyan/20 transition-all duration-200">
			<div className="mb-4 flex items-start justify-between gap-3">
				<div>
					<h2 className="text-xs font-bold text-ft-muted uppercase tracking-wider">Comunidad</h2>
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					<button
						type="button"
						onClick={() => setFilter('all')}
						className={`${buttonBase} ${
							filter === 'all'
								? 'border-ft-cyan/30 bg-ft-cyan/10 text-ft-cyan'
								: 'border-ft-border bg-ft-hover/40 text-ft-text hover:border-ft-cyan/20 hover:text-white'
						}`}
						title="Mostrar todos los perfiles"
					>
						{totalUsers}
					</button>
					<button
						type="button"
						onClick={() => setFilter('online')}
						className={`${buttonBase} ${
							filter === 'online'
								? 'border-green-400/40 bg-green-500/15 text-green-300'
								: 'border-green-400/30 bg-green-500/10 text-green-300 hover:bg-green-500/15'
						}`}
						title="Mostrar perfiles online"
					>
						{onlineUsers}
					</button>
					<button
						type="button"
						onClick={() => setFilter('campus')}
						className={`${buttonBase} ${
							filter === 'campus'
								? 'border-violet-400/40 bg-violet-500/15 text-violet-200'
								: 'border-ft-border bg-ft-hover/40 text-ft-text hover:border-violet-400/30 hover:text-white'
						}`}
						title="Mostrar perfiles de mi campus"
					>
						Mi campus
					</button>
					<button
						type="button"
						onClick={() => setFilter('country')}
						className={`${buttonBase} ${
							filter === 'country'
								? 'border-sky-400/40 bg-sky-500/15 text-sky-200'
								: 'border-ft-border bg-ft-hover/40 text-ft-text hover:border-sky-400/30 hover:text-white'
						}`}
						title="Mostrar perfiles de mi pais"
					>
						Pais
					</button>
					<button
						type="button"
						onClick={() => setFilter('projects')}
						className={`${buttonBase} ${
							filter === 'projects'
								? 'border-amber-400/40 bg-amber-500/15 text-amber-200'
								: 'border-ft-border bg-ft-hover/40 text-ft-text hover:border-amber-400/30 hover:text-white'
						}`}
						title="Mostrar perfiles con proyectos en comun"
					>
						Proyectos
					</button>
					<button
						type="button"
						onClick={() => setFilter('level')}
						className={`${buttonBase} ${
							filter === 'level'
								? 'border-lime-400/40 bg-lime-500/15 text-lime-200'
								: 'border-ft-border bg-ft-hover/40 text-ft-text hover:border-lime-400/30 hover:text-white'
						}`}
						title="Mostrar perfiles cerca de mi nivel"
					>
						Nivel
					</button>
					<button
						type="button"
						onClick={() => setFilter('cursus')}
						className={`${buttonBase} ${
							filter === 'cursus'
								? 'border-indigo-400/40 bg-indigo-500/15 text-indigo-200'
								: 'border-ft-border bg-ft-hover/40 text-ft-text hover:border-indigo-400/30 hover:text-white'
						}`}
						title="Mostrar perfiles de mi cursus"
					>
						Cursus
					</button>
					<button
						type="button"
						onClick={() => setFilter('achievements')}
						className={`${buttonBase} ${
							filter === 'achievements'
								? 'border-rose-400/40 bg-rose-500/15 text-rose-200'
								: 'border-ft-border bg-ft-hover/40 text-ft-text hover:border-rose-400/30 hover:text-white'
						}`}
						title="Mostrar perfiles con logros similares"
					>
						Logros
					</button>
				</div>
			</div>

			{pendingReceived > 0 && (
				<div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
					{pendingReceived} solicitud{pendingReceived === 1 ? '' : 'es'} pendiente{pendingReceived === 1 ? '' : 's'}
				</div>
			)}

			{loading && (
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

			{!loading && visibleEntries.length === 0 && (
				<div className="rounded-xl border border-dashed border-ft-border px-4 py-5 text-center">
					<div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-ft-border bg-ft-hover/40">
						<svg className="h-5 w-5 text-ft-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m0-4a4 4 0 100-8 4 4 0 000 8zm8 0a4 4 0 100-8 4 4 0 000 8z" />
						</svg>
					</div>
					<p className="text-xs font-semibold text-ft-text">
						{filter === 'online'
							? 'No hay usuarios online'
							: filter === 'campus'
								? 'No hay usuarios de tu campus'
								: filter === 'country'
									? 'No hay usuarios de tu pais'
									: filter === 'projects'
										? 'No hay usuarios con proyectos en comun'
										: filter === 'level'
											? 'No hay usuarios cerca de tu nivel'
											: filter === 'cursus'
												? 'No hay usuarios de tu cursus'
												: filter === 'achievements'
													? 'No hay usuarios con logros similares'
													: 'No hay usuarios disponibles'}
					</p>
				</div>
			)}

			{visibleEntries.length > 0 && (
				<ul className="-mx-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
					{visibleEntries.map((entry) => {
						const rel = relOverrides[entry.id] ?? entry.relation;
						const busy = processing.has(entry.id);
						const isOnline = isEntryOnline(entry);
						const campusLabel = [entry.campus_city, entry.campus_country].filter(Boolean).join(', ') || entry.campus;
						const matchLabel = entry.campus_match === 'campus'
							? 'Campus'
							: entry.campus_match === 'country'
								? 'Pais'
								: null;
						const commonProjects = entry.common_projects ?? [];
						const commonProjectCount = entry.common_projects_count ?? commonProjects.length;

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
										<div className="flex min-w-0 items-center gap-1.5">
											<p className="truncate text-[10px] text-ft-muted" title={campusLabel ?? undefined}>
												{entry.campus}
												{campusLabel && campusLabel !== entry.campus ? ` · ${campusLabel}` : ''}
											</p>
											{matchLabel && (
												<span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-bold ${
													entry.campus_match === 'campus'
														? 'border-violet-400/30 bg-violet-500/10 text-violet-200'
														: 'border-ft-cyan/30 bg-ft-cyan/10 text-ft-cyan'
												}`}>
													{matchLabel}
												</span>
											)}
										</div>
									)}
									{commonProjects.length > 0 && (
										<p className="truncate text-[10px] text-ft-cyan" title={commonProjects.join(', ')}>
											{commonProjectCount} proyecto{commonProjectCount === 1 ? '' : 's'} en comun
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
									<button
										type="button"
										disabled={busy}
										onClick={() => void handleAccept(entry.id)}
										className="flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
									>
										{busy ? '...' : 'Aceptar'}
									</button>
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
		</aside>
	);
};
