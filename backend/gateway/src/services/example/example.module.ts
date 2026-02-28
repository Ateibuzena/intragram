/**
 * Módulo de Ejemplo
 * Plantilla de referencia para crear nuevos módulos
 * Demuestra cómo configurar:
 * - Importación de dependencias
 * - Registro de controladores y servicios
 * - Configuración de cliente de microservicio
 */

import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { ExampleController } from './example.controller';
import { ExampleService } from './example.service';
import { MICROSERVICES_CONFIG, MICROSERVICE_TOKENS } from '../../config/microservices.config';

@Module({
  imports: [
    // Registra el cliente TCP para comunicarse con el microservicio example
    ClientsModule.register([
      {
        name: MICROSERVICE_TOKENS.EXAMPLE_SERVICE,
        ...MICROSERVICES_CONFIG.example,
      },
    ]),
  ],
  controllers: [ExampleController],
  providers: [ExampleService],
  exports: [ExampleService], // Exportar para usar en otros módulos si es necesario
})
export class ExampleModule {}
