/**
 * Entry point of the users-service.
 * Configures global validation and starts the HTTP server.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { UsersModule } from './users.module';

async function bootstrap() {
	const app = await NestFactory.create(UsersModule);

	// Avatar images arrive base64-encoded from the gateway inside the JSON body —
	// default Express limit (~100kb) is far too small for that (same fix as posts/chat-service).
	app.use(json({ limit: '12mb' }));

	app.useGlobalPipes(new ValidationPipe({
		whitelist: true,
		forbidNonWhitelisted: true,
		transform: true,
	}));

	const port = parseInt(process.env.PORT || '3006', 10);
	await app.listen(port, '0.0.0.0');

	console.log(`Users Microservice HTTP listening on port ${port}`);
	console.log(`Prometheus metrics available at http://localhost:${port}/metrics`);
	console.log(`Health check available at http://localhost:${port}/health`);
}

bootstrap();
