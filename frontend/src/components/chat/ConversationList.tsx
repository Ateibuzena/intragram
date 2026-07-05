import { useEffect, useRef, useState } from 'react';
import './ConversationList.css';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import type { ConversationListProps } from '@/types/ui';
import { usePresenceStatus } from '@/hooks/usePresenceContext';

type ChatTab = 'mensajes' | 'solicitudes';

type ContextMenu = { x: number; y: number; convId: string } | null;

const SearchIcon = () => (
	<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
	</svg>
);

export const ConversationList = ({
	conversations,
	requestConversations = [],
	loading = false,
	error = null,
	selectedChat,
	onSelectChat,
	onStartNewConversation,
	onDeleteChat,
}: ConversationListProps) => {
	const { presenceMap } = usePresenceStatus();
	const [searchQuery, setSearchQuery] = useState('');
	const [activeTab, setActiveTab] = useState<ChatTab>('mensajes');
	const [contextMenu, setContextMenu] = useState<ContextMenu>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const contextMenuRef = useRef<HTMLDivElement>(null);

	const filtered = conversations.filter((c) =>
		c.user.login.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const filteredRequests = requestConversations.filter((c) =>
		c.user.login.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	useEffect(() => {
		if (!contextMenu) return;
		const handler = (e: MouseEvent) => {
			if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
				setContextMenu(null);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [contextMenu]);

	const handleContextMenu = (e: React.MouseEvent, convId: string) => {
		e.preventDefault();
		setContextMenu({ x: e.clientX, y: e.clientY, convId });
	};

	const handleDelete = async (convId: string) => {
		setContextMenu(null);
		setDeletingId(convId);
		try { await onDeleteChat?.(convId); }
		finally { setDeletingId(null); }
	};

	const ConvItem = ({ conv }: { conv: (typeof conversations)[0] }) => (
		<button
			key={conv.id}
			onClick={() => onSelectChat(conv)}
			onContextMenu={(e) => handleContextMenu(e, String(conv.id))}
			className={`conv-item ${selectedChat?.id === conv.id ? 'conv-item--selected' : ''} ${deletingId === String(conv.id) ? 'opacity-50 pointer-events-none' : ''}`}
		>
			<div className="relative flex-shrink-0">
				<Avatar
					login={conv.user.login}
					imageUrl={conv.user.avatarUrl}
					size="lg"
					online={conv.user.id ? (presenceMap[String(conv.user.id)] ?? conv.user.online) : conv.user.online}
				/>
				{conv.unread > 0 && (
					<span className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-ft-cyan text-black text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-ft-card leading-none">
						{conv.unread > 99 ? '99+' : conv.unread}
					</span>
				)}
			</div>
			<div className="flex-1 min-w-0 text-left">
				<div className="flex items-center justify-between mb-1">
					<p className={`text-sm font-semibold truncate ${conv.unread > 0 ? 'text-white' : 'text-ft-text'}`}>
						{conv.user.displayName || conv.user.login}
					</p>
					<span className="text-xs text-ft-muted flex-shrink-0 ml-2">{conv.timestamp}</span>
				</div>
				<p className={`flex items-center gap-1 text-xs truncate ${conv.unread > 0 ? 'text-white font-medium' : 'text-ft-muted'}`}>
					{conv.lastMessageHasImage && (
						<svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							<circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
						</svg>
					)}
					<span className="truncate">{conv.lastMessageHasImage ? (conv.lastMessage || 'Foto') : conv.lastMessage}</span>
				</p>
			</div>
			{conv.unread > 0 && <div className="flex-shrink-0 w-2 h-2 bg-ft-cyan rounded-full mt-2" />}
		</button>
	);

	return (
		<aside className="conversation-list">
			{/* Tabs */}
			<div className="flex border-b border-ft-border">
				<button
					type="button"
					onClick={() => setActiveTab('mensajes')}
					className={`flex-1 py-3 text-sm font-semibold transition-colors ${
						activeTab === 'mensajes'
							? 'text-ft-cyan border-b-2 border-ft-cyan -mb-px'
							: 'text-ft-muted hover:text-ft-text'
					}`}
				>
					Mensajes
				</button>
				<button
					type="button"
					onClick={() => setActiveTab('solicitudes')}
					className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
						activeTab === 'solicitudes'
							? 'text-ft-cyan border-b-2 border-ft-cyan -mb-px'
							: 'text-ft-muted hover:text-ft-text'
					}`}
				>
					Solicitudes
					{requestConversations.length > 0 && (
						<span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-ft-cyan/15 text-ft-cyan border border-ft-cyan/30 text-[9px] font-black">
							{requestConversations.length}
						</span>
					)}
				</button>
			</div>

			{/* Mensajes tab */}
			{activeTab === 'mensajes' && (
				<>
					<div className="p-4 border-b border-ft-border">
						<div className="flex items-center gap-2">
							<div className="flex-1">
								<Input icon={<SearchIcon />} placeholder="Buscar" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
							</div>
							<button
								onClick={() => onStartNewConversation?.()}
								className="w-10 h-10 rounded-xl bg-ft-cyan/15 text-ft-cyan border border-ft-cyan/35 flex items-center justify-center hover:bg-ft-cyan/25 transition-colors flex-shrink-0"
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
						{filtered.map((conv) => <ConvItem key={conv.id} conv={conv} />)}
					</div>
				</>
			)}

			{/* Solicitudes tab — only message requests from non-friends */}
			{activeTab === 'solicitudes' && (
				<div className="flex-1 overflow-y-auto">
					{filteredRequests.length === 0 ? (
						<div className="px-4 py-10 text-center">
							<p className="text-sm text-ft-muted">No tienes solicitudes de mensajes.</p>
						</div>
					) : (
						filteredRequests.map((conv) => <ConvItem key={conv.id} conv={conv} />)
					)}
				</div>
			)}

			{/* Context menu */}
			{contextMenu && (
				<div
					ref={contextMenuRef}
					style={{ top: contextMenu.y, left: contextMenu.x }}
					className="fixed z-50 min-w-[140px] rounded-xl border border-ft-border bg-ft-card shadow-lg py-1"
				>
					<button
						type="button"
						onClick={() => void handleDelete(contextMenu.convId)}
						className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
					>
						Eliminar chat
					</button>
				</div>
			)}
		</aside>
	);
};
