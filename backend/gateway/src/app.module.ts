/*Conectar módulos*/

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MetricsModule } from './observability/metrics/metrics.module';
import { AppLoggerModule } from './observability/logger/logger.module';
import { ExampleModule } from './services/example/example.module';

@Module({
	imports: [
		MetricsModule, 
		AppLoggerModule,
		ExampleModule, // Módulo de ejemplo
	],
	controllers: [AppController],
})
export class AppModule { }