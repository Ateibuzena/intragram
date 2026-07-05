/**
 * Users controller of the users-service.
 * Exposes endpoints for profile management and synchronisation with OAuth42.
 * Handles errors with HttpException and appropriate HTTP codes.

 * Endpoints:
 * - POST /users/oauth/42/upsert → Creates or updates profile from OAuth42
 * - GET  /users/:id           → Looks up profile by internal ID
 * - GET  /users/42/:fortyTwoId → Looks up profile by 42 ID
 * - GET  /users/login/:login   → Looks up profile by login
 * - PATCH /users/:id/profile   → Updates editable profile fields
 * - GET  /health               → Health check for Docker
 *
 * Security:
 * - Data validation with DTOs and NestJS pipes
 * - Error handling that does not reveal internal information
 * - Correct HTTP codes for each error type
 */

import {
	Body,
	Controller,
	DefaultValuePipe,
	Get,
	HttpCode,
	HttpException,
	HttpStatus,
	Param,
	Delete,
	Patch,
	Post,
	ParseIntPipe,
	Query,
	Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { UpsertOAuth42UserDto, UpdateUserAvatarDto, UpdateUserProfileDto, CreateFriendDto } from '@intragram/shared/users';

@Controller()
export class UsersController {
	constructor(private readonly usersService: UsersService) { }

	/**
	 * Creates or updates the local profile from OAuth42.
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
	 * Refreshes a user's profile from the 42 API.
	 *
	 * Requires:
	 * - user_id: Internal user ID
	 * - access_token (query param): Valid OAuth42 access token
	 */
	@Patch('users/:id/refresh')
	@HttpCode(HttpStatus.OK)
	async refreshProfileFromOAuth42(
		@Param('id') userId: string,
		@Query('access_token') accessToken: string,
	) {
		if (!accessToken) {
			throw new HttpException(
				'Access token de OAuth42 requerido',
				HttpStatus.BAD_REQUEST,
			);
		}

		try {
			return await this.usersService.refreshFromOAuth42Token(userId, accessToken);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al refrescar perfil desde OAuth42',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Searches users by login or display_name with a limit to avoid overloading the DB.
	 */
	@Get('users/search')
	async searchUsers(
		@Query('q') query = '',
		@Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
	) {
		try {
			return await this.usersService.searchUsers(query, limit);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al buscar usuarios',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Looks up a profile by its internal identifier.
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
	 * Looks up a profile by its 42 id.
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
	 * Looks up a profile by its login.
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
	 * Updates the editable fields of the local profile.
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
	 * Updates the user's profile avatar using the posts-style image pipeline.
	 */
	@Patch('users/:id/avatar')
	async updateAvatar(@Param('id') id: string, @Body() dto: UpdateUserAvatarDto) {
		try {
			return await this.usersService.updateAvatar(id, dto);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al actualizar avatar',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Serves the stored avatar image bytes for public rendering.
	 */
	@Get('users/:id/avatar')
	async getAvatar(@Param('id') id: string, @Res() res: Response) {
		try {
			const image = await this.usersService.getAvatarImage(id);
			res.set({
				'Content-Type': image.mimeType,
				'Cache-Control': 'public, max-age=31536000, immutable',
			});
			res.send(image.data);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	/**
	 * Health check of the users-service.
	 */
	@Get('health')
	async health() {
		return this.usersService.getHealth();
	}

	/**
	 * Returns the list of accepted friends of a user.
	 */
	@Get('friends/suggestions/:id')
	async getSuggestions(@Param('id') id: string) {
		return this.usersService.getSuggestions(id);
	}

	@Get('directory/:id')
	async getDirectory(
		@Param('id') id: string,
		@Query('campus_scope') campusScope: 'all' | 'mine' | 'country' | 'projects' = 'all',
		@Query('min_level') minLevel?: string,
		@Query('max_level') maxLevel?: string,
		@Query('cursus') cursus?: string,
		@Query('achievement') achievement?: string,
		@Query('project') project?: string,
	) {
		const parsedMinLevel = minLevel ? Number(minLevel) : undefined;
		const parsedMaxLevel = maxLevel ? Number(maxLevel) : undefined;
		return this.usersService.getDirectory(
			id,
			50,
			['mine', 'country', 'projects'].includes(campusScope) ? campusScope : 'all',
			{
				minLevel: Number.isFinite(parsedMinLevel) ? parsedMinLevel : undefined,
				maxLevel: Number.isFinite(parsedMaxLevel) ? parsedMaxLevel : undefined,
				cursus,
				achievement,
				project,
			},
		);
	}

	@Get('friends/:id')
	async getFriends(@Param('id') id: string) {
		return this.usersService.getFriends(id);
	}

	/**
	 * Adds a friend to the specified user (creates a pending request or accepts the incoming one).
	 */
	@Post('friends/:id')
	async addFriend(@Param('id') id: string, @Body() dto: CreateFriendDto) {
		try {
			const friend = await this.usersService.findByLogin(dto.friend_login);
			return await this.usersService.addFriend(id, friend.id);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al agregar amigo',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Removes a friendship from the specified user.
	 */
	@Delete('friends/:id/:friendId')
	async removeFriend(@Param('id') id: string, @Param('friendId') friendId: string) {
		try {
			return await this.usersService.removeFriend(id, friendId);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al eliminar amigo',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Returns profiles of users with pending friend requests towards userId.
	 */
	@Get('friends/pending/:id')
	async getPendingFriendRequests(@Param('id') id: string) {
		return this.usersService.getPendingFriendRequests(id);
	}

	/**
	 * Returns the relation status between myId and targetId.
	 */
	@Get('friends/status/:myId/:targetId')
	async getFriendshipStatus(@Param('myId') myId: string, @Param('targetId') targetId: string) {
		const relation = await this.usersService.getFriendshipStatus(myId, targetId);
		return { relation };
	}

	/**
	 * Accepts a pending friend request from requesterId to id.
	 */
	@Patch('friends/:id/accept/:requesterId')
	async acceptFriendRequest(@Param('id') id: string, @Param('requesterId') requesterId: string) {
		try {
			return await this.usersService.acceptFriendRequest(id, requesterId);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al aceptar solicitud',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Updates the online presence status for a user.
	 * Internal endpoint — called by the gateway's WebSocket presence gateway.
	 */
	@Patch('users/:id/presence')
	@HttpCode(HttpStatus.NO_CONTENT)
	async setPresence(@Param('id') userId: string, @Body('active') active: boolean) {
		try {
			await this.usersService.setPresence(userId, active);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error updating presence',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
