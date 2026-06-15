import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
	cors: {
		origin: process.env.CORS_ORIGIN ?? '*',
		credentials: true,
	},
})
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
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
			this.socketUserMap.set(socket.id, userId);
			await this.usersService.setPresence(userId, true);
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
		}
	}
}
