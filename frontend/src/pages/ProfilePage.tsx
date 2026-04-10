import { useEffect, useMemo, useState } from 'react';
import { MOCK_POSTS } from '@/constants/mockData';
import { useAuth } from '@/hooks/useAuth';
import { buildApiUrl } from '@/utils/apiBase';
import { PostCard } from '@/components/feed/PostCard';

interface UserProfileEntityDto {
	id: string;
	forty_two_id: number;
	login: string;
	email: string | null;
	first_name: string | null;
	last_name: string | null;
	display_name: string | null;
	avatar_url: string | null;
	campus: string | null;
	pool_month: string | null;
	pool_year: string | null;
	wallet: number;
	correction_point: number;
	location: string | null;
	phone: string | null;
	staff: boolean;
	alumni: boolean;
	active: boolean;
	last_login_at: string | null;
	created_at: string;
	updated_at: string;
}

const decodeTokenPayload = (jwtToken: string | null): { sub?: string; username?: string } | null => {
	if (!jwtToken) return null;
	try {
		const [, payloadSegment] = jwtToken.split('.');
		if (!payloadSegment) return null;
		const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
		const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
		return JSON.parse(decoded) as { sub?: string; username?: string };
	} catch {
		return null;
	}
};

const formatDate = (value: string | null) => {
	if (!value) return 'N/A';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'N/A';
	return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
};

