/**
 * Servicio de autenticación del gateway.
 * Reenvía operaciones al auth-service y normaliza sus respuestas.
 */

import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { SERVICE_URLS } from '../../config/microservices.config';
import { LoginDto, RegisterDto, AuthResponse, TokenValidationResult } from '@intragram/shared';
import { GatewayHttpClientService } from '../../common/http/gateway-http.client';

@Injectable()
export class AuthService {
	private readonly authBaseUrl = SERVICE_URLS.auth;

	constructor(private readonly httpClient: GatewayHttpClientService) {}

	/**
	 * Reenvía el registro al auth-service.
	 */
	async register(registerDto: RegisterDto, ip?: string, userAgent?: string): Promise<AuthResponse> {
		try {
			return await this.httpClient.post<AuthResponse, RegisterDto>(
				`${this.authBaseUrl}/auth/register`,
				registerDto,
				{
					timeoutMs: 10000,
					headers: {
						'X-Forwarded-For': ip || '',
						'X-Original-User-Agent': userAgent || '',
					},
				},
			);
		} catch (error) {
			this.handleHttpError(error, 'registrar usuario');
		}
	}

	/**
	 * Reenvía el login al auth-service.
	 */
	async login(loginDto: LoginDto, ip?: string, userAgent?: string): Promise<AuthResponse> {
		try {
			return await this.httpClient.post<AuthResponse, LoginDto>(
				`${this.authBaseUrl}/auth/login`,
				loginDto,
				{
					timeoutMs: 10000,
					headers: {
						'X-Forwarded-For': ip || '',
						'X-Original-User-Agent': userAgent || '',
					},
				},
			);
		} catch (error) {
			this.handleHttpError(error, 'iniciar sesión');
		}
	}

	/**
	 * Reenvía la renovación de tokens al auth-service.
	 */
	async refreshToken(refreshToken: string, ip?: string, userAgent?: string): Promise<AuthResponse> {
		try {
			return await this.httpClient.post<AuthResponse, { refresh_token: string }>(
				`${this.authBaseUrl}/auth/refresh`,
				{ refresh_token: refreshToken },
				{
					timeoutMs: 10000,
					headers: {
						'X-Forwarded-For': ip || '',
						'X-Original-User-Agent': userAgent || '',
					},
				},
			);
		} catch (error) {
			this.handleHttpError(error, 'renovar token');
		}
	}

	/**
	 * Reenvía el logout al auth-service.
	 */
	async logout(refreshToken: string): Promise<{ message: string }> {
		try {
			return await this.httpClient.post<{ message: string }, { refresh_token: string }>(
				`${this.authBaseUrl}/auth/logout`,
				{ refresh_token: refreshToken },
				{ timeoutMs: 5000 },
			);
		} catch (error) {
			this.handleHttpError(error, 'cerrar sesión');
		}
	}

	/**
	 * Valida un access token para uso interno del gateway.
	 */
	async validateToken(accessToken: string): Promise<TokenValidationResult> {
		try {
			return await this.httpClient.post<TokenValidationResult, { access_token: string }>(
				`${this.authBaseUrl}/auth/validate`,
				{ access_token: accessToken },
				{ timeoutMs: 5000 },
			);
		} catch (error) {
			this.handleHttpError(error, 'validar token');
		}
	}
	
	/**
	 * Obtiene la URL de autorización OAuth 42.
	 */
	async getOAuth42AuthUrl(): Promise<{ url: string }> {
		try {
			return await this.httpClient.get<{ url: string }>(`${this.authBaseUrl}/auth/42`, { timeoutMs: 5000 });
		} catch (error) {
			this.handleHttpError(error, 'obtener URL de OAuth 42');
		}
	}

	/**
	 * Procesa el callback OAuth de 42.
	 */
	async handleOAuth42Callback(code: string, ip?: string, userAgent?: string): Promise<AuthResponse> {
		try {
			return await this.httpClient.get<AuthResponse>(`${this.authBaseUrl}/auth/42/callback`, {
				params: { code },
				timeoutMs: 15000,
				headers: {
					'X-Forwarded-For': ip || '',
					'X-Original-User-Agent': userAgent || '',
				},
			});
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
