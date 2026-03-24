/**
 * Módulo raíz del gateway.
 * Compone observabilidad, autenticación y proxy hacia los microservicios.
 */

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
		AuthModule,
		UsersModule,
		ChatModule,
	],
	controllers: [AppController],
})
export class AppModule {}
