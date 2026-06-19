import { createContext, useContext } from 'react';

interface PresenceContextType {
	connected: boolean;
	presenceMap: Record<string, boolean>;
}

export const PresenceContext = createContext<PresenceContextType>({
	connected: false,
	presenceMap: {},
});

export const usePresenceStatus = () => useContext(PresenceContext);

export const useUserOnline = (userId: string | number | null | undefined): boolean | undefined => {
	const { presenceMap } = useContext(PresenceContext);
	if (!userId) return undefined;
	const id = String(userId);
	return id in presenceMap ? presenceMap[id] : undefined;
};
