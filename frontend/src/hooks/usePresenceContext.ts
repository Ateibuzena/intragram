import { createContext, useContext } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { ClientToServerEvents } from '@intragram/shared/realtime';
import type { AppSocket } from './usePresence';

interface PresenceContextType {
	connected: boolean;
	/** True only while socket.io is actively retrying after a drop. */
	reconnecting: boolean;
	presenceMap: Record<string, boolean>;
	socketRef: MutableRefObject<AppSocket | null>;
	emit: <E extends keyof ClientToServerEvents>(event: E, data: Parameters<ClientToServerEvents[E]>[0]) => void;
	unreadChats: number;
	setUnreadChats: Dispatch<SetStateAction<number>>;
	syncUnreadChats: () => Promise<void>;
	currentChatRef: MutableRefObject<string | null>;
}

const noop = () => {};
const defaultSocketRef: MutableRefObject<AppSocket | null> = { current: null };
const defaultChatRef: MutableRefObject<string | null> = { current: null };

export const PresenceContext = createContext<PresenceContextType>({
	connected: false,
	reconnecting: false,
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
