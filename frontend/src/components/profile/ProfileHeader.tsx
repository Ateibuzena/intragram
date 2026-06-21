import { useState } from 'react';
import type { ProfileInsights, UserProfileEntityDto } from '@/types/profile';
import { ProfileNameEditor, ProfileNameEditorOverlay } from './ProfileNameEditor';
import { ProfileAvatarDisplay, ProfileAvatarEditorModal } from './ProfileAvatarEditor';
import { ProfileBackgroundSelector } from './ProfileBackgroundSelector';
import { FriendActionButton } from './FriendActionButton';

type Relation = 'none' | 'friends' | 'pending_sent' | 'pending_received';
type FriendAction = 'idle' | 'adding' | 'removing' | 'accepting';

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

export const ProfileHeader = ({
	profile,
	displayName,
	profileLogin,
	profileInitial,
	loading,
	error,
	online,
	insights,
	canEditProfile = false,
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
	const [editingAvatar, setEditingAvatar] = useState(false);

	const progressPercentage = Math.max(0, Math.min(100, Math.round(insights?.progressPercentage ?? 0)));
	const progressAngle = Math.PI - (progressPercentage / 100) * Math.PI;
	const progressLabelRadius = 328;
	const progressLabelLeft = ((450 + progressLabelRadius * Math.cos(progressAngle)) / 900) * 100;
	const progressLabelTop = ((390 - progressLabelRadius * Math.sin(progressAngle)) / 430) * 100;

	const titles = insights?.titles ?? [];
	const selectedTitle = insights?.selectedTitle ?? null;

	return (
		<div className={`relative overflow-hidden ${className}`}>

			{/* ── Editors ── */}
			{editingAvatar && onSaveAvatarUrl && (
				<ProfileAvatarEditorModal
					avatarUrl={profile?.avatar_url ?? null}
					profileInitial={profileInitial}
					onSave={onSaveAvatarUrl}
					onClose={() => setEditingAvatar(false)}
				/>
			)}

			{editingName && onSaveDisplayName && (
				<ProfileNameEditorOverlay
					displayName={displayName}
					onSave={onSaveDisplayName}
					onClose={() => setEditingName(false)}
				/>
			)}

			{/* ── Background theme picker ── */}
			{canEditProfile && onSaveBackground && (
				<ProfileBackgroundSelector activeTheme={activeTheme} onSave={onSaveBackground} />
			)}

			{/* ── Main content ── */}
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
							className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-ft-cyan/30 bg-ft-card px-2.5 py-1 text-xs font-black text-ft-cyan shadow-ft-glow-sm backdrop-blur-sm"
							style={{ left: `${progressLabelLeft}%`, top: `${progressLabelTop}%` }}
						>
							{progressPercentage}%
						</div>
					</div>
				)}

				<div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-8 pt-32 md:pt-40">
					<div className="flex w-full max-w-4xl flex-col items-center gap-6 md:flex-row md:justify-center">

						<ProfileAvatarDisplay
							profile={profile}
							displayName={displayName}
							profileInitial={profileInitial}
							online={online}
							canEdit={canEditProfile && !!onSaveAvatarUrl}
							onStartEdit={() => setEditingAvatar(true)}
						/>

						<div className="min-w-0 text-center md:text-left">
							<div className="flex max-w-full items-center justify-center gap-3 md:justify-start">
								<ProfileNameEditor
									displayName={displayName}
									canEdit={canEditProfile && !!onSaveDisplayName}
									onStartEdit={() => setEditingName(true)}
								/>
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
									<div className="absolute left-1/2 top-[calc(100%+0.5rem)] z-40 w-72 max-w-[calc(100vw-3rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-ft-cyan/30 bg-[#050816]/90 backdrop-blur-xl shadow-2xl shadow-black/60 md:left-0 md:translate-x-0">
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
								{showFriendButton && profile && (
									<FriendActionButton
										relation={relation}
										friendAction={friendAction}
										onAddFriend={onAddFriend}
										onRemoveFriend={onRemoveFriend}
										onAcceptFriend={onAcceptFriend}
									/>
								)}
							</div>

							{loading && <p className="text-xs text-ft-muted mt-3">Cargando perfil...</p>}
							{error && <p className="text-xs text-red-400 mt-3">{error}</p>}
						</div>
					</div>

					{insights && (
						<div className="flex w-full max-w-4xl flex-wrap items-center justify-center gap-2 md:flex-nowrap">
							<div className="inline-flex min-w-0 items-baseline gap-2 rounded-full border border-ft-border surface-glass px-3 py-1.5">
								<span className="text-[10px] uppercase text-ft-muted">Proyectos</span>
								<span className="text-sm font-black leading-none text-white">{insights.totalProjects}</span>
							</div>
							<div className="inline-flex min-w-0 items-baseline gap-2 rounded-full border border-ft-border surface-glass px-3 py-1.5">
								<span className="text-[10px] uppercase text-ft-muted">Validados</span>
								<span className="text-sm font-black leading-none text-green-300">{insights.validatedProjects}</span>
							</div>
							<div className="inline-flex min-w-0 items-baseline gap-2 rounded-full border border-ft-border surface-glass px-3 py-1.5">
								<span className="text-[10px] uppercase text-ft-muted">Nota</span>
								<span className="text-sm font-black leading-none text-white">{insights.averageProjectMark ?? '-'}</span>
							</div>
							<div className="inline-flex min-w-0 items-baseline gap-2 rounded-full border border-ft-border surface-glass px-3 py-1.5">
								<span className="text-[10px] uppercase text-ft-muted">Wallet</span>
								<span className="text-sm font-black leading-none text-white">{insights.wallet} ₳</span>
							</div>
							<div className="inline-flex min-w-0 items-baseline gap-2 rounded-full border border-ft-border surface-glass px-3 py-1.5">
								<span className="text-[10px] uppercase text-ft-muted">Corrections</span>
								<span className="text-sm font-black leading-none text-white">{insights.correctionPoint}</span>
							</div>
							<div className="inline-flex min-w-0 items-baseline gap-2 rounded-full border border-ft-border surface-glass px-3 py-1.5">
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
