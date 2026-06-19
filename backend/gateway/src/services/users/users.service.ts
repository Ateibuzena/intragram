/**
 * Users Service of the Gateway
 * Forwards operations to the users-service and normalises its responses.
 */

import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { IUserProfile, UpsertOAuth42UserDto, UpdateUserProfileDto, IFeedPost, IPostComment, CreateFeedPostDto, CreateFriendDto } from '@intragram/shared/users';
import { SERVICE_URLS } from '../../config/microservices.config';
import { GatewayHttpClientService } from '../../common/http/gateway-http.client';

export type IDirectoryRelation = 'none' | 'friends' | 'pending_sent' | 'pending_received';
export interface IDirectoryEntry {
	id: string;
	login: string;
	display_name: string | null;
	avatar_url: string | null;
	campus: string | null;
	active: boolean;
	relation: IDirectoryRelation;
}

@Injectable()
export class UsersService {
	// Base URL of the users microservice.
	private readonly usersBaseUrl = SERVICE_URLS.users;

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
			return await this.httpClient.get<IFeedPost[]>(`${this.usersBaseUrl}/feed/recent/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener feed reciente');
		}
	}

	/**
	 * Returns the personal feed of the authenticated user.
	 */
	async getMyFeed(userId: string): Promise<IFeedPost[]> {
		try {
			return await this.httpClient.get<IFeedPost[]>(`${this.usersBaseUrl}/feed/user/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener feed del usuario');
		}
	}

	/**
	 * Returns the friends feed of the authenticated user.
	 */
	async getFriendsFeed(userId: string): Promise<IFeedPost[]> {
		try {
			return await this.httpClient.get<IFeedPost[]>(`${this.usersBaseUrl}/feed/friends/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener feed de amigos');
		}
	}

	/**
	 * Returns the "Trending" feed of the authenticated user (excluding their own posts).
	 */
	async getTrendingFeed(userId: string): Promise<IFeedPost[]> {
		try {
			return await this.httpClient.get<IFeedPost[]>(`${this.usersBaseUrl}/feed/trending/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener feed de tendencias');
		}
	}

	/**
	 * Returns the saved (favourite) posts feed of the authenticated user.
	 */
	async getFavoritesFeed(userId: string): Promise<IFeedPost[]> {
		try {
			return await this.httpClient.get<IFeedPost[]>(`${this.usersBaseUrl}/feed/favorites/${userId}`, { timeoutMs: 5000 });
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
				`${this.usersBaseUrl}/feed/favorites/${userId}`,
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
				`${this.usersBaseUrl}/feed/user/${userId}`,
				dto,
				{ timeoutMs: 5000 },
			);
		} catch (error) {
			this.handleHttpError(error, 'crear publicacion');
		}
	}

	/**
	 * Returns friend suggestions for the authenticated user (campus → country → worldwide).
	 */
	async getSuggestions(userId: string): Promise<IUserProfile[]> {
		try {
			return await this.httpClient.get<IUserProfile[]>(`${this.usersBaseUrl}/friends/suggestions/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener sugerencias de amistad');
		}
	}

	/**
	 * Returns all users in the platform (except self) with their relation status, ordered by campus proximity.
	 */
	async getDirectory(userId: string): Promise<IDirectoryEntry[]> {
		try {
			return await this.httpClient.get<IDirectoryEntry[]>(`${this.usersBaseUrl}/directory/${userId}`, { timeoutMs: 5000 });
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
				`${this.usersBaseUrl}/feed/like/${userId}`,
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
	async removeFriend(userId: string, friendId: string): Promise<{ removed: boolean }> {
		try {
			return await this.httpClient.delete<{ removed: boolean }>(`${this.usersBaseUrl}/friends/${userId}/${friendId}`, {
				timeoutMs: 5000,
			});
		} catch (error) {
			this.handleHttpError(error, 'eliminar amigo');
		}
	}

	/**
	 * Returns all comments for a post.
	 */
	async getPostComments(postId: string): Promise<IPostComment[]> {
		try {
			return await this.httpClient.get<IPostComment[]>(`${this.usersBaseUrl}/feed/post/${postId}/comments`, { timeoutMs: 5000 });
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
				`${this.usersBaseUrl}/feed/post/${postId}/comments`,
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
				`${this.usersBaseUrl}/feed/post/comments/${commentId}/by/${userId}`,
				{ timeoutMs: 5000 },
			);
		} catch (error) {
			this.handleHttpError(error, 'delete comment');
		}
	}

	async deletePost(postId: string, userId: string): Promise<{ deleted: boolean }> {
		try {
			return await this.httpClient.delete<{ deleted: boolean }>(
				`${this.usersBaseUrl}/feed/post/${postId}/by/${userId}`,
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
			new Error(`Error de conexion al ${action} en users-service: ${axiosError.message}`),
			{ statusCode: 503 },
		);
	}
}
