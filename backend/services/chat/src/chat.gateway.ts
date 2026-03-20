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

type RegisterPayload = {
	clientId: string;
};

type JoinPrivateChatPayload = {
	clientId: string;
	peerId: string;
};

type SendMessagePayload = {
	sender: string;
	receiver: string;
	message: string;
};

@WebSocketGateway({
	path: '/chat/socket.io',
	cors: {
		origin: '*',
	},
	transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayDisconnect {
	@WebSocketServer()
	private readonly server: Server;

	constructor(
		private readonly chatService: ChatService,
		private readonly authService: AuthService
	) {}

	async handleConnection(client: Socket): Promise<void> {
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
		}
		catch (err) {
			console.error('Error al verificar el token:', err);
			client.disconnect(true);
		}
	}

	handleDisconnect(client: Socket): void {
		this.chatService.unregisterSocket(client.id);
		console.log(`Socket ${client.id} desconectado`);
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
	handleSendMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: SendMessagePayload,
	): void {
		if (!payload?.sender?.trim() || !payload?.receiver?.trim() || !payload?.message?.trim()) {
			return;
		}

		const message = this.chatService.appendMessage(
			payload.sender.trim(),
			payload.receiver.trim(),
			payload.message.trim(),
		);

		const receiverSocketIds = this.chatService.getSocketsForUser(payload.receiver.trim());
		for (const socketId of receiverSocketIds) {
			this.server.to(socketId).emit('receive_message', {
				sender: message.sender,
				message: message.message,
			});
		}

		const senderSocketIds = this.chatService.getSocketsForUser(payload.sender.trim());
		for (const socketId of senderSocketIds) {
			if (socketId !== client.id) {
				this.server.to(socketId).emit('receive_message', {
					sender: message.sender,
					message: message.message,
				});
			}
		}
	}

	private broadcastUsers(): void {
		this.server.emit('users_update', {
			users: this.chatService.getConnectedUsers(),
		});
	}
}
