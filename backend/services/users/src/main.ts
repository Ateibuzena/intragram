import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { UsersModule } from './users.module';

async function bootstrap() {
	const app = await NestFactory.create(UsersModule);

	app.useGlobalPipes(new ValidationPipe({
		whitelist: true,
		forbidNonWhitelisted: true,
		transform: true,
	}));

	const port = parseInt(process.env.PORT || '3006', 10);
	await app.listen(port, '0.0.0.0');

	console.log(`Users Microservice HTTP listening on port ${port}`);
	console.log(`Prometheus metrics available at http://localhost:${port}/metrics`);
}

bootstrap();
