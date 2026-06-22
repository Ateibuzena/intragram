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

export interface Post {
	id: string | number;
	user: Pick<User, 'id' | 'login' | 'level' | 'avatarUrl'> & { active?: boolean };
	content: string;
	time: string;
	likes: number;
	comments: number;
	liked: boolean;
	saved?: boolean;
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
	unread: number;
}

export interface PostComment {
	id: string;
	post_id: string;
	content: string;
	created_at: string;
	author: {
		id: string;
		login: string;
		display_name: string | null;
		avatar_url: string | null;
		active?: boolean;
	};
}

export type FilterKey = 'reciente' | 'amigos' | 'favoritos' | 'trending' | 'perfil';
export type NavKey = 'home' | 'chat' | 'profile';
export type ChatTab = 'mensajes' | 'solicitudes';
