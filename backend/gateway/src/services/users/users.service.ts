/**
 * Users Service of the Gateway
 * Forwards profile and friendship operations to users-service.
 * Forwards feed and post interactions to posts-service.
 */

import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { IUserProfile, UpsertOAuth42UserDto, UpdateUserAvatarDto, UpdateUserProfileDto, CreateFriendDto } from '@intragram/shared/users';
import { IFeedPost, IPostComment, CreateFeedPostDto } from '@intragram/shared/posts';
import { SERVICE_URLS } from '../../config/microservices.config';
import { GatewayHttpClientService } from '../../common/http/gateway-http.client';

export type IDirectoryRelation = 'none' | 'friends' | 'pending_sent' | 'pending_received';
export type IDirectoryScope = 'all' | 'mine' | 'country' | 'projects';
export interface IDirectoryFilters {
	min_level?: number;
	max_level?: number;
	cursus?: string;
	achievement?: string;
	project?: string;
}
export interface IDirectoryEntry {
	id: string;
	login: string;
	display_name: string | null;
	avatar_url: string | null;
	campus: string | null;
	campus_id: number | null;
	campus_country: string | null;
	campus_city: string | null;
	campus_match: 'campus' | 'country' | 'worldwide';
	common_projects_count: number;
	common_projects: string[];
	active: boolean;
	location: string | null;
	relation: IDirectoryRelation;
}

@Injectable()
export class UsersService {
	// Base URL of the users microservice.
	private readonly usersBaseUrl = SERVICE_URLS.users;
	// Base URL of the posts microservice.
	private readonly postsBaseUrl = SERVICE_URLS.posts;

	constructor(private readonly httpClient: GatewayHttpClientService) {}

	/**
	 * Forwards the OAuth42 upsert to the users-service.
	 */
	async upsertOAuth42User(dto: UpsertOAuth42UserDto): Promise<IUserProfile> {
		try {
			return await this.httpClient.post<IUserProfile, UpsertOAuth42UserDto>(
				`${this.usersBaseUrl}/users/oauth/42/upsert`,
				dto,
				{ timeoutMs: 10000 },
			);
		} catch (error) {
			this.handleHttpError(error, 'guardar usuario OAuth42');
		}
	}

