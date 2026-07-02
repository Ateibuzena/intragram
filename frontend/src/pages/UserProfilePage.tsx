import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePresenceStatus } from '@/hooks/usePresenceContext';
import { useFriend } from '@/hooks/useFriend';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { Navbar } from '@/components/layout/Navbar';
import { ROUTES } from '@/constants/routes';
import {
	ProfileHeader,
	SkillsRadar,
	ProjectsCard,
	AchievementsCard,
	AcademicTimeline,
	ProfileDetails,
	buildProfileInsights,
} from '@/components/profile';
import type { UserProfileEntityDto } from '@/components/profile';
import type { NavKey } from '@/types/ui';

type FriendAction = 'idle' | 'adding' | 'removing' | 'accepting';

const UserProfilePage = () => {
	const { login } = useParams<{ login: string }>();
	const { token, profile: myProfile } = useAuth();
	const { presenceMap } = usePresenceStatus();
	const navigate = useNavigate();

	const [profile, setProfile] = useState<UserProfileEntityDto | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState('');
	const [friendAction, setFriendAction] = useState<FriendAction>('idle');

	const isOwnProfile = !!myProfile?.login && myProfile.login === login;

	// Pass undefined when viewing own profile to skip fetch entirely.
	const friend = useFriend(isOwnProfile ? undefined : profile?.id, profile?.login ?? undefined);

	useEffect(() => {
		if (!login || !token) return;
		let cancelled = false;

		const fetchProfile = async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetchWithAuth(`/users/login/${encodeURIComponent(login)}`, token);
				if (!res.ok) throw new Error('Profile not found');
				const data = (await res.json()) as UserProfileEntityDto;
				if (!cancelled) setProfile(data);
			} catch {
				if (!cancelled) setError('No se pudo cargar el perfil.');
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		void fetchProfile();
		return () => { cancelled = true; };
	}, [login, token]);

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

	const displayName =
		profile?.display_name ||
		`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
		(login ?? '');
	const profileLogin = profile?.login ?? login ?? '';
	const profileInitial = displayName.charAt(0).toUpperCase();

	const insights = buildProfileInsights(profile);

	return (
		<div className="min-h-screen text-ft-text flex flex-col">
			<Navbar
				activeNav={null}
				setActiveNav={handleSetActiveNav}
				search={search}
				setSearch={setSearch}
			/>
			<main className="flex-1 overflow-y-auto">
				<div className="py-4 md:py-6 w-full px-3 md:px-6 lg:px-8">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="flex items-center gap-1.5 text-xs text-ft-muted hover:text-white transition-colors mb-4"
					>
						<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
						Volver
					</button>

					<section className="mb-6 space-y-5">
						<ProfileHeader
							profile={profile}
							displayName={displayName}
							profileLogin={profileLogin}
							profileInitial={profileInitial}
							loading={loading}
							error={error}
							online={presenceMap[profile?.id ?? ''] ?? false}
							insights={insights}
							canEditProfile={false}
							showFriendButton={!isOwnProfile && !friend.loading}
							relation={friend.relation}
							friendAction={friendAction}
							onAddFriend={() => void handleAddFriend()}
							onAcceptFriend={() => void handleAcceptFriend()}
							onRemoveFriend={() => void handleRemoveFriend()}
							className="min-h-[36rem]"
						/>
						<div className="grid grid-cols-1 justify-items-center gap-4">
							<SkillsRadar skills={insights.topSkills} className="w-full max-w-[76rem] min-h-[38rem]" />
							<AchievementsCard insights={insights} className="w-full max-w-[76rem]" />
							<AcademicTimeline insights={insights} className="w-full max-w-[76rem]" />
							<ProjectsCard insights={insights} className="w-full max-w-[76rem] min-h-[38rem]" />
						</div>
						<ProfileDetails profile={profile} insights={insights} />
					</section>
				</div>
			</main>
		</div>
	);
};

export default UserProfilePage;
