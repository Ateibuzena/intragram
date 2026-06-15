import type * as React from 'react';
import type { Conversation, FilterKey, Message, Post } from './models';

export interface PostCardProps {
	post: Post;
}

export interface MessageBubbleProps {
	key?: string | number;
	message: Message;
	showTimestamp: boolean;
}

export interface PendingFriendRequest {
	id: string;
	login: string;
	avatar_url?: string | null;
}

export interface ConversationListProps {
	conversations: Conversation[];
	loading?: boolean;
	error?: string | null;
	selectedChat: Conversation | null;
	onSelectChat: (chat: Conversation) => void;
	onStartNewConversation?: () => void;
	pendingRequests?: PendingFriendRequest[];
	pendingLoading?: boolean;
	onAcceptRequest?: (id: string, login: string) => Promise<void>;
	onRejectRequest?: (id: string, login: string) => Promise<void>;
}

export interface ChatWindowProps {
	selectedChat: Conversation | null;
	messages: Message[];
	loading?: boolean;
	error?: string | null;
	sending?: boolean;
	onSendMessage: (message: string) => Promise<void>;
	onStartNewConversation?: () => void;
}

export interface SidebarProps {
	activeFilter: FilterKey;
	setActiveFilter: (filter: FilterKey) => void;
}

export interface FilterDrawerProps {
	activeFilter: FilterKey;
	setActiveFilter: (filter: FilterKey) => void;
	onClose: () => void;
}

export interface SettingsModalProps {
	onClose: () => void;
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

export interface CardProps {
	children: React.ReactNode;
	className?: string;
	hover?: boolean;
}

export interface ModalProps {
	onClose: () => void;
	children: React.ReactNode;
	title?: string;
}
