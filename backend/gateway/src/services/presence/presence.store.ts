import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_PUB_CLIENT } from '../../redis/redis.module';

const ONLINE_SET_KEY = 'presence:online';
const connectionCountKey = (userId: string) => `presence:count:${userId}`;

/**
 * Cross-instance "is this user online anywhere" registry. A user can hold N
 * live socket connections at once (multiple tabs, or reconnects landing on a
 * different gateway replica) — online/offline only flips when the refcount
 * crosses zero, generalizing the same rule the gateway enforced locally
 * before this was shared across replicas via Redis.
 */
@Injectable()
export class PresenceStore {
	constructor(@Inject(REDIS_PUB_CLIENT) private readonly redis: Redis) {}

	/** Returns whether the user was already online before this connection. */
	async markOnline(userId: string): Promise<boolean> {
		const count = await this.redis.incr(connectionCountKey(userId));
		if (count === 1) {
			await this.redis.sadd(ONLINE_SET_KEY, userId);
			return false;
		}
		return true;
	}

	/** Returns whether the user is still online on another connection. */
	async markOffline(userId: string): Promise<boolean> {
		const count = await this.redis.decr(connectionCountKey(userId));
		if (count <= 0) {
			await this.redis.del(connectionCountKey(userId));
			await this.redis.srem(ONLINE_SET_KEY, userId);
			return false;
		}
		return true;
	}

	async getOnlineUserIds(): Promise<string[]> {
		return this.redis.smembers(ONLINE_SET_KEY);
	}
}
