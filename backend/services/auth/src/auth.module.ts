/**
 * Módulo principal del Microservicio de Autenticación
 * Configura TypeORM con PostgreSQL, Prometheus y todos los providers
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
		// PostgreSQL con TypeORM
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.DB_HOST || 'auth-db',
			port: parseInt(process.env.DB_PORT || '5432', 10),
			username: process.env.DB_USERNAME || 'auth_user',
			password: process.env.DB_PASSWORD || 'auth_password',
			database: process.env.DB_DATABASE || 'auth_db',
			entities: [UserEntity, RefreshTokenEntity],
			synchronize: process.env.NODE_ENV !== 'production', // Solo en desarrollo
			logging: process.env.NODE_ENV === 'development',
			// Configuración de seguridad para conexiones
			extra: {
				// Máximo de conexiones en el pool
				max: 10,
				// Timeout de conexión
				connectionTimeoutMillis: 5000,
				// Timeout de queries (previene queries lentas maliciosas)
				statement_timeout: 10000,
			},
		}),
		// Registrar entidades para inyección
		TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
		// Métricas Prometheus
		PrometheusModule.register(),
	],
	controllers: [AuthController],
	providers: [AuthService],
})
export class AuthModule {}
