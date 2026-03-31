import { useState } from 'react';
import './ChatWindow.css';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import type { ChatWindowProps } from '@/types/props';
import { MessageBubble } from './MessageBubble';

export const ChatWindow = ({
	selectedChat,
	messages,
	loading = false,
	error = null,
	sending = false,
	onSendMessage,
}: ChatWindowProps) => {
	const [messageText, setMessageText] = useState('');

	const handleSend = async () => {
		const trimmed = messageText.trim();
		if (!trimmed || sending) return;

		await onSendMessage(trimmed);
		setMessageText('');
	};

	if (!selectedChat) {
		return (
			<div className="chat-empty">
				<div className="w-24 h-24 rounded-full bg-ft-card border-2 border-ft-border flex items-center justify-center mb-4">
					<svg className="w-12 h-12 text-ft-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
				</div>
				<h3 className="text-xl font-bold text-white mb-2">Tus mensajes</h3>
				<p className="text-ft-muted text-sm text-center max-w-sm">Envía fotos y mensajes privados a un amigo o grupo</p>
				<Button variant="primary" size="md" className="mt-6">Enviar mensaje</Button>
			</div>
		);
	}

	return (
		<div className="chat-window">
			<div className="chat-header">
				<div className="flex items-center gap-3">
					<Avatar login={selectedChat.user.login} size="md" />
					<div>
						<p className="text-sm font-semibold text-white">{selectedChat.user.login}</p>
						<p className="text-xs text-ft-muted">activo {selectedChat.user.lastSeen}</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{[
						"M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
						"M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
					].map((d, i) => (
						<button key={i} className="p-2 hover:bg-ft-hover rounded-lg transition-colors">
							<svg className="w-5 h-5 text-ft-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
							</svg>
						</button>
					))}
				</div>
			</div>

			<div className="chat-messages">
				{loading && <p className="text-sm text-ft-muted text-center py-4">Cargando mensajes...</p>}
				{!loading && error && <p className="text-sm text-red-400 text-center py-4">{error}</p>}
				{!loading && !error && messages.length === 0 && (
					<p className="text-sm text-ft-muted text-center py-4">Todavia no hay mensajes en esta conversacion.</p>
				)}
				{messages.map((msg, idx) => (
					<MessageBubble key={msg.id} message={msg}
						showTimestamp={idx === 0 || messages[idx - 1].timestamp !== msg.timestamp} />
				))}
			</div>

			<div className="chat-input-area">
				<div className="flex items-center gap-3">
					<button className="p-2 hover:bg-ft-hover rounded-lg transition-colors flex-shrink-0">
						<svg className="w-5 h-5 text-ft-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
					</button>
					<div className="chat-input-wrapper">
						<input type="text" placeholder="Envía un mensaje..." value={messageText}
							onChange={(e) => setMessageText(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									void handleSend();
								}
							}}
							disabled={sending}
							className="flex-1 bg-transparent text-sm text-white placeholder-ft-muted focus:outline-none" />
					</div>
					<button
						onClick={() => {
							void handleSend();
						}}
						disabled={sending || !messageText.trim()}
						className="p-2.5 bg-ft-cyan hover:bg-ft-cyan-light rounded-full transition-all hover:shadow-ft-glow-sm active:scale-95 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
};
