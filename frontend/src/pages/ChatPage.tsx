import { useEffect, useMemo, useState } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useAuth } from '@/hooks/useAuth';
import type { Conversation, Message, User } from '@/types/models';
import { formatTime } from '@/utils/formatters';
import { buildApiUrl } from '@/utils/apiBase';

interface BackendConversation {
	id: string;
	participants: string[];
	created_at: string;
	updated_at: string;
	last_message: string | null;
	last_message_at: string | null;
}

interface BackendMessage {
	id: string;
	conversationId: string;
	senderId: string;
	message: string;
	attachments: string[];
	created_at: string;
}

interface SendMessageResponse {
	message: BackendMessage;
}

interface UserProfile {
	id: string;
	login: string;
	display_name: string | null;
}

const getCurrentUserIdFromToken = (token: string | null): string | null => {
	if (!token) return null;

	try {
		const [, payloadSegment] = token.split('.');
		if (!payloadSegment) return null;

		const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
		const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
		const payload = JSON.parse(decoded) as { sub?: string };
		return payload.sub ?? null;
	} catch {
		return null;
	}
};

const fallbackLogin = (userId: string): string => userId.slice(0, 8);

const mapConversationToUI = (
	conversation: BackendConversation,
	currentUserId: string | null,
	usersById: Record<string, User>,
): Conversation => {
	const otherParticipantId = conversation.participants.find((participantId) => participantId !== currentUserId)
		?? conversation.participants[0]
		?? 'unknown';

	const user = usersById[otherParticipantId] ?? {
		id: otherParticipantId,
		login: fallbackLogin(otherParticipantId),
		avatar: fallbackLogin(otherParticipantId).charAt(0).toUpperCase(),
		level: 0,
	};

	return {
		id: conversation.id,
		user,
		lastMessage: conversation.last_message ?? 'Sin mensajes',
		timestamp: formatTime(conversation.last_message_at ?? conversation.updated_at),
		unread: false,
	};
};

const mapMessageToUI = (message: BackendMessage, currentUserId: string | null): Message => ({
	id: message.id,
	sender: message.senderId === currentUserId ? 'me' : 'other',
	text: message.message,
	timestamp: new Date(message.created_at).toLocaleString('es-ES', {
		dateStyle: 'short',
		timeStyle: 'short',
	}),
});

