/**
 * Authentication controller of the gateway.
 * Proxies requests to the auth-service and keeps the frontend decoupled.
 *
 * Endpoints:
 * - POST /auth/register → Registers a new user
 * - POST /auth/login    → Logs in and obtains tokens
 * - POST /auth/refresh  → Renews the access token using the refresh token
 * - POST /auth/logout   → Logs out (revokes refresh token)
 * - POST /auth/validate → Validates an access token (internal gateway use)
 * - GET  /auth/42       → Starts the OAuth flow with 42 and returns the authorisation URL.
 * - GET  /auth/42/callback → OAuth 42 callback
 *
 * Security:
 * - Data validation with DTOs and NestJS pipes
 * - Error handling that does not reveal internal information
 * - Correct HTTP codes for each error type
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
	UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, AuthResponse } from '@intragram/shared';
import { PublicRateLimit } from '../../common/decorators/public-rate-limit.decorator';
import { PublicRateLimitGuard } from '../../common/guards/public-rate-limit.guard';

@Controller('auth')
export class AuthController {
	private readonly frontendUrl = process.env.FRONTEND_URL ?? 'https://zhvvqwnc-8443.uks1.devtunnels.ms/';

	constructor(private readonly authService: AuthService) {}

	/**
	 * POST /auth/register
	 * Sends the registration to the auth-service.
	 */
	@Post('register')
	@UseGuards(PublicRateLimitGuard)
	@PublicRateLimit(10, 60_000, 'auth:register')
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
	 * Sends the login to the auth-service.
	 */
	@Post('login')
	@UseGuards(PublicRateLimitGuard)
	@PublicRateLimit(12, 60_000, 'auth:login')
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
	 * Renews the access token in the auth-service.
	 */
	@Post('refresh')
	@UseGuards(PublicRateLimitGuard)
	@PublicRateLimit(60, 60_000, 'auth:refresh')
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
	 * Closes the current session.
	 */
	@Post('logout')
	@UseGuards(PublicRateLimitGuard)
	@PublicRateLimit(60, 60_000, 'auth:logout')
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
	 * Redirects to the 42 OAuth login.
	 */
	@Get('42/login')
	@UseGuards(PublicRateLimitGuard)
	@PublicRateLimit(30, 60_000, 'auth:42-login')
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
	 * Redirects to the 42 OAuth login.
	 */
	@Get('42')
	@UseGuards(PublicRateLimitGuard)
	@PublicRateLimit(30, 60_000, 'auth:42')
	async oauth42Login(@Res() res: any) {
		try {
			const { url } = await this.authService.getOAuth42AuthUrl();
			return res.redirect(url);
		} catch (error: any) {
			return res.redirect(`${this.frontendUrl}?error=oauth_init_failed`);
		}
	}
	/**
	 * GET /auth/42/callback
	 * Processes the OAuth callback and redirects to the frontend with the session.
	 */
	@Get('42/callback')
	@UseGuards(PublicRateLimitGuard)
	@PublicRateLimit(60, 60_000, 'auth:42-callback')
	@HttpCode(HttpStatus.FOUND)
	async oauth42Callback(
		@Query('code') code: string,
		@Query('error') oauthError: string,
		@Query('error_description') oauthErrorDescription: string,
		@Ip() ip: string,
		@Headers('user-agent') userAgent: string,
		@Res() res: any,
	) {
		if (!code) {
			if (oauthError) {
				const params = new URLSearchParams({
					error: oauthError,
				});

				if (oauthErrorDescription) {
					params.set('error_description', oauthErrorDescription);
				}

				return res.redirect(`${this.frontendUrl}?${params.toString()}`);
			}

			return res.redirect(`${this.frontendUrl}?error=no_code`);
		}

		try {
			const authResponse = await this.authService.handleOAuth42Callback(code, ip, userAgent);

			const redirectUrl = `${this.frontendUrl}?token=${authResponse.access_token}&user=${encodeURIComponent(JSON.stringify(authResponse.user))}`;
			return res.redirect(redirectUrl);
		} catch (error: any) {
			return res.redirect(`${this.frontendUrl}?error=auth_failed`);
		}
	}
}
