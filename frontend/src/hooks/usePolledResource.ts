import { useEffect, useRef } from 'react';

interface UsePolledResourceConfig<T> {
	/** Gate for both the initial fetch and the poll — e.g. `!!token`. */
	enabled: boolean;
	/** Returns the parsed data, or `null` to signal a non-ok response (skip applying it). */
	fetcher: () => Promise<T | null>;
	/** Applies a successful fetch's data to the caller's state. */
	onData: (data: T) => void;
	/** Called once when `enabled` turns false — e.g. to reset state on logout. */
	onDisabled?: () => void;
	/** Reconciliation poll interval, in ms. */
	intervalMs: number;
	/** Extra deps that should re-run the initial fetch (`enabled` is always included). */
	deps?: React.DependencyList;
}

/**
 * Fetch-on-mount + interval poll, the skeleton shared by every "load this
 * resource, then keep it fresh with a reconciliation poll" hook in the app
 * (friends, notifications, chat conversations/messages). Real-time push
 * (sockets) is still each caller's own concern — this only owns the
 * fetch/poll plumbing, not what happens when a socket event fires.
 */
export function usePolledResource<T>({
	enabled,
	fetcher,
	onData,
	onDisabled,
	intervalMs,
	deps = [],
}: UsePolledResourceConfig<T>): { refetch: () => Promise<void> } {
	const fetcherRef = useRef(fetcher);
	fetcherRef.current = fetcher;
	const onDataRef = useRef(onData);
	onDataRef.current = onData;

	const refetch = async (): Promise<void> => {
		const data = await fetcherRef.current();
		if (data !== null) onDataRef.current(data);
	};

	useEffect(() => {
		if (!enabled) {
			onDisabled?.();
			return;
		}

		let cancelled = false;

		const load = async () => {
			const data = await fetcherRef.current();
			if (!cancelled && data !== null) onDataRef.current(data);
		};

		void load();
		return () => { cancelled = true; };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enabled, ...deps]);

	useEffect(() => {
		if (!enabled) return;

		let disposed = false;

		const poll = async () => {
			const data = await fetcherRef.current();
			if (!disposed && data !== null) onDataRef.current(data);
		};

		const interval = setInterval(() => { void poll(); }, intervalMs);
		return () => { disposed = true; clearInterval(interval); };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enabled, intervalMs, ...deps]);

	return { refetch };
}
