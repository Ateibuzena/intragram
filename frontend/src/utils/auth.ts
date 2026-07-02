export const decodeTokenPayload = (jwtToken: string | null): { sub?: string; username?: string; chat_user_id?: string; exp?: number } | null => {
	if (!jwtToken) return null;
	try {
		const [, payloadSegment] = jwtToken.split('.');
		if (!payloadSegment) return null;
		const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
		const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
		return JSON.parse(decoded) as { sub?: string; username?: string; chat_user_id?: string; exp?: number };
	} catch {
		return null;
	}
};
