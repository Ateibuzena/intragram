import {
	ConnectedSocket,
	MessageBody,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';

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
	private readonly server!: Server;

	constructor(private readonly chatService: ChatService) {}

	handleDisconnect(client: Socket): void {
		this.chatService.unregisterSocket(client.id);
		this.broadcastUsers();
	}

	@SubscribeMessage('register')
	handleRegister(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: RegisterPayload,
	): void {
		if (!payload?.clientId?.trim()) {
			return;
		}

		this.chatService.registerSocket(payload.clientId.trim(), client.id);
		this.broadcastUsers();
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

		const receiverSocketIds = this.chatService.getSocketsForClient(payload.receiver.trim());
		for (const socketId of receiverSocketIds) {
			this.server.to(socketId).emit('receive_message', {
				sender: message.sender,
				message: message.message,
			});
		}

		const senderSocketIds = this.chatService.getSocketsForClient(payload.sender.trim());
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
