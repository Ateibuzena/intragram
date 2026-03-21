import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export type StoredChatMessage = {
	sender: string;
	receiver: string;
	message: string;
	timestamp: string;
};

export interface TokenPayload {
	sub: string;    // user id
	username: string;
	email: string;
	iat?: number;
	exp?: number;
}

@Injectable()
export class ChatService {

	private readonly jwtSecret: string;

	constructor() {
		// JWT secret desde variable de entorno (obligatorio en producción)
		this.jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
		if (!process.env.JWT_SECRET) {
			console.warn('⚠️  WARNING: JWT_SECRET is not set. Using default secret. This should be changed in production!');
		}
	}
	// Funcion para validar el token de autenticación (placeholder, implementar según tu lógica de auth)
	validateToken(token: string): any 
	{
		const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;
		console.log("Payload del token validado:", payload);
		if (payload && typeof payload === 'object' && 'sub' in payload) {
			return payload ;
		}
		return null;
	}

	// Mapa para almacenar las conversaciones entre pares de usuarios. La clave es una combinación ordenada de los IDs de los usuarios (e.g., "userA_userB").
	private readonly conversations = new Map<string, StoredChatMessage[]>();

	// Mapa para gestionar la relación entre usuarios y sus sockets conectados
	private readonly userToSockets = new Map<string, Set<string>>();

	// Mapa inverso para obtener el usuario asociado a un socket
	private readonly socketToUser = new Map<string, string>();

	// Función para registrar un nuevo socket para un usuario
	registerSocket(userId: string, socketId: string): void {
		this.socketToUser.set(socketId, userId);
		const sockets = this.userToSockets.get(userId) ?? new Set<string>();
		sockets.add(socketId);
		this.userToSockets.set(userId, sockets);
	}

	// Función para eliminar un socket cuando un cliente se desconecta
	unregisterSocket(socketId: string): void {
		const userId = this.socketToUser.get(socketId);
		if (!userId) return;

		this.socketToUser.delete(socketId);
		const sockets = this.userToSockets.get(userId);
		if (!sockets) return;

		sockets.delete(socketId);
		if (!sockets.size) this.userToSockets.delete(userId);
	}

	// Función para obtener los sockets conectados de un usuario
	getSocketsForUser(userId: string): string[] {
		return [...(this.userToSockets.get(userId) ?? [])];
	}

	// Función para obtener la lista de usuarios actualmente conectados
	getConnectedUsers(): string[] {
		return [...this.userToSockets.keys()];
	}

	getUserIdBySocket(socketId: string): string | undefined {
		return this.socketToUser.get(socketId);
	}

	// Función para generar una clave única para un par de usuarios, independientemente del orden
	getPairKey(userA: string, userB: string): string {
		return [userA, userB].sort().join('_');
	}

	// Función para agregar un mensaje a la conversación entre dos usuarios
	appendMessage(sender: string, receiver: string, message: string): StoredChatMessage {
		const storedMessage: StoredChatMessage = {
			sender,
			receiver,
			message,
			timestamp: new Date().toISOString(),
		};

		const pairKey = this.getPairKey(sender, receiver);
		const history = this.conversations.get(pairKey) ?? [];
		history.push(storedMessage);
		this.conversations.set(pairKey, history);

		return storedMessage;
	}

	// Función para obtener el historial de mensajes entre dos usuarios
	getConversation(clientId: string, peerId: string): StoredChatMessage[] {
		const pairKey = this.getPairKey(clientId, peerId);
		return this.conversations.get(pairKey) ?? [];
	}
}
