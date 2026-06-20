import { useAuth } from '@/hooks/useAuth';
import { usePresenceStatus } from '@/hooks/usePresenceContext';
import {
	useProfileData,
	ProfileHeader,
	SkillsRadar,
	ProjectsCard,
	ProfileDetails,
	buildProfileInsights,
	decodeTokenPayload,
} from '@/components/profile';
import { buildApiUrl } from '@/utils/apiBase';

const ProfilePage = () => {
	const { token, patchAuthProfile } = useAuth();
	const { connected } = usePresenceStatus();
	const { profile, setProfile, loading, error, fallbackLogin, refreshProfile } = useProfileData();

	const tokenPayload = decodeTokenPayload(token);

	const profileLogin = profile?.login ?? fallbackLogin;
	const displayName = profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profileLogin;
	const profileInitial = displayName.charAt(0).toUpperCase();
	const canonicalProfileId = tokenPayload?.chat_user_id ?? null;
	const canEditProfile = Boolean(
		profile && token && canonicalProfileId && profile.id === canonicalProfileId,
	);

	const activeTheme = profile?.background_theme ?? 'none';

	const patchProfile = async (body: Record<string, string>) => {
		if (!token || !canonicalProfileId) return;
		const res = await fetch(buildApiUrl(`/users/${canonicalProfileId}/profile`), {
			method: 'PATCH',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		if (!res.ok) throw new Error('No se pudo actualizar el perfil.');
		const updated = (await res.json()) as typeof profile;
		setProfile(updated);
		await refreshProfile({ silent: true });
	};

	const handleSaveDisplayName = async (name: string) => {
		await patchProfile({ display_name: name });
	};

	const handleSaveAvatarUrl = async (url: string) => {
		await patchProfile({ avatar_url: url });
	};

	const handleSaveBackground = async (theme: string) => {
		patchAuthProfile({ background_theme: theme });
		await patchProfile({ background_theme: theme });
	};

	const insights = buildProfileInsights(profile);

	return (
		<div className="w-full px-3 md:px-6 lg:px-8">
			<section className="mb-6 space-y-5">
				<ProfileHeader
					profile={profile}
					displayName={displayName}
					profileLogin={profileLogin}
					profileInitial={profileInitial}
					loading={loading}
					error={error}
					online={connected}
					insights={insights}
					canEditProfile={canEditProfile}
					activeTheme={activeTheme}
					onSaveDisplayName={handleSaveDisplayName}
					onSaveAvatarUrl={handleSaveAvatarUrl}
					onSaveBackground={handleSaveBackground}
					className="min-h-[36rem]"
				/>

				<div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.1fr)_minmax(28rem,0.9fr)] 2xl:items-start">
					<SkillsRadar skills={insights.topSkills} className="2xl:min-h-[38rem]" />
					<ProjectsCard insights={insights} className="2xl:min-h-[38rem]" />
				</div>

				<ProfileDetails profile={profile} campus={insights.campus} />
			</section>
		</div>
	);
};

export default ProfilePage;
