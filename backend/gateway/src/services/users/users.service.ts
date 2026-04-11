/**
 * Servicio de Usuarios del Gateway
 * Reenvía operaciones al users-service y normaliza sus respuestas.
 */

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { IUserProfile, UpsertOAuth42UserDto, UpdateUserProfileDto, IFeedPost, CreateFeedPostDto } from '@intragram/shared/users';
import { SERVICE_URLS } from '../../config/microservices.config';

@Injectable()
export class UsersService {
	// URL base del microservicio de usuarios.
	private readonly usersBaseUrl = SERVICE_URLS.users;

	constructor(private readonly httpService: HttpService) {}

	/**
	 * Reenvía el upsert OAuth42 al users-service.
	 */
	async upsertOAuth42User(dto: UpsertOAuth42UserDto): Promise<IUserProfile> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<IUserProfile>(`${this.usersBaseUrl}/users/oauth/42/upsert`, dto, {
					timeout: 10000,
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'guardar usuario OAuth42');
		}
	}

	/**
	 * Busca un usuario por id interno.
	 */
	async findById(id: string): Promise<IUserProfile> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<IUserProfile>(`${this.usersBaseUrl}/users/${id}`, {
					timeout: 5000,
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'obtener usuario por id');
		}
	}

	/**
	 * Busca un usuario por id de 42.
	 */
	async findBy42Id(fortyTwoId: number): Promise<IUserProfile> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<IUserProfile>(`${this.usersBaseUrl}/users/42/${fortyTwoId}`, {
					timeout: 5000,
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'obtener usuario por 42 id');
		}
	}

	/**
	 * Busca un usuario por login.
	 */
	async findByLogin(login: string): Promise<IUserProfile> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<IUserProfile>(`${this.usersBaseUrl}/users/login/${login}`, {
					timeout: 5000,
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'obtener usuario por login');
		}
	}

	/**
	 * Busca usuarios por texto libre (login/display_name) con limite.
	 */
	async searchUsers(query: string, limit = 20): Promise<IUserProfile[]> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<IUserProfile[]>(`${this.usersBaseUrl}/users/search`, {
					timeout: 5000,
					params: { q: query, limit },
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'buscar usuarios');
		}
	}

	/**
	 * Actualiza el perfil editable del usuario.
	 */
	async updateProfile(id: string, dto: UpdateUserProfileDto): Promise<IUserProfile> {
		try {
			const response = await firstValueFrom(
				this.httpService.patch<IUserProfile>(`${this.usersBaseUrl}/users/${id}/profile`, dto, {
					timeout: 5000,
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'actualizar perfil de usuario');
		}
	}

	/**
	 * Devuelve el feed "Reciente" personalizado del usuario.
	 */
	async getRecentFeed(userId: string): Promise<IFeedPost[]> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<IFeedPost[]>(`${this.usersBaseUrl}/feed/recent/${userId}`, {
					timeout: 5000,
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'obtener feed reciente');
		}
	}

	/**
	 * Devuelve el feed personal del usuario autenticado.
	 */
	async getMyFeed(userId: string): Promise<IFeedPost[]> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<IFeedPost[]>(`${this.usersBaseUrl}/feed/user/${userId}`, {
					timeout: 5000,
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'obtener feed del usuario');
		}
	}

	/**
	 * Devuelve el feed de amigos del usuario autenticado.
	 */
	async getFriendsFeed(userId: string): Promise<IFeedPost[]> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<IFeedPost[]>(`${this.usersBaseUrl}/feed/friends/${userId}`, {
					timeout: 5000,
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'obtener feed de amigos');
		}
	}

	/**
	 * Devuelve el feed de "Tendencias" del usuario autenticado (sin incluir sus propios posts).
	 */
	async getTrendingFeed(userId: string): Promise<IFeedPost[]> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<IFeedPost[]>(`${this.usersBaseUrl}/feed/trending/${userId}`, {
					timeout: 5000,
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'obtener feed de tendencias');
		}
	}

	/**
	 * Devuelve el feed de posts guardados (favoritos) del usuario autenticado.
	 */
	async getFavoritesFeed(userId: string): Promise<IFeedPost[]> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<IFeedPost[]>(`${this.usersBaseUrl}/feed/favorites/${userId}`, {
					timeout: 5000,
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'obtener feed de favoritos');
		}
	}

	/**
	 * Alterna el estado de guardado de un post para el usuario autenticado.
	 */
	async toggleFavoritePost(userId: string, postId: string): Promise<boolean> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<{ saved: boolean }>(`${this.usersBaseUrl}/feed/favorites/${userId}`, { postId }, {
					timeout: 5000,
				}),
			);
			return response.data.saved;
		} catch (error) {
			this.handleHttpError(error, 'actualizar favorito');
		}
	}

	/**
	 * Crea una nueva publicacion para el usuario autenticado.
	 */
	async createPost(userId: string, dto: CreateFeedPostDto): Promise<IFeedPost> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<IFeedPost>(`${this.usersBaseUrl}/feed/user/${userId}`, dto, {
					timeout: 5000,
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'crear publicacion');
		}
	}

	/**
	 * Devuelve la lista de amigos del usuario autenticado.
	 */
	async getFriends(userId: string): Promise<IUserProfile[]> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<IUserProfile[]>(`${this.usersBaseUrl}/friends/${userId}`, {
					timeout: 5000,
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'obtener amigos del usuario');
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
