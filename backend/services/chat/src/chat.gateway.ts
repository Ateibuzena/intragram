import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';
import { AuthService } from '../../auth/src/auth.service'; // ruta exacta a tu auth.service.ts

// DTOs para los mensajes entrantes
type RegisterPayload = {
	clientId: string;
};

// DTOs para los mensajes entrantes
type JoinPrivateChatPayload = {
	clientId: string;
	peerId: string;
};

// DTO para el mensaje de envío
type SendMessagePayload = {
	sender: string;
	receiver: string;
	message: string;
};

// Configuración del WebSocket Gateway
@WebSocketGateway({
	path: '/chat/socket.io',
	cors: {
		origin: '*',
	},
	transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayDisconnect {
	// Inyectamos el servidor de WebSocket para poder emitir eventos a los clientes
	@WebSocketServer()

	// El tipo de `server` es `Server` de socket.io, lo que nos permite usar métodos como `to()` para enviar mensajes a sockets específicos
	private readonly server: Server;

	// Mapa para almacenar la expiración de cada socket
	private readonly socketExpirations = new Map<string, number>(); // socketId -> timestamp de expiración

	// Inyectamos el servicio de chat y el servicio de autenticación para validar tokens y gestionar la lógica de chat
	constructor(
		private readonly chatService: ChatService,
		private readonly authService: AuthService
	) {}

	// Método que se ejecuta cuando un cliente se conecta al WebSocket
	async handleConnection(client: Socket): Promise<void> {
		// Extraemos el token del handshake del cliente
		const token = client.handshake.auth.token;
		if (!token) {
			console.warn('Conexión sin token, desconectando socket:', client.id);
			client.disconnect(true);
			return;
		}

		try {
			// Validar el token y obtener el userId
			const playload = await this.authService.validateToken(token);
			const userId = playload.sub;

			// Registrar el socket seguro
			this.chatService.registerSocket(userId, client.id);
			console.log(`Usuario ${userId} conectado en socket ${client.id}`);

			// Emitir actualización de usuarios conectados a todos los clientes
			const sockets = this.chatService.getSocketsForUser(userId);
			if (sockets.length === 1) {
				this.server.emit('users_connected', {userId});
			}

			// Guardar la expiración del socket (ejemplo: 1 hora)
			if (playload.exp) {
				// Guardamos la expiración del socket en milisegundos
				this.socketExpirations.set(client.id, playload.exp * 1000); // convertir a ms

				// Programar desconexión automática al expirar el token
				const msUntilExpiration = playload.exp * 1000 - Date.now();
				setTimeout(() => {
					if (this.socketExpirations.has(client.id)) {
						console.log(`Token expirado para socket ${client.id}, desconectando...`);
						client.disconnect(true);
						this.socketExpirations.delete(client.id);
					}
				}, msUntilExpiration);
			}
		}
		catch (err) {
			console.error('Error al verificar el token:', err);
			client.disconnect(true);
		}
	}

	handleDisconnect(client: Socket): void {
		const userId = this.chatService.getUserIdBySocket(client.id);
		this.chatService.unregisterSocket(client.id);
		this.socketExpirations.delete(client.id);
		console.log(`Socket ${client.id} desconectado${userId}`);

		// Emitir actualización de usuarios conectados a todos los clientes
		if (userId) {
			const remainingSockets = this.chatService.getSocketsForUser(userId);
			if (remainingSockets.length === 0) {
				this.server.emit('users_disconnected', {userId});
			}
		}
	}

	@SubscribeMessage('join_private_chat')
	handleJoinPrivateChat(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: JoinPrivateChatPayload,
	): void {
		if (!payload?.clientId?.trim() || !payload?.peerId?.trim()) {
			return;
		}

		const room = this.chatService.getPairKey(payload.clientId.trim(), payload.peerId.trim());
		void client.join(room);

		client.emit('chat_history', {
			peerId: payload.peerId,
			messages: this.chatService.getConversation(payload.clientId, payload.peerId),
		});
	}

	@SubscribeMessage('send_message')
	async handleSendMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: SendMessagePayload,
	): Promise<void> {
		if (!payload?.sender?.trim() || !payload?.receiver?.trim() || !payload?.message?.trim()) {
			return;
		}

		const senderId = payload.sender.trim();
		const receiverId = payload.receiver.trim();
		const text = payload.message.trim();

		// Guardar el mensaje en la conversación
		const menssage = this.chatService.appendMessage(senderId, receiverId, text);

		// Emitir solo a sockets del receptor
		const receiverSocketIds = this.chatService.getSocketsForUser(receiverId);
		receiverSocketIds.forEach(socketId => {
			this.server.to(socketId).emit('receive_message', {
				sender: senderId,
				message: text,
			});
		});

		// Emitir solo a otros sockets del remitente (en caso de que tenga múltiples conexiones)
		const senderSocketIds = this.chatService.getSocketsForUser(senderId);
		senderSocketIds
			.filter(socketId => socketId !== client.id) // Excluir el socket que envió el mensaje
			.forEach(socketId => {
				this.server.to(socketId).emit('receive_message', {
					sender: senderId,
					message: text,
				});
			});
	}
}
