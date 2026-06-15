/**
 * Root module of the gateway.
 * Composes observability, authentication, and proxy towards the microservices.
 */

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MetricsModule } from './observability/metrics/metrics.module';
import { AppLoggerModule } from './observability/logger/logger.module';
import { GatewayHttpModule } from './common/http/gateway-http.module';
import { AuthModule } from './services/auth/auth.module';
import { UsersModule } from './services/users/users.module';
import { ChatModule } from './services/chat/chat.module';

@Module({
	imports: [
		MetricsModule,
		GatewayHttpModule,
		AuthModule,
		UsersModule,
		ChatModule,
	],
	controllers: [AppController],
})
export class AppModule {}
