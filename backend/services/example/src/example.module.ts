/**
 * Módulo principal del Microservicio de Ejemplo
 */

import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ExampleController } from './example.controller';
import { ExampleService } from './example.service';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    PrometheusModule.register(),
  ],
  controllers: [ExampleController],
  providers: [DatabaseService, ExampleService],
})
export class ExampleModule {}
