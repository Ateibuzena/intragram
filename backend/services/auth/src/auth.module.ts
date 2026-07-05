/**
 * Main module of the auth-service.
 * Configures TypeORM, controllers, and authentication services.
 */

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MetricsController } from './metrics.controller';
import { MetricsInterceptor } from './observability/metrics/metrics.interceptor';
import { MetricsModule } from './observability/metrics/metrics.module';
import { UserEntity } from './entities/user.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { InitAuthSchema1710000000000 } from './migrations/1710000000000-InitAuthSchema';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.DB_HOST || 'auth-db',
			port: parseInt(process.env.DB_PORT || '5432', 10),
			username: process.env.DB_USERNAME || 'auth_user',
			password: process.env.DB_PASSWORD || 'auth_password',
			database: process.env.DB_DATABASE || 'auth_db',
			entities: [UserEntity, RefreshTokenEntity],
			migrations: [InitAuthSchema1710000000000],
			migrationsRun: process.env.NODE_ENV === 'production',
			synchronize: process.env.NODE_ENV !== 'production',
			logging: process.env.NODE_ENV === 'development',
			extra: {
				max: 10,
				connectionTimeoutMillis: 5000,
				statement_timeout: 10000,
			},
		}),
		TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
		MetricsModule,
	],
	controllers: [AuthController, MetricsController],
	providers: [AuthService, { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor }],
	exports: [AuthService],
})
export class AuthModule {}
