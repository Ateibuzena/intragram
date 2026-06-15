import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

export const usePresence = () => {
	const { token } = useAuth();
	const socketRef = useRef<Socket | null>(null);
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		if (!token) {
			socketRef.current?.disconnect();
			socketRef.current = null;
			setConnected(false);
			return;
		}

		if (socketRef.current?.connected) return;

		const socket = io(window.location.origin, {
			path: '/api/socket.io',
			auth: { token },
			reconnection: true,
			reconnectionDelay: 5000,
			reconnectionAttempts: 10,
			transports: ['websocket', 'polling'],
		});

		socket.on('connect', () => setConnected(true));
		socket.on('disconnect', () => setConnected(false));
		socket.on('connect_error', () => setConnected(false));

		socketRef.current = socket;

		return () => {
			socket.disconnect();
			socketRef.current = null;
			setConnected(false);
		};
	}, [token]);

	return { connected };
};
