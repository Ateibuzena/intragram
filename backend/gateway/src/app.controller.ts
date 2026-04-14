/**
 * Controlador raíz del gateway.
 * Expone endpoints globales de salud y métricas.
 */

import { Controller, Get, Res } from '@nestjs/common';
import { MetricsService } from './observability/metrics/metrics.service';
import { PublicRateLimit } from './common/decorators/public-rate-limit.decorator';
import { PublicRateLimitGuard } from './common/guards/public-rate-limit.guard';
import { UseGuards } from '@nestjs/common';

@Controller()
export class AppController {
	constructor(private readonly metrics: MetricsService) {}

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
	getHealth() {
		return { status: 'ok' };
	}
}
