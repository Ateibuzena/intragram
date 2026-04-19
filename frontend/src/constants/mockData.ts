import type { User } from '@/types/models';

export const MOCK_CURRENT_USER: User = {
	login: 'petazz',
	avatar: 'P',
	level: 7,
};

export const FILTERS = [
	{ key: 'reciente' as const, label: 'Reciente', icon: '🕐', desc: 'Tus publicaciones y las de tus amigos' },
	{ key: 'amigos' as const, label: 'Amigos', icon: '👥', desc: 'Solo de personas que sigues y te siguen' },
	{ key: 'favoritos' as const, label: 'Favoritos', icon: '⭐', desc: 'Publicaciones que has guardado' },
	{ key: 'trending' as const, label: 'Tendencias', icon: '🔥', desc: 'Lo más popular ahora mismo' },
	{ key: 'perfil' as const, label: 'Mis publicaciones', icon: '📝', desc: 'Solo tus propias publicaciones' },
];
