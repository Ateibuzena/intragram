import './FriendsList.css';
import { useEffect, useState, type FormEvent } from 'react';
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

export const FriendsList = () => {
	const { token } = useAuth();
	const [friends, setFriends] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [friendLogin, setFriendLogin] = useState('');
	const [actionError, setActionError] = useState<string | null>(null);
	const [actionSuccess, setActionSuccess] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!token) return;

		const controller = new AbortController();
		const fetchFriends = async () => {
			try {
				setLoading(true);
				setActionError(null);
				const res = await fetch(buildApiUrl('/users/friends/me'), {
					headers: {
						Authorization: `Bearer ${token}`,
					},
					signal: controller.signal,
				});
				if (!res.ok) {
					setFriends([]);
					return;
				}
				const data: ApiFriend[] = await res.json();
				setFriends(data.map((f) => ({
					id: f.id,
					login: f.login,
					avatar: f.login.charAt(0).toUpperCase(),
					level: f.correction_point ?? 0,
					lastSeen: f.last_login_at ?? undefined,
					online: Boolean(f.active),
				})));
			} catch {
				setFriends([]);
			} finally {
				setLoading(false);
			}
		};

		fetchFriends();
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
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ friend_login: normalizedLogin }),
			});

			if (!res.ok) {
				throw new Error('No se pudo agregar el amigo.');
			}

			setFriendLogin('');
			setActionSuccess('Amigo agregado correctamente.');
			const refreshed = await fetch(buildApiUrl('/users/friends/me'), {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (refreshed.ok) {
				const data: ApiFriend[] = await refreshed.json();
				setFriends(data.map((f) => ({
					id: f.id,
					login: f.login,
					avatar: f.login.charAt(0).toUpperCase(),
					level: f.correction_point ?? 0,
					lastSeen: f.last_login_at ?? undefined,
					online: Boolean(f.active),
				})));
			}
		} catch (error) {
			setActionError(error instanceof Error ? error.message : 'No se pudo agregar el amigo.');
		} finally {
			setSaving(false);
		}
	};

	const handleRemoveFriend = async (friendId: string) => {
		if (!token) return;

		setSaving(true);
		setActionError(null);
		setActionSuccess(null);

		try {
			const res = await fetch(buildApiUrl(`/users/friends/me/${friendId}`), {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) {
				throw new Error('No se pudo eliminar el amigo.');
			}

			setFriends((current) => current.filter((friend) => friend.id !== friendId));
			setActionSuccess('Amigo eliminado correctamente.');
		} catch (error) {
			setActionError(error instanceof Error ? error.message : 'No se pudo eliminar el amigo.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<aside className="friends-list">
			<div>
				<h3 className="text-xs font-bold text-ft-muted uppercase tracking-wider mb-3">
					En línea <span className="text-ft-cyan ml-1">{friends.length}</span>
				</h3>
				<form className="space-y-2 mb-4" onSubmit={handleAddFriend}>
					<div className="flex gap-2">
						<Input
							value={friendLogin}
							onChange={(event) => setFriendLogin(event.target.value)}
							placeholder="Agregar por login"
							aria-label="Login del amigo"
							className="flex-1"
						/>
						<Button type="submit" variant="primary" size="sm" disabled={saving}>
							{saving ? '...' : 'Añadir'}
						</Button>
					</div>
					{actionError && <p className="text-[11px] text-red-400">{actionError}</p>}
					{actionSuccess && <p className="text-[11px] text-emerald-300">{actionSuccess}</p>}
				</form>
				<ul className="space-y-2">
					{loading && friends.length === 0 && (
						<li className="text-[11px] text-ft-muted">Cargando amigos...</li>
					)}
					{!loading && friends.length === 0 && (
						<li className="text-[11px] text-ft-muted">Todavía no hay amigos guardados.</li>
					)}
					{friends.map((friend) => (
						<li key={friend.id ?? friend.login} className="friend-item">
							<Avatar login={friend.login} size="md" online={friend.online} />
							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold text-white truncate group-hover:text-ft-cyan transition-colors">
									{friend.login}
								</p>
								<div className="flex items-center gap-2 mt-1">
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
								onClick={() => void handleRemoveFriend(String(friend.id ?? friend.login))}
								className="text-[11px] px-2 py-1"
							>
								Quitar
							</Button>
						</li>
					))}
				</ul>
			</div>
			<div className="mt-auto pt-6 border-t border-ft-border space-y-1">
				<p className="text-[10px] text-ft-muted text-center">© 2026 Intragram · 42 Network</p>
				<p className="text-[10px] text-center space-x-2">
					<a href="/privacy" className="text-ft-muted hover:text-ft-cyan transition-colors">Privacidad</a>
					<span className="text-ft-muted">·</span>
					<a href="/terms" className="text-ft-muted hover:text-ft-cyan transition-colors">Términos</a>
				</p>
			</div>
		</aside>
	);
};
