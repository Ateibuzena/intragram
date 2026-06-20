import { useAuth } from '@/hooks/useAuth';
import { usePresenceStatus } from '@/hooks/usePresenceContext';
import {
	useProfileData,
	ProfileHeader,
	CommonCoreProgress,
	SkillsRadar,
	ProjectsCard,
	ProfileDetails,
	ProfileStats,
	buildProfileInsights,
	decodeTokenPayload,
} from '@/components/profile';
import { buildApiUrl } from '@/utils/apiBase';

const ProfilePage = () => {
	const { token } = useAuth();
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

	const insights = buildProfileInsights(profile);

	return (
		<div className="w-full px-3 md:px-6 lg:px-8">
			<section className="mb-6 space-y-5">
				<div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_25rem] xl:items-stretch">
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
						onSaveDisplayName={handleSaveDisplayName}
						onSaveAvatarUrl={handleSaveAvatarUrl}
						className="min-h-[18rem]"
					/>
					<CommonCoreProgress
						cursusGrade={insights.cursusGrade}
						levelInteger={insights.levelInteger}
						level={insights.level}
						progressPercentage={insights.progressPercentage}
						nextLevel={insights.nextLevel}
					/>
				</div>

				<ProfileStats insights={insights} />

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
