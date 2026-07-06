import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChatTypingPayload } from '@intragram/shared/realtime';
import './ChatWindow.css';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { PhotoAttachmentButton } from '@/components/media/PhotoAttachmentButton';
import type { ChatWindowProps } from '@/types/ui';
import { MessageBubble } from './MessageBubble';
import { usePresenceStatus } from '@/hooks/usePresenceContext';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { LANGUAGES } from '@/constants/languages';

const TYPING_DEBOUNCE_MS = 400;
const TYPING_CLEAR_MS = 2500;

export const ChatWindow = ({
	selectedChat,
	messages,
	loading = false,
	error = null,
	sending = false,
	onSendMessage,
 	onStartNewConversation,
	onBack,
}: ChatWindowProps) => {
	const { presenceMap, emit } = usePresenceStatus();
	const navigate = useNavigate();
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const [messageText, setMessageText] = useState('');
	const [typingLogin, setTypingLogin] = useState<string | null>(null);
	const typingClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const typingEmitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	// Listen for typing events from the other user.
	useSocketEvent('chat:typing', ({ conversationId, login }: ChatTypingPayload) => {
		if (!selectedChat || String(conversationId) !== String(selectedChat.id)) return;
		setTypingLogin(login);
		if (typingClearTimer.current) clearTimeout(typingClearTimer.current);
		typingClearTimer.current = setTimeout(() => setTypingLogin(null), TYPING_CLEAR_MS);
	});

	useEffect(() => () => {
		if (typingClearTimer.current) clearTimeout(typingClearTimer.current);
	}, []);

	// Clear typing when conversation switches or a message arrives
	useEffect(() => { setTypingLogin(null); }, [selectedChat?.id]);
	useEffect(() => {
		if (messages.length > 0) setTypingLogin(null);
	}, [messages.length]);

	const [showCodePanel, setShowCodePanel] = useState(false);
	const [codeSnippet, setCodeSnippet] = useState('');
	const [codeLang, setCodeLang] = useState('c');
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
	const [imageError, setImageError] = useState<string | null>(null);

	// Revoke the preview object URL whenever it's replaced or the component unmounts.
	useEffect(() => {
		return () => {
			if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
		};
	}, [imagePreviewUrl]);

	const handleImageSelected = (file: File) => {
		setImageError(null);
		if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
		setImageFile(file);
		setImagePreviewUrl(URL.createObjectURL(file));
	};

	const handleRemoveImage = () => {
		if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
		setImageFile(null);
		setImagePreviewUrl(null);
	};

	const handleMessageChange = (value: string) => {
		setMessageText(value);

		if (!selectedChat?.id || !selectedChat?.user?.id) return;

		// Debounce: emit typing event only after user pauses briefly
		if (typingEmitTimer.current) clearTimeout(typingEmitTimer.current);
		typingEmitTimer.current = setTimeout(() => {
			if (value.trim()) {
				emit('chat:typing', {
					conversationId: String(selectedChat.id),
					recipientId: String(selectedChat.user.id),
				});
			}
		}, TYPING_DEBOUNCE_MS);
	};

	useEffect(() => {
		const el = inputRef.current;
		if (!el) return;
		el.style.height = 'auto';
		el.style.height = `${el.scrollHeight}px`;
	}, [messageText]);

	const handleSend = async () => {
		const trimmed = messageText.trim();
		if ((!trimmed && !imageFile) || sending) return;
		await onSendMessage(trimmed, imageFile);
		setMessageText('');
		handleRemoveImage();
		if (inputRef.current) inputRef.current.style.height = 'auto';
		setTimeout(() => inputRef.current?.focus(), 0);
	};

	const handleSendCode = async () => {
		const code = codeSnippet.trim();
		if (!code || sending) return;
		await onSendMessage(`\`\`\`${codeLang}\n${code}\n\`\`\``);
		setCodeSnippet('');
		setShowCodePanel(false);
	};

	const handleToggleCode = () => {
		setShowCodePanel((v) => !v);
		if (showCodePanel) setCodeSnippet('');
	};

	const handleCancelCode = () => {
		setShowCodePanel(false);
		setCodeSnippet('');
	};

	if (!selectedChat) {
		return (
			<div className="chat-empty">
				<div className="w-24 h-24 rounded-full surface-glass border-2 border-ft-border flex items-center justify-center mb-4">
					<svg className="w-12 h-12 text-ft-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
				</div>
				<h3 className="text-xl font-bold text-white mb-2">Tus mensajes</h3>
				<p className="text-ft-muted text-sm text-center max-w-sm">Envía fotos y mensajes privados a un amigo o grupo</p>
				<Button
					variant="primary"
					size="md"
					className="mt-6"
					onClick={onStartNewConversation}
				>
					Enviar mensaje
				</Button>
			</div>
		);
	}

	return (
		<div className="chat-window">
			<div className="chat-header">
				<div className="flex items-center gap-2 sm:gap-3">
					{onBack && (
						<button
							type="button"
							onClick={onBack}
							title="Volver a conversaciones"
							className="md:hidden flex-shrink-0 p-1.5 -ml-1.5 rounded-lg text-ft-muted hover:text-white hover:bg-ft-hover transition-colors"
						>
							<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>
					)}
					{(() => {
						const isOnline = selectedChat.user.id
							? (presenceMap[String(selectedChat.user.id)] ?? selectedChat.user.online)
							: selectedChat.user.online;
						return (
							<>
								<button
									type="button"
									onClick={() => navigate(`/profile/${selectedChat.user.login}`)}
									className="hover:opacity-80 transition-opacity flex-shrink-0"
								>
									<Avatar login={selectedChat.user.login} imageUrl={selectedChat.user.avatarUrl} size="md" online={isOnline} />
								</button>
								<div>
									<button
										type="button"
										onClick={() => navigate(`/profile/${selectedChat.user.login}`)}
										className="text-sm font-semibold text-white hover:text-ft-cyan transition-colors"
									>
										{selectedChat.user.displayName || selectedChat.user.login}
									</button>
									<p className="text-xs text-ft-muted">
										{isOnline ? 'En línea' : (selectedChat.user.lastSeen ? `Visto ${selectedChat.user.lastSeen}` : 'Fuera de línea')}
									</p>
								</div>
							</>
						);
					})()}
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

				{/* Typing indicator */}
				{typingLogin && (
					<div className="flex items-center gap-2 px-1 py-1">
						<span className="text-xs text-ft-muted italic">{typingLogin} está escribiendo</span>
						<span className="flex gap-0.5 items-center">
							<span className="w-1 h-1 rounded-full bg-ft-muted animate-bounce [animation-delay:0ms]" />
							<span className="w-1 h-1 rounded-full bg-ft-muted animate-bounce [animation-delay:150ms]" />
							<span className="w-1 h-1 rounded-full bg-ft-muted animate-bounce [animation-delay:300ms]" />
						</span>
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			<div className="chat-input-area">
				{/* Preview de imagen adjunta */}
				{imagePreviewUrl && (
					<div className="mb-2 relative inline-block">
						<img src={imagePreviewUrl} alt="" className="max-h-32 rounded-xl border border-ft-border object-cover" />
						<button
							type="button"
							onClick={handleRemoveImage}
							title="Quitar imagen"
							className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-ft-bg border border-ft-border text-ft-muted hover:text-red-400 hover:border-red-400/40 transition-colors"
						>
							✕
						</button>
					</div>
				)}
				{imageError && (
					<p className="mb-2 text-xs text-red-400">{imageError}</p>
				)}

				{/* Panel de código */}
				{showCodePanel && (
					<div className="mb-2 border border-ft-cyan/30 rounded-xl overflow-hidden">
						<div className="flex items-center justify-between px-3 py-2 bg-ft-card border-b border-ft-border">
							<select
								value={codeLang}
								onChange={(e: ChangeEvent<HTMLSelectElement>) => setCodeLang(e.target.value)}
								className="bg-transparent text-xs text-ft-cyan font-mono focus:outline-none cursor-pointer"
							>
								{LANGUAGES.map((l) => (
									<option key={l.value} value={l.value} className="bg-ft-bg text-white">
										{l.label}
									</option>
								))}
							</select>
							<button
								type="button"
								onClick={handleCancelCode}
								className="text-ft-muted hover:text-white text-xs transition-colors"
							>
								✕ Cancelar
							</button>
						</div>
						<textarea
							className="w-full bg-ft-card text-xs text-ft-cyan font-mono p-3 focus:outline-none resize-none placeholder-ft-muted/50"
							placeholder={`// Escribe tu código ${codeLang} aquí...`}
							rows={5}
							value={codeSnippet}
							onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCodeSnippet(e.target.value)}
							spellCheck={false}
						/>
						<div className="flex justify-end px-3 py-2 bg-ft-card border-t border-ft-border">
							<button
								type="button"
								onClick={() => { void handleSendCode(); }}
								disabled={!codeSnippet.trim() || sending}
								className="flex items-center gap-1.5 text-xs font-semibold text-ft-cyan bg-ft-cyan/15 border border-ft-cyan/35 hover:bg-ft-cyan/25 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Enviar código →
							</button>
						</div>
					</div>
				)}

				{/* Fila de input principal */}
				<div className="flex items-end gap-3">
					<button
						type="button"
						onClick={handleToggleCode}
						title="Insertar código"
						className={`p-2 rounded-lg transition-colors flex-shrink-0 mb-0.5 ${showCodePanel ? 'bg-ft-cyan/20 text-ft-cyan' : 'hover:bg-ft-hover text-ft-cyan'}`}
					>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
					</button>
					<PhotoAttachmentButton
						onSelect={handleImageSelected}
						onError={setImageError}
						className={`p-2 rounded-lg transition-colors flex-shrink-0 mb-0.5 ${imageFile ? 'bg-ft-cyan/20 text-ft-cyan' : 'hover:bg-ft-hover text-ft-cyan'}`}
					>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							<circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
						</svg>
					</PhotoAttachmentButton>
					<div className="chat-input-wrapper">
						<textarea
							ref={inputRef}
							rows={1}
							placeholder="Envía un mensaje..."
							value={messageText}
							onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleMessageChange(e.target.value)}
							onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault();
									void handleSend();
								}
							}}
							disabled={sending}
							className="flex-1 bg-transparent text-sm text-white placeholder-ft-muted focus:outline-none resize-none overflow-hidden max-h-32 leading-5"
						/>
					</div>
					<button
						onClick={() => { void handleSend(); }}
						disabled={sending || (!messageText.trim() && !imageFile)}
						className="p-2.5 bg-ft-cyan/15 border border-ft-cyan/35 hover:bg-ft-cyan/25 rounded-full transition-all hover:shadow-ft-glow-sm active:scale-95 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg className="w-5 h-5 text-ft-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11l18-8-8 18-2-7-8-3z" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
};
