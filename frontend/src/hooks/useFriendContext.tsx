import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePresenceStatus } from '@/hooks/usePresenceContext';
import { buildApiUrl } from '@/utils/apiBase';
import type { PendingFriendRequest } from '@/types/chat';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FriendRelation = 'none' | 'friends' | 'pending_sent' | 'pending_received';

interface FriendContextType {
	/** Incoming friend requests directed at the current user. */
	pendingReceived: PendingFriendRequest[];
	/** Cache mapping userId → relation for every user the app has resolved. */
	relationCache: Record<string, FriendRelation>;
	/**
	 * Populate the cache from a batch of already-fetched data (e.g. directory).
	 * Always overwrites — server data is authoritative.
	 */
	seedRelations: (entries: Array<{ id: string; relation: FriendRelation }>) => void;
	/** Read the cached relation for a user (returns 'none' if not yet resolved). */
	getRelation: (userId: string) => FriendRelation;
	/** Fetch the relation for a user from the API and store it in the cache. */
	fetchRelation: (userId: string) => Promise<FriendRelation>;
	/** Send a friend request. Updates cache optimistically on success. */
	sendRequest: (userId: string, login: string) => Promise<void>;
	/** Accept an incoming request. Removes from pendingReceived and updates cache. */
	acceptRequest: (requesterId: string) => Promise<void>;
	/** Reject an incoming request. Removes from pendingReceived and updates cache. */
	rejectRequest: (requesterId: string) => Promise<void>;
	/** Remove an accepted friend. Updates cache to 'none'. */
	removeFriend: (friendId: string) => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const FriendContext = createContext<FriendContextType | null>(null);

export const useFriendContext = (): FriendContextType => {
	const ctx = useContext(FriendContext);
	if (!ctx) throw new Error('useFriendContext must be used within FriendProvider');
	return ctx;
};

// ─── Provider ────────────────────────────────────────────────────────────────

export const FriendProvider = ({ children }: { children: React.ReactNode }) => {
	const { token } = useAuth();
	const { socketRef, connected } = usePresenceStatus();

	const [pendingReceived, setPendingReceived] = useState<PendingFriendRequest[]>([]);
	const [relationCache, setRelationCache] = useState<Record<string, FriendRelation>>({});

	// ── Cache helpers ──────────────────────────────────────────────────────────

	const patchCache = useCallback((updates: Record<string, FriendRelation>) => {
		setRelationCache((prev) => ({ ...prev, ...updates }));
	}, []);

	const seedRelations = useCallback((entries: Array<{ id: string; relation: FriendRelation }>) => {
		setRelationCache((prev) => {
			const next = { ...prev };
			entries.forEach(({ id, relation }) => { next[id] = relation; });
			return next;
		});
	}, []);

	const getRelation = useCallback(
		(userId: string): FriendRelation => relationCache[userId] ?? 'none',
		[relationCache],
	);

	// ── Pending requests ───────────────────────────────────────────────────────

	const fetchPending = useCallback(async () => {
		if (!token) return;
		try {
			const res = await fetch(buildApiUrl('/users/friends/pending'), {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) return;
			const data = (await res.json()) as PendingFriendRequest[];
			setPendingReceived(data);
			// Seed cache so any component can read these relations immediately.
			const updates: Record<string, FriendRelation> = {};
			data.forEach((r) => { updates[r.id] = 'pending_received'; });
			patchCache(updates);
		} catch {
			// Retain last known state on network error.
		}
	}, [token, patchCache]);

	// Initial load + single 30 s poll — replaces duplicate polls that existed
	// across usePresence and usePendingFriendRequests.
	useEffect(() => {
		if (!token) {
			setPendingReceived([]);
			setRelationCache({});
			return;
		}
		void fetchPending();
		const id = setInterval(() => { void fetchPending(); }, 30_000);
		return () => clearInterval(id);
	}, [token, fetchPending]);

	// ── Real-time: friend:request socket event ─────────────────────────────────

	// Re-fetch the pending list whenever a new request arrives so we get the
	// full PendingFriendRequest object (including avatar_url) without needing
	// the server to embed it in the socket payload.
	const handleFriendRequest = useCallback(() => {
		void fetchPending();
	}, [fetchPending]);

	useEffect(() => {
		if (!connected) return;
		const socket = socketRef.current;
		if (!socket) return;
		socket.on('friend:request', handleFriendRequest);
		return () => { socket.off('friend:request', handleFriendRequest); };
	}, [connected, socketRef, handleFriendRequest]);

	// ── Relation fetch ─────────────────────────────────────────────────────────

	const fetchRelation = useCallback(async (userId: string): Promise<FriendRelation> => {
		if (!token) return 'none';
		try {
			const res = await fetch(buildApiUrl(`/users/friends/status/${userId}`), {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) return 'none';
			const data = (await res.json()) as { relation: FriendRelation };
			patchCache({ [userId]: data.relation });
			return data.relation;
		} catch {
			return 'none';
		}
	}, [token, patchCache]);

	// ── Actions ────────────────────────────────────────────────────────────────

	const sendRequest = useCallback(async (userId: string, login: string) => {
		if (!token) return;
		try {
			const res = await fetch(buildApiUrl('/users/friends/me'), {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({ friend_login: login }),
			});
			if (!res.ok) return;
			const data = (await res.json()) as { status: 'pending' | 'accepted' };
			patchCache({ [userId]: data.status === 'accepted' ? 'friends' : 'pending_sent' });
		} catch {
			// Optimistic update not applied — button stays in current state.
		}
	}, [token, patchCache]);

	const acceptRequest = useCallback(async (requesterId: string) => {
		if (!token) return;
		try {
			const res = await fetch(buildApiUrl(`/users/friends/me/${requesterId}/accept`), {
				method: 'PATCH',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) return;
			setPendingReceived((prev) => prev.filter((r) => r.id !== requesterId));
			patchCache({ [requesterId]: 'friends' });
		} catch {
			// ignore
		}
	}, [token, patchCache]);

	const rejectRequest = useCallback(async (requesterId: string) => {
		if (!token) return;
		try {
			const res = await fetch(buildApiUrl(`/users/friends/me/${requesterId}`), {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) return;
			setPendingReceived((prev) => prev.filter((r) => r.id !== requesterId));
			patchCache({ [requesterId]: 'none' });
		} catch {
			// ignore
		}
	}, [token, patchCache]);

	const removeFriend = useCallback(async (friendId: string) => {
		if (!token) return;
		try {
			const res = await fetch(buildApiUrl(`/users/friends/me/${friendId}`), {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) return;
			patchCache({ [friendId]: 'none' });
		} catch {
			// ignore
		}
	}, [token, patchCache]);

	// ── Context value ──────────────────────────────────────────────────────────

	const value = useMemo<FriendContextType>(() => ({
		pendingReceived,
		relationCache,
		seedRelations,
		getRelation,
		fetchRelation,
		sendRequest,
		acceptRequest,
		rejectRequest,
		removeFriend,
	}), [
		pendingReceived,
		relationCache,
		seedRelations,
		getRelation,
		fetchRelation,
		sendRequest,
		acceptRequest,
		rejectRequest,
		removeFriend,
	]);

	return <FriendContext.Provider value={value}>{children}</FriendContext.Provider>;
};
