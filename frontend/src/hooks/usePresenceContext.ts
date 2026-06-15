import { createContext, useContext } from 'react';

interface PresenceContextType {
	connected: boolean;
}

export const PresenceContext = createContext<PresenceContextType>({ connected: false });

export const usePresenceStatus = () => useContext(PresenceContext);
