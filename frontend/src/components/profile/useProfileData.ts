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
	const [refreshing, setRefreshing] = useState(false);

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

	const refreshProfile = async () => {
		if (!profile?.id || !token) return;

		setRefreshing(true);
		setError(null);

		try {
			const oauthAccessToken =
				localStorage.getItem('oauth42_access_token') ||
				localStorage.getItem('oauth_access_token') ||
				localStorage.getItem('42_access_token') ||
				localStorage.getItem('access_token');

			if (!oauthAccessToken) {
				throw new Error('No se encontro access_token de OAuth42. Cierra sesion e inicia con OAuth 42 nuevamente.');
			}

			const response = await fetch(
				buildApiUrl(`/users/${profile.id}/refresh-profile?access_token=${encodeURIComponent(oauthAccessToken)}`),
				{
					method: 'PATCH',
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!response.ok) {
				let message = 'No se pudo refrescar el perfil.';
				try {
					const payload = (await response.json()) as { message?: string | string[] };
					if (Array.isArray(payload?.message)) {
						message = payload.message.join(', ');
					} else if (typeof payload?.message === 'string' && payload.message.trim()) {
						message = payload.message;
					}
				} catch {
					// Ignorar errores parseando respuesta de error y usar mensaje por defecto.
				}
				throw new Error(message);
			}

			const updatedProfile = (await response.json()) as UserProfileEntityDto;
			setProfile(updatedProfile);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al refrescar el perfil desde 42.');
		} finally {
			setRefreshing(false);
		}
	};

	return { profile, loading, error, fallbackLogin, refreshProfile, refreshing };
};
