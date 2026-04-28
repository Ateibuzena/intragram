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
	DefaultValuePipe,
	ForbiddenException,
	Get,
	HttpException,
	HttpStatus,
	Param,
	Patch,
	Post,
	ParseIntPipe,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { IUserProfile, UpsertOAuth42UserDto, UpdateUserProfileDto, CreateFeedPostDto, CreateFriendDto } from '@intragram/shared/users';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PublicRateLimit } from '../../common/decorators/public-rate-limit.decorator';
import { PublicRateLimitGuard } from '../../common/guards/public-rate-limit.guard';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	/**
	 * Crea o actualiza el usuario local a partir del perfil OAuth42 recibido.
	 */
	@Post('oauth/42/upsert')
	@UseGuards(PublicRateLimitGuard)
	@PublicRateLimit(120, 60_000, 'users:oauth-upsert')
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
	 * Busca usuarios por login/display_name con límite de resultados.
	 */
	@UseGuards(AuthGuard)
	@Get('search')
	async searchUsers(
		@Query('q') query = '',
		@Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
	): Promise<IUserProfile[]> {
		try {
			return await this.usersService.searchUsers(query, limit);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Actualiza solo los campos editables del propio perfil del usuario autenticado.
	 */
	@UseGuards(AuthGuard)
	@Patch(':id/profile')
	async updateProfile(@Param('id') id: string, @Body() dto: UpdateUserProfileDto, @Req() req: any): Promise<IUserProfile> {
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

	/**
	 * Devuelve el feed "Reciente" del usuario autenticado.
	 */
	@UseGuards(AuthGuard)
	@Get('feed')
	async getRecentFeed(@Req() req: any) {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.getRecentFeed(profile.id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Devuelve el feed del usuario autenticado ("Mi perfil").
	 */
	@UseGuards(AuthGuard)
	@Get('feed/me')
	async getMyFeed(@Req() req: any) {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.getMyFeed(profile.id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Devuelve publicaciones de amigos del usuario autenticado.
	 */
	@UseGuards(AuthGuard)
	@Get('feed/friends')
	async getFriendsFeed(@Req() req: any) {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.getFriendsFeed(profile.id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Devuelve el feed de "Tendencias" del usuario autenticado.
	 */
	@UseGuards(AuthGuard)
	@Get('feed/trending')
	async getTrendingFeed(@Req() req: any) {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.getTrendingFeed(profile.id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Devuelve el feed de posts guardados (favoritos) del usuario autenticado.
	 */
	@UseGuards(AuthGuard)
	@Get('feed/favorites')
	async getFavoritesFeed(@Req() req: any) {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.getFavoritesFeed(profile.id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Alterna el estado de favorito de un post del usuario autenticado.
	 */
	@UseGuards(AuthGuard)
	@Post('feed/favorites/:postId')
	async toggleFavorite(@Param('postId') postId: string, @Req() req: any) {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			const saved = await this.usersService.toggleFavoritePost(profile.id, postId);
			return { saved };
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Devuelve la lista de amigos aceptados del usuario autenticado.
	 */
	@UseGuards(AuthGuard)
	@Get('friends/me')
	async getFriends(@Req() req: any): Promise<IUserProfile[]> {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.getFriends(profile.id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Agrega un amigo para el usuario autenticado.
	 */
	@UseGuards(AuthGuard)
	@Post('friends/me')
	async addFriend(@Req() req: any, @Body() dto: CreateFriendDto): Promise<IUserProfile> {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.addFriend(profile.id, dto);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Crea una nueva publicacion en el feed del usuario autenticado.
	 */
	@UseGuards(AuthGuard)
	@Post('feed')
	async createPost(@Body() dto: CreateFeedPostDto, @Req() req: any) {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.createPost(profile.id, dto);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Busca un usuario por su identificador interno.
	 */
	@UseGuards(AuthGuard)
	@Get(':id')
	async findById(@Param('id') id: string): Promise<IUserProfile> {
		try {
			return await this.usersService.findById(id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}
}
