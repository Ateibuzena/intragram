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
