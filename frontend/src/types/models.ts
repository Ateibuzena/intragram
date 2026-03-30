export interface User {
	id?: string | number;
	login: string;
	avatar: string;
	level: number;
	lastSeen?: string;
	online?: boolean;
}

export interface Post {
	id: string | number;
	user: Pick<User, 'login' | 'level'>;
	content: string;
	time: string;
	likes: number;
	comments: number;
	liked: boolean;
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

export type FilterKey = 'reciente' | 'amigos' | 'seguidos' | 'trending' | 'perfil';
export type NavKey = 'home' | 'chat' | 'notifications';
export type ChatTab = 'mensajes' | 'solicitudes';
