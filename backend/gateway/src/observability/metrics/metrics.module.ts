/**
 * Módulo de Métricas
 * Configura el sistema de recolección de métricas de la aplicación
 * Proporciona el MetricsService para monitoreo de rendimiento,
 * uso de recursos y estadísticas operacionales
 */

/*Métricas Prometheus*/

import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Module({
	providers: [MetricsService],
	exports: [MetricsService],
})
export class MetricsModule { }