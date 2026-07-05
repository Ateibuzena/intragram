import type * as React from 'react';
import type { Conversation, Message, PendingFriendRequest } from './chat';
import type { FilterKey, Post } from './feed';

export type NavKey = 'home' | 'chat' | 'profile';

export interface PostCardProps {
	post: Post;
	onDelete?: (postId: string) => void;
	isNew?: boolean;
}

export interface MessageBubbleProps {
	key?: string | number;
	message: Message;
	showTimestamp: boolean;
}

export interface ConversationListProps {
	conversations: Conversation[];
	requestConversations?: Conversation[];
	loading?: boolean;
	error?: string | null;
	selectedChat: Conversation | null;
	onSelectChat: (chat: Conversation) => void;
	onStartNewConversation?: () => void;
	onDeleteChat?: (convId: string) => Promise<void>;
}

export interface ChatWindowProps {
	selectedChat: Conversation | null;
	messages: Message[];
	loading?: boolean;
	error?: string | null;
	sending?: boolean;
	onSendMessage: (message: string, imageFile?: File | null) => Promise<void>;
	onStartNewConversation?: () => void;
}

export interface SidebarProps {
	activeFilter: FilterKey;
	setActiveFilter: (filter: FilterKey) => void;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
	children: React.ReactNode;
}

export interface AvatarProps {
	login: string;
	imageUrl?: string | null;
	size?: 'sm' | 'md' | 'lg';
	online?: boolean;
}

export interface BadgeProps {
	children: React.ReactNode;
	variant?: 'level' | 'notification' | 'status';
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	icon?: React.ReactNode;
}

export interface ModalProps {
	onClose: () => void;
	children: React.ReactNode;
	title?: string;
}
