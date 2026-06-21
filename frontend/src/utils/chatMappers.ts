import type { Conversation, Message, User } from '@/types/chat';
import { formatTime } from '@/utils/formatters';

export interface BackendConversation {
	id: string;
	participants: string[];
	created_at: string;
	updated_at: string;
	last_message: string | null;
	last_message_at: string | null;
}

export interface BackendMessage {
	id: string;
	conversationId: string;
	senderId: string;
	message: string;
	attachments: string[];
	created_at: string;
}

export interface SendMessageResponse {
	message: BackendMessage;
}

export interface ChatUserProfile {
	id: string;
	login: string;
	display_name: string | null;
	avatar_url: string | null;
	active?: boolean;
}

const fallbackLogin = (userId: string): string => userId.slice(0, 8);

export const mapConversationToUI = (
	conversation: BackendConversation,
	currentUserId: string | null,
	usersById: Record<string, User>,
): Conversation => {
	const otherParticipantId =
		conversation.participants.find((participantId) => participantId !== currentUserId) ??
		conversation.participants[0] ??
		'unknown';

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

export const mapMessageToUI = (message: BackendMessage, currentUserId: string | null): Message => ({
	id: message.id,
	sender: message.senderId === currentUserId ? 'me' : 'other',
	text: message.message,
	timestamp: new Date(message.created_at).toLocaleString('es-ES', {
		dateStyle: 'short',
		timeStyle: 'short',
	}),
});

export const mapChatUserProfileToUser = (profile: ChatUserProfile): User => ({
	id: profile.id,
	login: profile.login,
	displayName: profile.display_name || profile.login,
	avatar: (profile.display_name || profile.login).charAt(0).toUpperCase(),
	avatarUrl: profile.avatar_url,
	level: 0,
	online: profile.active ?? false,
});
