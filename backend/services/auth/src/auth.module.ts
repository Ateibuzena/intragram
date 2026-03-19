/**
 * Módulo principal del Microservicio de Autenticación
 * Configura TypeORM con PostgreSQL y expone el servicio de autenticación
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserEntity } from './entities/user.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';

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
			synchronize: process.env.NODE_ENV !== 'production',
			logging: process.env.NODE_ENV === 'development',
			extra: {
				max: 10,
				connectionTimeoutMillis: 5000,
				statement_timeout: 10000,
			},
		}),
		TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
		PrometheusModule.register(),
	],
	controllers: [AuthController],
	providers: [AuthService],
	exports: [AuthService],
})
export class AuthModule {}

