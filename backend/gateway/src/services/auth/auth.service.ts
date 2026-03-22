/**
 * Servicio de Autenticación del Gateway
 * Maneja la comunicación entre el gateway y el microservicio de autenticación
 * Implementa la lógica de proxy para:
 * - Validación de credenciales
 * - Generación de tokens JWT
 * - Gestión de sesiones de usuario
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
	 * Registrar un nuevo usuario
	 * Reenvía la petición al microservicio de autenticación
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
	 * Iniciar sesión
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
	 * Renovar access token con refresh token
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
	 * Cerrar sesión
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
	 * Validar un access token (para uso interno - guards)
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
	 * Obtener URL de autorización OAuth 42
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
	 * Manejar callback de OAuth 42
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
	 * Manejo centralizado de errores HTTP
	 * Re-lanza el error del microservicio preservando el status code
	 */
	private handleHttpError(error: unknown, action: string): never {
		const axiosError = error as AxiosError<{ statusCode?: number; message?: string }>;

		// Si el microservicio respondió con un error, preservar su status y mensaje
		if (axiosError.response?.data) {
			const { statusCode, message } = axiosError.response.data;
			throw Object.assign(new Error(message || `Error al ${action}`), {
				statusCode: statusCode || axiosError.response.status,
			});
		}

		// Error de conexión
		throw Object.assign(
			new Error(`Error de conexión al ${action} en auth-service: ${axiosError.message}`),
			{ statusCode: 503 },
		);
	}
}
