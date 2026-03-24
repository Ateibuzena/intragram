/**
 * Módulo de métricas del gateway.
 * Expone el servicio compartido para observabilidad Prometheus.
 */

import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Module({
	providers: [MetricsService],
	exports: [MetricsService],
})
export class MetricsModule { }