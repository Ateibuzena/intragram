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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { IAuthResponse } from './interfaces/auth-service.interface';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

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
}
