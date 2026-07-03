import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PostsModule } from './posts.module';

async function bootstrap() {
	const app = await NestFactory.create(PostsModule);

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	const port = parseInt(process.env.PORT || '3007', 10);
	await app.listen(port, '0.0.0.0');

	console.log(`Posts Microservice HTTP listening on port ${port}`);
	console.log(`Health check available at http://localhost:${port}/health`);
}

void bootstrap();
