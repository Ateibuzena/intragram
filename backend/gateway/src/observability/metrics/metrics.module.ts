/**
 * Metrics module of the gateway.
 * Exposes the shared service for Prometheus observability.
 */

import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Module({
	providers: [MetricsService],
	exports: [MetricsService],
})
export class MetricsModule { }