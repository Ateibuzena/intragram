import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

export const usePresence = () => {
	const { token } = useAuth();
	const socketRef = useRef<Socket | null>(null);
	const [connected, setConnected] = useState(false);
	const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});

	useEffect(() => {
		if (!token) {
			socketRef.current?.disconnect();
			socketRef.current = null;
			setConnected(false);
			setPresenceMap({});
			return;
		}

		if (socketRef.current?.connected) return;

		const socket = io(window.location.origin, {
			path: '/api/socket.io',
			auth: { token },
			reconnection: true,
			reconnectionDelay: 5000,
			reconnectionAttempts: 10,
			transports: ['polling', 'websocket'],
		});

		socket.on('connect', () => setConnected(true));
		socket.on('disconnect', () => setConnected(false));
		socket.on('connect_error', () => setConnected(false));

		// Initial snapshot: set all received IDs as online, rest as offline
		socket.on('online:users', (userIds: string[]) => {
			const next: Record<string, boolean> = {};
			userIds.forEach((id) => { next[id] = true; });
			setPresenceMap(next);
		});

		// Real-time delta: one user changed status
		socket.on('user:status', ({ userId, active }: { userId: string; active: boolean }) => {
			setPresenceMap((prev) => ({ ...prev, [userId]: active }));
		});

		socketRef.current = socket;

		return () => {
			socket.disconnect();
			socketRef.current = null;
			setConnected(false);
			setPresenceMap({});
		};
	}, [token]);

	return { connected, presenceMap };
};
