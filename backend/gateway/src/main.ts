/**
 * Punto de arranque del gateway.
 * Configura validación global, métricas e interceptores de CORS.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { MetricsService } from './observability/metrics/metrics.service';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.useGlobalPipes(new ValidationPipe({
		whitelist: true,
		forbidNonWhitelisted: true,
		transform: true,
	}));

	const metricsService = app.get(MetricsService);
	app.useGlobalInterceptors(new MetricsInterceptor(metricsService));

	app.enableCors({
		origin: [process.env.CORS_ORIGIN ?? 'https://localhost:8443'],
		credentials: true,
	});

	await app.listen(process.env.PORT ?? 3000);
	console.log(`Gateway is running on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();