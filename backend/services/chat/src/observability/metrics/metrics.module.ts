import { Module } from '@nestjs/common';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';

@Module({
	providers: [MetricsService, MetricsInterceptor],
	exports: [MetricsService, MetricsInterceptor],
})
export class MetricsModule {}