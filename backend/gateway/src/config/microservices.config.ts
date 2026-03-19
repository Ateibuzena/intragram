/**
 * Configuración de URLs internas entre servicios
 * Las variables de entorno se definen en .env.local o .env.docker
 */

const normalizeUrl = (url: string): string => url.replace(/\/$/, '');

export const SERVICE_URLS = {
	auth: normalizeUrl(
		process.env.AUTH_SERVICE_URL ||
			`http://${process.env.AUTH_SERVICE_HOST || 'auth-service'}:${process.env.AUTH_SERVICE_PORT || '3003'}`,
	),
	users: normalizeUrl(
		process.env.USERS_SERVICE_URL ||
			`http://${process.env.USERS_SERVICE_HOST || 'users-service'}:${process.env.USERS_SERVICE_PORT || '3006'}`,
	),
	chat: normalizeUrl(
		process.env.CHAT_SERVICE_URL ||
			`http://${process.env.CHAT_SERVICE_HOST || 'chat-service'}:${process.env.CHAT_SERVICE_PORT || '3004'}`,
	),
	example: normalizeUrl(
		process.env.EXAMPLE_SERVICE_URL ||
		process.env.EXAMPLE_URL ||
			`http://${process.env.EXAMPLE_SERVICE_HOST || 'example-service'}:${process.env.EXAMPLE_SERVICE_PORT || '3005'}`,
	),
};
