import { Controller, Get, Res } from '@nestjs/common';
import { MetricsService } from './observability/metrics/metrics.service';

@Controller()
export class MetricsController {
	constructor(private readonly metricsService: MetricsService) {}

	@Get('metrics')
	async metrics(@Res() res: any) {
		try {
			res.set('Content-Type', this.metricsService.getContentType());
			res.send(await this.metricsService.getMetrics());
		} catch {
			res.status(500).send('error collecting metrics');
		}
	}
}
