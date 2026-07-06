import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFriend } from '@/hooks/useFriend';
import { usePresenceStatus } from '@/hooks/usePresenceContext';
import { Navbar } from '@/components/layout/Navbar';
import { ROUTES } from '@/constants/routes';
import {
	useProfileData,
	ProfileHeader,
	SkillsRadar,
	ProjectsCard,
	AchievementsCard,
	AcademicTimeline,
	ProfileDetails,
	buildProfileInsights,
	decodeTokenPayload,
} from '@/components/profile';
import type { UserProfileEntityDto } from '@/components/profile';
import type { NavKey } from '@/types/ui';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

type FriendAction = 'idle' | 'adding' | 'removing' | 'accepting';

const ProfilePage = () => {
	const { login } = useParams<{ login: string }>();
	const navigate = useNavigate();
	const { token, patchAuthProfile } = useAuth();
	const { connected, presenceMap } = usePresenceStatus();
	const ownProfile = useProfileData();

	const [routeProfile, setRouteProfile] = useState<UserProfileEntityDto | null>(null);
	const [routeLoading, setRouteLoading] = useState(false);
	const [routeError, setRouteError] = useState<string | null>(null);
	const [search, setSearch] = useState('');
	const [friendAction, setFriendAction] = useState<FriendAction>('idle');

	const tokenPayload = decodeTokenPayload(token);
	const isStandaloneProfile = Boolean(login);

	useEffect(() => {
		if (!login || !token) {
			setRouteProfile(null);
			setRouteError(null);
			return;
		}

		let cancelled = false;

		const fetchProfile = async () => {
			setRouteLoading(true);
			setRouteError(null);
			try {
				const res = await fetchWithAuth(`/users/login/${encodeURIComponent(login)}`, token);
				if (!res.ok) throw new Error('PROFILE_NOT_FOUND');
				const data = (await res.json()) as UserProfileEntityDto;
				if (!cancelled) setRouteProfile(data);
			} catch {
				if (!cancelled) {
					setRouteError('No se pudo cargar el perfil.');
					setRouteProfile(null);
				}
			} finally {
				if (!cancelled) setRouteLoading(false);
			}
		};

		void fetchProfile();
		return () => {
			cancelled = true;
		};
	}, [login, token]);

	const profile = isStandaloneProfile ? routeProfile : ownProfile.profile;
	const loading = isStandaloneProfile ? routeLoading : ownProfile.loading;
	const error = isStandaloneProfile ? routeError : ownProfile.error;
	const profileLogin = profile?.login ?? login ?? ownProfile.fallbackLogin;
	const displayName = profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profileLogin;
	const profileInitial = displayName.charAt(0).toUpperCase();
	const canonicalProfileId = tokenPayload?.chat_user_id ?? null;
	const canEditProfile = Boolean(
		profile && token && canonicalProfileId && profile.id === canonicalProfileId,
	);
	const showFriendButton = Boolean(isStandaloneProfile && profile && !canEditProfile);

	const activeTheme = profile?.background_theme ?? 'none';
	const friend = useFriend(showFriendButton ? profile?.id : undefined, profile?.login ?? undefined);

	const patchProfile = async (body: Record<string, string>) => {
		if (!token || !canonicalProfileId) return;
		const res = await fetchWithAuth(`/users/${canonicalProfileId}/profile`, token, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		if (!res.ok) throw new Error('No se pudo actualizar el perfil.');
		const updated = (await res.json()) as typeof profile;
		if (isStandaloneProfile) {
			setRouteProfile(updated);
		} else {
			ownProfile.setProfile(updated);
		}
		await ownProfile.refreshProfile({ silent: true });
	};

	const handleSaveDisplayName = async (name: string) => {
		await patchProfile({ display_name: name });
	};

	const handleSaveAvatarUrl = async (file: File) => {
		if (!token || !canonicalProfileId) return;
		const formData = new FormData();
		formData.append('image', file);
		const res = await fetchWithAuth(`/users/${canonicalProfileId}/avatar`, token, {
			method: 'PATCH',
			body: formData,
		});
		if (!res.ok) throw new Error('No se pudo actualizar la foto de perfil.');
		const updated = (await res.json()) as typeof profile;
		if (isStandaloneProfile) {
			setRouteProfile(updated);
		} else {
			ownProfile.setProfile(updated);
		}
		if (updated) {
			patchAuthProfile({ avatar_url: updated.avatar_url });
		}
		await ownProfile.refreshProfile({ silent: true });
	};

	const handleSaveBackground = async (theme: string) => {
		patchAuthProfile({ background_theme: theme });
		await patchProfile({ background_theme: theme });
	};

	const handleRefreshFromOAuth42 = () => {
		// Re-runs the OAuth42 flow (already authorized, so it round-trips almost
		// instantly) to re-sync fresh 42 stats — state carries us back to this tab.
		window.location.href = `/api/auth/42?state=${encodeURIComponent('nav=profile')}`;
	};

	const handleAddFriend = async () => {
		if (friendAction !== 'idle') return;
		setFriendAction('adding');
		try { await friend.send(); }
		finally { setFriendAction('idle'); }
	};

	const handleAcceptFriend = async () => {
		if (friendAction !== 'idle') return;
		setFriendAction('accepting');
		try { await friend.accept(); }
		finally { setFriendAction('idle'); }
	};

	const handleRemoveFriend = async () => {
		if (friendAction !== 'idle') return;
		setFriendAction('removing');
		try { await friend.remove(); }
		finally { setFriendAction('idle'); }
	};

	const handleSetActiveNav = (nav: NavKey) => {
		navigate(nav === 'home' ? ROUTES.HOME : `${ROUTES.HOME}?nav=${nav}`);
	};

	const insights = buildProfileInsights(profile);
	const online = canEditProfile ? connected : presenceMap[profile?.id ?? ''] ?? false;
	const content = (
		<div className="w-full px-3 md:px-6 lg:px-8">
			<section className="mx-auto mb-6 max-w-5xl space-y-5">
				<ProfileHeader
					profile={profile}
					displayName={displayName}
					profileLogin={profileLogin}
					profileInitial={profileInitial}
					loading={loading}
					error={error}
					online={online}
					insights={insights}
					canEditProfile={canEditProfile}
					activeTheme={activeTheme}
					onSaveDisplayName={canEditProfile ? handleSaveDisplayName : undefined}
					onSaveAvatarUrl={canEditProfile ? handleSaveAvatarUrl : undefined}
					onSaveBackground={canEditProfile ? handleSaveBackground : undefined}
					onRefreshProfile={canEditProfile ? handleRefreshFromOAuth42 : undefined}
					showFriendButton={showFriendButton && !friend.loading}
					relation={friend.relation}
					friendAction={friendAction}
					onAddFriend={() => void handleAddFriend()}
					onAcceptFriend={() => void handleAcceptFriend()}
					onRemoveFriend={() => void handleRemoveFriend()}
					className="min-h-[36rem]"
				/>

				<div className="grid grid-cols-1 gap-4">
					<SkillsRadar skills={insights.topSkills} className="w-full min-h-[38rem]" />
					<AchievementsCard insights={insights} className="w-full" />
					<AcademicTimeline insights={insights} className="w-full" />
					<ProjectsCard insights={insights} className="w-full min-h-[38rem]" />
				</div>

				<ProfileDetails profile={profile} insights={insights} />
			</section>
		</div>
	);

	if (isStandaloneProfile) {
		return (
			<div className="min-h-screen text-ft-text flex flex-col">
				<Navbar
					activeNav={null}
					setActiveNav={handleSetActiveNav}
					search={search}
					setSearch={setSearch}
				/>
				<main className="flex-1 overflow-y-auto">
					<div className="py-4 md:py-6">
						<div className="w-full px-3 md:px-6 lg:px-8">
							<button
								type="button"
								onClick={() => navigate(-1)}
								className="mx-auto mb-4 flex w-full max-w-5xl items-center gap-1.5 text-xs text-ft-muted hover:text-white transition-colors"
							>
								<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
								Volver
							</button>
						</div>
						{content}
					</div>
				</main>
			</div>
		);
	}

	return (
		content
	);
};

export default ProfilePage;
