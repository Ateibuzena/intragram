import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildApiUrl } from '@/utils/apiBase';
import { UserProfileEntityDto } from './profileTypes';
import { decodeTokenPayload } from './profileUtils';

export const useProfileData = () => {
	const { token } = useAuth();
	const tokenPayload = useMemo(() => decodeTokenPayload(token), [token]);
	const fallbackLogin = tokenPayload?.username ?? 'user';

	const [profile, setProfile] = useState<UserProfileEntityDto | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!token || (!tokenPayload?.username && !tokenPayload?.sub)) {
			setProfile(null);
			return;
		}

		let cancelled = false;

		const fetchProfile = async () => {
			setLoading(true);
			setError(null);
			try {
				const candidates = [
					tokenPayload?.username ? `/users/login/${encodeURIComponent(tokenPayload.username)}` : null,
					tokenPayload?.sub ? `/users/${tokenPayload.sub}` : null,
				].filter(Boolean) as string[];

				let data: UserProfileEntityDto | null = null;
				for (const endpoint of candidates) {
					const response = await fetch(buildApiUrl(endpoint), {
						headers: {
							Authorization: `Bearer ${token}`,
						},
					});

					if (response.ok) {
						data = (await response.json()) as UserProfileEntityDto;
						break;
					}
				}

				if (!data) {
					throw new Error('PROFILE_NOT_FOUND');
				}

				if (!cancelled) setProfile(data);
			} catch {
				if (!cancelled) {
					setError('No se pudieron cargar los datos del perfil.');
					setProfile(null);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		void fetchProfile();
		return () => {
			cancelled = true;
		};
	}, [token, tokenPayload?.sub, tokenPayload?.username]);

	return { profile, loading, error, fallbackLogin };
};
