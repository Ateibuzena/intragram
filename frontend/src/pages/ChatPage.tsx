import { useEffect, useMemo, useState } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
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
	avatar_url: string | null;
}

const SearchIcon = () => (
	<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
	</svg>
);

const getCurrentUserIdFromToken = (token: string | null): string | null => {
	if (!token) return null;

	try {
		const [, payloadSegment] = token.split('.');
		if (!payloadSegment) return null;

		const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
		const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
		const payload = JSON.parse(decoded) as { sub?: string; chat_user_id?: string };
		return payload.chat_user_id ?? payload.sub ?? null;
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
		displayName: fallbackLogin(otherParticipantId),
		avatar: fallbackLogin(otherParticipantId).charAt(0).toUpperCase(),
		avatarUrl: null,
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

const MESSAGES_POLL_INTERVAL_MS = 2000;
const CONVERSATIONS_POLL_INTERVAL_MS = 3000;

const ChatPage = () => {
	const { token } = useAuth();

	const [rawConversations, setRawConversations] = useState<BackendConversation[]>([]);
	const [usersById, setUsersById] = useState<Record<string, User>>({});
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);

	const [loadingConversations, setLoadingConversations] = useState(false);
	const [loadingMessages, setLoadingMessages] = useState(false);
	const [sendingMessage, setSendingMessage] = useState(false);
	const [creatingConversation, setCreatingConversation] = useState(false);
	const [showUserPicker, setShowUserPicker] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);

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

	const loadMissingUsers = async (conversationList: BackendConversation[]) => {
		if (!token) return;

		const participantIds = new Set<string>();
		conversationList.forEach((conversation) => {
			conversation.participants.forEach((participantId) => {
				if (participantId !== currentUserId) participantIds.add(participantId);
			});
		});

		const missingParticipantIds = [...participantIds].filter((participantId) => !usersById[participantId]);
		if (missingParticipantIds.length === 0) return;

		const profiles = await Promise.all(
			missingParticipantIds.map(async (participantId) => {
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
							login: profile.login,
							displayName: profile.display_name || profile.login,
							avatar: (profile.display_name || profile.login).charAt(0).toUpperCase(),
							avatarUrl: profile.avatar_url,
							level: 0,
						} as User,
					};
				} catch {
					return {
						participantId,
						user: {
							id: participantId,
							login: participantId.slice(0, 8),
							displayName: participantId.slice(0, 8),
							avatar: participantId.slice(0, 1).toUpperCase(),
							avatarUrl: null,
							level: 0,
						} as User,
					};
				}
			}),
		);

		setUsersById((previousUsersById: Record<string, User>) => {
			const nextUsersById = { ...previousUsersById };
			profiles.forEach(({ participantId, user }) => {
				nextUsersById[participantId] = user;
			});
			return nextUsersById;
		});
	};

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
					setSelectedChatId((currentSelectedChatId: string | null) => {
						if (currentSelectedChatId && conversationList.some((conversation) => conversation.id === currentSelectedChatId)) {
							return currentSelectedChatId;
						}
						return conversationList[0].id;
					});
				} else {
					setSelectedChatId(null);
				}

				if (!cancelled) {
					await loadMissingUsers(conversationList);
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
		if (!token) return;

		let disposed = false;

		const pollConversations = async () => {
			try {
				const request = await fetch(buildApiUrl('/chat/conversations'), {
					headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				});

				if (!request.ok || disposed) return;

				const conversationList = await request.json() as BackendConversation[];
				if (disposed) return;

				setRawConversations(conversationList);

				setSelectedChatId((currentSelectedChatId: string | null) => {
					if (conversationList.length === 0) return null;
					if (currentSelectedChatId && conversationList.some((conversation) => conversation.id === currentSelectedChatId)) {
						return currentSelectedChatId;
					}
					return conversationList[0].id;
				});

				await loadMissingUsers(conversationList);
			} catch {
				// Poll silencioso: no sobreescribimos errores de carga inicial.
			}
		};

		const interval = setInterval(() => {
			void pollConversations();
		}, CONVERSATIONS_POLL_INTERVAL_MS);

		return () => {
			disposed = true;
			clearInterval(interval);
		};
	}, [token, currentUserId, usersById]);

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

	useEffect(() => {
		if (!token || !selectedChatId) return;

		let disposed = false;

		const pollMessages = async () => {
			try {
				const response = await fetch(buildApiUrl(`/chat/conversations/${selectedChatId}/messages`), {
					headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				});

				if (!response.ok || disposed) return;

				const backendMessages = await response.json() as BackendMessage[];
				if (disposed) return;

				setMessages(backendMessages.map((message) => mapMessageToUI(message, currentUserId)));
			} catch {
				// Poll silencioso: no sobreescribimos errores de carga inicial.
			}
		};

		const interval = setInterval(() => {
			void pollMessages();
		}, MESSAGES_POLL_INTERVAL_MS);

		return () => {
			disposed = true;
			clearInterval(interval);
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
			setMessages((previousMessages: Message[]) => [
				...previousMessages,
				mapMessageToUI(data.message, currentUserId),
			]);

			setRawConversations((previousConversations: BackendConversation[]) => previousConversations.map((conversation: BackendConversation) => {
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

	const handleStartNewConversation = async () => {
		setShowUserPicker(true);
		setSearchQuery('');
		void searchUsers('');
	};

	const searchUsers = async (query: string) => {
		if (!token) return;
		setSearchLoading(true);
		setSearchError(null);

		try {
			const response = await fetch(buildApiUrl(`/users/search?q=${encodeURIComponent(query)}&limit=20`), {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error('No se pudo buscar usuarios');
			}

			const profiles = await response.json() as UserProfile[];
			setSearchResults(profiles.filter((profile) => profile.id !== currentUserId));
		} catch (error) {
			setSearchError(error instanceof Error ? error.message : 'No se pudo buscar usuarios');
		} finally {
			setSearchLoading(false);
		}
	};

	const handleSelectRecipient = async (profile: UserProfile) => {
		if (!token) return;

		setCreatingConversation(true);
		setConversationsError(null);

		try {
			const convResponse = await fetch(buildApiUrl('/chat/conversations'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ recipientId: profile.id }),
			});

			if (!convResponse.ok) {
				throw new Error('No se pudo crear la conversación');
			}

			const { conversation } = await convResponse.json() as { conversation: BackendConversation };

			setRawConversations((previous: BackendConversation[]) => {
				const exists = previous.find((c: BackendConversation) => c.id === conversation.id);
				if (exists) return previous.map((c: BackendConversation) => (c.id === conversation.id ? conversation : c));
				return [...previous, conversation];
			});

			setUsersById((previous: Record<string, User>) => ({
				...previous,
				[profile.id]: {
					id: profile.id,
					login: profile.login,
					displayName: profile.display_name || profile.login,
					avatar: (profile.display_name || profile.login).charAt(0).toUpperCase(),
					avatarUrl: profile.avatar_url,
					level: 0,
				},
			}));

			setSelectedChatId(conversation.id);
			setShowUserPicker(false);
		} catch (error) {
			setConversationsError(error instanceof Error ? error.message : 'No se pudo crear la conversación');
		} finally {
			setCreatingConversation(false);
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
				onStartNewConversation={handleStartNewConversation}
			/>
			<ChatWindow
				selectedChat={selectedChat}
				messages={messages}
				loading={loadingMessages || creatingConversation}
				error={messagesError}
				sending={sendingMessage}
				onSendMessage={handleSendMessage}
				onStartNewConversation={handleStartNewConversation}
			/>

			{showUserPicker && (
				<Modal title="Nuevo mensaje" onClose={() => setShowUserPicker(false)}>
					<div className="space-y-3">
						<div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-ft-border bg-ft-bg/60">
							<SearchIcon />
							<input
								type="text"
								placeholder="Buscar usuario..."
								value={searchQuery}
								onChange={(event: any) => {
									const nextQuery = event.target.value;
									setSearchQuery(nextQuery);
									void searchUsers(nextQuery);
								}}
								className="w-full bg-transparent text-sm text-white placeholder-ft-muted focus:outline-none"
							/>
						</div>

						<div className="max-h-80 overflow-y-auto rounded-xl border border-ft-border bg-ft-bg/40">
							{searchLoading && <p className="px-3 py-2 text-sm text-ft-muted">Buscando usuarios...</p>}
							{!searchLoading && searchError && <p className="px-3 py-2 text-sm text-red-400">{searchError}</p>}
							{!searchLoading && !searchError && searchResults.length === 0 && (
								<p className="px-3 py-2 text-sm text-ft-muted">Sin resultados</p>
							)}
							{!searchLoading && !searchError && searchResults.map((profile: UserProfile) => (
								<button
									key={profile.id}
									onClick={() => void handleSelectRecipient(profile)}
									className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-ft-hover transition-colors"
								>
									<Avatar login={profile.login} imageUrl={profile.avatar_url} size="md" />
									<div className="min-w-0">
										<p className="text-sm text-white font-semibold truncate">{profile.display_name || profile.login}</p>
										<p className="text-xs text-ft-muted truncate">@{profile.login}</p>
									</div>
								</button>
							))}
						</div>

						<div className="flex justify-end">
							<button
								onClick={() => setShowUserPicker(false)}
								className="px-4 py-2 text-sm rounded-lg border border-ft-border text-ft-muted hover:text-white hover:bg-ft-hover transition-colors"
							>
								Cerrar
							</button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	);
};

export default ChatPage;
