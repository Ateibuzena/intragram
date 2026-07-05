/**
 * Authentication Microservice Controller
 * Exposes HTTP endpoints for communication with the API Gateway
 *
 * Endpoints:
 * - POST /auth/register  → Register new users
 * - POST /auth/login     → Log in
 * - POST /auth/refresh   → Renew access token
 * - POST /auth/logout    → Log out (revoke refresh token)
 * - POST /auth/validate  → Validate access token (internal gateway use)
 * - GET  /health         → Health check for Docker
 *
 * Security:
 * - Captures IP and User-Agent for auditing
 * - Error handling that does not reveal internal information
 * - Correct HTTP codes for each error type
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
import { AuthService, ConflictError, UnauthorizedError, ForbiddenError } from './auth.service';
import { AuthResponse, LoginDto, RegisterDto, RefreshTokenDto, TokenValidationResult } from '@intragram/shared';

@Controller()
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	/**
	 * POST /auth/register
	 * Register a new user
	 */
	@Post('auth/register')
	@HttpCode(HttpStatus.CREATED)
	async register(
		@Body() registerDto: RegisterDto,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
	): Promise<AuthResponse> {
		try {
			return await this.authService.register(registerDto, ip, userAgent);
		} catch (error: unknown) {
			this.handleError(error);
		}
	}

	/**
	 * POST /auth/login
	 * Log in
	 */
	@Post('auth/login')
	@HttpCode(HttpStatus.OK)
	async login(
		@Body() loginDto: LoginDto,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
	): Promise<AuthResponse> {
		try {
			return await this.authService.login(loginDto, ip, userAgent);
		} catch (error: unknown) {
			this.handleError(error);
		}
	}

	/**
	 * POST /auth/refresh
	 * Renew access token using refresh token
	 */
	@Post('auth/refresh')
	@HttpCode(HttpStatus.OK)
	async refresh(
		@Body() refreshTokenDto: RefreshTokenDto,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
	): Promise<AuthResponse> {
		try {
			return await this.authService.refreshToken(
				refreshTokenDto.refresh_token,
				ip,
				userAgent,
			);
		} catch (error: unknown) {
			this.handleError(error);
		}
	}

	/**
	 * POST /auth/logout
	 * Log out (revoke refresh token)
	 */
	@Post('auth/logout')
	@HttpCode(HttpStatus.OK)
	async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ message: string }> {
		try {
			return await this.authService.logout(refreshTokenDto.refresh_token);
		} catch (error: unknown) {
			this.handleError(error);
		}
	}

	/**
	 * POST /auth/validate
	 * Validate an access token (internal gateway use)
	 * The gateway sends the token for verification before allowing access
	 */
	@Post('auth/validate')
	@HttpCode(HttpStatus.OK)
	async validateToken(@Body('access_token') accessToken: string): Promise<TokenValidationResult> {
		try {
			const payload = await this.authService.validateToken(accessToken);
			return {
				valid: true,
				payload,
			};
		} catch (error: unknown) {
			this.handleError(error);
		}
	}

	/**
	 * GET /auth/42
	 * Starts the OAuth flow with 42 and returns the authorisation URL.
	 */
	@Get('auth/42')
	oauth42Login(): { url: string } {
		try {
			return { url: this.authService.getOAuth42AuthUrl() };
		} catch (error: unknown) {
			this.handleError(error);
		}
	}

	/**
	 * GET /auth/42/callback
	 * OAuth 42 callback
	 */
	@Get('auth/42/callback')
	@HttpCode(HttpStatus.OK)
	async oauth42Callback(
		@Query('code') code: string,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
	): Promise<AuthResponse> {
		if (!code) {
			throw new HttpException(
				{ statusCode: HttpStatus.BAD_REQUEST, message: 'Código OAuth no proporcionado' },
				HttpStatus.BAD_REQUEST,
			);
		}

		try {
			return await this.authService.handleOAuth42Callback(code, ip, userAgent);
		} catch (error: unknown) {
			this.handleError(error);
		}
	}


	/**
	 * GET /health
	 * Health check for Docker and monitoring
	 */
	@Get('health')
	async health(): Promise<{ status: string }> {
		return this.authService.getHealth();
	}

	/**
	 * Centralised mapping of service errors to HTTP exceptions
	 * Does not reveal internal details to the client
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

		// Unexpected error: internal log and generic response to the client.
		console.error('Error interno no manejado:', error);
		throw new HttpException(
			{ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Error interno del servidor' },
			HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
}
