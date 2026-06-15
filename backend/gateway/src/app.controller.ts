/**
 * Root controller of the gateway.
 * Exposes global health, health aggregation, and metrics endpoints.
 */

import { Controller, Get, Res } from '@nestjs/common';
import { MetricsService } from './observability/metrics/metrics.service';
import { PublicRateLimit } from './common/decorators/public-rate-limit.decorator';
import { PublicRateLimitGuard } from './common/guards/public-rate-limit.guard';
import { UseGuards } from '@nestjs/common';
import { GatewayHttpClientService } from './common/http/gateway-http.client';
import { SERVICE_URLS } from './config/microservices.config';
import { createHealthResponse } from '@intragram/shared/health';
import type { HealthResponse } from '@intragram/shared/health';

type ServicesHealth = {
	gateway: 'ok';
	auth: 'ok' | 'down';
	users: 'ok' | 'down';
	chat: 'ok' | 'down';
};

@Controller()
export class AppController {
	constructor(
		private readonly metrics: MetricsService,
		private readonly httpClient: GatewayHttpClientService,
	) {}

	@Get('metrics')
	@UseGuards(PublicRateLimitGuard)
	@PublicRateLimit(120, 60_000, 'app:metrics')
	async getMetrics(@Res() res: any) {
		res.set('Content-Type', 'text/plain');
		res.send(await this.metrics.getMetrics());
	}

	@Get('health')
	@UseGuards(PublicRateLimitGuard)
	@PublicRateLimit(120, 60_000, 'app:health')
	getHealth(): HealthResponse {
		return createHealthResponse('gateway');
	}

	@Get('health/services')
	@UseGuards(PublicRateLimitGuard)
	@PublicRateLimit(120, 60_000, 'app:health-services')
	async getServicesHealth(): Promise<ServicesHealth> {
		const [auth, users, chat] = await Promise.allSettled([
			this.httpClient.get<{ status: 'ok' }>(`${SERVICE_URLS.auth}/health`, {
				timeoutMs: 1500,
				retries: 0,
				retryable: false,
			}),
			this.httpClient.get<{ status: 'ok' }>(`${SERVICE_URLS.users}/health`, {
				timeoutMs: 1500,
				retries: 0,
				retryable: false,
			}),
			this.httpClient.get<{ status: 'ok' }>(`${SERVICE_URLS.chat}/health`, {
				timeoutMs: 1500,
				retries: 0,
				retryable: false,
			}),
		]);

		return {
			gateway: 'ok',
			auth: auth.status === 'fulfilled' && auth.value.status === 'ok' ? 'ok' : 'down',
			users: users.status === 'fulfilled' && users.value.status === 'ok' ? 'ok' : 'down',
			chat: chat.status === 'fulfilled' && chat.value.status === 'ok' ? 'ok' : 'down',
		};
	}
}
