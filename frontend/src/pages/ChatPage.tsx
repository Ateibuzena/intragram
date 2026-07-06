import { useEffect, useMemo, useState } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useChatConversations } from '@/hooks/useChatConversations';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useFriendContext } from '@/hooks/useFriendContext';
import { usePresenceStatus } from '@/hooks/usePresenceContext';
import { decodeTokenPayload } from '@/utils/auth';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { mapChatUserProfileToUser } from '@/utils/chatMappers';
import type { ChatUserProfile, BackendConversation } from '@/utils/chatMappers';

const SearchIcon = () => (
	<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
	</svg>
);

const ChatPage = () => {
	const { token } = useAuth();
	const { syncUnreadChats, currentChatRef } = usePresenceStatus();

	const currentUserId = useMemo(() => {
		const payload = decodeTokenPayload(token);
		return payload?.chat_user_id ?? payload?.sub ?? null;
	}, [token]);

	const {
		conversations,
		selectedChatId,
		setSelectedChatId,
		selectedChat,
		loading: loadingConversations,
		error: conversationsError,
		addOrUpdateConversation,
		removeConversation,
		updateConversationLastMessage,
		addUser,
		markConversationRead,
	} = useChatConversations(token, currentUserId);

	const {
		messages,
		loading: loadingMessages,
		sending: sendingMessage,
		error: messagesError,
		sendMessage,
	} = useChatMessages(token, selectedChatId, currentUserId);

	const { getRelation } = useFriendContext();

	useEffect(() => {
		currentChatRef.current = selectedChatId;
		return () => { currentChatRef.current = null; };
	}, [selectedChatId, currentChatRef]);

	useEffect(() => {
		if (!selectedChatId) return;
		void markConversationRead(selectedChatId).then(syncUnreadChats);
	}, [selectedChatId, markConversationRead, syncUnreadChats]);

	const [creatingConversation, setCreatingConversation] = useState(false);
	const [showUserPicker, setShowUserPicker] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<ChatUserProfile[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [createError, setCreateError] = useState<string | null>(null);

	const friendConversations = conversations.filter(
		(c) => c.user.id && getRelation(String(c.user.id)) === 'friends',
	);
	const requestConversations = conversations.filter(
		(c) => !c.user.id || getRelation(String(c.user.id)) !== 'friends',
	);

	const handleDeleteChat = async (convId: string) => {
		if (!token) return;
		removeConversation(convId);
		try {
			await fetchWithAuth(`/chat/conversations/${convId}`, token, { method: 'DELETE' });
		} catch {
			// polling will restore it if the request fails
		}
	};

	const handleSendMessage = async (messageText: string, imageFile?: File | null) => {
		await sendMessage(messageText, imageFile, (raw) => {
			updateConversationLastMessage(selectedChatId!, raw.message, raw.created_at, Boolean(raw.image_mime_type));
		});
	};

	const searchUsers = async (query: string) => {
		if (!token) return;
		setSearchLoading(true);
		setSearchError(null);
		try {
			const res = await fetchWithAuth(`/users/search?q=${encodeURIComponent(query)}&limit=20`, token);
			if (!res.ok) throw new Error('No se pudo buscar usuarios');
			const profiles = await res.json() as ChatUserProfile[];
			setSearchResults(profiles.filter((p) => p.id !== currentUserId));
		} catch (err) {
			setSearchError(err instanceof Error ? err.message : 'No se pudo buscar usuarios');
		} finally {
			setSearchLoading(false);
		}
	};

	const handleStartNewConversation = () => {
		setShowUserPicker(true);
		setSearchQuery('');
		void searchUsers('');
	};

	const handleSelectRecipient = async (profile: ChatUserProfile) => {
		if (!token) return;
		setCreatingConversation(true);
		setCreateError(null);
		try {
			const res = await fetchWithAuth('/chat/conversations', token, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ recipientId: profile.id }),
			});
			if (!res.ok) throw new Error('No se pudo crear la conversación');
			const { conversation } = await res.json() as { conversation: BackendConversation };
			addOrUpdateConversation(conversation);
			addUser(profile.id, mapChatUserProfileToUser(profile));
			setSelectedChatId(conversation.id);
			setShowUserPicker(false);
		} catch (err) {
			setCreateError(err instanceof Error ? err.message : 'No se pudo crear la conversación');
		} finally {
			setCreatingConversation(false);
		}
	};

	return (
		<div className="flex h-full">
			<div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}>
				<ConversationList
					conversations={friendConversations}
					requestConversations={requestConversations}
					loading={loadingConversations}
					error={conversationsError}
					selectedChat={selectedChat}
					onSelectChat={(conv) => setSelectedChatId(String(conv.id))}
					onStartNewConversation={handleStartNewConversation}
					onDeleteChat={handleDeleteChat}
				/>
			</div>
			<div className={`${selectedChatId ? 'flex' : 'hidden md:flex'} flex-1 w-full`}>
				<ChatWindow
					selectedChat={selectedChat}
					messages={messages}
					loading={loadingMessages || creatingConversation}
					error={messagesError ?? createError}
					sending={sendingMessage}
					onSendMessage={handleSendMessage}
					onStartNewConversation={handleStartNewConversation}
					onBack={() => setSelectedChatId(null)}
				/>
			</div>

			{showUserPicker && (
				<Modal title="Nuevo mensaje" onClose={() => setShowUserPicker(false)}>
					<div className="space-y-3">
						<div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-ft-border bg-ft-card">
							<SearchIcon />
							<input
								type="text"
								placeholder="Buscar usuario..."
								value={searchQuery}
								onChange={(e) => {
									const q = (e.target as HTMLInputElement).value;
									setSearchQuery(q);
									void searchUsers(q);
								}}
								className="w-full bg-transparent text-sm text-white placeholder-ft-muted focus:outline-none"
							/>
						</div>

						<div className="max-h-80 overflow-y-auto rounded-xl border border-ft-border bg-ft-card">
							{searchLoading && <p className="px-3 py-2 text-sm text-ft-muted">Buscando usuarios...</p>}
							{!searchLoading && searchError && <p className="px-3 py-2 text-sm text-red-400">{searchError}</p>}
							{!searchLoading && !searchError && searchResults.length === 0 && (
								<p className="px-3 py-2 text-sm text-ft-muted">Sin resultados</p>
							)}
							{!searchLoading && !searchError && searchResults.map((profile) => (
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
