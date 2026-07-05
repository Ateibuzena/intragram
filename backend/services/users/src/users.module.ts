/**
 * Main module of the users-service.
 * Configures TypeORM and exposes the users controller and service.
 */

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MetricsController } from './metrics.controller';
import { MetricsInterceptor } from './observability/metrics/metrics.interceptor';
import { MetricsModule } from './observability/metrics/metrics.module';
import { UserProfileEntity } from './entities/user-profile.entity';
import { UserFriendshipEntity } from './entities/user-friendship.entity';
import { InitUsersSchema1710000001000 } from './migrations/1710000001000-InitUsersSchema';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.DB_HOST || 'users-db',
			port: parseInt(process.env.DB_PORT || '5432', 10),
			username: process.env.DB_USERNAME || 'users_user',
			password: process.env.DB_PASSWORD || 'users_password',
			database: process.env.DB_DATABASE || 'users_db',
			entities: [UserProfileEntity, UserFriendshipEntity],
			migrations: [InitUsersSchema1710000001000],
			migrationsRun: process.env.NODE_ENV === 'production',
			synchronize: process.env.NODE_ENV !== 'production',
			logging: process.env.NODE_ENV === 'development',
			extra: {
				max: 10,
				connectionTimeoutMillis: 5000,
				statement_timeout: 10000,
			},
		}),
		TypeOrmModule.forFeature([UserProfileEntity, UserFriendshipEntity]),
		MetricsModule,
	],
	controllers: [UsersController, MetricsController],
	providers: [UsersService, { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor }],
	exports: [UsersService],
})
export class UsersModule {}
