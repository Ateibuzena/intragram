import { useState, useRef, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { ProfileInsights, UserProfileEntityDto } from './profileTypes';

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
	onSaveDisplayName?: (name: string) => Promise<void>;
	onSaveAvatarUrl?: (url: string) => Promise<void>;
	showFriendButton?: boolean;
	relation?: Relation;
	friendAction?: FriendAction;
	onAddFriend?: () => void;
	onRemoveFriend?: () => void;
	onAcceptFriend?: () => void;
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
	onSaveDisplayName,
	onSaveAvatarUrl,
	showFriendButton,
	relation = 'none',
	friendAction = 'idle',
	onAddFriend,
	onRemoveFriend,
	onAcceptFriend,
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
		<div className="relative bg-ft-card border border-ft-border rounded-2xl p-5 h-full flex flex-col items-center justify-center overflow-visible">

			{/* ── Avatar edit overlay ── */}
			{editingAvatar && (
				<div className="absolute inset-0 z-10 rounded-2xl bg-ft-card/95 backdrop-blur-sm flex flex-col items-center justify-center gap-5 p-6">
					<div className="w-36 h-36 rounded-2xl overflow-hidden bg-ft-hover flex-shrink-0">
						{avatarInput ? (
							<img src={avatarInput} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
						) : profile?.avatar_url ? (
							<img src={profile.avatar_url} alt="actual" className="w-full h-full object-cover" />
						) : (
							<span className="w-full h-full flex items-center justify-center text-2xl font-black text-black bg-ft-cyan">{profileInitial}</span>
						)}
					</div>
					<div className="w-full space-y-3">
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
								className="flex-1 py-1.5 text-xs font-medium text-ft-muted border border-ft-border rounded-xl hover:bg-ft-hover disabled:opacity-40 transition-all"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={() => void saveAvatar()}
								disabled={savingAvatar}
								className="flex-1 py-1.5 text-xs font-semibold bg-ft-cyan/10 text-ft-cyan border border-ft-cyan/30 rounded-xl hover:bg-ft-cyan/20 disabled:opacity-40 transition-all"
							>
								{savingAvatar ? 'Guardando...' : 'Guardar'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ── Name edit overlay ── */}
			{editingName && (
				<div className="absolute inset-0 z-10 rounded-2xl bg-ft-card/95 backdrop-blur-sm flex flex-col items-center justify-center gap-5 p-6">
					<div className="w-full space-y-3">
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
								className="flex-1 py-1.5 text-xs font-medium text-ft-muted border border-ft-border rounded-xl hover:bg-ft-hover disabled:opacity-40 transition-all"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={() => void saveName()}
								disabled={savingName}
								className="flex-1 py-1.5 text-xs font-semibold bg-ft-cyan/10 text-ft-cyan border border-ft-cyan/30 rounded-xl hover:bg-ft-cyan/20 disabled:opacity-40 transition-all"
							>
								{savingName ? 'Guardando...' : 'Guardar'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ── Normal content ── */}
			<div className="flex flex-col items-center w-full">
				<div className="relative group/avatar">
					<div className="w-36 h-36 md:w-40 md:h-40 rounded-2xl bg-ft-cyan text-black font-black text-6xl flex items-center justify-center overflow-hidden shadow-ft-glow-sm">
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

				<div className="mt-4 flex items-center gap-1.5 group/name max-w-full px-2">
					<h2
						className={`text-center text-2xl font-black text-white truncate ${canEditProfile ? 'cursor-pointer' : ''}`}
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

				{selectedTitle && (
					<details className="group relative z-20 mt-1 max-w-full">
						<summary className="flex max-w-full cursor-pointer list-none items-center justify-center gap-1.5 text-center text-xs font-semibold text-ft-muted transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
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

						<div className="absolute left-1/2 top-[calc(100%+0.5rem)] z-40 w-72 max-w-[calc(100vw-3rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-ft-border bg-ft-card shadow-2xl shadow-black/50">
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

				<p className="text-center text-sm text-ft-muted mt-1">@{profileLogin}</p>
				<p className="text-center text-xs text-ft-muted">42 ID: {profile?.forty_two_id ?? 'N/A'}</p>

				{insights && (
					<div className="mt-4 grid w-full grid-cols-2 gap-2 text-center">
						<div className="min-w-0 rounded-lg border border-ft-border bg-ft-hover/40 px-2 py-2">
							<p className="text-[9px] font-semibold uppercase text-ft-muted">Campus</p>
							<p className="truncate text-xs font-bold text-white">{insights.campus}</p>
						</div>
						<div className="min-w-0 rounded-lg border border-ft-border bg-ft-hover/40 px-2 py-2">
							<p className="text-[9px] font-semibold uppercase text-ft-muted">Rol</p>
							<p className="truncate text-xs font-bold text-white">{insights.role}</p>
						</div>
						<div className="min-w-0 rounded-lg border border-ft-border bg-ft-hover/40 px-2 py-2">
							<p className="text-[9px] font-semibold uppercase text-ft-muted">Estado</p>
							<p className={`truncate text-xs font-bold ${profile?.active ? 'text-green-300' : 'text-ft-muted'}`}>
								{insights.profileStatus}
							</p>
						</div>
						<div className="min-w-0 rounded-lg border border-ft-border bg-ft-hover/40 px-2 py-2">
							<p className="text-[9px] font-semibold uppercase text-ft-muted">Pool</p>
							<p className="truncate text-xs font-bold text-white">{insights.pool}</p>
						</div>
					</div>
				)}

				{titles.length > 0 && (
					<div className="mt-3 flex w-full gap-1.5 overflow-hidden">
						{titles.slice(0, 3).map((title) => (
							<span
								key={title.id}
								className={`min-w-0 truncate rounded-full border px-2 py-1 text-[10px] font-semibold ${
									title.selected
										? 'border-ft-cyan/40 bg-ft-cyan/10 text-ft-cyan'
										: 'border-ft-border bg-ft-hover/40 text-ft-muted'
								}`}
								title={title.name}
							>
								{title.name}
							</span>
						))}
					</div>
				)}

				<div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
					{showFriendButton && profile && renderFriendButton()}
				</div>

				{loading && <p className="text-xs text-ft-muted mt-3">Cargando perfil...</p>}
				{error && <p className="text-xs text-red-400 mt-3">{error}</p>}
			</div>
		</div>
	);
};
