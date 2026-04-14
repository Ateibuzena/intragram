import { CanActivate, ExecutionContext, Injectable, TooManyRequestsException } from '@nestjs/common';
import { PUBLIC_RATE_LIMIT_METADATA, type PublicRateLimitOptions } from '../decorators/public-rate-limit.decorator';

interface Bucket {
	count: number;
	resetAt: number;
}

@Injectable()
export class PublicRateLimitGuard implements CanActivate {
	private readonly buckets = new Map<string, Bucket>();

	canActivate(context: ExecutionContext): boolean {
		const handler = context.getHandler();
		const controller = context.getClass();

		const methodConfig = Reflect.getMetadata(PUBLIC_RATE_LIMIT_METADATA, handler) as PublicRateLimitOptions | undefined;
		const controllerConfig = Reflect.getMetadata(PUBLIC_RATE_LIMIT_METADATA, controller) as PublicRateLimitOptions | undefined;
		const config = methodConfig ?? controllerConfig;

		if (!config) return true;

		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();

		const now = Date.now();
		const clientIp = this.resolveClientIp(request);
		const routeKey = config.key ?? `${request.method}:${request.route?.path ?? request.path ?? 'unknown'}`;
		const bucketKey = `${routeKey}:${clientIp}`;

		const current = this.buckets.get(bucketKey);
		if (!current || now >= current.resetAt) {
			const resetAt = now + config.windowMs;
			this.buckets.set(bucketKey, { count: 1, resetAt });
			this.setRateHeaders(response, config.limit, config.limit - 1, resetAt);
			this.cleanup(now);
			return true;
		}

		current.count += 1;
		const remaining = Math.max(config.limit - current.count, 0);
		this.setRateHeaders(response, config.limit, remaining, current.resetAt);

		if (current.count > config.limit) {
			const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
			throw new TooManyRequestsException(`Rate limit exceeded. Retry in ${retryAfterSeconds}s.`);
		}

		return true;
	}

	private resolveClientIp(request: any): string {
		const forwarded = request?.headers?.['x-forwarded-for'];
		if (typeof forwarded === 'string' && forwarded.length > 0) {
			return forwarded.split(',')[0]?.trim() || 'unknown';
		}
		return request?.ip ?? 'unknown';
	}

	private setRateHeaders(response: any, limit: number, remaining: number, resetAt: number): void {
		if (!response?.setHeader) return;
		response.setHeader('X-RateLimit-Limit', String(limit));
		response.setHeader('X-RateLimit-Remaining', String(remaining));
		response.setHeader('X-RateLimit-Reset', String(Math.floor(resetAt / 1000)));
	}

	private cleanup(now: number): void {
		if (this.buckets.size < 5000) return;
		for (const [key, bucket] of this.buckets.entries()) {
			if (bucket.resetAt <= now) {
				this.buckets.delete(key);
			}
		}
	}
}
