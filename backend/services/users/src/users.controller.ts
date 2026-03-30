/**
 * Controlador de usuarios del users-service.
 * Expone endpoints para gestión de perfiles y sincronización con OAuth42.
 * Maneja errores con HttpException y códigos HTTP adecuados.
 
 * Endpoints:
 * - POST /users/oauth/42/upsert → Crea o actualiza perfil desde OAuth42
 * - GET  /users/:id           → Busca perfil por ID interno
 * - GET  /users/42/:fortyTwoId → Busca perfil por ID de 42
 * - GET  /users/login/:login   → Busca perfil por login
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
	Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpsertOAuth42UserDto, UpdateUserProfileDto, CreateFeedPostDto } from '@intragram/shared/users';

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
	async findById(@Param('id') id: string) {
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
	 * Actualiza los campos editables del perfil local.
	 */
	@Patch('users/:id/profile')
	async updateProfile(@Param('id') id: string, @Body() dto: UpdateUserProfileDto) {
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

	/**
	 * Devuelve el feed "Reciente" personalizado del usuario.
	 */
	@Get('feed/recent/:id')
	async getRecentFeed(@Param('id') id: string) {
		return this.usersService.getRecentFeed(id);
	}

	/**
	 * Devuelve las publicaciones del propio usuario.
	 */
	@Get('feed/user/:id')
	async getUserFeed(@Param('id') id: string) {
		return this.usersService.getUserFeed(id);
	}

	/**
	 * Crea una nueva publicacion para el usuario indicado.
	 */
	@Post('feed/user/:id')
	async createUserPost(@Param('id') id: string, @Body() dto: CreateFeedPostDto) {
		return this.usersService.createPost(id, dto);
	}

	/**
	 * Devuelve publicaciones de amigos de un usuario.
	 */
	@Get('feed/friends/:id')
	async getFriendsFeed(@Param('id') id: string) {
		return this.usersService.getFriendsFeed(id);
	}

	/**
	 * Devuelve el feed de "Tendencias" para un usuario (sin incluir sus propios posts).
	 */
	@Get('feed/trending/:id')
	async getTrendingFeed(@Param('id') id: string) {
		return this.usersService.getTrendingFeed(id);
	}

	/**
	 * Devuelve el feed de posts guardados (favoritos) de un usuario.
	 */
	@Get('feed/favorites/:id')
	async getFavoritesFeed(@Param('id') id: string) {
		return this.usersService.getFavoritesFeed(id);
	}

	/**
	 * Alterna el estado de guardado de un post para un usuario.
	 */
	@Post('feed/favorites/:id')
	async toggleFavorite(
		@Param('id') id: string,
		@Body('postId') postId: string,
	) {
		const saved = await this.usersService.toggleFavoritePost(id, postId);
		return { saved };
	}

	/**
	 * Devuelve la lista de amigos aceptados de un usuario.
	 */
	@Get('friends/:id')
	async getFriends(@Param('id') id: string) {
		return this.usersService.getFriends(id);
	}
}
