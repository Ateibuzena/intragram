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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpsertOAuth42UserDto, UpdateUserProfileDto, CreateFeedPostDto, CreateFriendDto } from '@intragram/shared/users';

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
	 * Health check of the users-service.
	 */
	@Get('health')
	async health() {
		return this.usersService.getHealth();
	}

	/**
	 * Returns the user's personalised "Recent" feed.
	 */
	@Get('feed/recent/:id')
	async getRecentFeed(@Param('id') id: string) {
		return this.usersService.getRecentFeed(id);
	}

	/**
	 * Returns the user's own posts.
	 */
	@Get('feed/user/:id')
	async getUserFeed(@Param('id') id: string) {
		return this.usersService.getUserFeed(id);
	}

	/**
	 * Creates a new post for the specified user.
	 */
	@Post('feed/user/:id')
	async createUserPost(@Param('id') id: string, @Body() dto: CreateFeedPostDto) {
		return this.usersService.createPost(id, dto);
	}

	/**
	 * Returns posts from a user's friends.
	 */
	@Get('feed/friends/:id')
	async getFriendsFeed(@Param('id') id: string) {
		return this.usersService.getFriendsFeed(id);
	}

	/**
	 * Returns the "Trending" feed for a user (excluding their own posts).
	 */
	@Get('feed/trending/:id')
	async getTrendingFeed(@Param('id') id: string) {
		return this.usersService.getTrendingFeed(id);
	}

	/**
	 * Returns the feed of saved (favourite) posts of a user.
	 */
	@Get('feed/favorites/:id')
	async getFavoritesFeed(@Param('id') id: string) {
		return this.usersService.getFavoritesFeed(id);
	}

	/**
	 * Toggles the saved state of a post for a user.
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
	 * Returns the list of accepted friends of a user.
	 */
	@Get('friends/suggestions/:id')
	async getSuggestions(@Param('id') id: string) {
		return this.usersService.getSuggestions(id);
	}

	@Get('directory/:id')
	async getDirectory(@Param('id') id: string) {
		return this.usersService.getDirectory(id);
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
	 * Toggles a user's like on a post.
	 */
	@Post('feed/like/:id')
	async toggleLike(@Param('id') id: string, @Body('postId') postId: string) {
		try {
			return await this.usersService.toggleLikePost(id, postId);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al actualizar like',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Returns all comments for a post.
	 */
	@Get('feed/post/:postId/comments')
	async getPostComments(@Param('postId') postId: string) {
		return this.usersService.getPostComments(postId);
	}

	/**
	 * Adds a comment to a post.
	 */
	@Post('feed/post/:postId/comments')
	async addComment(
		@Param('postId') postId: string,
		@Body('authorId') authorId: string,
		@Body('content') content: string,
	) {
		try {
			return await this.usersService.addComment(postId, authorId, content);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error adding comment',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Deletes a comment by its owner.
	 */
	@Delete('feed/post/comments/:commentId/by/:userId')
	async deleteComment(@Param('commentId') commentId: string, @Param('userId') userId: string) {
		try {
			return await this.usersService.deleteComment(commentId, userId);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error deleting comment',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Delete('feed/post/:postId/by/:userId')
	async deletePost(@Param('postId') postId: string, @Param('userId') userId: string) {
		try {
			return await this.usersService.deletePost(postId, userId);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error deleting post',
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
