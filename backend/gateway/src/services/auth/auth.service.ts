/**
 * Servicio de autenticación del gateway.
 * Reenvía operaciones al auth-service y normaliza sus respuestas.
 */

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { SERVICE_URLS } from '../../config/microservices.config';
import { LoginDto, RegisterDto, AuthResponse, TokenValidationResult } from '@intragram/shared';

@Injectable()
export class AuthService {
	private readonly authBaseUrl = SERVICE_URLS.auth;

	constructor(private readonly httpService: HttpService) {}

	/**
	 * Reenvía el registro al auth-service.
	 */
	async register(registerDto: RegisterDto, ip?: string, userAgent?: string): Promise<AuthResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<AuthResponse>(
					`${this.authBaseUrl}/auth/register`,
					registerDto,
					{
						timeout: 10000,
						headers: {
							'X-Forwarded-For': ip || '',
							'X-Original-User-Agent': userAgent || '',
						},
					},
				),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'registrar usuario');
		}
	}

	/**
	 * Reenvía el login al auth-service.
	 */
	async login(loginDto: LoginDto, ip?: string, userAgent?: string): Promise<AuthResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<AuthResponse>(
					`${this.authBaseUrl}/auth/login`,
					loginDto,
					{
						timeout: 10000,
						headers: {
							'X-Forwarded-For': ip || '',
							'X-Original-User-Agent': userAgent || '',
						},
					},
				),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'iniciar sesión');
		}
	}

	/**
	 * Reenvía la renovación de tokens al auth-service.
	 */
	async refreshToken(refreshToken: string, ip?: string, userAgent?: string): Promise<AuthResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<AuthResponse>(
					`${this.authBaseUrl}/auth/refresh`,
					{ refresh_token: refreshToken },
					{
						timeout: 10000,
						headers: {
							'X-Forwarded-For': ip || '',
							'X-Original-User-Agent': userAgent || '',
						},
					},
				),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'renovar token');
		}
	}

	/**
	 * Reenvía el logout al auth-service.
	 */
	async logout(refreshToken: string): Promise<{ message: string }> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<{ message: string }>(
					`${this.authBaseUrl}/auth/logout`,
					{ refresh_token: refreshToken },
					{ timeout: 5000 },
				),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'cerrar sesión');
		}
	}

	/**
	 * Valida un access token para uso interno del gateway.
	 */
	async validateToken(accessToken: string): Promise<TokenValidationResult> {
		try {
			const response = await firstValueFrom(
				this.httpService.post<TokenValidationResult>(
					`${this.authBaseUrl}/auth/validate`,
					{ access_token: accessToken },
					{ timeout: 5000 },
				),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'validar token');
		}
	}
	
	/**
	 * Obtiene la URL de autorización OAuth 42.
	 */
	async getOAuth42AuthUrl(): Promise<{ url: string }> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<{ url: string }>(
					`${this.authBaseUrl}/auth/42`,
					{ timeout: 5000 },
				),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'obtener URL de OAuth 42');
		}
	}

	/**
	 * Procesa el callback OAuth de 42.
	 */
	async handleOAuth42Callback(code: string, ip?: string, userAgent?: string): Promise<AuthResponse> {
		try {
			const response = await firstValueFrom(
				this.httpService.get<AuthResponse>(
					`${this.authBaseUrl}/auth/42/callback`,
					{
						params: { code },
						timeout: 15000,
						headers: {
							'X-Forwarded-For': ip || '',
							'X-Original-User-Agent': userAgent || '',
						},
					},
				),
			);
			return response.data;
		} catch (error) {
			this.handleHttpError(error, 'procesar callback de OAuth 42');
		}
	}


	/**
	 * Normaliza errores HTTP del auth-service.
	 */
	private handleHttpError(error: unknown, action: string): never {
		const axiosError = error as AxiosError<{ statusCode?: number; message?: string }>;

		// Si el microservicio respondió con un error, preserva su status y mensaje.
		if (axiosError.response?.data) {
			const { statusCode, message } = axiosError.response.data;
			throw Object.assign(new Error(message || `Error al ${action}`), {
				statusCode: statusCode || axiosError.response.status,
			});
		}

		// Error de conexión.
		throw Object.assign(
			new Error(`Error de conexión al ${action} en auth-service: ${axiosError.message}`),
			{ statusCode: 503 },
		);
	}
}
