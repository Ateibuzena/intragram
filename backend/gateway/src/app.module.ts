/*Conectar módulos*/

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MetricsModule } from './observability/metrics/metrics.module';
import { AppLoggerModule } from './observability/logger/logger.module';
import { ExampleModule } from './services/example/example.module';
import { AuthModule } from './services/auth/auth.module';
import { UsersModule } from './services/users/users.module';

@Module({
	imports: [
		MetricsModule, 
		ExampleModule, // Módulo de ejemplo
		AuthModule,    // Módulo de autenticación
		UsersModule,
	],
	controllers: [AppController],
})
export class AppModule { }
