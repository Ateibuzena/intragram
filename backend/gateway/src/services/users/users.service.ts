/**
 * Servicio de Usuarios del Gateway
 * Reenvía operaciones al users-service y normaliza sus respuestas.
 */

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import {
	IUserProfile,
	IUserProject,
	IUserProjectsSyncResult,
	SyncOAuth42ProjectsDto,
	UpsertOAuth42UserDto,
	UpdateUserProfileDto,
} from '@intragram/shared/users';
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
	 * Lista los proyectos almacenados del usuario por id interno.
	 */
	async findProjectsByUserId(id: string): Promise<IUserProject[]> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<IUserProject[]>(`${this.usersBaseUrl}/users/${id}/projects`, {
					timeout: 5000,
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'obtener proyectos de usuario por id');
		}
	}

	/**
	 * Lista los proyectos almacenados del usuario por id de 42.
	 */
	async findProjectsBy42Id(fortyTwoId: number): Promise<IUserProject[]> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<IUserProject[]>(`${this.usersBaseUrl}/users/42/${fortyTwoId}/projects`, {
					timeout: 5000,
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'obtener proyectos de usuario por 42 id');
		}
	}

	/**
	 * Sincroniza los proyectos del usuario con los datos actuales de OAuth42.
	 */
	async syncProjects(id: string, dto: SyncOAuth42ProjectsDto): Promise<IUserProjectsSyncResult> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<IUserProjectsSyncResult>(`${this.usersBaseUrl}/users/${id}/projects/sync`, dto, {
					timeout: 10000,
				}),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'sincronizar proyectos de usuario');
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
