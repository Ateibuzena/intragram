import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ChatModule } from './chat.module';

async function bootstrap() {
	const app = await NestFactory.create(ChatModule);

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	const port = parseInt(process.env.PORT || '3009', 10);
	await app.listen(port, '0.0.0.0');

	console.log(`Chat Microservice HTTP/WS listening on port ${port}`);
	console.log(`Prometheus metrics available at http://localhost:${port}/metrics`);
}

void bootstrap();
