/**
 * ═══════════════════════════════════════════════════════════
 *  PLANTILLA - Módulo principal del microservicio
 * ═══════════════════════════════════════════════════════════
 * 
 * Configura:
 * - Prometheus para métricas
 * - Controller y Service del microservicio
 * - (Opcional) Base de datos si el servicio la requiere
 * 
 * PARA USAR: Renombrar TemplateModule al nombre de tu servicio
 */

import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';

@Module({
	imports: [
		// Métricas Prometheus (accesibles en GET /metrics)
		PrometheusModule.register(),

		// ── Si necesitas base de datos, descomenta una de estas opciones: ──
		//
		// OPCIÓN A: PostgreSQL con TypeORM
		// TypeOrmModule.forRoot({
		//   type: 'postgres',
		//   host: process.env.DB_HOST || 'mi-servicio-db',
		//   port: parseInt(process.env.DB_PORT || '5432', 10),
		//   username: process.env.DB_USERNAME || 'user',
		//   password: process.env.DB_PASSWORD || 'password',
		//   database: process.env.DB_DATABASE || 'my_db',
		//   entities: [/* tus entidades */],
		//   synchronize: process.env.NODE_ENV !== 'production',
		// }),
		//
		// OPCIÓN B: SQLite con sql.js (sin servicio separado)
		// (ver el servicio 'example' para referencia)
	],
	controllers: [TemplateController],
	providers: [TemplateService],
})
export class TemplateModule {}
