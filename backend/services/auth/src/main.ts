/**
 * Entry point of the auth-service.
 * Configures global validation and minimal middleware for the internal service.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AuthModule } from './auth.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
	const app = await NestFactory.create(AuthModule);

	app.useGlobalPipes(new ValidationPipe({
		whitelist: true,
		forbidNonWhitelisted: true,
		transform: true,
		transformOptions: {
			enableImplicitConversion: false,
		},
	}));

	app.use(cookieParser());

	const port = parseInt(process.env.PORT || '3003', 10);
	await app.listen(port, '0.0.0.0');

	console.log(`Auth Microservice HTTP listening on port ${port}`);
	console.log(`Prometheus metrics available at http://localhost:${port}/metrics`);
	console.log(`Health check available at http://localhost:${port}/health`);
}

bootstrap();
