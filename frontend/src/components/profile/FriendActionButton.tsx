import { Button } from '@/components/ui/Button';

type Relation = 'none' | 'friends' | 'pending_sent' | 'pending_received';
type FriendAction = 'idle' | 'adding' | 'removing' | 'accepting';

interface FriendActionButtonProps {
	relation: Relation;
	friendAction: FriendAction;
	onAddFriend?: () => void;
	onRemoveFriend?: () => void;
	onAcceptFriend?: () => void;
}

export const FriendActionButton = ({
	relation,
	friendAction,
	onAddFriend,
	onRemoveFriend,
	onAcceptFriend,
}: FriendActionButtonProps) => {
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
