import {
	useProfileData,
	ProfileHeader,
	CommonCoreProgress,
	TitlesCard,
	SkillsRadar,
	ProjectsCard,
	ProfileDetails,
	ProfileStats,
} from '@/components/profile';

const ProfilePage = () => {
	const { profile, loading, error, fallbackLogin } = useProfileData();

	const profileLogin = profile?.login ?? fallbackLogin;
	const displayName = profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profileLogin;
	const profileInitial = displayName.charAt(0).toUpperCase();

	const posts = profile?.dashes_users
		?.filter((dash) => dash.level === 21)
		.map((dash) => ({
			id: dash.id,
			title: dash.name,
			content: '',
			createdAt: profile?.updated_at ?? new Date().toISOString(),
		})) ?? [];

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
		<div className="relative left-1/2 right-1/2 w-screen -ml-[40vw] -mr-[40vw] px-3 md:px-6 lg:px-8 mr-3 md:mr-6 lg:mr-10">
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

			{posts.length === 0 && (
				<div className="bg-ft-card border border-ft-border rounded-2xl p-5 text-center">
					<p className="text-sm text-ft-muted">Aun no hay publicaciones de @{profileLogin}.</p>
				</div>
			)}
		</div>
	);
};

export default ProfilePage;
