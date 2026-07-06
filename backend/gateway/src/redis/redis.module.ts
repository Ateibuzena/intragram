import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_PUB_CLIENT = 'REDIS_PUB_CLIENT';
export const REDIS_SUB_CLIENT = 'REDIS_SUB_CLIENT';

/**
 * Global so both PresenceStore (via DI) and main.ts's bootstrap (via app.get)
 * share the same two connections instead of each opening their own.
 */
@Global()
@Module({
	providers: [
		{
			provide: REDIS_PUB_CLIENT,
			useFactory: () => new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379'),
		},
		{
			provide: REDIS_SUB_CLIENT,
			useFactory: (pubClient: Redis) => pubClient.duplicate(),
			inject: [REDIS_PUB_CLIENT],
		},
	],
	exports: [REDIS_PUB_CLIENT, REDIS_SUB_CLIENT],
})
export class RedisModule {}
