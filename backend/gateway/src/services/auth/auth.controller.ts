/**
 * Controlador de Autenticación
 * Define los endpoints del API Gateway relacionados con autenticación:
 * - POST /auth/register - Registro de nuevos usuarios
 * - POST /auth/login - Inicio de sesión
 * - POST /auth/refresh - Renovar token
 * - POST /auth/logout - Cierre de sesión
 * Delega las peticiones al microservicio de autenticación
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
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { IAuthResponse } from './interfaces/auth-service.interface';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) { }

	/**
	 * POST /auth/register
	 * Registrar un nuevo usuario
	 */
	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	async register(
		@Body() registerDto: RegisterDto,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
	): Promise<IAuthResponse> {
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
	 * Iniciar sesión
	 */
	@Post('login')
	@HttpCode(HttpStatus.OK)
	async login(
		@Body() loginDto: LoginDto,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
	): Promise<IAuthResponse> {
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
	 * Renovar access token
	 */
	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	async refresh(
		@Body('refresh_token') refreshToken: string,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
	): Promise<IAuthResponse> {
		try {
			return await this.authService.refreshToken(refreshToken, ip, userAgent);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al renovar token',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	/**
	 * POST /auth/logout
	 * Cerrar sesión
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
	 * Redirigir directamente al login de 42
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
 * Redirigir directamente a 42
 */
	@Get('42')
	async oauth42Login(@Res() res: any) {
		try {
			const { url } = await this.authService.getOAuth42AuthUrl();
			return res.redirect(url); // ← REDIRIGIR en vez de devolver JSON
		} catch (error: any) {
			return res.redirect('http://localhost:5173?error=oauth_init_failed');
		}
	}


	/**
	 * GET /auth/42/callback
	 * Callback de OAuth 42 - redirige al frontend con tokens
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
			// Redirigir al frontend con error
			return res.redirect('http://localhost:5173?error=no_code');
		}

		try {
			const authResponse = await this.authService.handleOAuth42Callback(code, ip, userAgent);

			// Redirigir al frontend con tokens
			const frontendUrl = `http://localhost:5173?token=${authResponse.access_token}&user=${encodeURIComponent(JSON.stringify(authResponse.user))}`;
			return res.redirect(frontendUrl);
		} catch (error: any) {
			// Redirigir al frontend con error
			return res.redirect('http://localhost:5173?error=auth_failed');
		}
	}

}
