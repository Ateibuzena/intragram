import { OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@intragram/shared/realtime';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { RealtimeService, IRealtimeGateway, EventPayload } from '../realtime/realtime.service';
import { PresenceStore } from './presence.store';

/** Every connected socket joins this room — emitToUser targets it directly,
 * and the Redis adapter (see redis-io.adapter.ts) makes that reach the user
 * regardless of which gateway replica their socket is attached to. */
const userRoom = (userId: string) => `user:${userId}`;

@WebSocketGateway({
	cors: {
		origin: true,
		credentials: true,
	},
})
export class PresenceGateway implements IRealtimeGateway, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
	@WebSocketServer() private readonly server: Server<ClientToServerEvents, ServerToClientEvents>;

	// socketId → { userId, login }, scoped to sockets connected to *this* instance —
	// only needed for per-connection bookkeeping (disconnect cleanup, "who's typing"),
	// never for reaching another user (that goes through rooms + the Redis adapter).
	private readonly socketMeta = new Map<string, { userId: string; login: string }>();

	constructor(
		private readonly authService: AuthService,
		private readonly usersService: UsersService,
		private readonly realtimeService: RealtimeService,
		private readonly presenceStore: PresenceStore,
	) {}

	onModuleInit(): void {
		this.realtimeService.register(this);
	}

	emitToAll<E extends keyof ServerToClientEvents>(event: E, data: EventPayload<E>): void {
		this.server?.emit(event, data);
	}

	emitToUser<E extends keyof ServerToClientEvents>(userId: string, event: E, data: EventPayload<E>): void {
		this.server?.to(userRoom(userId)).emit(event, data);
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

			this.socketMeta.set(socket.id, { userId, login });
			await socket.join(userRoom(userId));

			const wasAlreadyOnline = await this.presenceStore.markOnline(userId);
			await this.usersService.setPresence(userId, true);

			const onlineUserIds = await this.presenceStore.getOnlineUserIds();
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

		this.socketMeta.delete(socket.id);

		const stillOnline = await this.presenceStore.markOffline(meta.userId);
		if (!stillOnline) {
			await this.usersService.setPresence(meta.userId, false);
			this.server.emit('user:status', { userId: meta.userId, active: false });
		}
	}

	@SubscribeMessage('chat:typing')
	handleTyping(
		@ConnectedSocket() socket: Socket,
		@MessageBody() data: Parameters<ClientToServerEvents['chat:typing']>[0],
	): void {
		const meta = this.socketMeta.get(socket.id);
		if (!meta || !data?.recipientId) return;

		this.server.to(userRoom(data.recipientId)).emit('chat:typing', {
			conversationId: data.conversationId,
			login: meta.login,
		});
	}
}
