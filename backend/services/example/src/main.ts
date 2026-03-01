/**
 * Archivo principal del Microservicio de Ejemplo
 * Ahora HTTP para simplificar integración con Prometheus
 */

import { NestFactory } from '@nestjs/core';
import { ExampleModule } from './example.module';

async function bootstrap() {
  const app = await NestFactory.create(ExampleModule);

  const port = parseInt(process.env.PORT || '3005', 10);
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Example Microservice HTTP listening on port ${port}`);
  console.log(`📊 Prometheus metrics available at http://localhost:${port}/metrics`);
}

bootstrap();

/**
 * Archivo principal del Microservicio de Ejemplo
 * Plantilla de referencia para crear nuevos microservicios
 * Muestra cómo configurar:
 * - Servidor de microservicio (gRPC/TCP)
 * - Conexión a base de datos
 * - Integración con otros servicios
 * - Logging y manejo de errores
 */
/*
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ExampleModule } from './example.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ExampleModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: parseInt(process.env.PORT || '3005'),
      },
    },
  );

  await app.listen();
  console.log('🚀 Example Microservice is listening on TCP port 3005');
}

bootstrap();*/
