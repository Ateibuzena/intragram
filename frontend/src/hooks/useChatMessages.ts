import { useEffect, useRef, useState } from 'react';
import type { ChatNewMessagePayload } from '@intragram/shared/realtime';
import type { Message } from '@/types/chat';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { type BackendMessage, mapMessageToUI } from '@/utils/chatMappers';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { usePolledResource } from '@/hooks/usePolledResource';

// Messages are delivered live via the 'chat:new-message' socket event below —
// this poll is only a reconciliation fallback for events missed during a
// reconnect gap, so it can afford to be slow.
const MESSAGES_RECONCILE_INTERVAL_MS = 25_000;

export const useChatMessages = (
	token: string | null,
	selectedChatId: string | null,
	currentUserId: string | null,
) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Only the first load for a given conversation shows the loading/error
	// state — the reconciliation poll below stays silent, same as before.
	const isInitialLoadRef = useRef(true);
	useEffect(() => { isInitialLoadRef.current = true; }, [token, selectedChatId]);

	const fetchMessages = async (): Promise<Message[] | null> => {
		if (!token || !selectedChatId) return null;
		const showLoading = isInitialLoadRef.current;
		if (showLoading) { setLoading(true); setError(null); }
		try {
			const res = await fetchWithAuth(`/chat/conversations/${selectedChatId}/messages`, token);
			if (!res.ok) {
				if (showLoading) setError('No se pudieron cargar los mensajes');
				return null;
			}
			const raw = await res.json() as BackendMessage[];
			return raw.map((m) => mapMessageToUI(m, currentUserId));
		} catch (err) {
			if (showLoading) setError(err instanceof Error ? err.message : 'No se pudieron cargar los mensajes');
			return null;
		} finally {
			if (showLoading) { setLoading(false); isInitialLoadRef.current = false; }
		}
	};

	usePolledResource<Message[]>({
		enabled: !!token && !!selectedChatId,
		fetcher: fetchMessages,
		onData: setMessages,
		onDisabled: () => setMessages([]),
		intervalMs: MESSAGES_RECONCILE_INTERVAL_MS,
		deps: [token, selectedChatId, currentUserId],
	});

	// Real-time: append the message as soon as it arrives instead of waiting
	// for the next reconciliation poll. Ignores events for a conversation that
	// isn't the one currently open, and de-dupes by id against the poll/optimistic add.
	useSocketEvent('chat:new-message', (payload: ChatNewMessagePayload) => {
		if (payload.conversationId !== selectedChatId) return;
		setMessages((prev) => {
			if (prev.some((m) => String(m.id) === payload.id)) return prev;
			const backendMessage: BackendMessage = {
				id: payload.id,
				conversationId: payload.conversationId,
				senderId: payload.senderId,
				message: payload.message,
				attachments: [],
				image_mime_type: payload.has_image ? 'image/webp' : null,
				created_at: payload.created_at,
			};
			return [...prev, mapMessageToUI(backendMessage, currentUserId)];
		});
	});

	const sendMessage = async (
		messageText: string,
		imageFile?: File | null,
		onSuccess?: (raw: BackendMessage) => void,
	): Promise<void> => {
		if (!selectedChatId || !token) return;
		if (!messageText.trim() && !imageFile) return;
		setSending(true);
		setError(null);
		try {
			// Multipart only when there's an image attached — the gateway's
			// FileInterceptor on this route only parses multipart/form-data
			// bodies, same constraint as /posts/feed.
			const init = imageFile
				? (() => {
						const formData = new FormData();
						formData.append('message', messageText);
						formData.append('image', imageFile);
						return { method: 'POST', body: formData };
					})()
				: {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ message: messageText, attachments: [] }),
					};

			const res = await fetchWithAuth(`/chat/conversations/${selectedChatId}/messages`, token, init);
			if (!res.ok) throw new Error('No se pudo enviar el mensaje');
			const data = await res.json() as { message: BackendMessage };
			setMessages((prev) => [...prev, mapMessageToUI(data.message, currentUserId)]);
			onSuccess?.(data.message);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje');
		} finally {
			setSending(false);
		}
	};

	return { messages, loading, sending, error, sendMessage };
};
