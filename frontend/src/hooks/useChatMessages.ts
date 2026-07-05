import { useEffect, useState } from 'react';
import type { Message } from '@/types/chat';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { type BackendMessage, mapMessageToUI } from '@/utils/chatMappers';

const MESSAGES_POLL_INTERVAL_MS = 2000;

export const useChatMessages = (
	token: string | null,
	selectedChatId: string | null,
	currentUserId: string | null,
) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!token || !selectedChatId) {
			setMessages([]);
			return;
		}

		let cancelled = false;

		const load = async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetchWithAuth(`/chat/conversations/${selectedChatId}/messages`, token);
				if (!res.ok) throw new Error('No se pudieron cargar los mensajes');
				const raw = await res.json() as BackendMessage[];
				if (!cancelled) setMessages(raw.map((m) => mapMessageToUI(m, currentUserId)));
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudieron cargar los mensajes');
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		void load();
		return () => { cancelled = true; };
	}, [token, selectedChatId, currentUserId]);

	useEffect(() => {
		if (!token || !selectedChatId) return;
		let disposed = false;

		const poll = async () => {
			try {
				const res = await fetchWithAuth(`/chat/conversations/${selectedChatId}/messages`, token);
				if (!res.ok || disposed) return;
				const raw = await res.json() as BackendMessage[];
				if (disposed) return;
				setMessages(raw.map((m) => mapMessageToUI(m, currentUserId)));
			} catch {
				// silent poll
			}
		};

		const interval = setInterval(() => { void poll(); }, MESSAGES_POLL_INTERVAL_MS);
		return () => { disposed = true; clearInterval(interval); };
	}, [token, selectedChatId, currentUserId]);

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
