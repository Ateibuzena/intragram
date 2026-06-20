import { useState, useRef, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { ProfileInsights, UserProfileEntityDto } from './profileTypes';

type Relation = 'none' | 'friends' | 'pending_sent' | 'pending_received';
type FriendAction = 'idle' | 'adding' | 'removing' | 'accepting';

const BG_THEMES = [
	{ key: 'none',        label: 'Sólido' },
	{ key: 'dots',        label: 'Puntos' },
	{ key: 'topographic', label: 'Topográfico' },
	{ key: 'circuit',     label: 'Circuito' },
	{ key: 'noise',       label: 'Grano' },
] as const;

const ThemeSwatch = ({ themeKey }: { themeKey: string }) => {
	if (themeKey === 'none') return <div className="absolute inset-0 bg-ft-bg rounded-lg" />;
	if (themeKey === 'dots') return (
		<div className="absolute inset-0 bg-ft-bg rounded-lg" style={{
			backgroundImage: 'radial-gradient(circle, rgba(0,186,188,0.4) 1px, transparent 1px)',
			backgroundSize: '6px 6px',
		}} />
	);
	if (themeKey === 'topographic') return (
		<div className="absolute inset-0 bg-ft-bg rounded-lg overflow-hidden">
			<svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 36" preserveAspectRatio="xMidYMid slice">
				<ellipse cx="32" cy="18" rx="28" ry="10" fill="none" stroke="rgba(0,186,188,0.4)" strokeWidth="1" />
				<ellipse cx="32" cy="18" rx="20" ry="7" fill="none" stroke="rgba(0,186,188,0.4)" strokeWidth="1" />
				<ellipse cx="32" cy="18" rx="12" ry="4" fill="none" stroke="rgba(0,186,188,0.4)" strokeWidth="1" />
				<ellipse cx="8"  cy="32" rx="14" ry="6" fill="none" stroke="rgba(0,186,188,0.25)" strokeWidth="1" />
				<ellipse cx="56" cy="4"  rx="12" ry="5" fill="none" stroke="rgba(0,186,188,0.25)" strokeWidth="1" />
			</svg>
		</div>
	);
	if (themeKey === 'circuit') return (
		<div className="absolute inset-0 bg-ft-bg rounded-lg overflow-hidden">
			<svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 36" preserveAspectRatio="xMidYMid slice">
				<g fill="none" stroke="rgba(0,186,188,0.4)" strokeWidth="1">
					<path d="M4 18h12v-8h10" /><path d="M60 18h-12v8h-10" />
					<path d="M32 4v10h10" /><path d="M32 32v-10h-10" />
				</g>
				<g fill="rgba(0,186,188,0.5)">
					<circle cx="4" cy="18" r="2" /><circle cx="60" cy="18" r="2" />
					<circle cx="32" cy="4" r="2" /><circle cx="32" cy="32" r="2" />
					<circle cx="26" cy="10" r="1.5" /><circle cx="38" cy="26" r="1.5" />
				</g>
			</svg>
		</div>
	);
	if (themeKey === 'noise') return (
		<div className="absolute inset-0 bg-ft-bg rounded-lg overflow-hidden">
			<svg className="absolute inset-0 w-full h-full">
				<filter id={`np-${themeKey}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#np-${themeKey})`} opacity="0.15" />
			</svg>
		</div>
	);
	return null;
};

interface ProfileHeaderProps {
	profile: UserProfileEntityDto | null;
	displayName: string;
	profileLogin: string;
	profileInitial: string;
	loading: boolean;
	error: string | null;
	online?: boolean;
	insights?: ProfileInsights;
	canEditProfile?: boolean;
	activeTheme?: string;
	onSaveDisplayName?: (name: string) => Promise<void>;
	onSaveAvatarUrl?: (url: string) => Promise<void>;
	onSaveBackground?: (theme: string) => Promise<void>;
	showFriendButton?: boolean;
	relation?: Relation;
	friendAction?: FriendAction;
	onAddFriend?: () => void;
	onRemoveFriend?: () => void;
	onAcceptFriend?: () => void;
	className?: string;
}

const PencilIcon = ({ className }: { className?: string }) => (
	<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
	</svg>
);

export const ProfileHeader = ({
	profile,
	displayName,
	profileLogin,
	profileInitial,
	loading,
	error,
	online,
	insights,
	canEditProfile,
	activeTheme = 'none',
	onSaveDisplayName,
	onSaveAvatarUrl,
	onSaveBackground,
	showFriendButton,
	relation = 'none',
	friendAction = 'idle',
	onAddFriend,
	onRemoveFriend,
	onAcceptFriend,
	className = '',
}: ProfileHeaderProps) => {
	const [editingName, setEditingName] = useState(false);
	const [nameInput, setNameInput] = useState('');
	const [savingName, setSavingName] = useState(false);

	const [editingAvatar, setEditingAvatar] = useState(false);
	const [avatarInput, setAvatarInput] = useState('');
	const [savingAvatar, setSavingAvatar] = useState(false);
	const [avatarError, setAvatarError] = useState<string | null>(null);

	const nameInputRef = useRef<HTMLInputElement>(null);
	const titles = insights?.titles ?? [];
	const selectedTitle = insights?.selectedTitle ?? null;
	const progressPercentage = Math.max(0, Math.min(100, Math.round(insights?.progressPercentage ?? 0)));
	const progressAngle = Math.PI - (progressPercentage / 100) * Math.PI;
	const progressLabelRadius = 328;
	const progressLabelLeft = ((450 + progressLabelRadius * Math.cos(progressAngle)) / 900) * 100;
	const progressLabelTop = ((390 - progressLabelRadius * Math.sin(progressAngle)) / 430) * 100;

	const startEditName = () => {
		if (!canEditProfile) return;
		setNameInput(displayName);
		setEditingName(true);
	};

	const cancelEditName = () => {
		setEditingName(false);
		setNameInput('');
	};

	const saveName = async () => {
		const trimmed = nameInput.trim();
		if (!trimmed || !onSaveDisplayName) { cancelEditName(); return; }
		setSavingName(true);
		try {
			await onSaveDisplayName(trimmed);
			setEditingName(false);
		} finally {
			setSavingName(false);
		}
	};

	const onNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') void saveName();
		if (e.key === 'Escape') cancelEditName();
	};

	const startEditAvatar = () => {
		if (!canEditProfile) return;
		setAvatarInput(profile?.avatar_url ?? '');
		setAvatarError(null);
		setEditingAvatar(true);
	};

	const cancelEditAvatar = () => {
		setEditingAvatar(false);
		setAvatarInput('');
		setAvatarError(null);
	};

	const saveAvatar = async () => {
		const trimmed = avatarInput.trim();
		if (!onSaveAvatarUrl) { cancelEditAvatar(); return; }
		if (trimmed) {
			try {
				const parsed = new URL(trimmed);
				if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
			} catch {
				setAvatarError('Introduce una URL válida (http/https).');
				return;
			}
		}
		setSavingAvatar(true);
		try {
			await onSaveAvatarUrl(trimmed);
			setEditingAvatar(false);
		} finally {
			setSavingAvatar(false);
		}
	};

	const renderFriendButton = () => {
		if (friendAction !== 'idle') {
			return <span className="text-[10px] text-ft-muted px-2.5 py-1">...</span>;
		}
		switch (relation) {
			case 'friends':
				return (
					<Button variant="ghost" size="sm" onClick={onRemoveFriend} className="text-[10px] px-2.5 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-400/30">
						Eliminar amigo
					</Button>
				);
			case 'pending_sent':
				return (
					<span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-ft-border text-ft-muted">
						Solicitud enviada
					</span>
				);
			case 'pending_received':
				return (
					<Button variant="primary" size="sm" onClick={onAcceptFriend} className="text-[10px] px-2.5 py-1">
						Aceptar solicitud
					</Button>
				);
			default:
				return (
					<Button variant="primary" size="sm" onClick={onAddFriend} className="text-[10px] px-2.5 py-1">
						Agregar amigo
					</Button>
				);
		}
	};

	return (
		<div className={`relative overflow-hidden ${className}`}>

			{/* ── Avatar edit overlay ── */}
			{editingAvatar && (
				<div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-ft-card/95 backdrop-blur-sm p-6 rounded-[inherit]">
					<h3 className="text-sm font-bold text-white">Cambiar foto de perfil</h3>
					<div className="w-28 h-28 rounded-2xl overflow-hidden bg-ft-hover flex-shrink-0">
						{avatarInput ? (
							<img src={avatarInput} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
						) : profile?.avatar_url ? (
							<img src={profile.avatar_url} alt="actual" className="w-full h-full object-cover" />
						) : (
							<span className="w-full h-full flex items-center justify-center text-2xl font-black text-black bg-ft-cyan">{profileInitial}</span>
						)}
					</div>
					<div className="w-full max-w-sm space-y-3">
						<input
							type="url"
							value={avatarInput}
							onChange={(e) => { setAvatarInput(e.target.value); setAvatarError(null); }}
							placeholder="https://example.com/foto.jpg"
							autoFocus
							className="w-full bg-ft-hover border border-ft-border rounded-xl px-3 py-2 text-xs text-ft-text placeholder-ft-muted focus:outline-none focus:border-ft-cyan/50 transition-colors"
						/>
						{avatarError && <p className="text-[10px] text-red-400 text-center">{avatarError}</p>}
						<div className="flex gap-2">
							<button
								type="button"
								onClick={cancelEditAvatar}
								disabled={savingAvatar}
								className="flex-1 py-2 text-xs font-medium text-ft-muted border border-ft-border rounded-xl hover:bg-ft-hover disabled:opacity-40 transition-all"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={() => void saveAvatar()}
								disabled={savingAvatar}
								className="flex-1 py-2 text-xs font-semibold bg-ft-cyan/10 text-ft-cyan border border-ft-cyan/30 rounded-xl hover:bg-ft-cyan/20 disabled:opacity-40 transition-all"
							>
								{savingAvatar ? 'Guardando...' : 'Guardar'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ── Name edit overlay ── */}
			{editingName && (
				<div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-ft-card/95 backdrop-blur-sm p-6 rounded-[inherit]">
					<h3 className="text-sm font-bold text-white">Cambiar nombre</h3>
					<div className="w-full max-w-sm space-y-3">
						<input
							ref={nameInputRef}
							type="text"
							value={nameInput}
							onChange={(e) => setNameInput(e.target.value)}
							onKeyDown={onNameKeyDown}
							maxLength={80}
							autoFocus
							className="w-full bg-ft-hover border border-ft-border rounded-xl px-3 py-2 text-sm font-bold text-white text-center focus:outline-none focus:border-ft-cyan/50 transition-colors"
						/>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={cancelEditName}
								disabled={savingName}
								className="flex-1 py-2 text-xs font-medium text-ft-muted border border-ft-border rounded-xl hover:bg-ft-hover disabled:opacity-40 transition-all"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={() => void saveName()}
								disabled={savingName}
								className="flex-1 py-2 text-xs font-semibold bg-ft-cyan/10 text-ft-cyan border border-ft-cyan/30 rounded-xl hover:bg-ft-cyan/20 disabled:opacity-40 transition-all"
							>
								{savingName ? 'Guardando...' : 'Guardar'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ── Background theme picker ── */}
			{canEditProfile && onSaveBackground && (
				<div className="absolute top-4 right-4 z-20 flex items-center gap-2">
					{BG_THEMES.map(({ key, label }) => {
						const isActive = activeTheme === key;
						return (
							<button
								key={key}
								title={label}
								onClick={() => void onSaveBackground(key)}
								className={`relative w-8 h-5 rounded-md overflow-hidden flex-shrink-0 transition-all duration-200
									${isActive
										? 'border-2 border-ft-cyan scale-110 shadow-[0_0_6px_rgba(0,186,188,0.6)]'
										: 'border border-white/30 hover:border-white/70 hover:scale-105'}`}
							>
								<ThemeSwatch themeKey={key} />
							</button>
						);
					})}
				</div>
			)}

			{/* ── Normal content ── */}
			<div className="relative flex min-h-[36rem] w-full items-center justify-center overflow-visible px-4 py-14 md:min-h-[34rem] md:px-10 md:py-16">
				{insights && (
					<div
						className="pointer-events-none absolute inset-x-0 top-3 z-0 mx-auto w-full max-w-6xl px-3 md:top-6 md:px-8"
						aria-hidden="true"
					>
						<svg viewBox="0 0 900 430" className="h-auto w-full overflow-visible">
							<path
								d="M 72 390 A 378 378 0 0 1 828 390"
								fill="none"
								pathLength={100}
								stroke="currentColor"
								strokeLinecap="round"
								strokeWidth="30"
								className="text-ft-border/70"
							/>
							<path
								d="M 72 390 A 378 378 0 0 1 828 390"
								fill="none"
								pathLength={100}
								stroke="currentColor"
								strokeDasharray={`${progressPercentage} 100`}
								strokeLinecap="round"
								strokeWidth="30"
								className="text-ft-cyan drop-shadow-[0_0_34px_rgba(0,212,255,0.52)]"
							/>
						</svg>
						<div
							className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-ft-cyan/30 bg-ft-bg/80 px-2.5 py-1 text-xs font-black text-ft-cyan shadow-ft-glow-sm backdrop-blur-sm"
							style={{ left: `${progressLabelLeft}%`, top: `${progressLabelTop}%` }}
						>
							{progressPercentage}%
						</div>
					</div>
				)}

				<div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-8 pt-32 md:pt-40">
					<div className="flex w-full max-w-4xl flex-col items-center gap-6 md:flex-row md:justify-center">
						<div className="relative group/avatar shrink-0">
							<div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-ft-cyan text-black font-black text-6xl flex items-center justify-center overflow-hidden shadow-ft-glow-sm">
								{profile?.avatar_url ? (
									<img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
								) : (
									<span>{profileInitial}</span>
								)}
							</div>

							{canEditProfile && (
								<button
									type="button"
									onClick={startEditAvatar}
									className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
								>
									<PencilIcon className="w-8 h-8 text-white drop-shadow" />
								</button>
							)}

							{online !== undefined && (
								<span
									className={`absolute bottom-2 right-2 w-4 h-4 border-2 border-ft-card rounded-full ${
										online ? 'bg-green-400' : 'bg-ft-muted'
									}`}
									title={online ? 'Online' : 'Offline'}
								/>
							)}
						</div>

						<div className="min-w-0 text-center md:text-left">
							<div className="flex max-w-full items-center justify-center gap-3 md:justify-start">
								<div className="flex min-w-0 items-center justify-center gap-1.5 group/name md:justify-start">
									<h2
										className={`min-w-0 truncate text-3xl font-black text-white md:text-4xl ${canEditProfile ? 'cursor-pointer' : ''}`}
										onClick={canEditProfile ? startEditName : undefined}
									>
										{displayName}
									</h2>
									{canEditProfile && (
										<button
											type="button"
											onClick={startEditName}
											className="flex-shrink-0 opacity-0 group-hover/name:opacity-100 transition-opacity text-ft-muted hover:text-white"
										>
											<PencilIcon className="w-3.5 h-3.5" />
										</button>
									)}
								</div>
								{insights && (
									<div
										className="hidden h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border border-ft-cyan/30 bg-ft-cyan/10 text-ft-cyan shadow-ft-glow-sm md:flex"
										title={`Nivel 42: ${insights.level}`}
									>
										<span className="text-[9px] font-bold uppercase leading-none text-ft-muted">lvl</span>
										<span className="mt-0.5 text-sm font-black leading-none text-white">{insights.level}</span>
									</div>
								)}
							</div>

					{selectedTitle && (
						<details className="group relative z-20 mt-2 max-w-full">
							<summary className="flex max-w-full cursor-pointer list-none items-center justify-center gap-1.5 text-center text-sm font-semibold text-ft-muted transition-colors hover:text-white md:justify-start md:text-left [&::-webkit-details-marker]:hidden">
								<span className="min-w-0 truncate">{selectedTitle.name}</span>
								<svg
									className="h-3.5 w-3.5 shrink-0 text-ft-muted transition-transform group-open:rotate-180 group-hover:text-white"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-hidden="true"
								>
									<path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
								</svg>
							</summary>

							<div className="absolute left-1/2 top-[calc(100%+0.5rem)] z-40 w-72 max-w-[calc(100vw-3rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-ft-border bg-ft-card shadow-2xl shadow-black/50 md:left-0 md:translate-x-0">
								<div className="max-h-52 overflow-y-auto py-1">
									{titles.map((title) => (
										<div
											key={title.id}
											className={`px-3 py-2 text-left text-xs leading-snug ${
												title.id === selectedTitle.id
													? 'bg-ft-cyan/10 font-semibold text-ft-cyan'
													: 'text-ft-muted hover:bg-ft-hover hover:text-white'
											}`}
											title={title.name}
										>
											{title.name}
										</div>
									))}
								</div>
							</div>
						</details>
					)}

					<p className="mt-2 text-sm text-ft-muted">@{profileLogin}</p>
					<p className="text-xs text-ft-muted">42 ID: {profile?.forty_two_id ?? 'N/A'}</p>

						{insights && (
							<div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
								<span className="rounded-full border border-ft-border bg-ft-hover/40 px-3 py-1 text-xs font-bold text-white">
									{insights.role}
								</span>
							<span className={`rounded-full border px-3 py-1 text-xs font-bold ${
								profile?.location
									? 'border-green-400/30 bg-green-500/10 text-green-300'
									: 'border-ft-border bg-ft-hover/40 text-ft-muted'
							}`}
								title={profile?.location ?? 'Sin location en 42'}
							>
								{insights.profileStatus}
							</span>
							<span className="max-w-full truncate rounded-full border border-ft-border bg-ft-hover/40 px-3 py-1 text-xs font-bold text-white">
								Pool {insights.pool}
							</span>
						</div>
					)}

						<div className="flex items-center gap-2 mt-4 flex-wrap justify-center md:justify-start">
						{showFriendButton && profile && renderFriendButton()}
					</div>

							{loading && <p className="text-xs text-ft-muted mt-3">Cargando perfil...</p>}
							{error && <p className="text-xs text-red-400 mt-3">{error}</p>}
						</div>
					</div>

							{insights && (
								<div className="flex w-full max-w-4xl flex-wrap items-center justify-center gap-2 md:flex-nowrap">
									<div className="inline-flex min-w-0 items-baseline gap-2 rounded-full border border-ft-border bg-ft-card/35 px-3 py-1.5 backdrop-blur-sm">
										<span className="text-[10px] uppercase text-ft-muted">Proyectos</span>
										<span className="text-sm font-black leading-none text-white">{insights.totalProjects}</span>
									</div>
									<div className="inline-flex min-w-0 items-baseline gap-2 rounded-full border border-ft-border bg-ft-card/35 px-3 py-1.5 backdrop-blur-sm">
										<span className="text-[10px] uppercase text-ft-muted">Validados</span>
										<span className="text-sm font-black leading-none text-green-300">{insights.validatedProjects}</span>
									</div>
									<div className="inline-flex min-w-0 items-baseline gap-2 rounded-full border border-ft-border bg-ft-card/35 px-3 py-1.5 backdrop-blur-sm">
										<span className="text-[10px] uppercase text-ft-muted">Nota</span>
										<span className="text-sm font-black leading-none text-white">{insights.averageProjectMark ?? '-'}</span>
									</div>
									<div className="inline-flex min-w-0 items-baseline gap-2 rounded-full border border-ft-border bg-ft-card/35 px-3 py-1.5 backdrop-blur-sm">
										<span className="text-[10px] uppercase text-ft-muted">Wallet</span>
										<span className="text-sm font-black leading-none text-white">{insights.wallet} ₳</span>
									</div>
									<div className="inline-flex min-w-0 items-baseline gap-2 rounded-full border border-ft-border bg-ft-card/35 px-3 py-1.5 backdrop-blur-sm">
										<span className="text-[10px] uppercase text-ft-muted">Corrections</span>
										<span className="text-sm font-black leading-none text-white">{insights.correctionPoint}</span>
									</div>
									<div className="inline-flex min-w-0 items-baseline gap-2 rounded-full border border-ft-border bg-ft-card/35 px-3 py-1.5 backdrop-blur-sm">
										<span className="text-[10px] uppercase text-ft-muted">Campus</span>
										<span className="truncate text-sm font-black leading-none text-white">{insights.campus}</span>
									</div>
								</div>
							)}
					</div>
				</div>
			</div>
		);
	};