const ChatPage = () => {
	const { token } = useAuth();

	const [rawConversations, setRawConversations] = useState<BackendConversation[]>([]);
	const [usersById, setUsersById] = useState<Record<string, User>>({});
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);

	const [loadingConversations, setLoadingConversations] = useState(false);
	const [loadingMessages, setLoadingMessages] = useState(false);
	const [sendingMessage, setSendingMessage] = useState(false);

	const [conversationsError, setConversationsError] = useState<string | null>(null);
	const [messagesError, setMessagesError] = useState<string | null>(null);

	const currentUserId = useMemo(() => getCurrentUserIdFromToken(token), [token]);

	const conversations = useMemo(
		() => rawConversations.map((conversation) => mapConversationToUI(conversation, currentUserId, usersById)),
		[rawConversations, currentUserId, usersById],
	);

	const selectedChat = useMemo(
		() => conversations.find((conversation) => String(conversation.id) === selectedChatId) ?? null,
		[conversations, selectedChatId],
	);

	useEffect(() => {
		if (!token) {
			setRawConversations([]);
			setSelectedChatId(null);
			setMessages([]);
			return;
		}

		let cancelled = false;

		const loadConversations = async () => {
			setLoadingConversations(true);
			setConversationsError(null);

			try {
				const request = await fetch(buildApiUrl('/chat/conversations'), {
					headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				});

				if (!request.ok) {
					throw new Error('No se pudieron cargar las conversaciones');
				}

				const conversationList = await request.json() as BackendConversation[];
				if (cancelled) return;

				setRawConversations(conversationList);

				if (conversationList.length > 0) {
					setSelectedChatId((currentSelectedChatId) => {
						if (currentSelectedChatId && conversationList.some((conversation) => conversation.id === currentSelectedChatId)) {
							return currentSelectedChatId;
						}
						return conversationList[0].id;
					});
				} else {
					setSelectedChatId(null);
				}

				const participantIds = new Set<string>();
				conversationList.forEach((conversation) => {
					conversation.participants.forEach((participantId) => {
						if (participantId !== currentUserId) participantIds.add(participantId);
					});
				});

				const profiles = await Promise.all(
					[...participantIds].map(async (participantId) => {
						try {
							const response = await fetch(buildApiUrl(`/users/${participantId}`), {
								headers: token ? { Authorization: `Bearer ${token}` } : undefined,
							});

							if (!response.ok) throw new Error('No se pudo cargar el usuario');

							const profile = await response.json() as UserProfile;
							return {
								participantId,
								user: {
									id: profile.id,
									login: profile.display_name || profile.login,
									avatar: (profile.display_name || profile.login).charAt(0).toUpperCase(),
									level: 0,
								} as User,
							};
						} catch {
							return {
								participantId,
								user: {
									id: participantId,
									login: participantId.slice(0, 8),
									avatar: participantId.slice(0, 1).toUpperCase(),
									level: 0,
								} as User,
							};
						}
					}),
				);

				if (!cancelled) {
					const nextUsersById: Record<string, User> = {};
					profiles.forEach(({ participantId, user }) => {
						nextUsersById[participantId] = user;
					});
					setUsersById(nextUsersById);
				}
			} catch (error) {
				if (!cancelled) {
					setConversationsError(error instanceof Error ? error.message : 'No se pudieron cargar las conversaciones');
				}
			} finally {
				if (!cancelled) {
					setLoadingConversations(false);
				}
			}
		};

		void loadConversations();

		return () => {
			cancelled = true;
		};
	}, [token, currentUserId]);

	useEffect(() => {
		if (!token || !selectedChatId) {
			setMessages([]);
			return;
		}

		let cancelled = false;

		const loadMessages = async () => {
			setLoadingMessages(true);
			setMessagesError(null);

			try {
				const response = await fetch(buildApiUrl(`/chat/conversations/${selectedChatId}/messages`), {
					headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				});

				if (!response.ok) throw new Error('No se pudieron cargar los mensajes');

				const backendMessages = await response.json() as BackendMessage[];
				if (!cancelled) {
					setMessages(backendMessages.map((message) => mapMessageToUI(message, currentUserId)));
				}
			} catch (error) {
				if (!cancelled) {
					setMessagesError(error instanceof Error ? error.message : 'No se pudieron cargar los mensajes');
				}
			} finally {
				if (!cancelled) {
					setLoadingMessages(false);
				}
			}
		};

		void loadMessages();

		return () => {
			cancelled = true;
		};
	}, [token, selectedChatId, currentUserId]);

	const handleSendMessage = async (messageText: string) => {
		if (!selectedChatId) return;

		setSendingMessage(true);
		setMessagesError(null);

		try {
			const response = await fetch(buildApiUrl(`/chat/conversations/${selectedChatId}/messages`), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({ message: messageText, attachments: [] }),
			});

			if (!response.ok) throw new Error('No se pudo enviar el mensaje');

			const data = await response.json() as SendMessageResponse;
			setMessages((previousMessages) => [
				...previousMessages,
				mapMessageToUI(data.message, currentUserId),
			]);

			setRawConversations((previousConversations) => previousConversations.map((conversation) => {
				if (conversation.id !== selectedChatId) return conversation;

				const now = new Date().toISOString();
				return {
					...conversation,
					last_message: data.message.message,
					last_message_at: data.message.created_at,
					updated_at: now,
				};
			}));
		} catch (error) {
			setMessagesError(error instanceof Error ? error.message : 'No se pudo enviar el mensaje');
		} finally {
			setSendingMessage(false);
		}
	};

	return (
		<div className="flex h-full">
			<ConversationList
				conversations={conversations}
				loading={loadingConversations}
				error={conversationsError}
				selectedChat={selectedChat}
				onSelectChat={(conversation) => setSelectedChatId(String(conversation.id))}
			/>
			<ChatWindow
				selectedChat={selectedChat}
				messages={messages}
				loading={loadingMessages}
				error={messagesError}
				sending={sendingMessage}
				onSendMessage={handleSendMessage}
			/>
		</div>
	);
};

export default ChatPage;
