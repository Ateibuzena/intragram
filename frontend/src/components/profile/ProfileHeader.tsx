import { Button } from '@/components/ui/Button';
import { UserProfileEntityDto } from './profileTypes';

type FriendAction = 'idle' | 'adding' | 'removing';

interface ProfileHeaderProps {
	profile: UserProfileEntityDto | null;
	displayName: string;
	profileLogin: string;
	profileInitial: string;
	loading: boolean;
	error: string | null;
	canEditProfile?: boolean;
	onEditProfile?: () => void;
	showFriendButton?: boolean;
	isFriend?: boolean;
	friendAction?: FriendAction;
	friendMessage?: string | null;
	onAddFriend?: () => void;
	onRemoveFriend?: () => void;
}

export const ProfileHeader = ({
	profile,
	displayName,
	profileLogin,
	profileInitial,
	loading,
	error,
	canEditProfile,
	onEditProfile,
	showFriendButton,
	isFriend,
	friendAction = 'idle',
	friendMessage,
	onAddFriend,
	onRemoveFriend,
}: ProfileHeaderProps) => {
	return (
		<div className="relative bg-ft-card border border-ft-border rounded-2xl p-6 h-full flex flex-col items-center justify-center">
			{canEditProfile && onEditProfile && (
				<div className="absolute top-4 right-4">
					<Button variant="outline" size="sm" onClick={onEditProfile} className="text-[11px] px-3 py-1.5">
						Editar perfil
					</Button>
				</div>
			)}
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
				<div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
					<span className={`text-[10px] px-3 py-1 rounded-full border ${profile?.active ? 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10' : 'border-ft-border text-ft-muted bg-ft-hover/60'}`}>
						{profile?.active ? 'Activo' : 'Inactivo'}
					</span>
					{showFriendButton && profile && (
						isFriend ? (
							<Button
								variant="ghost"
								size="sm"
								disabled={friendAction !== 'idle'}
								onClick={onRemoveFriend}
								className="text-[10px] px-2.5 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-400/30"
							>
								{friendAction === 'removing' ? '...' : 'Eliminar amigo'}
							</Button>
						) : (
							<Button
								variant="primary"
								size="sm"
								disabled={friendAction !== 'idle'}
								onClick={onAddFriend}
								className="text-[10px] px-2.5 py-1"
							>
								{friendAction === 'adding' ? '...' : 'Agregar amigo'}
							</Button>
						)
					)}
				</div>
				{friendMessage && (
					<p className="text-[10px] text-ft-muted mt-1">{friendMessage}</p>
				)}
				{loading && <p className="text-xs text-ft-muted mt-3">Cargando perfil...</p>}
				{error && <p className="text-xs text-red-400 mt-3">{error}</p>}
			</div>
		</div>
	);
};
