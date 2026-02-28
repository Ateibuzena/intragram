/**
 * Configuración de Microservicios
 * Centraliza la configuración de conexión a todos los microservicios
 * Usa TCP como protocolo de transporte
 */

import { Transport } from '@nestjs/microservices';

export const MICROSERVICES_CONFIG = {
	auth: {
		transport: Transport.TCP,
		options: {
			host: process.env.AUTH_SERVICE_HOST || 'auth-service',
			port: parseInt(process.env.AUTH_SERVICE_PORT || '3003'),
		},
	},
	chat: {
		transport: Transport.TCP,
		options: {
			host: process.env.CHAT_SERVICE_HOST || 'chat-service',
			port: parseInt(process.env.CHAT_SERVICE_PORT || '3004'),
		},
	},
	example: {
		transport: Transport.TCP,
		options: {
			host: process.env.EXAMPLE_SERVICE_HOST || 'example-service',
			port: parseInt(process.env.EXAMPLE_SERVICE_PORT || '3005'),
		},
	},
};
// Nombres de los servicios para inyección
export const MICROSERVICE_TOKENS = {
	EXAMPLE_SERVICE: 'EXAMPLE_SERVICE',
	AUTH_SERVICE: 'AUTH_SERVICE',
	CHAT_SERVICE: 'CHAT_SERVICE',
};
