import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { User } from '@/types/models';
import { buildApiUrl } from '@/utils/apiBase';
import { useAuth } from '@/hooks/useAuth';

type ApiFriend = {
	id: string;
	login: string;
	correction_point?: number;
	last_login_at?: string | null;
	active?: boolean;
};

const mapApiFriend = (f: ApiFriend): User => ({
	id: f.id,
	login: f.login,
	avatar: f.login.charAt(0).toUpperCase(),
	level: f.correction_point ?? 0,
	lastSeen: f.last_login_at ?? undefined,
	online: Boolean(f.active),
});

const FriendsPage = () => {
	const { token } = useAuth();
	const [friends, setFriends] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [friendLogin, setFriendLogin] = useState('');
	const [actionError, setActionError] = useState<string | null>(null);
	const [actionSuccess, setActionSuccess] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const fetchingRef = useRef(false);

	const fetchFriends = async (signal?: AbortSignal) => {
		if (!token) return;
		try {
			setLoading(true);
			const res = await fetch(buildApiUrl('/users/friends/me'), {
				headers: { Authorization: `Bearer ${token}` },
				signal,
			});
			if (!res.ok) return;
			const data: ApiFriend[] = await res.json();
			setFriends(data.map(mapApiFriend));
		} catch {
			// ignore abort
		} finally {
			setLoading(false);
			fetchingRef.current = false;
		}
	};

	useEffect(() => {
		if (!token || fetchingRef.current) return;
		fetchingRef.current = true;
		const controller = new AbortController();
		fetchFriends(controller.signal);
		return () => controller.abort();
	}, [token]);

	const handleAddFriend = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!token) return;
		const normalizedLogin = friendLogin.trim().toLowerCase();
		if (!normalizedLogin) {
			setActionError('Introduce un login para agregar como amigo.');
			return;
		}
		setSaving(true);
		setActionError(null);
		setActionSuccess(null);
		try {
			const res = await fetch(buildApiUrl('/users/friends/me'), {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({ friend_login: normalizedLogin }),
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body?.message ?? 'No se pudo agregar el amigo.');
			}
			setFriendLogin('');
			setActionSuccess(`${normalizedLogin} agregado correctamente.`);
			await fetchFriends();
		} catch (error) {
			setActionError(error instanceof Error ? error.message : 'No se pudo agregar el amigo.');
		} finally {
			setSaving(false);
		}
	};

	const handleRemoveFriend = async (friendId: string, login: string) => {
		if (!token) return;
		setSaving(true);
		setActionError(null);
		setActionSuccess(null);
		try {
			const res = await fetch(buildApiUrl(`/users/friends/me/${friendId}`), {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error('No se pudo eliminar el amigo.');
			setFriends((current) => current.filter((f) => f.id !== friendId));
			setActionSuccess(`${login} eliminado de tus amigos.`);
		} catch (error) {
			setActionError(error instanceof Error ? error.message : 'No se pudo eliminar el amigo.');
		} finally {
			setSaving(false);
		}
	};

	const onlineCount = friends.filter((f) => f.online).length;

	return (
		<div className="max-w-2xl mx-auto w-full space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-black text-white">Amigos</h1>
					<p className="text-xs text-ft-muted mt-0.5">
						{friends.length} amigo{friends.length !== 1 ? 's' : ''}
						{onlineCount > 0 && (
							<span className="text-emerald-400 ml-1.5">· {onlineCount} en línea</span>
						)}
					</p>
				</div>
			</div>

			{/* Add friend form */}
			<div className="bg-ft-card border border-ft-border rounded-2xl p-5">
				<h2 className="text-xs font-bold text-ft-muted uppercase tracking-wider mb-3">Agregar amigo</h2>
				<form className="space-y-3" onSubmit={handleAddFriend}>
					<div className="flex gap-2">
						<Input
							value={friendLogin}
							onChange={(e) => setFriendLogin(e.target.value)}
							placeholder="Login de 42 (ej: jonhdoe)"
							aria-label="Login del amigo"
							className="flex-1"
						/>
						<Button type="submit" variant="primary" size="sm" disabled={saving || !friendLogin.trim()}>
							{saving ? '...' : 'Añadir'}
						</Button>
					</div>
					{actionError && (
						<p className="text-xs text-red-400 flex items-center gap-1.5">
							<span>⚠</span> {actionError}
						</p>
					)}
					{actionSuccess && (
						<p className="text-xs text-emerald-300 flex items-center gap-1.5">
							<span>✓</span> {actionSuccess}
						</p>
					)}
				</form>
			</div>

			{/* Friends list */}
			<div className="bg-ft-card border border-ft-border rounded-2xl overflow-hidden">
				<div className="px-5 py-4 border-b border-ft-border">
					<h2 className="text-xs font-bold text-ft-muted uppercase tracking-wider">Mis amigos</h2>
				</div>

				{loading && friends.length === 0 && (
					<div className="px-5 py-8 text-center text-sm text-ft-muted">Cargando amigos...</div>
				)}

				{!loading && friends.length === 0 && (
					<div className="px-5 py-10 text-center">
						<p className="text-sm text-ft-muted">Todavía no tienes amigos en Intragram.</p>
						<p className="text-xs text-ft-muted mt-1 opacity-60">Usa el formulario de arriba para añadir el login de un compañero.</p>
					</div>
				)}

				{friends.length > 0 && (
					<ul className="divide-y divide-ft-border">
						{friends.map((friend) => (
							<li key={friend.id ?? friend.login} className="flex items-center gap-3 px-5 py-3.5 hover:bg-ft-hover transition-colors">
								<Avatar login={friend.login} size="md" online={friend.online} />
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold text-white truncate">{friend.login}</p>
									<div className="flex items-center gap-2 mt-0.5">
										<Badge variant="level">CP {friend.level}</Badge>
										<span className={`text-[10px] px-2 py-0.5 rounded-full border ${friend.online ? 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10' : 'border-ft-border text-ft-muted bg-ft-hover/60'}`}>
											{friend.online ? 'En línea' : 'Desconectado'}
										</span>
									</div>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									disabled={saving}
									onClick={() => void handleRemoveFriend(String(friend.id ?? friend.login), friend.login)}
									className="text-[11px] px-2.5 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
								>
									Eliminar
								</Button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};

export default FriendsPage;
