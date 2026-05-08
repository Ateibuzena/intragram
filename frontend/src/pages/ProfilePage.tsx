import {
	useProfileData,
	ProfileHeader,
	CommonCoreProgress,
	TitlesCard,
	SkillsRadar,
	ProjectsCard,
	ProfileDetails,
	ProfileStats,
	ProfilePosts,
} from '@/components/profile';

const ProfilePage = () => {
	const { profile, loading, error, fallbackLogin, refreshProfile, refreshing } = useProfileData();

	const profileLogin = profile?.login ?? fallbackLogin;
	const displayName = profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profileLogin;
	const profileInitial = displayName.charAt(0).toUpperCase();

	const campus = profile?.campus ?? 'N/A';
	const role = profile?.staff ? 'Staff' : profile?.alumni ? 'Alumni' : 'Student';
	const profileStatus = profile?.active ? 'Activo' : 'Inactivo';
	const pool = [profile?.pool_month, profile?.pool_year].filter(Boolean).join(' ') || 'N/A';
	const cursusLevel = profile?.levels?.[0]?.level ?? 0;
	const cursusGrade = profile?.levels?.[0]?.grade ?? 'N/A';
	const level = Math.max(0, Math.round(cursusLevel * 100) / 100);
	const levelInteger = Math.floor(cursusLevel);
	const levelProgress = cursusLevel - levelInteger;
	const progressPercentage = levelProgress * 100;

	return (
		<div className="w-full h-full">
		{/* Refresh Button */}
		<div className="mb-4">
			<button
				onClick={refreshProfile}
				disabled={refreshing || !profile}
				className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
			>
				<svg
					className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
				{refreshing ? 'Actualizando...' : 'Actualizar Perfil'}
			</button>
		</div>
		<section className="mb-4 space-y-3">
			<div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
				{/* Left column: Profile Picture + Common Core Progress + Titles */}
				<div className="space-y-3">
					{/* Profile Header */}
					<ProfileHeader
						profile={profile}
						displayName={displayName}
						profileLogin={profileLogin}
						profileInitial={profileInitial}
						loading={loading}
						error={error}
					/>

					{/* Common Core Progress and Titles Row */}
					<div className="grid grid-cols-2 gap-3">
						<CommonCoreProgress
							cursusLevel={cursusLevel}
							cursusGrade={cursusGrade}
							levelInteger={levelInteger}
							level={level}
							progressPercentage={progressPercentage}
						/>
						<TitlesCard profile={profile} />
					</div>
				</div>

				{/* Skills Radar Chart */}
				<SkillsRadar skills={profile?.skills} />

				{/* Projects */}
				<ProjectsCard profile={profile} />
			</div>

			{/* Profile Details */}
			<ProfileDetails profile={profile} campus={campus} />

			{/* Stats Cards */}
			<ProfileStats
				profile={profile}
				campus={campus}
				pool={pool}
				role={role}
				profileStatus={profileStatus}
			/>

			<h3 className="text-sm font-bold text-ft-cyan uppercase tracking-wide">Mis publicaciones</h3>
		</section>

		{/* Posts Section */}
		<ProfilePosts username={profileLogin} />
	</div>
);
};
export default ProfilePage;
