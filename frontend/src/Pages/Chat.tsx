import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

type StoredSession = {
	access_token: string;
	user: {
		id: string;
		username: string;
		email: string;
		display_name: string | null;
	};
};

type ChatConversation = {
	id: string;
	participants: string[];
	created_at: string;
	updated_at: string;
	last_message: string | null;
	last_message_at: string | null;
};

type ChatMessage = {
	id: string;
	conversationId: string;
	senderId: string;
	message: string;
	attachments: string[];
	created_at: string;
};

type CreateConversationResponse = {
	conversation: ChatConversation;
};

type SendMessageResponse = {
	message: ChatMessage;
};

const API_BASE_URL = 'https://localhost:8443/api';
const AUTH_STORAGE_KEY = 'intragram.auth';

export default function Chat() {
	const router = useNavigate();
	const [session, setSession] = useState<StoredSession | null>(null);
	const [conversations, setConversations] = useState<ChatConversation[]>([]);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [recipientId, setRecipientId] = useState('');
	const [messageText, setMessageText] = useState('');
	const [selectedConversationId, setSelectedConversationId] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);

		if (!rawSession) {
			router('/', { replace: true });
			return;
		}

		try {
			setSession(JSON.parse(rawSession) as StoredSession);
		} catch {
			localStorage.removeItem(AUTH_STORAGE_KEY);
			router('/', { replace: true });
		}
	}, [router]);

	const authHeaders = useMemo(() => {
		if (!session?.access_token) {
			return null;
		}

		return {
			Authorization: `Bearer ${session.access_token}`,
			'Content-Type': 'application/json',
		};
	}, [session]);

	const loadConversations = async () => {
		if (!authHeaders) return;
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
				headers: authHeaders,
			});

			if (!response.ok) {
				throw new Error('No se pudieron cargar las conversaciones');
			}

			const data = (await response.json()) as ChatConversation[];
			setConversations(data);

			if (!selectedConversationId && data.length > 0) {
				setSelectedConversationId(data[0].id);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al cargar conversaciones');
		} finally {
			setIsLoading(false);
		}
	};

	const loadMessages = async (conversationId: string) => {
		if (!authHeaders || !conversationId) return;
		setError(null);

		try {
			const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, {
				headers: authHeaders,
			});

			if (!response.ok) {
				throw new Error('No se pudieron cargar los mensajes');
			}

			const data = (await response.json()) as ChatMessage[];
			setMessages(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al cargar mensajes');
		}
	};

	useEffect(() => {
		if (!authHeaders) return;
		void loadConversations();
	}, [authHeaders]);

	useEffect(() => {
		if (!selectedConversationId || !authHeaders) return;
		void loadMessages(selectedConversationId);
	}, [selectedConversationId, authHeaders]);

	const handleCreateConversation = async () => {
		if (!authHeaders || !recipientId.trim()) return;

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
				method: 'POST',
				headers: authHeaders,
				body: JSON.stringify({ recipientId: recipientId.trim() }),
			});

			if (!response.ok) {
				throw new Error('No se pudo crear la conversación');
			}

			const data = (await response.json()) as CreateConversationResponse;
			await loadConversations();
			setSelectedConversationId(data.conversation.id);
			setRecipientId('');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al crear conversación');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSendMessage = async () => {
		if (!authHeaders || !selectedConversationId || !messageText.trim()) return;

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(`${API_BASE_URL}/chat/conversations/${selectedConversationId}/messages`, {
				method: 'POST',
				headers: authHeaders,
				body: JSON.stringify({ message: messageText.trim(), attachments: [] }),
			});

			if (!response.ok) {
				throw new Error('No se pudo enviar el mensaje');
			}

			const data = (await response.json()) as SendMessageResponse;
			setMessages((previousMessages: ChatMessage[]) => [...previousMessages, data.message]);
			setMessageText('');
			await loadConversations();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al enviar mensaje');
		} finally {
			setIsLoading(false);
		}
	};

	const activeConversation = conversations.find((conversation: ChatConversation) => conversation.id === selectedConversationId) ?? null;

	return (
		<div style={{
			minHeight: '100vh',
			padding: '24px',
			background: 'radial-gradient(circle at top, #1f2a44 0%, #0b1020 45%, #050816 100%)',
			color: '#e5eefc',
			fontFamily: 'Inter, system-ui, sans-serif',
		}}>
			<div style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				marginBottom: '20px',
			}}>
				<div>
					<p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: '12px', color: '#7dd3fc' }}>Intragram Chat</p>
					<h1 style={{ margin: '8px 0 0', fontSize: '32px' }}>Conversaciones protegidas</h1>
				</div>
				<div style={{ textAlign: 'right', color: '#9fb0d0' }}>
					<div style={{ fontSize: '14px' }}>Sesión</div>
					<div style={{ fontWeight: 700 }}>{session?.user.username ?? 'sin sesión'}</div>
				</div>
			</div>

			{error ? (
				<div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.3)', color: '#fecaca' }}>
					{error}
				</div>
			) : null}

			<div style={{
				display: 'grid',
				gridTemplateColumns: '320px 1fr',
				gap: '18px',
			}}>
				<aside style={{
					padding: '18px',
					borderRadius: '20px',
					background: 'rgba(10, 15, 30, 0.72)',
					border: '1px solid rgba(148, 163, 184, 0.16)',
					backdropFilter: 'blur(18px)',
				}}>
					<h2 style={{ marginTop: 0 }}>Nueva conversación</h2>
					<label style={{ display: 'block', marginBottom: '8px', color: '#9fb0d0' }}>Recipient ID</label>
						<input
							value={recipientId}
							onChange={(event: ChangeEvent<HTMLInputElement>) => setRecipientId(event.target.value)}
						placeholder="id del otro usuario"
						style={{ width: '100%', boxSizing: 'border-box', marginBottom: '12px', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.2)', background: 'rgba(15, 23, 42, 0.88)', color: '#e5eefc' }}
					/>
					<button
						onClick={handleCreateConversation}
						disabled={isLoading || !recipientId.trim()}
						style={{
							width: '100%',
							border: 'none',
							borderRadius: '12px',
							padding: '12px 14px',
							fontWeight: 700,
							cursor: 'pointer',
							color: '#08111f',
							background: 'linear-gradient(135deg, #7dd3fc 0%, #a78bfa 100%)',
							opacity: isLoading || !recipientId.trim() ? 0.72 : 1,
						}}
					>
						Crear conversación
					</button>

					<div style={{ marginTop: '24px' }}>
						<h2 style={{ marginBottom: '12px' }}>Conversations</h2>
						<div style={{ display: 'grid', gap: '10px' }}>
							{conversations.length === 0 ? (
								<p style={{ color: '#9fb0d0', margin: 0 }}>No hay conversaciones todavía.</p>
							) : conversations.map((conversation: ChatConversation) => {
								const partner = conversation.participants.find((participant: string) => participant !== session?.user.id) ?? conversation.participants[0];

								return (
									<button
										key={conversation.id}
										onClick={() => setSelectedConversationId(conversation.id)}
										style={{
											textAlign: 'left',
											padding: '12px 14px',
											borderRadius: '14px',
											border: conversation.id === selectedConversationId ? '1px solid rgba(125, 211, 252, 0.6)' : '1px solid rgba(148, 163, 184, 0.14)',
											background: conversation.id === selectedConversationId ? 'rgba(125, 211, 252, 0.12)' : 'rgba(15, 23, 42, 0.72)',
											color: '#e5eefc',
											cursor: 'pointer',
										}}
									>
										<div style={{ fontWeight: 700 }}>{partner}</div>
										<div style={{ fontSize: '13px', color: '#9fb0d0', marginTop: '4px' }}>{conversation.last_message ?? 'Sin mensajes aún'}</div>
									</button>
								);
							})}
						</div>
					</div>
				</aside>

				<main style={{
					padding: '18px',
					borderRadius: '20px',
					background: 'rgba(10, 15, 30, 0.72)',
					border: '1px solid rgba(148, 163, 184, 0.16)',
					backdropFilter: 'blur(18px)',
					minHeight: '72vh',
					display: 'flex',
					flexDirection: 'column',
				}}>
					<header style={{ paddingBottom: '14px', borderBottom: '1px solid rgba(148, 163, 184, 0.14)' }}>
						<h2 style={{ margin: 0 }}>{activeConversation ? `Conversation ${activeConversation.id.slice(0, 8)}` : 'Selecciona una conversación'}</h2>
						<p style={{ margin: '8px 0 0', color: '#9fb0d0' }}>
							{activeConversation ? `${activeConversation.participants.length} participantes` : 'Crea una conversación con otro user id.'}
						</p>
					</header>

					<section style={{ flex: 1, padding: '16px 0', display: 'grid', gap: '10px', alignContent: 'start' }}>
						{messages.length === 0 ? (
							<p style={{ color: '#9fb0d0', margin: 0 }}>No hay mensajes todavía.</p>
						) : messages.map((message) => (
							<div
								key={message.id}
								style={{
									maxWidth: '72%',
									alignSelf: message.senderId === session?.user.id ? 'end' : 'start',
									padding: '12px 14px',
									borderRadius: '16px',
									background: message.senderId === session?.user.id ? 'linear-gradient(135deg, rgba(125, 211, 252, 0.24), rgba(167, 139, 250, 0.24))' : 'rgba(15, 23, 42, 0.9)',
									border: '1px solid rgba(148, 163, 184, 0.16)',
								}}>
								<div style={{ fontSize: '12px', color: '#9fb0d0', marginBottom: '6px' }}>
									{message.senderId === session?.user.id ? 'Tú' : message.senderId}
								</div>
								<div style={{ lineHeight: 1.5 }}>{message.message}</div>
							</div>
						))}
					</section>

					<footer style={{ display: 'flex', gap: '10px', borderTop: '1px solid rgba(148, 163, 184, 0.14)', paddingTop: '14px' }}>
						<input
							value={messageText}
							onChange={(event) => setMessageText(event.target.value)}
							placeholder={selectedConversationId ? 'Escribe un mensaje...' : 'Selecciona una conversación primero'}
							disabled={!selectedConversationId || isLoading}
							style={{ flex: 1, padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(148, 163, 184, 0.2)', background: 'rgba(15, 23, 42, 0.88)', color: '#e5eefc' }}
						/>
						<button
							onClick={handleSendMessage}
							disabled={!selectedConversationId || !messageText.trim() || isLoading}
							style={{
								border: 'none',
								borderRadius: '14px',
								padding: '14px 18px',
								fontWeight: 700,
								cursor: 'pointer',
								color: '#08111f',
								background: 'linear-gradient(135deg, #7dd3fc 0%, #a78bfa 100%)',
								opacity: !selectedConversationId || !messageText.trim() || isLoading ? 0.72 : 1,
							}}
						>
							Enviar
						</button>
					</footer>
				</main>
			</div>
		</div>
	);
}