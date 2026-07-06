import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplicationContext } from '@nestjs/common';
import type { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type Redis from 'ioredis';

/**
 * Attaches the Redis pub/sub adapter to Socket.IO so `server.emit(...)` and
 * room-based emits reach clients connected to any gateway replica, not just
 * the process that received the originating HTTP request.
 */
export class RedisIoAdapter extends IoAdapter {
	constructor(
		app: INestApplicationContext,
		private readonly pubClient: Redis,
		private readonly subClient: Redis,
	) {
		super(app);
	}

	createIOServer(port: number, options?: ServerOptions) {
		const server = super.createIOServer(port, options);
		server.adapter(createAdapter(this.pubClient, this.subClient));
		return server;
	}
}
