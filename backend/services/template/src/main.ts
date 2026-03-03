/**
 * ═══════════════════════════════════════════════════════════
 *  PLANTILLA - Archivo principal del microservicio
 * ═══════════════════════════════════════════════════════════
 * 
 * Punto de entrada del servicio.
 * Configura el servidor HTTP con validación global de DTOs.
 * 
 * PARA USAR ESTA PLANTILLA:
 * 1. Copiar toda la carpeta template/ y renombrarla
 * 2. Renombrar todos los archivos "template" al nombre de tu servicio
 * 3. Cambiar el puerto en la variable PORT (y en Dockerfile)
 * 4. Actualizar package.json con el nombre del servicio
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { TemplateModule } from './template.module';

async function bootstrap() {
	const app = await NestFactory.create(TemplateModule);

	// Validación global de DTOs
	app.useGlobalPipes(new ValidationPipe({
		whitelist: true,
		forbidNonWhitelisted: true,
		transform: true,
	}));

	// ⚠️ Cambiar el puerto por defecto al asignado
	const port = parseInt(process.env.PORT || '300X', 10);
	await app.listen(port, '0.0.0.0');

	console.log(`🚀 Template Microservice HTTP listening on port ${port}`);
	console.log(`📊 Prometheus metrics available at http://localhost:${port}/metrics`);
	console.log(`❤️  Health check available at http://localhost:${port}/health`);
}

bootstrap();
