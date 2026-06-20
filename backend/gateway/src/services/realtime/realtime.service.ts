import { Injectable } from '@nestjs/common';

export interface IRealtimeGateway {
	emitToAll(event: string, data: unknown): void;
	emitToUser(userId: string, event: string, data: unknown): void;
}

@Injectable()
export class RealtimeService {
	private gateway: IRealtimeGateway | null = null;

	register(gateway: IRealtimeGateway): void {
		this.gateway = gateway;
	}

	emitToAll(event: string, data: unknown): void {
		this.gateway?.emitToAll(event, data);
	}

	emitToUser(userId: string, event: string, data: unknown): void {
		this.gateway?.emitToUser(userId, event, data);
	}
}
