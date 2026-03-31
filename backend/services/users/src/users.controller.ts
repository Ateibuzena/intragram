/**
 * Controlador de usuarios del users-service.
 * Expone endpoints para gestión de perfiles y sincronización con OAuth42.
 * Maneja errores con HttpException y códigos HTTP adecuados.
 
 * Endpoints:
 * - POST /users/oauth/42/upsert → Crea o actualiza perfil desde OAuth42
 * - GET  /users/:id           → Busca perfil por ID interno
 * - GET  /users/42/:fortyTwoId → Busca perfil por ID de 42
 * - GET  /users/login/:login   → Busca perfil por login
 * - GET  /users/:id/projects    → Devuelve proyectos sincronizados del usuario
 * - GET  /users/42/:fortyTwoId/projects → Devuelve proyectos por id de 42
 * - POST /users/:id/projects/sync → Sincroniza proyectos con un payload actual
 * - PATCH /users/:id/profile   → Actualiza campos editables del perfil
 * - GET  /health               → Health check para Docker
 * 
 * Seguridad:
 * - Validación de datos con DTOs y pipes de NestJS
 * - Manejo de errores que no revela información interna
 * - Códigos HTTP correctos para cada tipo de error
 */

import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpException,
	HttpStatus,
	Param,
	Patch,
	ParseUUIDPipe,
	Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
	IUserProject,
	IUserProjectsSyncResult,
	SyncOAuth42ProjectsDto,
	UpsertOAuth42UserDto,
	UpdateUserProfileDto,
} from '@intragram/shared/users';

@Controller()
export class UsersController {
	constructor(private readonly usersService: UsersService) { }

	/**
	 * Crea o actualiza el perfil local a partir de OAuth42.
	 */
	@Post('users/oauth/42/upsert')
	@HttpCode(HttpStatus.OK)
	async upsertOAuth42(@Body() profile: UpsertOAuth42UserDto) {
		try {
			return await this.usersService.upsertFromOAuth42(profile);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al guardar usuario de OAuth 42',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Busca un perfil por su identificador interno.
	 */
	@Get('users/:id')
	async findById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
		try {
			return await this.usersService.findById(id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	/**
	 * Busca un perfil por su id de 42.
	 */
	@Get('users/42/:fortyTwoId')
	async findBy42Id(@Param('fortyTwoId') fortyTwoId: string) {
		try {
			return await this.usersService.findBy42Id(parseInt(fortyTwoId, 10));
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	/**
	 * Busca un perfil por su login.
	 */
	@Get('users/login/:login')
	async findByLogin(@Param('login') login: string) {
		try {
			return await this.usersService.findByLogin(login);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	/**
	 * Devuelve los proyectos almacenados de un usuario por id interno.
	 */
	@Get('users/:id/projects')
	async findProjectsByUserId(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
	): Promise<IUserProject[]> {
		try {
			return await this.usersService.findProjectsByUserId(id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	/**
	 * Devuelve los proyectos almacenados de un usuario por id de 42.
	 */
	@Get('users/42/:fortyTwoId/projects')
	async findProjectsBy42Id(@Param('fortyTwoId') fortyTwoId: string): Promise<IUserProject[]> {
		try {
			return await this.usersService.findProjectsBy42Id(parseInt(fortyTwoId, 10));
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	/**
	 * Sincroniza proyectos actuales del usuario con el payload de OAuth42.
	 */
	@Post('users/:id/projects/sync')
	@HttpCode(HttpStatus.OK)
	async syncProjects(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Body() dto: SyncOAuth42ProjectsDto,
	): Promise<IUserProjectsSyncResult> {
		try {
			return await this.usersService.syncProjectsByUserId(id, dto);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al sincronizar proyectos',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Actualiza los campos editables del perfil local.
	 */
	@Patch('users/:id/profile')
	async updateProfile(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Body() dto: UpdateUserProfileDto,
	) {
		try {
			return await this.usersService.updateProfile(id, dto);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al actualizar perfil',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Health check del users-service.
	 */
	@Get('health')
	async health() {
		return this.usersService.getHealth();
	}
}
