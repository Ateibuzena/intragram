import { Injectable } from '@nestjs/common';
import type { ServerToClientEvents } from '@intragram/shared/realtime';

export type EventPayload<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

export interface IRealtimeGateway {
	emitToAll<E extends keyof ServerToClientEvents>(event: E, data: EventPayload<E>): void;
	emitToUser<E extends keyof ServerToClientEvents>(userId: string, event: E, data: EventPayload<E>): void;
}

/**
 * Typed bridge between HTTP controllers and the WebSocket gateway. Controllers
 * depend on this instead of the gateway directly, so the actual push mechanism
 * (in-process today, Redis-backed rooms once scaled out) can change without
 * touching call sites.
 */
@Injectable()
export class RealtimeService {
	private gateway: IRealtimeGateway | null = null;

	register(gateway: IRealtimeGateway): void {
		this.gateway = gateway;
	}

	emitToAll<E extends keyof ServerToClientEvents>(event: E, data: EventPayload<E>): void {
		this.gateway?.emitToAll(event, data);
	}

	emitToUser<E extends keyof ServerToClientEvents>(userId: string, event: E, data: EventPayload<E>): void {
		this.gateway?.emitToUser(userId, event, data);
	}
}
