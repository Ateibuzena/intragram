/**
 * Entry point of the chat-service.
 * Configures global validation and starts the HTTP server.
 */

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { ChatModule } from './chat.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
	const app = await NestFactory.create(ChatModule);

	// Chat images arrive base64-encoded from the gateway inside the JSON body —
	// default Express limit (~100kb) is far too small for that (same fix as posts-service).
	app.use(json({ limit: '12mb' }));

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	app.use(cookieParser());

	const port = parseInt(process.env.PORT || '3009', 10);
	await app.listen(port, '0.0.0.0');

	console.log(`Chat Microservice HTTP listening on port ${port}`);
	console.log(`Prometheus metrics available at http://localhost:${port}/metrics`);
	console.log(`Health check available at http://localhost:${port}/chat/health`);
}

void bootstrap();
