import { Button } from '@/components/ui/Button';
import { UserProfileEntityDto } from './profileTypes';

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
	canEditProfile?: boolean;
	onEditProfile?: () => void;
	showFriendButton?: boolean;
	relation?: Relation;
	friendAction?: FriendAction;
	onAddFriend?: () => void;
	onRemoveFriend?: () => void;
	onAcceptFriend?: () => void;
}

export const ProfileHeader = ({
	profile,
	displayName,
	profileLogin,
	profileInitial,
	loading,
	error,
	online,
	canEditProfile,
	onEditProfile,
	showFriendButton,
	relation = 'none',
	friendAction = 'idle',
	onAddFriend,
	onRemoveFriend,
	onAcceptFriend,
}: ProfileHeaderProps) => {
	const renderFriendButton = () => {
		if (friendAction !== 'idle') {
			return <span className="text-[10px] text-ft-muted px-2.5 py-1">...</span>;
		}
		switch (relation) {
			case 'friends':
				return (
					<Button
						variant="ghost"
						size="sm"
						onClick={onRemoveFriend}
						className="text-[10px] px-2.5 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-400/30"
					>
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
					<Button
						variant="primary"
						size="sm"
						onClick={onAcceptFriend}
						className="text-[10px] px-2.5 py-1"
					>
						Aceptar solicitud
					</Button>
				);
			default:
				return (
					<Button
						variant="primary"
						size="sm"
						onClick={onAddFriend}
						className="text-[10px] px-2.5 py-1"
					>
						Agregar amigo
					</Button>
				);
		}
	};

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
				<div className="relative">
					<div className="w-40 h-40 rounded-2xl bg-ft-cyan text-black font-black text-6xl flex items-center justify-center overflow-hidden">
						{profile?.avatar_url ? (
							<img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
						) : (
							<span>{profileInitial}</span>
						)}
					</div>
					{online !== undefined && (
						<span className={`absolute bottom-2 right-2 w-4 h-4 border-2 border-ft-card rounded-full ${online ? 'bg-green-400' : 'bg-red-500'}`} />
					)}
				</div>
				<h2 className="text-center mt-4 text-2xl font-black text-white">{displayName}</h2>
				<p className="text-center text-sm text-ft-muted mt-1">@{profileLogin}</p>
				<p className="text-center text-xs text-ft-muted">42 ID: {profile?.forty_two_id ?? 'N/A'}</p>
				<div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
					{showFriendButton && profile && renderFriendButton()}
				</div>
				{loading && <p className="text-xs text-ft-muted mt-3">Cargando perfil...</p>}
				{error && <p className="text-xs text-red-400 mt-3">{error}</p>}
			</div>
		</div>
	);
};
