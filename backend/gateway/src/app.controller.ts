/**
 * Controlador raíz del gateway.
 * Expone endpoints globales de salud y métricas.
 */

import { Controller, Get, Res } from '@nestjs/common';
import { MetricsService } from './observability/metrics/metrics.service';

@Controller()
export class AppController {
	constructor(private readonly metrics: MetricsService) {}

	@Get('metrics')
	async getMetrics(@Res() res: any) {
		res.set('Content-Type', 'text/plain');
		res.send(await this.metrics.getMetrics());
	}

	@Get('health')
	getHealth() {
		return { status: 'ok' };
	}
}
