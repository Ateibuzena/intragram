import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ConversationList.css';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import type { ConversationListProps } from '@/types/ui';
import { usePresenceStatus } from '@/hooks/usePresenceContext';

type ChatTab = 'mensajes' | 'solicitudes';

const SearchIcon = () => (
	<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
	</svg>
);

export const ConversationList = ({
	conversations,
	loading = false,
	error = null,
	selectedChat,
	onSelectChat,
	onStartNewConversation,
	pendingRequests = [],
	pendingLoading = false,
	onAcceptRequest,
	onRejectRequest,
}: ConversationListProps) => {
	const { presenceMap } = usePresenceStatus();
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState('');
	const [activeTab, setActiveTab] = useState<ChatTab>('mensajes');
	const [processingId, setProcessingId] = useState<string | null>(null);

	const filtered = conversations.filter((c) =>
		c.user.login.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const handleAccept = async (id: string, login: string) => {
		setProcessingId(id);
		try { await onAcceptRequest?.(id, login); } finally { setProcessingId(null); }
	};

	const handleReject = async (id: string, login: string) => {
		setProcessingId(id);
		try { await onRejectRequest?.(id, login); } finally { setProcessingId(null); }
	};

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
					{pendingRequests.length > 0 && (
						<span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-ft-cyan/15 text-ft-cyan border border-ft-cyan/30 text-[9px] font-black">
							{pendingRequests.length}
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
						{filtered.map((conv) => (
							<button
								key={conv.id}
								onClick={() => onSelectChat(conv)}
								className={`conv-item ${selectedChat?.id === conv.id ? 'conv-item--selected' : ''}`}
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
									<p className={`text-xs truncate ${conv.unread > 0 ? 'text-white font-medium' : 'text-ft-muted'}`}>{conv.lastMessage}</p>
								</div>
								{conv.unread > 0 && <div className="flex-shrink-0 w-2 h-2 bg-ft-cyan rounded-full mt-2" />}
							</button>
						))}
					</div>
				</>
			)}

			{/* Solicitudes tab */}
			{activeTab === 'solicitudes' && (
				<div className="flex-1 overflow-y-auto">
					{pendingLoading && (
						<p className="px-4 py-6 text-sm text-ft-muted text-center">Cargando solicitudes...</p>
					)}
					{!pendingLoading && pendingRequests.length === 0 && (
						<div className="px-4 py-10 text-center">
							<p className="text-sm text-ft-muted">No tienes solicitudes pendientes.</p>
						</div>
					)}
					{!pendingLoading && pendingRequests.map((req) => (
						<div key={req.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-ft-border">
							<button
								type="button"
								onClick={() => navigate(`/profile/${req.login}`)}
								className="hover:opacity-80 transition-opacity flex-shrink-0"
							>
								<Avatar login={req.login} imageUrl={req.avatar_url ?? null} size="md" />
							</button>
							<button
								type="button"
								onClick={() => navigate(`/profile/${req.login}`)}
								className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
							>
								<p className="text-sm font-semibold text-white truncate">{req.login}</p>
								<p className="text-[10px] text-ft-muted mt-0.5">Quiere ser tu amigo</p>
							</button>
							<div className="flex gap-1.5 flex-shrink-0">
								<button
									type="button"
									disabled={processingId === req.id}
									onClick={() => void handleAccept(req.id, req.login)}
									className="text-[11px] px-2.5 py-1 rounded-lg bg-ft-cyan/15 text-ft-cyan border border-ft-cyan/30 font-semibold hover:bg-ft-cyan/25 disabled:opacity-50 transition-colors"
								>
									{processingId === req.id ? '...' : 'Aceptar'}
								</button>
								<button
									type="button"
									disabled={processingId === req.id}
									onClick={() => void handleReject(req.id, req.login)}
									className="text-[11px] px-2.5 py-1 rounded-lg text-ft-muted border border-ft-border hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
								>
									{processingId === req.id ? '...' : 'Rechazar'}
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</aside>
	);
};
