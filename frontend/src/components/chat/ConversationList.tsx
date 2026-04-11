import { useState } from 'react';
import './ConversationList.css';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import type { ConversationListProps } from '@/types/props';

const SearchIcon = () => (
	<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
	</svg>
);

export const ConversationList = ({ conversations, loading = false, error = null, selectedChat, onSelectChat, onStartNewConversation }: ConversationListProps) => {
	const [searchQuery, setSearchQuery] = useState('');

	const filtered = conversations.filter(c =>
		c.user.login.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<aside className="conversation-list">
			<div className="p-4 border-b border-ft-border">
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-lg font-bold text-white">Mensajes</h2>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex-1">
						<Input icon={<SearchIcon />} placeholder="Buscar" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
					</div>
					<button
						onClick={() => onStartNewConversation?.()}
						className="w-10 h-10 rounded-xl bg-ft-cyan text-black flex items-center justify-center hover:bg-ft-cyan-light transition-colors"
						title="Nuevo chat"
					>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto">
				{loading && <p className="px-4 py-3 text-sm text-ft-muted">Cargando conversaciones...</p>}
				{!loading && error && <p className="px-4 py-3 text-sm text-red-400">{error}</p>}
				{!loading && !error && filtered.length === 0 && (
					<p className="px-4 py-3 text-sm text-ft-muted">No hay conversaciones disponibles.</p>
				)}
				{filtered.map((conv) => (
					<button key={conv.id} onClick={() => onSelectChat(conv)}
						className={`conv-item ${selectedChat?.id === conv.id ? 'conv-item--selected' : ''}`}>
						<div className="relative flex-shrink-0">
							<Avatar login={conv.user.login} imageUrl={conv.user.avatarUrl} size="lg" />
							{conv.unread && <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-ft-card rounded-full" />}
						</div>
						<div className="flex-1 min-w-0 text-left">
							<div className="flex items-center justify-between mb-1">
								<p className={`text-sm font-semibold truncate ${conv.unread ? 'text-white' : 'text-ft-text'}`}>
									{conv.user.displayName || conv.user.login}
								</p>
								<span className="text-xs text-ft-muted flex-shrink-0 ml-2">{conv.timestamp}</span>
							</div>
							<p className={`text-xs truncate ${conv.unread ? 'text-white font-medium' : 'text-ft-muted'}`}>{conv.lastMessage}</p>
						</div>
						{conv.unread && <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />}
					</button>
				))}
			</div>
		</aside>
	);
};
