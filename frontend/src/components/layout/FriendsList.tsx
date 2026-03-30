import './FriendsList.css';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { User } from '@/types/models';
import { buildApiUrl } from '@/utils/apiBase';
import { useAuth } from '@/hooks/useAuth';

type ApiFriend = {
	id: string;
	login: string;
	correction_point?: number;
	last_login_at?: string | null;
};

export const FriendsList = () => {
	const { token } = useAuth();
	const [friends, setFriends] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!token) return;

		const controller = new AbortController();
		const fetchFriends = async () => {
			try {
				setLoading(true);
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

	return (
		<aside className="friends-list">
			<div>
				<h3 className="text-xs font-bold text-ft-muted uppercase tracking-wider mb-3">
					En línea <span className="text-ft-cyan ml-1">{friends.length}</span>
				</h3>
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
								<Badge variant="level">CP {friend.level}</Badge>
							</div>
							<svg className="w-4 h-4 text-ft-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
							</svg>
						</li>
					))}
				</ul>
			</div>
			<div className="mt-auto pt-6 border-t border-ft-border">
				<p className="text-[10px] text-ft-muted text-center">© 2026 Intragram · 42 Network</p>
			</div>
		</aside>
	);
};
