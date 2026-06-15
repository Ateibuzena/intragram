import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { buildApiUrl } from '@/utils/apiBase';
import { Navbar } from '@/components/layout/Navbar';
import { ROUTES } from '@/constants/routes';
import {
	ProfileHeader,
	CommonCoreProgress,
	TitlesCard,
	SkillsRadar,
	ProjectsCard,
	ProfileDetails,
	ProfileStats,
} from '@/components/profile';
import type { UserProfileEntityDto } from '@/components/profile';
import type { NavKey } from '@/types/models';

type FriendItem = { id: string; login: string };
type FriendAction = 'idle' | 'adding' | 'removing';

const UserProfilePage = () => {
	const { login } = useParams<{ login: string }>();
	const { token, profile: myProfile } = useAuth();
	const navigate = useNavigate();

	const [profile, setProfile] = useState<UserProfileEntityDto | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState('');

	const [isFriend, setIsFriend] = useState(false);
	const [friendshipLoading, setFriendshipLoading] = useState(false);
	const [friendAction, setFriendAction] = useState<FriendAction>('idle');
	const [friendMessage, setFriendMessage] = useState<string | null>(null);

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
				if (!cancelled) setIsFriend(friends.some((f) => f.id === profile.id));
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
		setFriendMessage(null);
		try {
			const res = await fetch(buildApiUrl('/users/friends/me'), {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({ friend_login: profile.login }),
			});
			if (!res.ok) throw new Error();
			const data = (await res.json()) as { status?: string };
			if (data.status === 'accepted') {
				setIsFriend(true);
				setFriendMessage('¡Ahora sois amigos!');
			} else {
				setFriendMessage('Solicitud enviada.');
			}
		} catch {
			setFriendMessage('No se pudo enviar la solicitud.');
		} finally {
			setFriendAction('idle');
		}
	};

	const handleRemoveFriend = async () => {
		if (!token || !profile || friendAction !== 'idle') return;
		setFriendAction('removing');
		setFriendMessage(null);
		try {
			const res = await fetch(buildApiUrl(`/users/friends/me/${profile.id}`), {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error();
			setIsFriend(false);
			setFriendMessage('Amigo eliminado.');
		} catch {
			setFriendMessage('No se pudo eliminar el amigo.');
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

					<section className="mb-4 space-y-3">
						<div className="grid grid-cols-1 xl:grid-cols-3 gap-3 xl:items-start">
							<div className="flex flex-col gap-3 xl:h-[34rem]">
								<div className="flex-1 min-h-0">
									<ProfileHeader
										profile={profile}
										displayName={displayName}
										profileLogin={profileLogin}
										profileInitial={profileInitial}
										loading={loading}
										error={error}
										canEditProfile={false}
										showFriendButton={!isOwnProfile && !friendshipLoading}
										isFriend={isFriend}
										friendAction={friendAction}
										friendMessage={friendMessage ?? undefined}
										onAddFriend={() => void handleAddFriend()}
										onRemoveFriend={() => void handleRemoveFriend()}
									/>
								</div>
								<div className="grid grid-cols-2 gap-3 flex-shrink-0">
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
							<SkillsRadar skills={profile?.skills} />
							<ProjectsCard profile={profile} />
						</div>
						<ProfileDetails profile={profile} campus={campus} />
						<ProfileStats
							profile={profile}
							campus={campus}
							pool={pool}
							role={role}
							profileStatus={profileStatus}
						/>
					</section>
				</div>
			</main>
		</div>
	);
};

export default UserProfilePage;
