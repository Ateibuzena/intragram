import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChatNewMessagePayload } from '@intragram/shared/realtime';
import type { User } from '@/types/chat';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { usePolledResource } from '@/hooks/usePolledResource';
import {
	type BackendConversation,
	type ChatUserProfile,
	mapConversationToUI,
	mapChatUserProfileToUser,
} from '@/utils/chatMappers';

// The conversation list is patched live via 'chat:new-message' below — this
// poll is only a reconciliation fallback for events missed during a
// reconnect gap, so it can afford to be slow.
const CONVERSATIONS_RECONCILE_INTERVAL_MS = 25_000;

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
					const res = await fetchWithAuth(`/users/${pid}`, token);
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

	// Only the first load shows the loading/error state — the reconciliation
	// poll stays silent, same as before.
	const isInitialLoadRef = useRef(true);
	useEffect(() => { isInitialLoadRef.current = true; }, [token]);

	const fetchConversations = async (): Promise<BackendConversation[] | null> => {
		if (!token) return null;
		const showLoading = isInitialLoadRef.current;
		if (showLoading) { setLoading(true); setError(null); }
		try {
			const res = await fetchWithAuth('/chat/conversations', token);
			if (!res.ok) {
				if (showLoading) setError('No se pudieron cargar las conversaciones');
				return null;
			}
			return await res.json() as BackendConversation[];
		} catch (err) {
			if (showLoading) setError(err instanceof Error ? err.message : 'No se pudieron cargar las conversaciones');
			return null;
		} finally {
			if (showLoading) { setLoading(false); isInitialLoadRef.current = false; }
		}
	};

	usePolledResource<BackendConversation[]>({
		enabled: !!token,
		fetcher: fetchConversations,
		onData: (list) => {
			setRawConversations(list);
			setSelectedChatId((cur) => pickSelectedId(list, cur));
			void loadMissingUsers(list);
		},
		onDisabled: () => { setRawConversations([]); setSelectedChatId(null); },
		intervalMs: CONVERSATIONS_RECONCILE_INTERVAL_MS,
		deps: [currentUserId],
	});

	// Real-time: the gateway only emits 'chat:new-message' to the recipient
	// (never the sender, see chat.controller.ts), so any event received here
	// is always an incoming message — patch the preview immediately and bump
	// unread unless this is the conversation currently open.
	useSocketEvent('chat:new-message', (payload: ChatNewMessagePayload) => {
		setRawConversations((prev) => prev.map((c) => {
			if (c.id !== payload.conversationId) return c;
			const isOpen = c.id === selectedChatId;
			return {
				...c,
				last_message: payload.message,
				last_message_has_image: payload.has_image,
				last_message_at: payload.created_at,
				updated_at: payload.created_at,
				unread_count: isOpen ? 0 : c.unread_count + 1,
			};
		}));
	});

	const removeConversation = (convId: string) => {
		setRawConversations((prev) => prev.filter((c) => c.id !== convId));
		setSelectedChatId((cur) => (cur === convId ? null : cur));
	};

	const addOrUpdateConversation = (conv: BackendConversation) => {
		setRawConversations((prev) => {
			const exists = prev.find((c) => c.id === conv.id);
			if (exists) return prev.map((c) => (c.id === conv.id ? conv : c));
			return [...prev, conv];
		});
	};

	const updateConversationLastMessage = (convId: string, message: string, at: string, hasImage = false) => {
		setRawConversations((prev) =>
			prev.map((c) =>
				c.id !== convId
					? c
					: { ...c, last_message: message, last_message_has_image: hasImage, last_message_at: at, updated_at: new Date().toISOString() },
			),
		);
	};

	const addUser = (userId: string, user: User) => {
		setUsersById((prev) => ({ ...prev, [userId]: user }));
	};

	const markConversationRead = useCallback(async (conversationId: string): Promise<void> => {
		if (!token) return;
		setRawConversations((prev) => prev.map((conversation) =>
			conversation.id === conversationId ? { ...conversation, unread_count: 0 } : conversation,
		));
		try {
			await fetchWithAuth(`/chat/conversations/${conversationId}/read`, token, { method: 'POST' });
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
		removeConversation,
		updateConversationLastMessage,
		addUser,
		markConversationRead,
	};
};
