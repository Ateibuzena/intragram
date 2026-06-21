import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { buildApiUrl } from '@/utils/apiBase';
import { useAuth } from '@/hooks/useAuth';
import { usePresenceStatus } from '@/hooks/usePresenceContext';

type Relation = 'none' | 'friends' | 'pending_sent' | 'pending_received';

type DirectoryEntry = {
	id: string;
	login: string;
	display_name?: string | null;
	avatar_url?: string | null;
	campus?: string | null;
	active?: boolean;
	relation: Relation;
};

export const FriendsSidebar = () => {
	const { token } = useAuth();
	const navigate = useNavigate();
	const { presenceMap } = usePresenceStatus();

	const [entries, setEntries] = useState<DirectoryEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [relOverrides, setRelOverrides] = useState<Record<string, Relation>>({});
	const [processing, setProcessing] = useState<Set<string>>(new Set());

	const fetchDirectory = useCallback(async () => {
		if (!token) return;
		try {
			const res = await fetch(buildApiUrl('/users/directory'), {
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
	}, [token]);

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

	return (
		<aside className="sticky top-4 surface-glass border border-ft-border rounded-2xl overflow-hidden">
			<div className="px-4 py-3 border-b border-ft-border">
				<h2 className="text-xs font-bold text-ft-muted uppercase tracking-wider">Comunidad</h2>
			</div>

			{loading && (
				<div className="px-4 py-6 text-center text-xs text-ft-muted">Cargando...</div>
			)}

			{!loading && entries.length === 0 && (
				<div className="px-4 py-6 text-center">
					<p className="text-xs text-ft-muted">No hay usuarios disponibles.</p>
				</div>
			)}

			{entries.length > 0 && (
				<ul className="divide-y divide-ft-border max-h-[calc(100vh-12rem)] overflow-y-auto">
					{entries.map((entry) => {
						const rel = relOverrides[entry.id] ?? entry.relation;
						const busy = processing.has(entry.id);
						const isOnline = presenceMap[entry.id] ?? false;

						return (
							<li key={entry.id} className="flex items-center gap-2.5 px-4 py-2.5">
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
										<p className="text-[10px] text-ft-muted truncate">{entry.campus}</p>
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
