import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@/types/chat';
import { buildApiUrl } from '@/utils/apiBase';
import {
	type BackendConversation,
	type ChatUserProfile,
	mapConversationToUI,
	mapChatUserProfileToUser,
} from '@/utils/chatMappers';

const CONVERSATIONS_POLL_INTERVAL_MS = 3000;

export const useChatConversations = (token: string | null, currentUserId: string | null) => {
	const [rawConversations, setRawConversations] = useState<BackendConversation[]>([]);
	const [usersById, setUsersById] = useState<Record<string, User>>({});
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const conversations = useMemo(
		() => rawConversations.map((conv) => {
			const conversation = mapConversationToUI(conv, currentUserId, usersById);
			return conv.id === selectedChatId ? { ...conversation, unread: 0 } : conversation;
		}),
		[rawConversations, currentUserId, usersById, selectedChatId],
	);

	const selectedChat = useMemo(
		() => conversations.find((conv) => String(conv.id) === selectedChatId) ?? null,
		[conversations, selectedChatId],
	);

	const loadMissingUsers = async (conversationList: BackendConversation[]) => {
		if (!token) return;

		const participantIds = new Set<string>();
		conversationList.forEach((conv) => {
			conv.participants.forEach((pid) => {
				if (pid !== currentUserId) participantIds.add(pid);
			});
		});

		const missingIds = [...participantIds].filter((pid) => !usersById[pid]);
		if (missingIds.length === 0) return;

		const results = await Promise.all(
			missingIds.map(async (pid) => {
				try {
					const res = await fetch(buildApiUrl(`/users/${pid}`), {
						headers: { Authorization: `Bearer ${token}` },
					});
					if (!res.ok) throw new Error();
					const profile = await res.json() as ChatUserProfile;
					return { pid, user: mapChatUserProfileToUser(profile) };
				} catch {
					return {
						pid,
						user: {
							id: pid,
							login: pid.slice(0, 8),
							displayName: pid.slice(0, 8),
							avatar: pid.slice(0, 1).toUpperCase(),
							avatarUrl: null,
							level: 0,
						} as User,
					};
				}
			}),
		);

		setUsersById((prev) => {
			const next = { ...prev };
			results.forEach(({ pid, user }) => { next[pid] = user; });
			return next;
		});
	};

	const pickSelectedId = (list: BackendConversation[], current: string | null): string | null => {
		if (list.length === 0) return null;
		if (current && list.some((c) => c.id === current)) return current;
		return list[0].id;
	};

	useEffect(() => {
		if (!token) {
			setRawConversations([]);
			setSelectedChatId(null);
			return;
		}

		let cancelled = false;

		const load = async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(buildApiUrl('/chat/conversations'), {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok) throw new Error('No se pudieron cargar las conversaciones');
				const list = await res.json() as BackendConversation[];
				if (cancelled) return;
				setRawConversations(list);
				setSelectedChatId((cur) => pickSelectedId(list, cur));
				if (!cancelled) await loadMissingUsers(list);
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudieron cargar las conversaciones');
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		void load();
		return () => { cancelled = true; };
	}, [token, currentUserId]);

	useEffect(() => {
		if (!token) return;
		let disposed = false;

		const poll = async () => {
			try {
				const res = await fetch(buildApiUrl('/chat/conversations'), {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok || disposed) return;
				const list = await res.json() as BackendConversation[];
				if (disposed) return;
				setRawConversations(list);
				setSelectedChatId((cur) => pickSelectedId(list, cur));
				await loadMissingUsers(list);
			} catch {
				// silent poll
			}
		};

		const interval = setInterval(() => { void poll(); }, CONVERSATIONS_POLL_INTERVAL_MS);
		return () => { disposed = true; clearInterval(interval); };
	}, [token, currentUserId, usersById]);

	const addOrUpdateConversation = (conv: BackendConversation) => {
		setRawConversations((prev) => {
			const exists = prev.find((c) => c.id === conv.id);
			if (exists) return prev.map((c) => (c.id === conv.id ? conv : c));
			return [...prev, conv];
		});
	};

	const updateConversationLastMessage = (convId: string, message: string, at: string) => {
		setRawConversations((prev) =>
			prev.map((c) =>
				c.id !== convId ? c : { ...c, last_message: message, last_message_at: at, updated_at: new Date().toISOString() },
			),
		);
	};

	const addUser = (userId: string, user: User) => {
		setUsersById((prev) => ({ ...prev, [userId]: user }));
	};

	const updateUserOnlineStatus = (userId: string, online: boolean) => {
		setUsersById((prev) => {
			if (!prev[userId]) return prev;
			return { ...prev, [userId]: { ...prev[userId], online } };
		});
	};

	const markConversationRead = useCallback(async (conversationId: string): Promise<void> => {
		if (!token) return;
		setRawConversations((prev) => prev.map((conversation) =>
			conversation.id === conversationId ? { ...conversation, unread_count: 0 } : conversation,
		));
		try {
			await fetch(buildApiUrl(`/chat/conversations/${conversationId}/read`), {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
			});
		} catch {
			// Polling will reconcile the optimistic update if the request fails.
		}
	}, [token]);

	return {
		rawConversations,
		conversations,
		selectedChatId,
		setSelectedChatId,
		selectedChat,
		usersById,
		loading,
		error,
		addOrUpdateConversation,
		updateConversationLastMessage,
		addUser,
		updateUserOnlineStatus,
		markConversationRead,
	};
};
