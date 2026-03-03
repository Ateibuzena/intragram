/**
 * Archivo principal del Microservicio de Autenticación
 * Configura el servidor HTTP con validación global de DTOs
 * y medidas de seguridad (CORS deshabilitado por ser servicio interno)
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AuthModule } from './auth.module';

async function bootstrap() {
	const app = await NestFactory.create(AuthModule);

	// Validación global de DTOs - Seguridad contra inyección de datos
	app.useGlobalPipes(new ValidationPipe({
		whitelist: true,            // Elimina propiedades no definidas en el DTO
		forbidNonWhitelisted: true, // Rechaza peticiones con propiedades extra
		transform: true,            // Transforma automáticamente los tipos
		transformOptions: {
			enableImplicitConversion: false, // No convertir tipos implícitamente
		},
	}));

	const port = parseInt(process.env.PORT || '3003', 10);
	await app.listen(port, '0.0.0.0');

	console.log(`🔐 Auth Microservice HTTP listening on port ${port}`);
	console.log(`📊 Prometheus metrics available at http://localhost:${port}/metrics`);
	console.log(`❤️  Health check available at http://localhost:${port}/health`);
}

bootstrap();
