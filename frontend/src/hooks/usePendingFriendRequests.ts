import { useEffect, useState } from 'react';
import type { PendingFriendRequest } from '@/types/chat';
import { buildApiUrl } from '@/utils/apiBase';

export const usePendingFriendRequests = (token: string | null) => {
	const [pendingRequests, setPendingRequests] = useState<PendingFriendRequest[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!token) return;
		let cancelled = false;

		const fetch_ = async () => {
			setLoading(true);
			try {
				const res = await fetch(buildApiUrl('/users/friends/pending'), {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok || cancelled) return;
				const data = await res.json() as PendingFriendRequest[];
				if (!cancelled) setPendingRequests(data);
			} catch {
				// ignore
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		void fetch_();
		const interval = setInterval(() => { void fetch_(); }, 30_000);
		return () => { cancelled = true; clearInterval(interval); };
	}, [token]);

	const acceptRequest = async (requesterId: string): Promise<void> => {
		if (!token) return;
		try {
			const res = await fetch(buildApiUrl(`/users/friends/me/${requesterId}/accept`), {
				method: 'PATCH',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) setPendingRequests((prev) => prev.filter((r) => r.id !== requesterId));
		} catch {
			// ignore
		}
	};

	const rejectRequest = async (requesterId: string): Promise<void> => {
		if (!token) return;
		try {
			const res = await fetch(buildApiUrl(`/users/friends/me/${requesterId}`), {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) setPendingRequests((prev) => prev.filter((r) => r.id !== requesterId));
		} catch {
			// ignore
		}
	};

	return { pendingRequests, loading, acceptRequest, rejectRequest };
};
