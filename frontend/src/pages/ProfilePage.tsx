import { useEffect, useMemo, useState } from 'react';
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
	skills?: Array<{ id: number; name: string; level?: number }>;
	levels?: Array<{ id: number; name: string; level?: number; grade?: string | null }>;
	titles?: Array<{ id: number; name: string }>;
	projects_users?: Array<{ id: number; name: string; status?: string | null; final_mark?: number | null }>;
	dashes_users?: Array<{ id: number; name: string; level?: number }>;
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

const splitLabel = (value: string): [string, string?, string?] => {
	if (value.length <= 18) return [value];
	const words = value.split(' ');
	if (words.length === 1) {
		// Single long word - split into chunks
		const third = Math.ceil(value.length / 3);
		return [value.slice(0, third), value.slice(third, third * 2), value.slice(third * 2)];
	}
	if (words.length === 2) {
		return [words[0], words[1]];
	}
	// Multiple words - split into 2-3 parts
	const mid = Math.ceil(words.length / 2);
	return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
};

const ProfilePage = () => {
	const { token } = useAuth();
	const tokenPayload = useMemo(() => decodeTokenPayload(token), [token]);
	const fallbackLogin = tokenPayload?.username ?? 'user';

	const [profile, setProfile] = useState<UserProfileEntityDto | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!token || (!tokenPayload?.username && !tokenPayload?.sub)) {
			setProfile(null);
			return;
		}

		let cancelled = false;

		const fetchProfile = async () => {
			setLoading(true);
			setError(null);
			try {
				const candidates = [
					tokenPayload?.username ? `/users/login/${encodeURIComponent(tokenPayload.username)}` : null,
					tokenPayload?.sub ? `/users/${tokenPayload.sub}` : null,
				].filter(Boolean) as string[];

				let data: UserProfileEntityDto | null = null;
				for (const endpoint of candidates) {
					const response = await fetch(buildApiUrl(endpoint), {
						headers: {
							Authorization: `Bearer ${token}`,
						},
					});

					if (response.ok) {
						data = (await response.json()) as UserProfileEntityDto;
						break;
					}
				}

				if (!data) {
					throw new Error('PROFILE_NOT_FOUND');
				}

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
	}, [token, tokenPayload?.sub, tokenPayload?.username]);

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

	const wallet = profile?.wallet ?? 0;
	const correctionPoint = profile?.correction_point ?? 0;
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

	const radarSkills = useMemo(
		() =>
			(profile?.skills ?? [])
				.slice(0, 7)
				.map((skill) => ({
					name: skill.name || 'Unnamed',
					level: Number(skill.level || 0),
				})),
		[profile?.skills],
	);

	const radarData = useMemo(() => {
		if (radarSkills.length === 0) return null;

		const size = 320;
		const center = size / 2;
		const radius = 85;
		const labelOffset = 38;
		const rings = 4;
		const maxLevel = 20;
		const count = radarSkills.length;

		const axisPoints = radarSkills.map((_, idx) => {
			const angle = (-Math.PI / 2) + (idx * 2 * Math.PI) / count;
			return {
				x: center + Math.cos(angle) * radius,
				y: center + Math.sin(angle) * radius,
				labelX: center + Math.cos(angle) * (radius + labelOffset),
				labelY: center + Math.sin(angle) * (radius + labelOffset),
			};
		});

		const polygon = radarSkills
			.map((skill, idx) => {
				const angle = (-Math.PI / 2) + (idx * 2 * Math.PI) / count;
				const ratio = Math.max(0, Math.min(1, skill.level / maxLevel));
				const r = radius * ratio;
				const x = center + Math.cos(angle) * r;
				const y = center + Math.sin(angle) * r;
				return `${x},${y}`;
			})
			.join(' ');

		return { size, center, radius, rings, axisPoints, polygon, maxLevel };
	}, [radarSkills]);

	return (
		<div className="relative left-1/2 right-1/2 w-screen -ml-[40vw] -mr-[40vw] px-3 md:px-6 lg:px-8 mr-3 md:mr-6 lg:mr-10">
			<section className="mb-4 space-y-3">
				<div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
					{/* Left column: Profile Picture + Common Core Progress */}
					<div className="space-y-3">
						{/* Bigger Profile Picture */}
						<div className="bg-ft-card border border-ft-border rounded-2xl p-6">
							<div className="flex flex-col items-center">
								<div className="w-40 h-40 rounded-2xl bg-ft-cyan text-black font-black text-6xl flex items-center justify-center overflow-hidden">
									{profile?.avatar_url ? (
										<img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
									) : (
										<span>{profileInitial}</span>
									)}
								</div>
								<h2 className="text-center mt-4 text-2xl font-black text-white">{displayName}</h2>
								<p className="text-center text-sm text-ft-muted mt-1">@{profileLogin}</p>
								<p className="text-center text-xs text-ft-muted">42 ID: {profile?.forty_two_id ?? 'N/A'}</p>
								<span className={`text-[10px] px-3 py-1 rounded-full border mt-3 ${profile?.active ? 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10' : 'border-ft-border text-ft-muted bg-ft-hover/60'}`}>
									{profile?.active ? 'Activo' : 'Inactivo'}
								</span>
						{loading && <p className="text-xs text-ft-muted mt-3">Cargando perfil...</p>}
								{error && <p className="text-xs text-red-400 mt-3">{error}</p>}
							</div>
						</div>

						{/* Common Core Progress and Titles Row */}
						<div className="grid grid-cols-2 gap-3">
							{/* Common Core Progress */}
							<div className="bg-ft-card border border-ft-border rounded-2xl p-4">
								<h3 className="text-sm font-bold text-white mb-3">Common Core Progress</h3>
								<div className="flex items-center gap-3">
									<div className="relative w-16 h-16 flex-shrink-0">
										<svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
											{/* Background circle */}
											<circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6" className="text-ft-border" />
											{/* Progress circle */}
											<circle
												cx="32"
												cy="32"
												r="28"
												fill="none"
												stroke="currentColor"
												strokeWidth="6"
												strokeDasharray={`${(progressPercentage / 100) * 2 * Math.PI * 28} ${2 * Math.PI * 28}`}
												strokeLinecap="round"
												className="text-ft-cyan transition-all duration-300"
											/>
										</svg>
										{/* Center level display */}
										<div className="absolute inset-0 flex items-center justify-center">
											<div className="text-center">
												<p className="text-xs font-bold text-ft-cyan">{levelInteger}</p>
											</div>
										</div>
									</div>
									<div>
										<p className="text-xs text-ft-muted">Current level cursus</p>
										<p className="text-xl font-black text-white">{level}</p>
										<p className="text-xs text-ft-muted">Grade: {cursusGrade}</p>
									</div>
								</div>
							</div>

							{/* Titles */}
							<div className="bg-ft-card border border-ft-border rounded-2xl p-4">
								<p className="text-[10px] text-ft-cyan uppercase mb-2 font-semibold">Titles</p>
								<div className="space-y-1">
									{profile?.titles && profile.titles.length > 0 ? (
										profile.titles.map((title, idx) => (
											<p key={idx} className="text-xs text-ft-muted truncate">{title.name || 'Untitled'}</p>
										))
									) : (
										<p className="text-xs text-ft-muted">No titles data</p>
									)}
								</div>
							</div>
						</div>
					</div>

					<div className="bg-ft-card border border-ft-border rounded-2xl p-4 xl:col-span-1">
						<h3 className="text-sm font-bold text-white mb-3">Skills</h3>
						{radarData ? (
							<div className="rounded-xl border border-ft-border bg-ft-hover/30 p-1">
								<svg viewBox={`0 0 ${radarData.size} ${radarData.size}`} className="w-full h-auto mx-auto" role="img" aria-label="Skills radar chart">
									{Array.from({ length: radarData.rings }, (_, ringIdx) => {
										const r = ((ringIdx + 1) / radarData.rings) * radarData.radius;
										return (
											<circle
												key={`ring-${ringIdx}`}
												cx={radarData.center}
												cy={radarData.center}
												r={r}
												fill="none"
												stroke="#334155"
												strokeWidth="1"
											/>
										);
									})}

									{radarData.axisPoints.map((point, idx) => (
										<line
											key={`axis-${idx}`}
											x1={radarData.center}
											y1={radarData.center}
											x2={point.x}
											y2={point.y}
											stroke="#334155"
											strokeWidth="1"
										/>
									))}

									<polygon
										points={radarData.polygon}
										fill="rgba(6, 182, 212, 0.55)"
										stroke="#0891b2"
										strokeWidth="2"
									/>

									{radarData.axisPoints.map((point, idx) => {
										const [line1, line2, line3] = splitLabel(radarSkills[idx].name);
										return (
											<text
												key={`label-${idx}`}
												x={point.labelX}
												y={point.labelY}
												textAnchor="middle"
												fontSize="10"
												fontWeight="500"
												fill="#94a3b8"
											>
												<tspan x={point.labelX} dy="0">{line1}</tspan>
												{line2 ? <tspan x={point.labelX} dy="12">{line2}</tspan> : null}
												{line3 ? <tspan x={point.labelX} dy="12">{line3}</tspan> : null}
											</text>
										);
									})}
								</svg>
							</div>
						) : (
							<p className="text-xs text-ft-muted">No skills data</p>
						)}
					</div>

				<div className="bg-ft-card border border-ft-border rounded-2xl p-4 xl:col-span-1">
					<h3 className="text-sm font-bold text-white mb-3">Projects</h3>
					{profile?.projects_users && profile.projects_users.length > 0 ? (
						<div className="space-y-1 max-h-80 overflow-y-auto pr-1">
								{profile.projects_users.map((project, idx) => (
									<div key={project.id ?? idx} className="border border-ft-border rounded-lg p-2">
										<p className="text-xs font-semibold text-white truncate">{project.name || 'Unnamed project'}</p>
										<div className="mt-1 flex items-center justify-between text-xs">
											<p className="text-ft-muted">
												Status: <span className="text-white text-xs">{project.status || 'unknown'}</span>
											</p>
											<p className="text-ft-muted">
												Mark: <span className="text-ft-cyan font-semibold text-xs">{project.final_mark ?? '-'}</span>
											</p>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-xs text-ft-muted">No projects from cursus 21 available</p>
						)}
					</div>

				</div>

				<div className="bg-ft-card border border-ft-border rounded-2xl p-4">
					<h3 className="text-sm font-bold text-white mb-3">Profile Details</h3>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
						<div>
							<p className="text-ft-muted uppercase text-[10px] font-semibold">Email</p>
							<p className="text-white truncate">{profile?.email ?? 'N/A'}</p>
						</div>
						<div>
							<p className="text-ft-muted uppercase text-[10px] font-semibold">Campus</p>
							<p className="text-white">{campus}</p>
						</div>
						<div>
							<p className="text-ft-muted uppercase text-[10px] font-semibold">Pool</p>
							<p className="text-white">{profile?.pool_month ?? 'N/A'} {profile?.pool_year ?? ''}</p>
						</div>
						<div>
							<p className="text-ft-muted uppercase text-[10px] font-semibold">Location</p>
							<p className="text-white truncate">{profile?.location ?? 'N/A'}</p>
						</div>
						<div>
							<p className="text-ft-muted uppercase text-[10px] font-semibold">Phone</p>
							<p className="text-white truncate">{profile?.phone ?? 'N/A'}</p>
						</div>
						<div>
							<p className="text-ft-muted uppercase text-[10px] font-semibold">Role</p>
							<p className="text-white">{profile?.staff ? 'Staff' : profile?.alumni ? 'Alumni' : 'Student'}</p>
						</div>
						<div>
							<p className="text-ft-muted uppercase text-[10px] font-semibold">Last Login</p>
							<p className="text-white text-[11px]">{formatDate(profile?.last_login_at ?? null)}</p>
						</div>
						<div>
							<p className="text-ft-muted uppercase text-[10px] font-semibold">Created</p>
							<p className="text-white text-[11px]">{formatDate(profile?.created_at ?? null)}</p>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
					<div className="bg-ft-card border border-ft-border rounded-lg p-2">
						<p className="text-[10px] text-ft-muted uppercase">Wallet</p>
						<p className="text-lg font-black text-white">{wallet} ₳</p>
					</div>
					<div className="bg-ft-card border border-ft-border rounded-lg p-2">
						<p className="text-[10px] text-ft-muted uppercase">Correction Points</p>
						<p className="text-lg font-black text-white">{correctionPoint}</p>
					</div>
					<div className="bg-ft-card border border-ft-border rounded-lg p-2">
						<p className="text-[10px] text-ft-muted uppercase">Campus</p>
						<p className="text-sm font-black text-white truncate">{campus}</p>
					</div>
					<div className="bg-ft-card border border-ft-border rounded-lg p-2">
						<p className="text-[10px] text-ft-muted uppercase">Pool</p>
						<p className="text-sm font-black text-white truncate">{pool}</p>
					</div>
					<div className="bg-ft-card border border-ft-border rounded-lg p-2">
						<p className="text-[10px] text-ft-muted uppercase">Role</p>
						<p className="text-sm font-black text-white">{role}</p>
					</div>
					<div className="bg-ft-card border border-ft-border rounded-lg p-2">
						<p className="text-[10px] text-ft-muted uppercase">Status</p>
						<p className="text-sm font-black text-white">{profileStatus}</p>
					</div>
				</div>

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
