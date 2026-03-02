/**
 * Módulo de Ejemplo
 * Plantilla de referencia para crear nuevos módulos
 * Demuestra cómo configurar:
 * - Importación de dependencias
 * - Registro de controladores y servicios
 * - Configuración de cliente de microservicio
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExampleController } from './example.controller';
import { ExampleService } from './example.service';

@Module({
	imports: [HttpModule],
	controllers: [ExampleController],
	providers: [ExampleService],
	exports: [ExampleService], // Exportar para usar en otros módulos si es necesario
})
export class ExampleModule { }
