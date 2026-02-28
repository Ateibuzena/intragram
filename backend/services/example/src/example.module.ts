/**
 * Módulo principal del Microservicio de Ejemplo
 */

import { Module } from '@nestjs/common';
import { ExampleController } from './example.controller';
import { ExampleService } from './example.service';
import { DatabaseService } from './database.service';

@Module({
  imports: [],
  controllers: [ExampleController],
  providers: [DatabaseService, ExampleService],
})
export class ExampleModule {}
