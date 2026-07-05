import type { FriendRelation } from '@/hooks/useFriendContext';

type FriendAction = 'idle' | 'adding' | 'removing' | 'accepting';

interface FriendActionButtonProps {
	relation: FriendRelation;
	friendAction: FriendAction;
	onAddFriend?: () => void;
	onRemoveFriend?: () => void;
	onAcceptFriend?: () => void;
}

const pill = 'rounded-full border px-3 py-1 text-xs font-bold transition-colors';

export const FriendActionButton = ({
	relation,
	friendAction,
	onAddFriend,
	onRemoveFriend,
	onAcceptFriend,
}: FriendActionButtonProps) => {
	if (friendAction !== 'idle') {
		return <span className={`${pill} border-ft-border bg-ft-hover/40 text-ft-muted`}>...</span>;
	}

	switch (relation) {
		case 'friends':
			return (
				<button
					type="button"
					onClick={onRemoveFriend}
					className={`${pill} border-red-400/30 bg-red-500/10 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.35)] hover:bg-red-500/20 hover:text-red-200 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]`}
				>
					Eliminar amigo
				</button>
			);
		case 'pending_sent':
			return (
				<span className={`${pill} border-amber-400/30 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)]`}>
					Solicitud enviada
				</span>
			);
		case 'pending_received':
			return (
				<button
					type="button"
					onClick={onAcceptFriend}
					className={`${pill} border-green-400/30 bg-green-500/10 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.35)] hover:bg-green-500/20 hover:text-green-200 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]`}
				>
					Aceptar solicitud
				</button>
			);
		default:
			return (
				<button
					type="button"
					onClick={onAddFriend}
					className={`${pill} border-ft-cyan/30 bg-ft-cyan/10 text-ft-cyan shadow-[0_0_15px_rgba(0,186,188,0.35)] hover:bg-ft-cyan/20 hover:shadow-[0_0_20px_rgba(0,186,188,0.5)]`}
				>
					Agregar amigo
				</button>
			);
	}
};
