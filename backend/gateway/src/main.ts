/*Activar interceptor global*/

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { MetricsService } from './observability/metrics/metrics.service';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Habilitar validación global de DTOs
	app.useGlobalPipes(new ValidationPipe({
		whitelist: true, // Elimina propiedades no definidas en el DTO
		forbidNonWhitelisted: true, // Lanza error si hay propiedades extra
		transform: true, // Transforma automáticamente los tipos
	}));

	// Interceptor de métricas
	const metricsService = app.get(MetricsService);
	app.useGlobalInterceptors(new MetricsInterceptor(metricsService));

	await app.listen(process.env.PORT ?? 3000);
	console.log(`🚀 Gateway is running on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();