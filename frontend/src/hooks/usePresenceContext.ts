import { createContext, useContext } from 'react';
import type { MutableRefObject } from 'react';
import type { Socket } from 'socket.io-client';

interface PresenceContextType {
	connected: boolean;
	presenceMap: Record<string, boolean>;
	socketRef: MutableRefObject<Socket | null>;
	emit: (event: string, data: unknown) => void;
}

const noop = () => {};
const defaultRef: MutableRefObject<Socket | null> = { current: null };

export const PresenceContext = createContext<PresenceContextType>({
	connected: false,
	presenceMap: {},
	socketRef: defaultRef,
	emit: noop,
});

export const usePresenceStatus = () => useContext(PresenceContext);

export const useSocketEmit = () => useContext(PresenceContext).emit;

export const useUserOnline = (userId: string | number | null | undefined): boolean | undefined => {
	const { presenceMap } = useContext(PresenceContext);
	if (!userId) return undefined;
	const id = String(userId);
	return id in presenceMap ? presenceMap[id] : undefined;
};
