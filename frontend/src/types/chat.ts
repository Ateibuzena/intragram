export interface User {
	id?: string | number;
	login: string;
	avatar: string;
	avatarUrl?: string | null;
	displayName?: string;
	level: number;
	lastSeen?: string;
	online?: boolean;
}

export type MessageSender = 'me' | 'other';
export type MessageType = 'text' | 'audio';

export interface Message {
	id: string | number;
	sender: MessageSender;
	type?: MessageType;
	text?: string;
	duration?: string;
	timestamp: string;
	reactions?: string[];
}

export interface Conversation {
	id: string | number;
	user: User;
	lastMessage: string;
	timestamp: string;
	unread: boolean;
}

export type ChatTab = 'mensajes' | 'solicitudes';

export interface PendingFriendRequest {
	id: string;
	login: string;
	avatar_url?: string | null;
}
