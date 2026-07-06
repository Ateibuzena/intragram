import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { usePolledResource } from '@/hooks/usePolledResource';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
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

	const fetchPending = useCallback(async (): Promise<PendingFriendRequest[] | null> => {
		if (!token) return null;
		try {
			const res = await fetchWithAuth('/users/friends/pending', token);
			if (!res.ok) return null;
			return (await res.json()) as PendingFriendRequest[];
		} catch {
			return null;
		}
	}, [token]);

	const applyPending = useCallback((data: PendingFriendRequest[]) => {
		setPendingReceived(data);
		// Seed cache so any component can read these relations immediately.
		const updates: Record<string, FriendRelation> = {};
		data.forEach((r) => { updates[r.id] = 'pending_received'; });
		patchCache(updates);
	}, [patchCache]);

	// Initial load + single 30 s reconciliation poll — replaces duplicate polls
	// that existed across usePresence and usePendingFriendRequests.
	const { refetch: refetchPending } = usePolledResource<PendingFriendRequest[]>({
		enabled: !!token,
		fetcher: fetchPending,
		onData: applyPending,
		onDisabled: () => { setPendingReceived([]); setRelationCache({}); },
		intervalMs: 30_000,
	});

	// ── Real-time: friend:* socket events ───────────────────────────────────────

	// Re-fetch the pending list whenever a new request arrives so we get the
	// full PendingFriendRequest object (including avatar_url) without needing
	// the server to embed it in the socket payload.
	const handleFriendRequest = useCallback(() => {
		void refetchPending();
	}, [refetchPending]);

	// The other three events only ever flip a single relation, so a direct
	// cache patch is enough — no need to re-fetch anything.
	const handleFriendAccepted = useCallback((payload: { by: { id: string } }) => {
		patchCache({ [payload.by.id]: 'friends' });
	}, [patchCache]);

	const handleFriendRemoved = useCallback((payload: { by: { id: string } }) => {
		patchCache({ [payload.by.id]: 'none' });
	}, [patchCache]);

	const handleFriendRejected = useCallback((payload: { by: { id: string } }) => {
		patchCache({ [payload.by.id]: 'none' });
	}, [patchCache]);

	useSocketEvent('friend:request', handleFriendRequest);
	useSocketEvent('friend:accepted', handleFriendAccepted);
	useSocketEvent('friend:removed', handleFriendRemoved);
	useSocketEvent('friend:rejected', handleFriendRejected);

	// ── Relation fetch ─────────────────────────────────────────────────────────

	const fetchRelation = useCallback(async (userId: string): Promise<FriendRelation> => {
		if (!token) return 'none';
		try {
			const res = await fetchWithAuth(`/users/friends/status/${userId}`, token);
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
			const res = await fetchWithAuth('/users/friends/me', token, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
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
			const res = await fetchWithAuth(`/users/friends/me/${requesterId}/accept`, token, { method: 'PATCH' });
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
			const res = await fetchWithAuth(`/users/friends/me/${requesterId}`, token, { method: 'DELETE' });
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
			const res = await fetchWithAuth(`/users/friends/me/${friendId}`, token, { method: 'DELETE' });
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
