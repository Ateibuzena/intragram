import { createPortal } from 'react-dom';
import { usePresenceStatus } from '@/hooks/usePresenceContext';

/**
 * Small non-blocking signal that real-time features (chat, notifications,
 * presence) are temporarily down and socket.io is retrying in the background —
 * without this, a dropped connection is silent until the user notices nothing
 * is updating anymore.
 */
export const ConnectionBanner = () => {
	const { reconnecting } = usePresenceStatus();

	if (!reconnecting) return null;

	return createPortal(
		<div className="fixed top-3 left-1/2 z-[1000] -translate-x-1/2 rounded-full border border-ft-cyan/30 bg-ft-card px-4 py-1.5 text-[11px] font-semibold text-ft-cyan shadow-lg">
			Reconectando…
		</div>,
		document.body,
	);
};
