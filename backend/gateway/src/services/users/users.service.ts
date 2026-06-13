/**
 * Servicio de Usuarios del Gateway
 * Reenvía operaciones al users-service y normaliza sus respuestas.
 */

import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { IUserProfile, UpsertOAuth42UserDto, UpdateUserProfileDto, IFeedPost, CreateFeedPostDto, CreateFriendDto } from '@intragram/shared/users';
import { SERVICE_URLS } from '../../config/microservices.config';
import { GatewayHttpClientService } from '../../common/http/gateway-http.client';

@Injectable()
export class UsersService {
	// URL base del microservicio de usuarios.
	private readonly usersBaseUrl = SERVICE_URLS.users;

	constructor(private readonly httpClient: GatewayHttpClientService) {}

	/**
	 * Reenvía el upsert OAuth42 al users-service.
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
	 * Busca un usuario por id interno.
	 */
	async findById(id: string): Promise<IUserProfile> {
		try {
			return await this.httpClient.get<IUserProfile>(`${this.usersBaseUrl}/users/${id}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener usuario por id');
		}
	}

	/**
	 * Busca un usuario por id de 42.
	 */
	async findBy42Id(fortyTwoId: number): Promise<IUserProfile> {
		try {
			return await this.httpClient.get<IUserProfile>(`${this.usersBaseUrl}/users/42/${fortyTwoId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener usuario por 42 id');
		}
	}

	/**
	 * Busca un usuario por login.
	 */
	async findByLogin(login: string): Promise<IUserProfile> {
		try {
			return await this.httpClient.get<IUserProfile>(`${this.usersBaseUrl}/users/login/${login}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener usuario por login');
		}
	}

	/**
	 * Busca usuarios por texto libre (login/display_name) con limite.
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
	 * Actualiza el perfil editable del usuario.
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
	 * Refresca el perfil de un usuario desde la API de 42.
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
	 * Devuelve el feed "Reciente" personalizado del usuario.
	 */
	async getRecentFeed(userId: string): Promise<IFeedPost[]> {
		try {
			return await this.httpClient.get<IFeedPost[]>(`${this.usersBaseUrl}/feed/recent/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener feed reciente');
		}
	}

	/**
	 * Devuelve el feed personal del usuario autenticado.
	 */
	async getMyFeed(userId: string): Promise<IFeedPost[]> {
		try {
			return await this.httpClient.get<IFeedPost[]>(`${this.usersBaseUrl}/feed/user/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener feed del usuario');
		}
	}

	/**
	 * Devuelve el feed de amigos del usuario autenticado.
	 */
	async getFriendsFeed(userId: string): Promise<IFeedPost[]> {
		try {
			return await this.httpClient.get<IFeedPost[]>(`${this.usersBaseUrl}/feed/friends/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener feed de amigos');
		}
	}

	/**
	 * Devuelve el feed de "Tendencias" del usuario autenticado (sin incluir sus propios posts).
	 */
	async getTrendingFeed(userId: string): Promise<IFeedPost[]> {
		try {
			return await this.httpClient.get<IFeedPost[]>(`${this.usersBaseUrl}/feed/trending/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener feed de tendencias');
		}
	}

	/**
	 * Devuelve el feed de posts guardados (favoritos) del usuario autenticado.
	 */
	async getFavoritesFeed(userId: string): Promise<IFeedPost[]> {
		try {
			return await this.httpClient.get<IFeedPost[]>(`${this.usersBaseUrl}/feed/favorites/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener feed de favoritos');
		}
	}

	/**
	 * Alterna el estado de guardado de un post para el usuario autenticado.
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
	 * Crea una nueva publicacion para el usuario autenticado.
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
	 * Devuelve la lista de amigos del usuario autenticado.
	 */
	async getFriends(userId: string): Promise<IUserProfile[]> {
		try {
			return await this.httpClient.get<IUserProfile[]>(`${this.usersBaseUrl}/friends/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener amigos del usuario');
		}
	}

	/**
	 * Agrega un amigo para el usuario autenticado (solicitud pending o aceptación automática).
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
	 * Devuelve solicitudes de amistad pendientes entrantes del usuario.
	 */
	async getPendingFriendRequests(userId: string): Promise<IUserProfile[]> {
		try {
			return await this.httpClient.get<IUserProfile[]>(`${this.usersBaseUrl}/friends/pending/${userId}`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener solicitudes pendientes');
		}
	}

	/**
	 * Acepta una solicitud de amistad pendiente.
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
	 * Alterna el like del usuario autenticado en un post.
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
	 * Elimina una amistad del usuario autenticado.
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
	 * Normaliza las respuestas de error HTTP del users-service.
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
