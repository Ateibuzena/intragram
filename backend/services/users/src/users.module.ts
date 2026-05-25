/**
 * Módulo principal del users-service.
 * Configura TypeORM y expone el controlador y servicio de usuarios.
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
import { UserPostEntity } from './entities/user-post.entity';
import { UserFriendshipEntity } from './entities/user-friendship.entity';
import { UserSavedPostEntity } from './entities/user-saved-post.entity';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.DB_HOST || 'users-db',
			port: parseInt(process.env.DB_PORT || '5432', 10),
			username: process.env.DB_USERNAME || 'users_user',
			password: process.env.DB_PASSWORD || 'users_password',
			database: process.env.DB_DATABASE || 'users_db',
			entities: [UserProfileEntity, UserPostEntity, UserFriendshipEntity, UserSavedPostEntity],
			synchronize: process.env.NODE_ENV !== 'production',
			logging: process.env.NODE_ENV === 'development',
			extra: {
				max: 10,
				connectionTimeoutMillis: 5000,
				statement_timeout: 10000,
			},
		}),
		TypeOrmModule.forFeature([UserProfileEntity, UserPostEntity, UserFriendshipEntity, UserSavedPostEntity]),
		MetricsModule,
	],
	controllers: [UsersController, MetricsController],
	providers: [UsersService, { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor }],
	exports: [UsersService],
})
export class UsersModule {}
