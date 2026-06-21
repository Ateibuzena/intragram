import type { FilterKey } from '@/types/feed';

export interface FeedFilter {
	key: FilterKey;
	label: string;
	icon: string;
	desc: string;
}

export const FILTERS: FeedFilter[] = [
	{ key: 'reciente', label: 'Reciente', icon: '🕐', desc: 'Tus publicaciones y las de tus amigos' },
	{ key: 'amigos', label: 'Amigos', icon: '👥', desc: 'Solo de personas que sigues y te siguen' },
	{ key: 'favoritos', label: 'Favoritos', icon: '⭐', desc: 'Publicaciones que has guardado' },
	{ key: 'trending', label: 'Tendencias', icon: '🔥', desc: 'Lo más popular ahora mismo' },
	{ key: 'perfil', label: 'Mis publicaciones', icon: '📝', desc: 'Solo tus propias publicaciones' },
];
