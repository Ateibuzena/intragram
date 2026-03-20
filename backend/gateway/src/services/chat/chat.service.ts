import { Injectable } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { SERVICE_URLS } from '../../config/microservices.config';

@Injectable()
export class ChatService {
	private activeBridges = 0;

	createUpstreamConnection(): Socket {
		return io(SERVICE_URLS.chat, {
			path: '/chat/socket.io',
			transports: ['websocket'],
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 500,
		});
	}

	incrementActiveBridges(): void {
		this.activeBridges += 1;
	}

	decrementActiveBridges(): void {
		this.activeBridges = Math.max(0, this.activeBridges - 1);
	}

	getBridgeStatus() {
		return {
			service: 'gateway-chat-bridge',
			status: 'ok',
			upstream: SERVICE_URLS.chat,
			activeBridges: this.activeBridges,
		};
	}
}
