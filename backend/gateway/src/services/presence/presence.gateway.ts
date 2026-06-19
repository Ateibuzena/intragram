import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
	cors: {
		origin: true,
		credentials: true,
	},
})
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() private readonly server: Server;
	private readonly socketUserMap = new Map<string, string>();

	constructor(
		private readonly authService: AuthService,
		private readonly usersService: UsersService,
	) {}

	async handleConnection(socket: Socket): Promise<void> {
		const token = socket.handshake.auth?.token as string | undefined;
		if (!token) {
			socket.disconnect(true);
			return;
		}

		try {
			const validation = await this.authService.validateToken(token);
			if (!validation?.valid || !validation.payload?.chat_user_id) {
				socket.disconnect(true);
				return;
			}

			const userId = validation.payload.chat_user_id;
			const wasAlreadyOnline = [...this.socketUserMap.values()].includes(userId);
			this.socketUserMap.set(socket.id, userId);
			await this.usersService.setPresence(userId, true);

			// Send the current snapshot of online users to the newly connected client
			const onlineUserIds = [...new Set(this.socketUserMap.values())];
			socket.emit('online:users', onlineUserIds);

			// Broadcast status change only on first connection (not on extra tabs)
			if (!wasAlreadyOnline) {
				socket.broadcast.emit('user:status', { userId, active: true });
			}
		} catch {
			socket.disconnect(true);
		}
	}

	async handleDisconnect(socket: Socket): Promise<void> {
		const userId = this.socketUserMap.get(socket.id);
		if (!userId) return;

		this.socketUserMap.delete(socket.id);

		const isStillOnline = [...this.socketUserMap.values()].includes(userId);
		if (!isStillOnline) {
			await this.usersService.setPresence(userId, false);
			this.server.emit('user:status', { userId, active: false });
		}
	}
}
