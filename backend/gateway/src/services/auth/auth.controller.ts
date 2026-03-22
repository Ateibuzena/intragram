/**
 * Controlador de autenticación del gateway.
 * Redirige las peticiones al auth-service y mantiene el frontend desacoplado.
 *
 * Endpoints:
 * - POST /auth/register → Registra un nuevo usuario
 * - POST /auth/login    → Inicia sesión y obtiene tokens
 * - POST /auth/refresh  → Renueva el access token usando el refresh token
 * - POST /auth/logout   → Cierra sesión (revoca refresh token)
 * - POST /auth/validate → Valida un access token (uso interno del gateway)
 * - GET  /auth/42       → Inicia el flujo OAuth con 42 y devuelve la URL de autorización.
 * - GET  /auth/42/callback → Callback de OAuth 42
 *
 * Seguridad:
 * - Validación de datos con DTOs y pipes de NestJS
 * - Manejo de errores que no revela información interna
 * - Códigos HTTP correctos para cada tipo de error
 */

import {
	Controller,
	Post,
	Body,
	Headers,
	Ip,
	HttpCode,
	HttpStatus,
	HttpException,
	Get,
	Query,
	Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, AuthResponse } from '@intragram/shared';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	/**
	 * POST /auth/register
	 * Envía el registro al auth-service.
	 */
	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	async register(
		@Body() registerDto: RegisterDto,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
	): Promise<AuthResponse> {
		try {
			return await this.authService.register(registerDto, ip, userAgent);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al registrar usuario',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * POST /auth/login
	 * Envía el login al auth-service.
	 */
	@Post('login')
	@HttpCode(HttpStatus.OK)
	async login(
		@Body() loginDto: LoginDto,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
	): Promise<AuthResponse> {
		try {
			return await this.authService.login(loginDto, ip, userAgent);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al iniciar sesión',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * POST /auth/refresh
	 * Renueva el access token en el auth-service.
	 */
	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	async refresh(
		@Body() refreshTokenDto: RefreshTokenDto,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
	): Promise<AuthResponse> {
		try {
			return await this.authService.refreshToken(refreshTokenDto.refresh_token, ip, userAgent);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al renovar token',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * POST /auth/logout
	 * Cierra la sesión actual.
	 */
	@Post('logout')
	@HttpCode(HttpStatus.OK)
	async logout(@Body('refresh_token') refreshToken: string) {
		try {
			return await this.authService.logout(refreshToken);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al cerrar sesión',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * GET /auth/42/login
	 * Redirige al login OAuth de 42.
	 */
	@Get('42/login')
	async oauth42Redirect(@Res() res: any) {
		try {
			const { url } = await this.authService.getOAuth42AuthUrl();
			return res.redirect(url);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al redirigir a OAuth 42',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * GET /auth/42
	 * Redirige al login OAuth de 42.
	 */
	@Get('42')
	async oauth42Login(@Res() res: any) {
		try {
			const { url } = await this.authService.getOAuth42AuthUrl();
			return res.redirect(url);
		} catch (error: any) {
			return res.redirect('http://localhost:5173?error=oauth_init_failed');
		}
	}
	/**
	 * GET /auth/42/callback
	 * Procesa el callback OAuth y redirige al frontend con la sesión.
	 */
	@Get('42/callback')
	@HttpCode(HttpStatus.FOUND)
	async oauth42Callback(
		@Query('code') code: string,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
		@Res() res: any,
	) {
		if (!code) {
			return res.redirect('http://localhost:5173?error=no_code');
		}

		try {
			const authResponse = await this.authService.handleOAuth42Callback(code, ip, userAgent);

			const frontendUrl = `http://localhost:5173?token=${authResponse.access_token}&user=${encodeURIComponent(JSON.stringify(authResponse.user))}`;
			return res.redirect(frontendUrl);
		} catch (error: any) {
			return res.redirect('http://localhost:5173?error=auth_failed');
		}
	}
}
