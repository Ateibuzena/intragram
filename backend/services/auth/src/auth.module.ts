/**
 * Módulo principal del Microservicio de Autenticación
 * Configuración MOCK para desarrollo sin PostgreSQL
 */

import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';

// Mock de repositorios para desarrollo sin BD
const mockUserRepository = {
	findOne: async () => null,
	create: (data: any) => data,
	save: async (data: any) => ({ ...data, id: 'mock-id' }),
	update: async () => ({ affected: 1 }),
	createQueryBuilder: () => ({
		addSelect: () => ({
			where: () => ({
				getOne: async () => null,
			}),
		}),
	}),
	query: async () => [{ '1': 1 }],
};

const mockRefreshTokenRepository = {
	create: (data: any) => data,
	save: async (data: any) => ({ ...data, id: 'mock-token-id' }),
	update: async () => ({ affected: 1 }),
	findOne: async () => null,
	createQueryBuilder: () => ({
		delete: () => ({
			where: () => ({
				orWhere: () => ({
					execute: async () => ({ affected: 0 }),
				}),
			}),
		}),
	}),
};

@Module({
	imports: [
		// Métricas Prometheus
		PrometheusModule.register(),
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		// Providers mock de repositorios
		{
			provide: getRepositoryToken(UserEntity),
			useValue: mockUserRepository,
		},
		{
			provide: getRepositoryToken(RefreshTokenEntity),
			useValue: mockRefreshTokenRepository,
		},
	],
})
export class AuthModule {}

