/**
 * Users controller of the gateway.
 * Exposes routes for synchronising profiles from OAuth42 and querying profiles.
 * Protects query routes with AuthGuard to ensure only authenticated users can access them.
 *
 * Endpoints:
 * - POST   /users/oauth/42/upsert        → Creates or updates profile from OAuth42
 * - PATCH  /users/:id/refresh-profile    → Refreshes profile from 42 API (requires access_token)
 * - GET    /users/:id                    → Looks up profile by internal ID
 * - GET    /users/42/:fortyTwoId         → Looks up profile by 42 ID
 * - GET    /users/login/:login           → Looks up profile by normalised login
 * - PATCH  /users/:id/profile            → Updates editable profile fields (own profile only)
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
	ForbiddenException,
	Get,
	HttpException,
	HttpStatus,
	Delete,
	Param,
	Patch,
	Post,
	ParseIntPipe,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import type { IDirectoryEntry, IDirectoryFilters, IDirectoryScope } from './users.service';
import { IUserProfile, IPostComment, IFeedPost, UpsertOAuth42UserDto, UpdateUserProfileDto, CreateFeedPostDto, CreateFriendDto } from '@intragram/shared/users';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PublicRateLimit } from '../../common/decorators/public-rate-limit.decorator';
import { PublicRateLimitGuard } from '../../common/guards/public-rate-limit.guard';
import { RealtimeService } from '../realtime/realtime.service';

@Controller('users')
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
		private readonly realtimeService: RealtimeService,
	) {}

	private async resolveAuthenticatedProfileId(req: any): Promise<string | null> {
		const chatUserId = req.user?.chat_user_id;
		if (typeof chatUserId === 'string' && chatUserId.length > 0) {
			return chatUserId;
		}

		const username = req.user?.username;
		if (!username) return null;

		try {
			const profile = await this.usersService.findByLogin(username);
			return profile.id;
		} catch {
			return null;
		}
	}

	/**
	 * Creates or updates the local user from the received OAuth42 profile.
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
	 * Looks up a user by their 42 id.
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
	 * Looks up a user by their normalised login.
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
	 * Searches users by login/display_name with a result limit.
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
	 * Updates only the editable fields of the authenticated user's own profile.
	 */
	@UseGuards(AuthGuard)
	@Patch(':id/profile')
	async updateProfile(@Param('id') id: string, @Body() dto: UpdateUserProfileDto, @Req() req: any): Promise<IUserProfile> {
		const authenticatedProfileId = await this.resolveAuthenticatedProfileId(req);
		if (!authenticatedProfileId || authenticatedProfileId !== id) {
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
	 * Refreshes a user's profile from the 42 API.
	 *
	 * Supports two forms:
	 * - PATCH /users/me/refresh-profile (uses the authenticated user)
	 * - PATCH /users/:id/refresh-profile (uses the specified ID, owner only)
	 *
	 * Query params:
	 * - access_token: Valid OAuth42 access token
	 */
	@UseGuards(AuthGuard)
	@Patch(':id/refresh-profile')
	async refreshProfile(
		@Param('id') id: string,
		@Query('access_token') accessToken: string,
		@Req() req: any,
	): Promise<IUserProfile> {
		// Only allow refreshing the own profile or when "me" is used
		const authenticatedProfileId = await this.resolveAuthenticatedProfileId(req);
		if (id !== 'me' && authenticatedProfileId !== id) {
			throw new ForbiddenException('You can only refresh your own profile');
		}

		const userId = id === 'me' ? authenticatedProfileId : id;
		if (!userId) {
			throw new ForbiddenException('You can only refresh your own profile');
		}

		if (!accessToken) {
			throw new HttpException(
				'Access token de OAuth42 requerido (parámetro: access_token)',
				HttpStatus.BAD_REQUEST,
			);
		}

		try {
			return await this.usersService.refreshProfileFromOAuth42(userId, accessToken);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al refrescar perfil desde OAuth42',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * Returns the "Recent" feed of the authenticated user.
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
	 * Returns the authenticated user's own feed ("My profile").
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
	 * Returns posts from the authenticated user's friends.
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
	 * Returns the "Trending" feed of the authenticated user.
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
	 * Returns the saved (favourite) posts feed of the authenticated user.
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
	 * Toggles the favourite state of a post for the authenticated user.
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
	 * Returns friend suggestions for the authenticated user (ordered by campus → country → worldwide).
	 */
	@UseGuards(AuthGuard)
	@Get('friends/suggestions')
	async getSuggestions(@Req() req: any): Promise<IDirectoryEntry[]> {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.getSuggestions(profile.id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Returns all users in the platform except self, ordered by campus proximity.
	 */
	@UseGuards(AuthGuard)
	@Get('directory')
	async getDirectory(
		@Req() req: any,
		@Query('campus_scope') campusScope: IDirectoryScope = 'all',
		@Query('min_level') minLevel?: string,
		@Query('max_level') maxLevel?: string,
		@Query('cursus') cursus?: string,
		@Query('achievement') achievement?: string,
		@Query('project') project?: string,
	): Promise<IDirectoryEntry[]> {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			const parsedMinLevel = minLevel ? Number(minLevel) : undefined;
			const parsedMaxLevel = maxLevel ? Number(maxLevel) : undefined;
			const filters: IDirectoryFilters = {
				min_level: Number.isFinite(parsedMinLevel) ? parsedMinLevel : undefined,
				max_level: Number.isFinite(parsedMaxLevel) ? parsedMaxLevel : undefined,
				cursus,
				achievement,
				project,
			};
			return await this.usersService.getDirectory(
				profile.id,
				['mine', 'country', 'projects'].includes(campusScope) ? campusScope : 'all',
				filters,
			);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Returns the list of accepted friends of the authenticated user.
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
	 * Removes a friend from the authenticated user.
	 */
	@UseGuards(AuthGuard)
	@Delete('friends/me/:friendId')
	async removeFriend(@Req() req: any, @Param('friendId') friendId: string): Promise<{ removed: boolean }> {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.removeFriend(profile.id, friendId);
		} catch (error: any) {
			throw new HttpException(error.message || 'Error al eliminar amigo', error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Adds a friend for the authenticated user (returns status pending or accepted).
	 */
	@UseGuards(AuthGuard)
	@Post('friends/me')
	async addFriend(@Req() req: any, @Body() dto: CreateFriendDto): Promise<{ status: 'pending' | 'accepted'; friend: IUserProfile }> {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			const result = await this.usersService.addFriend(profile.id, dto);
			if (result.status === 'pending') {
				this.realtimeService.emitToUser(result.friend.id, 'friend:request', {
					from: { id: profile.id, login: profile.login, displayName: profile.display_name },
				});
			}
			return result;
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Returns incoming pending friend requests for the authenticated user.
	 */
	@UseGuards(AuthGuard)
	@Get('friends/pending')
	async getPendingFriendRequests(@Req() req: any): Promise<IUserProfile[]> {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.getPendingFriendRequests(profile.id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Accepts a pending friend request from the specified user.
	 */
	@UseGuards(AuthGuard)
	@Patch('friends/me/:requesterId/accept')
	async acceptFriendRequest(@Req() req: any, @Param('requesterId') requesterId: string): Promise<IUserProfile> {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.acceptFriendRequest(profile.id, requesterId);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Toggles the like of the authenticated user on a post.
	 */
	@UseGuards(AuthGuard)
	@Post('feed/like/:postId')
	async toggleLike(@Param('postId') postId: string, @Req() req: any): Promise<{ liked: boolean; likes_count: number }> {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.toggleLikePost(profile.id, postId);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Creates a new post in the feed of the authenticated user.
	 */
	@UseGuards(AuthGuard)
	@Post('feed')
	async createPost(@Body() dto: CreateFeedPostDto, @Req() req: any): Promise<IFeedPost> {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			const post = await this.usersService.createPost(profile.id, dto);
			this.realtimeService.emitToAll('feed:new-post', post);
			return post;
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Returns all comments for a post.
	 */
	@UseGuards(AuthGuard)
	@Get('feed/post/:postId')
	async getPostById(@Param('postId') postId: string, @Req() req: any): Promise<IFeedPost> {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.getPostById(postId, profile.id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@UseGuards(AuthGuard)
	@Get('feed/post/:postId/comments')
	async getPostComments(@Param('postId') postId: string): Promise<IPostComment[]> {
		try {
			return await this.usersService.getPostComments(postId);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Adds a comment to a post for the authenticated user.
	 */
	@UseGuards(AuthGuard)
	@Post('feed/post/:postId/comments')
	async addComment(
		@Param('postId') postId: string,
		@Body('content') content: string,
		@Req() req: any,
	): Promise<IPostComment> {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.addComment(postId, profile.id, content);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Deletes a comment owned by the authenticated user.
	 */
	@UseGuards(AuthGuard)
	@Delete('feed/post/:postId/comments/:commentId')
	async deleteComment(@Param('commentId') commentId: string, @Req() req: any): Promise<{ deleted: boolean }> {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.deleteComment(commentId, profile.id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@UseGuards(AuthGuard)
	@Delete('feed/post/:postId')
	async deletePost(@Param('postId') postId: string, @Req() req: any): Promise<{ deleted: boolean }> {
		try {
			const profile = await this.usersService.findByLogin(req.user.username);
			return await this.usersService.deletePost(postId, profile.id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Looks up a user by their internal identifier.
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
