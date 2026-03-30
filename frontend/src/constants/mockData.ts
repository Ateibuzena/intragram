import type { Conversation, Message, Post, User } from '@/types/models';

export const MOCK_CURRENT_USER: User = {
	login: 'petazz',
	avatar: 'P',
	level: 7,
};

export const MOCK_POSTS: Post[] = [
	{
		id: 1,
		user: { login: 'pperez', level: 8 },
		content: '¡Acabo de terminar ft_printf! Después de 3 semanas, por fin funciona al 100% 🎉 Si alguien necesita ayuda, aquí estoy.',
		time: 'hace 5 min',
		likes: 12,
		comments: 3,
		liked: false,
	},
	{
		id: 2,
		user: { login: 'mruiz', level: 5 },
		content: '¿Alguien me puede explicar cómo funciona Norminette? Me tiene completamente loco con las líneas de 80 caracteres...',
		time: 'hace 20 min',
		likes: 7,
		comments: 8,
		liked: false,
	},
	{
		id: 3,
		user: { login: 'agarcia', level: 12 },
		content: 'Push_swap con 3 instrucciones para 100 números ✅ El algoritmo de Turk optimizado funciona de maravilla.',
		time: 'hace 1 hora',
		likes: 34,
		comments: 15,
		liked: true,
	},
];

export const MOCK_FRIENDS: User[] = [
	{ login: 'mruiz', avatar: 'M', level: 5, online: true },
	{ login: 'agarcia', avatar: 'A', level: 12, online: true },
	{ login: 'csmith', avatar: 'C', level: 9, online: true },
	{ login: 'dperez', avatar: 'D', level: 3, online: true },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
	{ id: 1, user: { login: 'dperez', avatar: 'D', level: 3, lastSeen: '2 min' }, lastMessage: 'Oye el push_swap me está matando 😭', timestamp: '2 min', unread: true },
	{ id: 2, user: { login: 'jgarcia', avatar: 'J', level: 7, lastSeen: '15 min' }, lastMessage: 'Ya terminaste libft? Necesito ayuda con ft_split', timestamp: '15 min', unread: true },
	{ id: 3, user: { login: 'mlopez', avatar: 'M', level: 5, lastSeen: '1 h' }, lastMessage: 'Vamos a la cantina en 10?', timestamp: '1 h', unread: false },
	{ id: 4, user: { login: 'atorre', avatar: 'A', level: 9, lastSeen: '3 h' }, lastMessage: 'El exam de C03 fue brutal tío', timestamp: '3 h', unread: false },
	{ id: 5, user: { login: 'rblanco', avatar: 'R', level: 4, lastSeen: '5 h' }, lastMessage: 'rblanco ha enviado un archivo adjunto.', timestamp: '5 h', unread: true },
	{ id: 6, user: { login: 'cnavarro', avatar: 'C', level: 11, lastSeen: '1 d' }, lastMessage: 'Thx por la corrección!', timestamp: '1 d', unread: false },
	{ id: 7, user: { login: 'lmartinez', avatar: 'L', level: 6, lastSeen: '2 d' }, lastMessage: 'lmartinez ha enviado un mensaje de voz.', timestamp: '2 d', unread: true },
	{ id: 8, user: { login: 'sruiz', avatar: 'S', level: 8, lastSeen: '3 d' }, lastMessage: 'Minitalk funciona perfecto, gracias!', timestamp: '3 d', unread: false },
];

export const MOCK_MESSAGES: Message[] = [
	{ id: 1, sender: 'other', text: 'Tío, me estoy volviendo loco con malloc y free', timestamp: '14 mar. 2026, 18:23' },
	{ id: 2, sender: 'other', text: 'Cada vez que corro valgrind me salen leaks por todos lados 😭', timestamp: '14 mar. 2026, 18:23', reactions: ['😂', '💀'] },
	{ id: 3, sender: 'me', text: 'jajaja tranqui', timestamp: '14 mar. 2026, 18:25' },
	{ id: 4, sender: 'me', text: 'revisa que hagas free de todo lo que malloceas', timestamp: '14 mar. 2026, 18:25' },
	{ id: 5, sender: 'me', text: 'y también del return de strdup/split', timestamp: '14 mar. 2026, 18:26' },
	{ id: 6, sender: 'other', type: 'audio', duration: '0:15', timestamp: '14 mar. 2026, 19:02' },
	{ id: 7, sender: 'me', type: 'audio', duration: '0:08', timestamp: '14 mar. 2026, 19:10' },
	{ id: 8, sender: 'other', text: 'Vale, ya lo pillé! Era que no liberaba el array en ft_split', timestamp: '14 mar. 2026, 19:45' },
	{ id: 9, sender: 'other', text: 'Gracias crack 🙏', timestamp: '14 mar. 2026, 19:45', reactions: ['🔥', '💪'] },
];

export const FILTERS = [
	{ key: 'reciente' as const, label: 'Reciente', icon: '🕐', desc: 'Tus publicaciones y las de tus amigos' },
	{ key: 'amigos' as const, label: 'Amigos', icon: '👥', desc: 'Solo de personas que sigues y te siguen' },
	{ key: 'favoritos' as const, label: 'Favoritos', icon: '⭐', desc: 'Publicaciones que has guardado' },
	{ key: 'trending' as const, label: 'Tendencias', icon: '🔥', desc: 'Lo más popular ahora mismo' },
	{ key: 'perfil' as const, label: 'Mis publicaciones', icon: '👤', desc: 'Solo tus propias publicaciones' },
];
