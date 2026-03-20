/**
 * Controlador del Microservicio de Autenticación
 * Expone endpoints HTTP para comunicación con el API Gateway
 * 
 * Endpoints:
 * - POST /auth/register  → Registro de nuevos usuarios
 * - POST /auth/login     → Inicio de sesión
 * - POST /auth/refresh   → Renovar access token
 * - POST /auth/logout    → Cerrar sesión (revocar refresh token)
 * - POST /auth/validate  → Validar access token (uso interno del gateway)
 * - GET  /health         → Health check para Docker
 * 
 * Seguridad:
 * - Captura IP y User-Agent para auditoría
 * - Manejo de errores que no revela información interna
 * - Códigos HTTP correctos para cada tipo de error
 */

import {
	Controller,
	Post,
	Body,
	Get,
	Headers,
	Ip,
	HttpCode,
	HttpStatus,
	HttpException,
	Query,
} from '@nestjs/common';
import { AuthService, ConflictError, UnauthorizedError, ForbiddenError, TokenPayload } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller()
export class AuthController {
	constructor(private readonly authService: AuthService) { }

	/**
	 * POST /auth/register
	 * Registrar un nuevo usuario
	 */
	@Post('auth/register')
	@HttpCode(HttpStatus.CREATED)
	async register(
		@Body() registerDto: RegisterDto,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
	) {
		try {
			return await this.authService.register(registerDto, ip, userAgent);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * POST /auth/login
	 * Iniciar sesión
	 */
	@Post('auth/login')
	@HttpCode(HttpStatus.OK)
	async login(
		@Body() loginDto: LoginDto,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
	) {
		try {
			return await this.authService.login(loginDto, ip, userAgent);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * POST /auth/refresh
	 * Renovar access token usando refresh token
	 */
	@Post('auth/refresh')
	@HttpCode(HttpStatus.OK)
	async refresh(
		@Body() refreshTokenDto: RefreshTokenDto,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
	) {
		try {
			return await this.authService.refreshToken(
				refreshTokenDto.refresh_token,
				ip,
				userAgent,
			);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * POST /auth/logout
	 * Cerrar sesión (revocar refresh token)
	 */
	@Post('auth/logout')
	@HttpCode(HttpStatus.OK)
	async logout(@Body() refreshTokenDto: RefreshTokenDto) {
		try {
			return await this.authService.logout(refreshTokenDto.refresh_token);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * POST /auth/validate
	 * Validar un access token (uso interno del gateway)
	 * El gateway envía el token para verificar antes de permitir acceso
	 */
	@Post('auth/validate')
	@HttpCode(HttpStatus.OK)
	async validateToken(@Body('access_token') accessToken: string): Promise<{ valid: boolean; payload: TokenPayload }> {
		try {
			const payload = await this.authService.validateToken(accessToken);
			return { valid: true, payload };
		} catch (error) {
			this.handleError(error);
		}
	}
	/**
 * GET /auth/42
 * Iniciar flujo OAuth con 42
 */
	@Get('auth/42')
	oauth42Login() {
		try {
			const authUrl = this.authService.getOAuth42AuthUrl();
			return { url: authUrl };
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * GET /auth/42/callback
	 * Callback de OAuth 42
	 */
	@Get('auth/42/callback')
	@HttpCode(HttpStatus.OK)
	async oauth42Callback(
		@Query('code') code: string,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
	) {
		if (!code) {
			throw new HttpException(
				{ statusCode: HttpStatus.BAD_REQUEST, message: 'Código OAuth no proporcionado' },
				HttpStatus.BAD_REQUEST,
			);
		}

		try {
			return await this.authService.handleOAuth42Callback(code, ip, userAgent);
		} catch (error) {
			this.handleError(error);
		}
	}


	/**
	 * GET /health
	 * Health check para Docker y monitoreo
	 */
	@Get('health')
	async health() {
		return this.authService.getHealth();
	}

	/**
	 * Mapeo centralizado de errores del servicio a HTTP exceptions
	 * No revela detalles internos al cliente
	 */
	private handleError(error: unknown): never {
		if (error instanceof ConflictError) {
			throw new HttpException(
				{ statusCode: HttpStatus.CONFLICT, message: error.message },
				HttpStatus.CONFLICT,
			);
		}
		if (error instanceof UnauthorizedError) {
			throw new HttpException(
				{ statusCode: HttpStatus.UNAUTHORIZED, message: error.message },
				HttpStatus.UNAUTHORIZED,
			);
		}
		if (error instanceof ForbiddenError) {
			throw new HttpException(
				{ statusCode: HttpStatus.FORBIDDEN, message: error.message },
				HttpStatus.FORBIDDEN,
			);
		}

		// Error inesperado - log interno, respuesta genérica
		console.error('Error interno no manejado:', error);
		throw new HttpException(
			{ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Error interno del servidor' },
			HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
}
