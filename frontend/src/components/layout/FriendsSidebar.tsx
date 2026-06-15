import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { buildApiUrl } from '@/utils/apiBase';
import { useAuth } from '@/hooks/useAuth';

type FriendItem = {
	id: string;
	login: string;
	avatar_url?: string | null;
	active?: boolean;
};

export const FriendsSidebar = () => {
	const { token } = useAuth();
	const navigate = useNavigate();
	const [friends, setFriends] = useState<FriendItem[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!token) return;
		let cancelled = false;

		const fetchFriends = async () => {
			try {
				const res = await fetch(buildApiUrl('/users/friends/me'), {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok || cancelled) return;
				const data: FriendItem[] = await res.json();
				if (!cancelled) {
					const sorted = [...data].sort((a, b) => {
						if (a.active && !b.active) return -1;
						if (!a.active && b.active) return 1;
						return 0;
					});
					setFriends(sorted);
					setLoading(false);
				}
			} catch {
				if (!cancelled) setLoading(false);
			}
		};

		void fetchFriends();
		const interval = setInterval(() => { void fetchFriends(); }, 30_000);

		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [token]);

	const onlineCount = friends.filter((f) => f.active).length;

	return (
		<aside className="sticky top-4 bg-ft-card border border-ft-border rounded-2xl overflow-hidden">
			<div className="px-4 py-3 border-b border-ft-border flex items-center justify-between">
				<h2 className="text-xs font-bold text-ft-muted uppercase tracking-wider">Amigos</h2>
				{onlineCount > 0 && (
					<span className="text-[10px] font-bold text-emerald-400">{onlineCount} en línea</span>
				)}
			</div>

			{loading && (
				<div className="px-4 py-6 text-center text-xs text-ft-muted">Cargando...</div>
			)}

			{!loading && friends.length === 0 && (
				<div className="px-4 py-6 text-center">
					<p className="text-xs text-ft-muted">No tienes amigos aún.</p>
				</div>
			)}

			{friends.length > 0 && (
				<ul className="divide-y divide-ft-border max-h-[calc(100vh-12rem)] overflow-y-auto">
					{friends.map((friend) => (
						<li key={friend.id}>
							<button
								type="button"
								onClick={() => navigate(`/profile/${friend.login}`)}
								className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-ft-hover transition-colors text-left"
							>
								<Avatar login={friend.login} imageUrl={friend.avatar_url ?? null} size="sm" online={friend.active} />
								<span className="text-xs font-medium text-ft-text truncate">{friend.login}</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</aside>
	);
};
