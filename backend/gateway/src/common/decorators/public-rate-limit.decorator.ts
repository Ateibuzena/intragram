import { SetMetadata } from '@nestjs/common';

export const PUBLIC_RATE_LIMIT_METADATA = 'public_rate_limit';

export interface PublicRateLimitOptions {
	limit: number;
	windowMs: number;
	key?: string;
}

export const PublicRateLimit = (limit: number, windowMs: number, key?: string) =>
	SetMetadata(PUBLIC_RATE_LIMIT_METADATA, { limit, windowMs, key } satisfies PublicRateLimitOptions);
