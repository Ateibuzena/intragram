import { OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { RealtimeService } from '../realtime/realtime.service';

@WebSocketGateway({
	cors: {
		origin: true,
		credentials: true,
	},
})
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
	@WebSocketServer() private readonly server: Server;

	// socketId → { userId, login }
	private readonly socketMeta = new Map<string, { userId: string; login: string }>();
	// userId → Set of socketIds (multi-tab support)
	private readonly userSockets = new Map<string, Set<string>>();

	constructor(
		private readonly authService: AuthService,
		private readonly usersService: UsersService,
		private readonly realtimeService: RealtimeService,
	) {}

	onModuleInit(): void {
		this.realtimeService.register({
			emitToAll: (event, data) => this.server?.emit(event, data),
			emitToUser: (userId, event, data) => {
				const sockets = this.userSockets.get(userId);
				if (!sockets) return;
				for (const socketId of sockets) {
					this.server.to(socketId).emit(event, data);
				}
			},
		});
	}

	async handleConnection(socket: Socket): Promise<void> {
		const token = socket.handshake.auth?.token as string | undefined;
		if (!token) { socket.disconnect(true); return; }

		try {
			const validation = await this.authService.validateToken(token);
			if (!validation?.valid || !validation.payload?.chat_user_id) {
				socket.disconnect(true);
				return;
			}

			const userId = String(validation.payload.chat_user_id);
			const login = String(validation.payload.username ?? validation.payload.sub ?? userId);

			const wasAlreadyOnline = this.userSockets.has(userId);

			this.socketMeta.set(socket.id, { userId, login });

			if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
			this.userSockets.get(userId)!.add(socket.id);

			await this.usersService.setPresence(userId, true);

			const onlineUserIds = [...this.userSockets.keys()];
			socket.emit('online:users', onlineUserIds);

			if (!wasAlreadyOnline) {
				socket.broadcast.emit('user:status', { userId, active: true });
			}
		} catch {
			socket.disconnect(true);
		}
	}

	async handleDisconnect(socket: Socket): Promise<void> {
		const meta = this.socketMeta.get(socket.id);
		if (!meta) return;

		const { userId } = meta;
		this.socketMeta.delete(socket.id);

		const sockets = this.userSockets.get(userId);
		if (sockets) {
			sockets.delete(socket.id);
			if (sockets.size === 0) {
				this.userSockets.delete(userId);
				await this.usersService.setPresence(userId, false);
				this.server.emit('user:status', { userId, active: false });
			}
		}
	}

	@SubscribeMessage('chat:typing')
	handleTyping(
		@ConnectedSocket() socket: Socket,
		@MessageBody() data: { conversationId: string; recipientId: string },
	): void {
		const meta = this.socketMeta.get(socket.id);
		if (!meta || !data?.recipientId) return;

		const recipientSockets = this.userSockets.get(data.recipientId);
		if (!recipientSockets) return;

		for (const socketId of recipientSockets) {
			this.server.to(socketId).emit('chat:typing', {
				conversationId: data.conversationId,
				login: meta.login,
			});
		}
	}
}
