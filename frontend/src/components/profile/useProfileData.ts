import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildApiUrl } from '@/utils/apiBase';
import { UserProfileEntityDto } from './profileTypes';
import { decodeTokenPayload } from './profileUtils';

const fetchProfileFromBackend = async (
	token: string,
	tokenPayload: { username?: string; sub?: string } | null,
): Promise<UserProfileEntityDto | null> => {
	if (!token || (!tokenPayload?.username && !tokenPayload?.sub)) return null;

	const endpoints = [
		tokenPayload?.username ? `/users/login/${encodeURIComponent(tokenPayload.username)}` : null,
		tokenPayload?.sub ? `/users/${tokenPayload.sub}` : null,
	].filter(Boolean) as string[];

	for (const endpoint of endpoints) {
		const response = await fetch(buildApiUrl(endpoint), {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (response.ok) {
			return (await response.json()) as UserProfileEntityDto;
		}
	}

	return null;
};

export const useProfileData = () => {
	const { token } = useAuth();
	const tokenPayload = useMemo(() => decodeTokenPayload(token), [token]);
	const fallbackLogin = tokenPayload?.username ?? 'user';

	const [profile, setProfile] = useState<UserProfileEntityDto | null>(null);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const refreshProfile = async (options: { silent?: boolean } = {}) => {
		if (!token) return null;

		setRefreshing(true);
		if (!options.silent) setError(null);
		try {
			const data = await fetchProfileFromBackend(token, tokenPayload);
			if (!data) throw new Error('PROFILE_NOT_FOUND');
			setProfile(data);
			return data;
		} catch {
			if (!options.silent) {
				setError('No se pudieron cargar los datos del perfil.');
			}
			return null;
		} finally {
			setRefreshing(false);
		}
	};

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
				const data = await fetchProfileFromBackend(token, tokenPayload);
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

	return { profile, setProfile, loading, refreshing, error, fallbackLogin, refreshProfile };
};
