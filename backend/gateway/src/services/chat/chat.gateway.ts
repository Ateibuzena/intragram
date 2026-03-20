import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Socket as UpstreamSocket } from 'socket.io-client';
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
		origin: true,
		credentials: true,
	},
	transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	private readonly upstreamByClientSocketId = new Map<string, UpstreamSocket>();

	constructor(private readonly chatService: ChatService) {}

	handleConnection(@ConnectedSocket() client: Socket): void {
		const upstream = this.chatService.createUpstreamConnection();
		this.upstreamByClientSocketId.set(client.id, upstream);
		this.chatService.incrementActiveBridges();

		upstream.on('receive_message', (data: unknown) => {
			client.emit('receive_message', data);
		});
		upstream.on('chat_history', (data: unknown) => {
			client.emit('chat_history', data);
		});
		upstream.on('users_update', (data: unknown) => {
			client.emit('users_update', data);
		});
		upstream.on('connect_error', () => {
			client.emit('chat_error', {
				message: 'No se pudo conectar con chat-service',
			});
		});
	}

	handleDisconnect(@ConnectedSocket() client: Socket): void {
		const upstream = this.upstreamByClientSocketId.get(client.id);
		if (upstream) {
			upstream.disconnect();
			this.upstreamByClientSocketId.delete(client.id);
			this.chatService.decrementActiveBridges();
		}
	}

	@SubscribeMessage('register')
	handleRegister(@ConnectedSocket() client: Socket, @MessageBody() payload: RegisterPayload): void {
		this.forwardEvent(client, 'register', payload);
	}

	@SubscribeMessage('join_private_chat')
	handleJoinPrivateChat(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: JoinPrivateChatPayload,
	): void {
		this.forwardEvent(client, 'join_private_chat', payload);
	}

	@SubscribeMessage('send_message')
	handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: SendMessagePayload): void {
		this.forwardEvent(client, 'send_message', payload);
	}

	private forwardEvent(client: Socket, event: string, payload: unknown): void {
		const upstream = this.upstreamByClientSocketId.get(client.id);
		if (!upstream) {
			client.emit('chat_error', { message: 'Bridge WS no disponible' });
			return;
		}

		upstream.emit(event, payload);
	}
}
