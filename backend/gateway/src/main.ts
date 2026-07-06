/**
 * Entry point of the gateway.
 * Configures global validation, metrics, and CORS interceptors.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { MetricsService } from './observability/metrics/metrics.service';
import { RedisIoAdapter } from './redis/redis-io.adapter';
import { REDIS_PUB_CLIENT, REDIS_SUB_CLIENT } from './redis/redis.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Lets Socket.IO fan out events (emitToUser/emitToAll) across every gateway
	// replica instead of only the process that owns the originating socket.
	app.useWebSocketAdapter(new RedisIoAdapter(app, app.get(REDIS_PUB_CLIENT), app.get(REDIS_SUB_CLIENT)));

	app.useGlobalPipes(new ValidationPipe({
		whitelist: true,
		forbidNonWhitelisted: true,
		transform: true,
	}));

	const metricsService = app.get(MetricsService);
	app.useGlobalInterceptors(new MetricsInterceptor(metricsService));

	const rawCorsOrigin = process.env.CORS_ORIGIN ?? 'https://localhost:8443/';
	const corsOrigin = (() => {
		try { return new URL(rawCorsOrigin).origin; } catch { return rawCorsOrigin; }
	})();

	app.enableCors({
		origin: corsOrigin,
		credentials: true,
	});

	await app.listen(process.env.PORT ?? 3000);
	console.log(`Gateway is running on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
