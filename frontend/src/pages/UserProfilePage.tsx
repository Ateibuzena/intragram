import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePresenceStatus } from '@/hooks/usePresenceContext';
import { buildApiUrl } from '@/utils/apiBase';
import { Navbar } from '@/components/layout/Navbar';
import { ROUTES } from '@/constants/routes';
import {
	ProfileHeader,
	SkillsRadar,
	ProjectsCard,
	ProfileDetails,
	buildProfileInsights,
} from '@/components/profile';
import type { UserProfileEntityDto } from '@/components/profile';
import type { NavKey } from '@/types/models';

type Relation = 'none' | 'friends' | 'pending_sent' | 'pending_received';
type FriendAction = 'idle' | 'adding' | 'removing' | 'accepting';
type FriendItem = { id: string; login: string };

const UserProfilePage = () => {
	const { login } = useParams<{ login: string }>();
	const { token, profile: myProfile } = useAuth();
	const { presenceMap } = usePresenceStatus();
	const navigate = useNavigate();

	const [profile, setProfile] = useState<UserProfileEntityDto | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState('');

	const [relation, setRelation] = useState<Relation>('none');
	const [friendshipLoading, setFriendshipLoading] = useState(false);
	const [friendAction, setFriendAction] = useState<FriendAction>('idle');

	const isOwnProfile = !!myProfile?.login && myProfile.login === login;

	useEffect(() => {
		if (!login || !token) return;
		let cancelled = false;

		const fetchProfile = async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(buildApiUrl(`/users/login/${encodeURIComponent(login)}`), {
					headers: { Authorization: `Bearer ${token}` },
				});
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

	useEffect(() => {
		if (!token || !profile || isOwnProfile) return;
		let cancelled = false;

		const checkFriendship = async () => {
			setFriendshipLoading(true);
			try {
				const res = await fetch(buildApiUrl('/users/friends/me'), {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok || cancelled) return;
				const friends = (await res.json()) as FriendItem[];
				if (!cancelled) setRelation(friends.some((f) => f.id === profile.id) ? 'friends' : 'none');
			} catch {
				// ignore
			} finally {
				if (!cancelled) setFriendshipLoading(false);
			}
		};

		void checkFriendship();
		return () => { cancelled = true; };
	}, [token, profile?.id, isOwnProfile]);

	const handleAddFriend = async () => {
		if (!token || !profile || friendAction !== 'idle') return;
		setFriendAction('adding');
		try {
			const res = await fetch(buildApiUrl('/users/friends/me'), {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({ friend_login: profile.login }),
			});
			if (!res.ok) throw new Error();
			const data = (await res.json()) as { status?: string };
			setRelation(data.status === 'accepted' ? 'friends' : 'pending_sent');
		} catch {
			// ignore — button stays in current state
		} finally {
			setFriendAction('idle');
		}
	};

	const handleAcceptFriend = async () => {
		if (!token || !profile || friendAction !== 'idle') return;
		setFriendAction('accepting');
		try {
			const res = await fetch(buildApiUrl(`/users/friends/me/${profile.id}/accept`), {
				method: 'PATCH',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error();
			setRelation('friends');
		} catch {
			// ignore
		} finally {
			setFriendAction('idle');
		}
	};

	const handleRemoveFriend = async () => {
		if (!token || !profile || friendAction !== 'idle') return;
		setFriendAction('removing');
		try {
			const res = await fetch(buildApiUrl(`/users/friends/me/${profile.id}`), {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error();
			setRelation('none');
		} catch {
			// ignore
		} finally {
			setFriendAction('idle');
		}
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
		<div className="min-h-screen bg-ft-bg text-ft-text flex flex-col">
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
							showFriendButton={!isOwnProfile && !friendshipLoading}
							relation={relation}
							friendAction={friendAction}
							onAddFriend={() => void handleAddFriend()}
							onAcceptFriend={() => void handleAcceptFriend()}
							onRemoveFriend={() => void handleRemoveFriend()}
							className="min-h-[36rem]"
						/>
						<div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.1fr)_minmax(28rem,0.9fr)] 2xl:items-start">
							<SkillsRadar skills={insights.topSkills} className="2xl:min-h-[38rem]" />
							<ProjectsCard insights={insights} className="2xl:min-h-[38rem]" />
						</div>
						<ProfileDetails profile={profile} campus={insights.campus} />
					</section>
				</div>
			</main>
		</div>
	);
};

export default UserProfilePage;
