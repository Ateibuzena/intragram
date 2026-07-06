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
export type MessageType = 'text' | 'audio' | 'image';

export interface Message {
	id: string | number;
	sender: MessageSender;
	type?: MessageType;
	text?: string;
	imageUrl?: string | null;
	duration?: string;
	timestamp: string;
	reactions?: string[];
}

export interface Conversation {
	id: string | number;
	user: User;
	lastMessage: string;
	lastMessageHasImage?: boolean;
	timestamp: string;
	unread: number;
}

export interface PendingFriendRequest {
	id: string;
	login: string;
	avatar_url?: string | null;
}