	/**
	 * Looks up a user by internal id.
	 */
	async findById(id: string): Promise<IUserProfile> {
		try {
			return await this.httpClient.get<IUserProfile>(`${this.usersBaseUrl}/users/${id}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener usuario por id');
		}
	}

	/**
	 * Looks up a user by 42 id.
	 */
	async findBy42Id(fortyTwoId: number): Promise<IUserProfile> {
		try {
			return await this.httpClient.get<IUserProfile>(`${this.usersBaseUrl}/users/42/${fortyTwoId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener usuario por 42 id');
		}
	}

	/**
	 * Looks up a user by login.
	 */
	async findByLogin(login: string): Promise<IUserProfile> {
		try {
			return await this.httpClient.get<IUserProfile>(`${this.usersBaseUrl}/users/login/${login}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener usuario por login');
		}
	}

	/**
	 * Searches users by free text (login/display_name) with a limit.
	 */
	async searchUsers(query: string, limit = 20): Promise<IUserProfile[]> {
		try {
			return await this.httpClient.get<IUserProfile[]>(`${this.usersBaseUrl}/users/search`, {
				timeoutMs: 5000,
				params: { q: query, limit },
			});
		} catch (error) {
			this.handleHttpError(error, 'buscar usuarios');
		}
	}

	/**
	 * Updates the editable profile of the user.
	 */
	async updateProfile(id: string, dto: UpdateUserProfileDto): Promise<IUserProfile> {
		try {
			return await this.httpClient.patch<IUserProfile, UpdateUserProfileDto>(
				`${this.usersBaseUrl}/users/${id}/profile`,
				dto,
				{ timeoutMs: 5000 },
			);
		} catch (error) {
			this.handleHttpError(error, 'actualizar perfil de usuario');
		}
	}

	/**
	 * Updates the user's avatar image using the users-service image pipeline.
	 */
	async updateAvatar(id: string, dto: UpdateUserAvatarDto): Promise<IUserProfile> {
		try {
			return await this.httpClient.patch<IUserProfile, UpdateUserAvatarDto>(
				`${this.usersBaseUrl}/users/${id}/avatar`,
				dto,
				{ timeoutMs: 10000 },
			);
		} catch (error) {
			this.handleHttpError(error, 'actualizar avatar de usuario');
		}
	}

	/**
	 * Returns the stored avatar image bytes for public rendering.
	 */
	async getAvatarImage(id: string): Promise<Uint8Array> {
		try {
			return await this.httpClient.get<Uint8Array>(`${this.usersBaseUrl}/users/${id}/avatar`, {
				timeoutMs: 5000,
				responseType: 'arraybuffer',
			});
		} catch (error) {
			this.handleHttpError(error, 'obtener avatar de usuario');
		}
	}

	/**
	 * Refreshes a user's profile from the 42 API.
	 */
	async refreshProfileFromOAuth42(userId: string, oauth42AccessToken: string): Promise<IUserProfile> {
		try {
			return await this.httpClient.patch<IUserProfile, Record<string, never>>(
				`${this.usersBaseUrl}/users/${userId}/refresh`,
				{},
				{
					timeoutMs: 10000,
					params: { access_token: oauth42AccessToken },
				},
			);
		} catch (error) {
			this.handleHttpError(error, 'refrescar perfil desde OAuth42');
		}
	}

	/**
	 * Returns the user's personalised "Recent" feed.
	 */
	async getRecentFeed(userId: string): Promise<IFeedPost[]> {
		try {
			return await this.httpClient.get<IFeedPost[]>(`${this.postsBaseUrl}/posts/feed/recent/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener feed reciente');
		}
	}

	/**
	 * Returns the personal feed of the authenticated user.
	 */
	async getMyFeed(userId: string): Promise<IFeedPost[]> {
		try {
			return await this.httpClient.get<IFeedPost[]>(`${this.postsBaseUrl}/posts/feed/user/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener feed del usuario');
		}
	}

	/**
	 * Returns the friends feed of the authenticated user.
	 */
	async getFriendsFeed(userId: string): Promise<IFeedPost[]> {
		try {
			return await this.httpClient.get<IFeedPost[]>(`${this.postsBaseUrl}/posts/feed/friends/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener feed de amigos');
		}
	}

	/**
	 * Returns the "Trending" feed of the authenticated user (excluding their own posts).
	 */
	async getTrendingFeed(userId: string): Promise<IFeedPost[]> {
		try {
			return await this.httpClient.get<IFeedPost[]>(`${this.postsBaseUrl}/posts/feed/trending/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener feed de tendencias');
		}
	}

	/**
	 * Returns the saved (favourite) posts feed of the authenticated user.
	 */
	async getFavoritesFeed(userId: string): Promise<IFeedPost[]> {
		try {
			return await this.httpClient.get<IFeedPost[]>(`${this.postsBaseUrl}/posts/feed/favorites/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener feed de favoritos');
		}
	}

	/**
	 * Toggles the saved state of a post for the authenticated user.
	 */
	async toggleFavoritePost(userId: string, postId: string): Promise<boolean> {
		try {
			const response = await this.httpClient.post<{ saved: boolean }, { postId: string }>(
				`${this.postsBaseUrl}/posts/feed/favorites/${userId}`,
				{ postId },
				{ timeoutMs: 5000 },
			);
			return response.saved;
		} catch (error) {
			this.handleHttpError(error, 'actualizar favorito');
		}
	}

	/**
	 * Creates a new post for the authenticated user.
	 */
	async createPost(userId: string, dto: CreateFeedPostDto): Promise<IFeedPost> {
		try {
			return await this.httpClient.post<IFeedPost, CreateFeedPostDto>(
				`${this.postsBaseUrl}/posts/feed/user/${userId}`,
				dto,
				{ timeoutMs: 5000 },
			);
		} catch (error) {
			this.handleHttpError(error, 'crear publicacion');
		}
	}

	/**
	 * Fetches a post's image bytes from posts-service. Always WebP (posts-service
	 * re-encodes every upload), so the caller can set Content-Type without
	 * needing to inspect a header here.
	 */
	async getPostImage(postId: string, userId: string): Promise<Uint8Array> {
		try {
			return await this.httpClient.get<Uint8Array>(
				`${this.postsBaseUrl}/posts/feed/post/${postId}/image?userId=${encodeURIComponent(userId)}`,
				{ timeoutMs: 5000, responseType: 'arraybuffer' },
			);
		} catch (error) {
			this.handleHttpError(error, 'obtener imagen del post');
		}
	}

	/**
	 * Returns friend suggestions for the authenticated user (campus → country → worldwide).
	 */
	async getSuggestions(userId: string): Promise<IDirectoryEntry[]> {
		try {
			return await this.httpClient.get<IDirectoryEntry[]>(`${this.usersBaseUrl}/friends/suggestions/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener sugerencias de amistad');
		}
	}

	/**
	 * Returns all users in the platform (except self) with their relation status, ordered by campus proximity.
	 */
	async getDirectory(userId: string, campusScope: IDirectoryScope = 'all', filters: IDirectoryFilters = {}): Promise<IDirectoryEntry[]> {
		try {
			return await this.httpClient.get<IDirectoryEntry[]>(`${this.usersBaseUrl}/directory/${userId}`, {
				timeoutMs: 5000,
				params: { campus_scope: campusScope, ...filters },
			});
		} catch (error) {
			this.handleHttpError(error, 'obtener directorio de usuarios');
		}
	}

	/**
	 * Returns the list of friends of the authenticated user.
	 */
	async getFriends(userId: string): Promise<IUserProfile[]> {
		try {
			return await this.httpClient.get<IUserProfile[]>(`${this.usersBaseUrl}/friends/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener amigos del usuario');
		}
	}

	/**
	 * Adds a friend for the authenticated user (pending request or automatic acceptance).
	 */
	async addFriend(userId: string, dto: CreateFriendDto): Promise<{ status: 'pending' | 'accepted'; friend: IUserProfile }> {
		try {
			return await this.httpClient.post<{ status: 'pending' | 'accepted'; friend: IUserProfile }, CreateFriendDto>(
				`${this.usersBaseUrl}/friends/${userId}`,
				dto,
				{ timeoutMs: 5000 },
			);
		} catch (error) {
			this.handleHttpError(error, 'agregar amigo');
		}
	}

	/**
	 * Returns incoming pending friend requests for the user.
	 */
	async getPendingFriendRequests(userId: string): Promise<IUserProfile[]> {
		try {
			return await this.httpClient.get<IUserProfile[]>(`${this.usersBaseUrl}/friends/pending/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener solicitudes pendientes');
		}
	}

	/**
	 * Returns the relation status between myId and targetId.
	 */
	async getFriendshipStatus(myId: string, targetId: string): Promise<{ relation: IDirectoryRelation }> {
		try {
			return await this.httpClient.get<{ relation: IDirectoryRelation }>(`${this.usersBaseUrl}/friends/status/${myId}/${targetId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener estado de amistad');
		}
	}

	/**
	 * Accepts a pending friend request.
	 */
	async acceptFriendRequest(userId: string, requesterId: string): Promise<IUserProfile> {
		try {
			return await this.httpClient.patch<IUserProfile, Record<string, never>>(
				`${this.usersBaseUrl}/friends/${userId}/accept/${requesterId}`,
				{},
				{ timeoutMs: 5000 },
			);
		} catch (error) {
			this.handleHttpError(error, 'aceptar solicitud de amistad');
		}
	}

	/**
	 * Toggles the like of the authenticated user on a post.
	 */
	async toggleLikePost(userId: string, postId: string): Promise<{ liked: boolean; likes_count: number }> {
		try {
			return await this.httpClient.post<{ liked: boolean; likes_count: number }, { postId: string }>(
				`${this.postsBaseUrl}/posts/feed/like/${userId}`,
				{ postId },
				{ timeoutMs: 5000 },
			);
		} catch (error) {
			this.handleHttpError(error, 'actualizar like');
		}
	}

	/**
	 * Removes a friendship from the authenticated user.
	 */
	async removeFriend(userId: string, friendId: string): Promise<{ removed: boolean; wasAccepted: boolean }> {
		try {
			return await this.httpClient.delete<{ removed: boolean; wasAccepted: boolean }>(`${this.usersBaseUrl}/friends/${userId}/${friendId}`, {
				timeoutMs: 5000,
			});
		} catch (error) {
			this.handleHttpError(error, 'eliminar amigo');
		}
	}

	/**
	 * Returns all comments for a post.
	 */
	async getPostComments(postId: string, userId: string): Promise<IPostComment[]> {
		try {
			return await this.httpClient.get<IPostComment[]>(`${this.postsBaseUrl}/posts/feed/post/${postId}/comments`, {
				timeoutMs: 5000,
				params: { userId },
			});
		} catch (error) {
			this.handleHttpError(error, 'get comments');
		}
	}

	/**
	 * Updates the online/offline presence status for a user.
	 * Non-critical — errors are silently ignored.
	 */
	async setPresence(userId: string, active: boolean): Promise<void> {
		try {
			await this.httpClient.patch<void, { active: boolean }>(
				`${this.usersBaseUrl}/users/${userId}/presence`,
				{ active },
				{ timeoutMs: 3000, retries: 0 },
			);
		} catch {
			// Presence is non-critical; ignore failures.
		}
	}

	/**
	 * Adds a comment to a post.
	 */
	async addComment(postId: string, userId: string, content: string): Promise<IPostComment> {
		try {
			return await this.httpClient.post<IPostComment, { authorId: string; content: string }>(
				`${this.postsBaseUrl}/posts/feed/post/${postId}/comments`,
				{ authorId: userId, content },
				{ timeoutMs: 5000 },
			);
		} catch (error) {
			this.handleHttpError(error, 'add comment');
		}
	}

	/**
	 * Deletes a comment by its owner.
	 */
	async deleteComment(commentId: string, userId: string): Promise<{ deleted: boolean }> {
		try {
			return await this.httpClient.delete<{ deleted: boolean }>(
					`${this.postsBaseUrl}/posts/feed/post/comments/${commentId}/by/${userId}`,
				{ timeoutMs: 5000 },
			);
		} catch (error) {
			this.handleHttpError(error, 'delete comment');
		}
	}

	async getPostById(postId: string, userId: string): Promise<IFeedPost> {
		try {
			return await this.httpClient.get<IFeedPost>(
				`${this.postsBaseUrl}/posts/feed/post/${postId}?userId=${encodeURIComponent(userId)}`,
				{ timeoutMs: 5000 },
			);
		} catch (error) {
			this.handleHttpError(error, 'get post');
		}
	}

	async deletePost(postId: string, userId: string): Promise<{ deleted: boolean }> {
		try {
			return await this.httpClient.delete<{ deleted: boolean }>(
				`${this.postsBaseUrl}/posts/feed/post/${postId}/by/${userId}`,
				{ timeoutMs: 5000 },
			);
		} catch (error) {
			this.handleHttpError(error, 'delete post');
		}
	}

	/**
	 * Normalises HTTP error responses from the users-service.
	 */
	private handleHttpError(error: unknown, action: string): never {
		const axiosError = error as AxiosError<{ statusCode?: number; message?: string }>;
		if (axiosError.response?.data) {
			const { statusCode, message } = axiosError.response.data;
			throw Object.assign(new Error(message || `Error al ${action}`), {
				statusCode: statusCode || axiosError.response.status,
			});
		}

		throw Object.assign(
			new Error(`Error de conexion al ${action} en el microservicio: ${axiosError.message}`),
			{ statusCode: 503 },
		);
	}
}
