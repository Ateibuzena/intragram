/*Conectar módulos*/

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MetricsModule } from './observability/metrics/metrics.module';
import { AppLoggerModule } from './observability/logger/logger.module';
import { AuthModule } from './services/auth/auth.module';
import { UsersModule } from './services/users/users.module';
import { ChatModule } from './services/chat/chat.module';

@Module({
	imports: [
		MetricsModule, 
		AuthModule,    // Módulo de autenticación
		UsersModule,
		ChatModule,
	],
	controllers: [AppController],
})
export class AppModule { }