const ProfilePage = () => {
	const { token } = useAuth();
	const tokenPayload = useMemo(() => decodeTokenPayload(token), [token]);
	const fallbackLogin = tokenPayload?.username ?? 'user';

	const [profile, setProfile] = useState<UserProfileEntityDto | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!token || !tokenPayload?.sub) {
			setProfile(null);
			return;
		}

		let cancelled = false;

		const fetchProfile = async () => {
			setLoading(true);
			setError(null);
			try {
				const response = await fetch(buildApiUrl(`/users/${tokenPayload.sub}`), {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}

				const data = (await response.json()) as UserProfileEntityDto;
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
	}, [token, tokenPayload?.sub]);

	const profileLogin = profile?.login ?? fallbackLogin;
	const displayName = profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profileLogin;
	const profileInitial = displayName.charAt(0).toUpperCase();

	const posts = MOCK_POSTS.filter((post) => post.user.login === profileLogin);
	const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
	const totalComments = posts.reduce((sum, post) => sum + post.comments, 0);

	const wallet = profile?.wallet ?? 0;
	const correctionPoint = profile?.correction_point ?? 0;
	const campus = profile?.campus ?? 'N/A';
	const level = Math.max(1, Math.floor(correctionPoint / 5));
	const progressPercent = Math.max(0, Math.min(100, Math.round((level / 21) * 100)));

	return (
		<div className="relative left-1/2 right-1/2 w-screen -ml-[40vw] -mr-[40vw] px-3 md:px-6 lg:px-8">
			<section className="mb-4 space-y-3">
				<div className="bg-ft-card border border-ft-border rounded-2xl p-4">
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-3 min-w-0">
							<div className="w-12 h-12 rounded-2xl bg-ft-cyan text-black font-black text-lg flex items-center justify-center overflow-hidden">
								{profile?.avatar_url ? (
									<img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
								) : (
									<span>{profileInitial}</span>
								)}
							</div>
							<div className="min-w-0">
								<h2 className="text-base font-bold text-white truncate">{displayName}</h2>
								<p className="text-xs text-ft-muted truncate">@{profileLogin} · 42 ID: {profile?.forty_two_id ?? 'N/A'}</p>
							</div>
						</div>
						<span className={`text-[10px] px-2 py-1 rounded-full border ${profile?.active ? 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10' : 'border-ft-border text-ft-muted bg-ft-hover/60'}`}>
							{profile?.active ? 'Activo' : 'Inactivo'}
						</span>
					</div>
					{loading && <p className="text-xs text-ft-muted mt-3">Cargando perfil...</p>}
					{error && <p className="text-xs text-red-400 mt-3">{error}</p>}
				</div>

				<div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
					<div className="bg-ft-card border border-ft-border rounded-2xl p-4 xl:col-span-1">
						<h3 className="text-sm font-bold text-white mb-3">Common Core Progress</h3>
						<div className="flex items-center gap-3">
							<div className="w-16 h-16 rounded-full border-[6px] border-ft-border border-t-ft-cyan border-r-ft-cyan" />
							<div>
								<p className="text-xs text-ft-muted">Current level</p>
								<p className="text-xl font-black text-white">{level}</p>
								<p className="text-xs text-ft-muted">{progressPercent}%</p>
							</div>
						</div>
						<div className="mt-3 flex flex-wrap gap-1">
							{['M1', 'M2', 'M3', 'M4', 'M5'].map((m) => (
								<span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-ft-cyan text-black font-semibold">{m}</span>
							))}
						</div>
					</div>

					<div className="bg-ft-card border border-ft-border rounded-2xl p-4 xl:col-span-1">
						<h3 className="text-sm font-bold text-white mb-3">Skills Radar</h3>
						<svg width="100%" height="170" viewBox="0 0 240 200" aria-label="skills radar">
							<polygon points="120,30 190,65 190,135 120,170 50,135 50,65" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
							<polygon points="120,50 173,78 173,122 120,150 67,122 67,78" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
							<polygon points="120,70 157,91 157,109 120,130 83,109 83,91" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
							<polygon points="120,48 178,74 182,118 120,155 65,115 62,72" fill="rgba(0,238,238,0.18)" stroke="#0ee" strokeWidth="1.5" />
							<text x="120" y="22" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="10">C</text>
							<text x="204" y="67" fill="rgba(255,255,255,0.55)" fontSize="10">C++</text>
							<text x="204" y="138" fill="rgba(255,255,255,0.55)" fontSize="10">Algo</text>
							<text x="120" y="186" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="10">Unix</text>
							<text x="36" y="138" textAnchor="end" fill="rgba(255,255,255,0.55)" fontSize="10">Net</text>
							<text x="36" y="67" textAnchor="end" fill="rgba(255,255,255,0.55)" fontSize="10">Graphics</text>
						</svg>
					</div>

					<div className="bg-ft-card border border-ft-border rounded-2xl p-4 xl:col-span-1">
						<h3 className="text-sm font-bold text-white mb-3">Profile Details</h3>
						<div className="space-y-2 text-xs">
							<p className="text-ft-muted">Email: <span className="text-white">{profile?.email ?? 'N/A'}</span></p>
							<p className="text-ft-muted">Campus: <span className="text-white">{campus}</span></p>
							<p className="text-ft-muted">Pool: <span className="text-white">{profile?.pool_month ?? 'N/A'} {profile?.pool_year ?? ''}</span></p>
							<p className="text-ft-muted">Location: <span className="text-white">{profile?.location ?? 'N/A'}</span></p>
							<p className="text-ft-muted">Phone: <span className="text-white">{profile?.phone ?? 'N/A'}</span></p>
							<p className="text-ft-muted">Role: <span className="text-white">{profile?.staff ? 'Staff' : profile?.alumni ? 'Alumni' : 'Student'}</span></p>
							<p className="text-ft-muted">Last login: <span className="text-white">{formatDate(profile?.last_login_at ?? null)}</span></p>
							<p className="text-ft-muted">Created: <span className="text-white">{formatDate(profile?.created_at ?? null)}</span></p>
							<p className="text-ft-muted">Updated: <span className="text-white">{formatDate(profile?.updated_at ?? null)}</span></p>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
					<div className="bg-ft-card border border-ft-border rounded-lg p-2">
						<p className="text-[10px] text-ft-muted uppercase">Posts</p>
						<p className="text-lg font-black text-white">{posts.length}</p>
					</div>
					<div className="bg-ft-card border border-ft-border rounded-lg p-2">
						<p className="text-[10px] text-ft-muted uppercase">Likes</p>
						<p className="text-lg font-black text-white">{totalLikes}</p>
					</div>
					<div className="bg-ft-card border border-ft-border rounded-lg p-2">
						<p className="text-[10px] text-ft-muted uppercase">Comments</p>
						<p className="text-lg font-black text-white">{totalComments}</p>
					</div>
					<div className="bg-ft-card border border-ft-border rounded-lg p-2">
						<p className="text-[10px] text-ft-muted uppercase">Wallet</p>
						<p className="text-lg font-black text-white">{wallet}</p>
					</div>
					<div className="bg-ft-card border border-ft-border rounded-lg p-2">
						<p className="text-[10px] text-ft-muted uppercase">CP</p>
						<p className="text-lg font-black text-white">{correctionPoint}</p>
					</div>
					<div className="bg-ft-card border border-ft-border rounded-lg p-2">
						<p className="text-[10px] text-ft-muted uppercase">42 ID</p>
						<p className="text-lg font-black text-white">{profile?.forty_two_id ?? 0}</p>
					</div>
				</div>

				<div className="bg-ft-card border border-ft-border rounded-2xl p-4">
					<h3 className="text-sm font-bold text-white mb-3">Progress Line Graph</h3>
					<svg width="100%" height="120" viewBox="0 0 280 120" aria-label="progress line">
						<line x1="24" y1="10" x2="280" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
						<line x1="24" y1="30" x2="280" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
						<line x1="24" y1="50" x2="280" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
						<line x1="24" y1="70" x2="280" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
						<path d="M28,108 L55,95 L85,80 L110,65 L135,55 L160,38 L190,25 L220,18 L260,10" fill="none" stroke="#0ee" strokeWidth="1.5" />
					</svg>
				</div>

				<h3 className="text-sm font-bold text-ft-cyan uppercase tracking-wide">Mis publicaciones</h3>
			</section>

			{posts.length === 0 && (
				<div className="bg-ft-card border border-ft-border rounded-2xl p-5 text-center">
					<p className="text-sm text-ft-muted">Aun no hay publicaciones de @{profileLogin}.</p>
				</div>
			)}

			{posts.map((post, index) => (
				<div key={post.id} className={`animate-fade-in-up-delay-${Math.min(index + 1, 3)}`}>
					<PostCard post={post} />
				</div>
			))}
		</div>
	);
};

export default ProfilePage;
