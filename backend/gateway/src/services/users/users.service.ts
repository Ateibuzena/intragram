import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { SERVICE_URLS } from '../../config/microservices.config';
import { IUserProfile } from './interfaces/users-service.interface';
import { UpsertOAuth42UserDto } from './dto/upsert-oauth42-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Injectable()
export class UsersService {
	private readonly usersBaseUrl = SERVICE_URLS.users;

	constructor(private readonly httpService: HttpService) {}

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
