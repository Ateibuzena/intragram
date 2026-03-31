/**
 * Controlador de usuarios del gateway.
 * Expone rutas para sincronizar perfiles desde OAuth42 y consultar perfiles.
 * Protege las rutas de consulta con AuthGuard para asegurar que solo usuarios autenticados puedan acceder.
 *
 * Endpoints:
 * - POST   /users/oauth/42/upsert → Crea o actualiza perfil a partir de OAuth42
 * - GET    /users/:id             → Busca perfil por ID interno
 * - GET    /users/42/:fortyTwoId  → Busca perfil por ID de 42
 * - GET    /users/login/:login    → Busca perfil por login normalizado
 * - GET    /users/:id/projects    → Lista proyectos guardados del usuario
 * - GET    /users/42/:fortyTwoId/projects → Lista proyectos por id de 42
 * - POST   /users/:id/projects/sync → Sincroniza proyectos actuales
 * - PATCH  /users/:id/profile     → Actualiza campos editables del perfil (solo propio)
 * 
 * Seguridad:
 * - Validación de datos con DTOs y pipes de NestJS
 * - Manejo de errores que no revela información interna
 * - Códigos HTTP correctos para cada tipo de error
 */ 

import {
	Body,
	Controller,
	ForbiddenException,
	Get,
	HttpException,
	HttpStatus,
	Param,
	Patch,
	ParseUUIDPipe,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
	IUserProfile,
	IUserProject,
	IUserProjectsSyncResult,
	SyncOAuth42ProjectsDto,
	UpsertOAuth42UserDto,
	UpdateUserProfileDto,
} from '@intragram/shared/users';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	/**
	 * Crea o actualiza el usuario local a partir del perfil OAuth42 recibido.
	 */
	@Post('oauth/42/upsert')
	async upsertOAuth42User(@Body() dto: UpsertOAuth42UserDto): Promise<IUserProfile> {
		try {
			return await this.usersService.upsertOAuth42User(dto);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al guardar usuario OAuth42',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Busca un usuario por su identificador interno.
	 */
	@UseGuards(AuthGuard)
	@Get(':id')
	async findById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<IUserProfile> {
		try {
			return await this.usersService.findById(id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	/**
	 * Busca un usuario por su id de 42.
	 */
	@UseGuards(AuthGuard)
	@Get('42/:fortyTwoId')
	async findBy42Id(@Param('fortyTwoId') fortyTwoId: string): Promise<IUserProfile> {
		try {
			return await this.usersService.findBy42Id(parseInt(fortyTwoId, 10));
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	/**
	 * Busca un usuario por su login normalizado.
	 */
	@UseGuards(AuthGuard)
	@Get('login/:login')
	async findByLogin(@Param('login') login: string): Promise<IUserProfile> {
		try {
			return await this.usersService.findByLogin(login);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	/**
	 * Lista proyectos almacenados por id interno del usuario.
	 */
	@UseGuards(AuthGuard)
	@Get(':id/projects')
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
	 * Lista proyectos almacenados por id de 42.
	 */
	@UseGuards(AuthGuard)
	@Get('42/:fortyTwoId/projects')
	async findProjectsBy42Id(@Param('fortyTwoId') fortyTwoId: string): Promise<IUserProject[]> {
		try {
			return await this.usersService.findProjectsBy42Id(parseInt(fortyTwoId, 10));
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	/**
	 * Sincroniza manualmente proyectos actuales del usuario.
	 */
	@UseGuards(AuthGuard)
	@Post(':id/projects/sync')
	async syncProjects(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Body() dto: SyncOAuth42ProjectsDto,
	): Promise<IUserProjectsSyncResult> {
		try {
			return await this.usersService.syncProjects(id, dto);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al sincronizar proyectos',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Actualiza solo los campos editables del propio perfil del usuario autenticado.
	 */
	@UseGuards(AuthGuard)
	@Patch(':id/profile')
	async updateProfile(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Body() dto: UpdateUserProfileDto,
		@Req() req: any,
	): Promise<IUserProfile> {
		if (req.user?.sub !== id) {
			throw new ForbiddenException('You can only update your own profile');
		}

		try {
			return await this.usersService.updateProfile(id, dto);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al actualizar perfil',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
