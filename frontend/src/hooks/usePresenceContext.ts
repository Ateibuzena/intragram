import { createContext, useContext } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Socket } from 'socket.io-client';

interface PresenceContextType {
	connected: boolean;
	presenceMap: Record<string, boolean>;
	socketRef: MutableRefObject<Socket | null>;
	emit: (event: string, data: unknown) => void;
	unreadChats: number;
	setUnreadChats: Dispatch<SetStateAction<number>>;
	syncUnreadChats: () => Promise<void>;
	currentChatRef: MutableRefObject<string | null>;
}

const noop = () => {};
const defaultSocketRef: MutableRefObject<Socket | null> = { current: null };
const defaultChatRef: MutableRefObject<string | null> = { current: null };

export const PresenceContext = createContext<PresenceContextType>({
	connected: false,
	presenceMap: {},
	socketRef: defaultSocketRef,
	emit: noop,
	unreadChats: 0,
	setUnreadChats: noop,
	syncUnreadChats: async () => {},
	currentChatRef: defaultChatRef,
});

export const usePresenceStatus = () => useContext(PresenceContext);

export const useSocketEmit = () => useContext(PresenceContext).emit;

export const useUserOnline = (userId: string | number | null | undefined): boolean | undefined => {
	const { presenceMap } = useContext(PresenceContext);
	if (!userId) return undefined;
	const id = String(userId);
	return id in presenceMap ? presenceMap[id] : undefined;
};
