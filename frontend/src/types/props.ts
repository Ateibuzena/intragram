import type { Conversation, FilterKey, Message, Post } from './models';

export interface PostCardProps {
	post: Post;
}

export interface MessageBubbleProps {
	message: Message;
	showTimestamp: boolean;
}

export interface ConversationListProps {
	conversations: Conversation[];
	loading?: boolean;
	error?: string | null;
	selectedChat: Conversation | null;
	onSelectChat: (chat: Conversation) => void;
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
