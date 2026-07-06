import { useEffect, useRef } from 'react';
import type { ServerToClientEvents } from '@intragram/shared/realtime';
import { usePresenceStatus } from './usePresenceContext';

/**
 * Subscribes to a typed real-time event for as long as the socket is
 * connected. Wraps the connect-guard + socket.on/off cleanup that used to be
 * hand-copied in every listener (friends, notifications, feed, chat...) —
 * typed against the same contracts the gateway emits from
 * (backend/shared/realtime/contracts/events.ts), so a payload shape change on
 * one side is a compile error on the other instead of a silent runtime bug.
 *
 * `handler` doesn't need to be memoized — the latest version is always used,
 * only the event name re-subscribes the listener.
 */
export function useSocketEvent<E extends keyof ServerToClientEvents>(
	event: E,
	handler: ServerToClientEvents[E],
): void {
	const { socketRef, connected } = usePresenceStatus();
	const handlerRef = useRef(handler);
	handlerRef.current = handler;

	useEffect(() => {
		if (!connected) return;
		const socket = socketRef.current;
		if (!socket) return;

		const listener = ((...args: Parameters<ServerToClientEvents[E]>) => handlerRef.current(...args)) as ServerToClientEvents[E];
		socket.on(event, listener);
		return () => { socket.off(event, listener); };
	}, [connected, socketRef, event]);
}
