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
			<section className="mb-4 space-y-3">
				<div className="grid grid-cols-1 xl:grid-cols-3 gap-3 xl:items-start">
					{/* Left column: Profile Picture + Common Core Progress + Titles */}
					<div className="flex flex-col gap-3 xl:h-[34rem]">
						{/* Profile Header — grows to match the height of Skills and Projects */}
						<div className="flex-1 min-h-0">
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
							/>
						</div>

						{/* Common Core Progress */}
						<div className="flex-shrink-0">
							<CommonCoreProgress
								cursusGrade={insights.cursusGrade}
								levelInteger={insights.levelInteger}
								level={insights.level}
								progressPercentage={insights.progressPercentage}
								nextLevel={insights.nextLevel}
							/>
						</div>
					</div>

					{/* Skills Radar Chart */}
					<SkillsRadar skills={insights.topSkills} />

					{/* Projects */}
					<ProjectsCard insights={insights} />
				</div>

				{/* Profile Details */}
				<ProfileDetails profile={profile} campus={insights.campus} />

				{/* Stats Cards */}
				<ProfileStats insights={insights} />

			</section>
		</div>
	);
};
export default ProfilePage;
