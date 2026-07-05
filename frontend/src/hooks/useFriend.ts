import { useEffect, useState } from 'react';
import { useFriendContext } from '@/hooks/useFriendContext';
import type { FriendRelation } from '@/hooks/useFriendContext';

export type { FriendRelation };

interface UseFriendReturn {
	/** Current cached relation with this user. 'none' until resolved. */
	relation: FriendRelation;
	/** True while the initial relation is being fetched from the API. */
	loading: boolean;
	/** Send a friend request to this user. */
	send: () => Promise<void>;
	/** Accept an incoming request from this user. */
	accept: () => Promise<void>;
	/** Reject an incoming request from this user. */
	reject: () => Promise<void>;
	/** Remove this user from your friends list. */
	remove: () => Promise<void>;
}

/**
 * Convenience hook that resolves and tracks the relation with a single user.
 *
 * - If the relation is already in FriendContext's cache (seeded by the directory
 *   or a previous visit) it is returned immediately with no API call.
 * - Otherwise a single GET /users/friends/status/:userId is fired, the result
 *   stored in the shared cache, and every subscriber re-renders automatically.
 *
 * Pass `userId = null | undefined` (e.g. when viewing your own profile) to
 * skip the fetch entirely and always receive `relation: 'none'`.
 */
export const useFriend = (
	userId: string | null | undefined,
	login?: string,
): UseFriendReturn => {
	const { relationCache, fetchRelation, sendRequest, acceptRequest, rejectRequest, removeFriend } =
		useFriendContext();

	const [loading, setLoading] = useState(false);

	const isCached = !userId || userId in relationCache;
	const relation: FriendRelation = (userId ? relationCache[userId] : undefined) ?? 'none';

	useEffect(() => {
		if (isCached) return;
		setLoading(true);
		void fetchRelation(userId!).finally(() => setLoading(false));
	}, [userId, isCached, fetchRelation]);

	return {
		relation,
		loading,
		send: () => (userId && login ? sendRequest(userId, login) : Promise.resolve()),
		accept: () => (userId ? acceptRequest(userId) : Promise.resolve()),
		reject: () => (userId ? rejectRequest(userId) : Promise.resolve()),
		remove: () => (userId ? removeFriend(userId) : Promise.resolve()),
	};
};
