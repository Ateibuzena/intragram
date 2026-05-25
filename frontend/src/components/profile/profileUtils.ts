export const decodeTokenPayload = (jwtToken: string | null): { sub?: string; username?: string; chat_user_id?: string } | null => {
	if (!jwtToken) return null;
	try {
		const [, payloadSegment] = jwtToken.split('.');
		if (!payloadSegment) return null;
		const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
		const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
		return JSON.parse(decoded) as { sub?: string; username?: string; chat_user_id?: string };
	} catch {
		return null;
	}
};

export const formatDate = (value: string | null) => {
	if (!value) return 'N/A';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'N/A';
	return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
};

export const splitLabel = (value: string): [string, string?, string?] => {
	if (value.length <= 18) return [value];
	const words = value.split(' ');
	if (words.length === 1) {
		// Single long word - split into chunks
		const third = Math.ceil(value.length / 3);
		return [value.slice(0, third), value.slice(third, third * 2), value.slice(third * 2)];
	}
	if (words.length === 2) {
		return [words[0], words[1]];
	}
	// Multiple words - split into 2-3 parts
	const mid = Math.ceil(words.length / 2);
	return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
};
