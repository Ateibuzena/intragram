/**
 * Authentication Service
 * Business logic for registration, login, tokens and security
 *
 * ═══════════════════════════════════════════════════
 *  IMPLEMENTED CYBERSECURITY MEASURES
 * ═══════════════════════════════════════════════════
 *
 * 1. PASSWORD HASHING
 *    - bcrypt with 12 salt rounds (resistant to brute force)
 *    - Password is never stored or returned in plain text
 *
 * 2. JWT TOKENS
 *    - Access token: short duration (15 min)
 *    - Refresh token: long duration (7 days), hashed in the DB
 *    - Refresh token rotation on each use
 *
 * 3. BRUTE FORCE PROTECTION
 *    - Failed attempt counter per user
 *    - Temporary account lockout after 5 failed attempts (15 min)
 *    - Generic error messages (do not reveal whether the user exists)
 *
 * 4. SQL INJECTION PREVENTION
 *    - TypeORM with parameterized queries
 *    - Strict DTO validation with class-validator
 *
 * 5. DATA SANITIZATION
 *    - Emails normalised to lowercase
 *    - Usernames normalised to lowercase
 *    - Property whitelist in DTOs
 *
 * 6. SESSION REVOCATION
 *    - Logout invalidates the refresh token
 *    - Ability to revoke all sessions of a user
 *
 * 7. AUDIT
 *    - IP and User-Agent recorded for each session
 *    - Last login date
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { UserEntity } from './entities/user.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { LoginDto, RegisterDto, AuthResponse, TokenPayload } from '@intragram/shared';
import { createHealthResponse, HealthResponse } from '@intragram/shared/health';
import axios from 'axios';

// ─── Security constants ─────────────────────────────
const BCRYPT_SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// Generic error messages (do not reveal system information)
const INVALID_CREDENTIALS_MSG = 'Credenciales inválidas';
const ACCOUNT_LOCKED_MSG = 'Cuenta bloqueada temporalmente. Inténtalo más tarde';
const USER_EXISTS_MSG = 'El nombre de usuario o email ya está en uso';



@Injectable()
export class AuthService implements OnModuleInit {
	private readonly jwtSecret: string;

	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepo: Repository<UserEntity>,
		@InjectRepository(RefreshTokenEntity)
		private readonly refreshTokenRepo: Repository<RefreshTokenEntity>,
	) {
		// JWT secret from environment variable (required in production)
		this.jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';

		if (process.env.NODE_ENV === 'production' && this.jwtSecret === 'dev-secret-change-in-production') {
			throw new Error('❌ JWT_SECRET debe estar configurado en producción');
		}
	}

	/**
	 * Startup log useful for validating sensitive configuration at runtime.
	 */
	async onModuleInit() {}

	// ═══════════════════════════════════════════════
	//  REGISTRATION
	// ═══════════════════════════════════════════════

	/**
	 * Register a new user
	 * - Normalises email and username to lowercase
	 * - Hashes the password with bcrypt
	 * - Generates access tokens
	 */
	async register(
		registerDto: RegisterDto,
		ip?: string,
		userAgent?: string,
	): Promise<AuthResponse> {
		const { username, email, password, display_name } = registerDto;

		// Normalise input data for consistent comparison and persistence.
		const normalizedUsername = username.toLowerCase().trim();
		const normalizedEmail = email.toLowerCase().trim();

		// Verify uniqueness by username or email before creating.
		const existingUser = await this.userRepo.findOne({
			where: [
				{ username: normalizedUsername },
				{ email: normalizedEmail },
			],
		});

		if (existingUser) {
			throw new ConflictError(USER_EXISTS_MSG);
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

		// Create user
		const user = this.userRepo.create({
			username: normalizedUsername,
			email: normalizedEmail,
			password: hashedPassword,
			display_name: display_name || normalizedUsername,
			is_active: true,
			failed_login_attempts: 0,
		});

		const savedUser = await this.userRepo.save(user);

		// Generate tokens
		return this.generateAuthResponse(savedUser, ip, userAgent);
	}

	// ═══════════════════════════════════════════════
	//  LOGIN
	// ═══════════════════════════════════════════════

	/**
	 * Authenticate user
	 * - Accepts login by username or email
	 * - Verifies account lockout
	 * - Validates password with bcrypt
	 * - Generates new tokens
	 */
	async login(
		loginDto: LoginDto,
		ip?: string,
		userAgent?: string,
	): Promise<AuthResponse> {
		const { identifier, password } = loginDto;
		const normalizedIdentifier = identifier.toLowerCase().trim();

		// Determine whether it is an email or a username
		const isEmail = normalizedIdentifier.includes('@');

		// Find user with password (select: false by default)
		const user = await this.userRepo
			.createQueryBuilder('user')
			.addSelect('user.password')
			.where(
				isEmail ? 'user.email = :identifier' : 'user.username = :identifier',
				{ identifier: normalizedIdentifier },
			)
			.getOne();

		// User not found - return generic error
		if (!user) {
			// Timing attack mitigation: always hash something
			await bcrypt.hash('dummy-password', BCRYPT_SALT_ROUNDS);
			throw new UnauthorizedError(INVALID_CREDENTIALS_MSG);
		}

		// Verify that the account is active
		if (!user.is_active) {
			throw new UnauthorizedError(INVALID_CREDENTIALS_MSG);
		}

		// Verify account lockout
		if (user.locked_until && user.locked_until > new Date()) {
			throw new ForbiddenError(ACCOUNT_LOCKED_MSG);
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			// Increment failed attempts
			await this.handleFailedLogin(user);
			throw new UnauthorizedError(INVALID_CREDENTIALS_MSG);
		}

		// Successful login: reset failed attempts
		await this.handleSuccessfulLogin(user);

		return this.generateAuthResponse(user, ip, userAgent);
	}

	// ═══════════════════════════════════════════════
	//  REFRESH TOKEN
	// ═══════════════════════════════════════════════

	/**
	 * Renew access token using refresh token
	 * - Verifies that the token exists and is not revoked
	 * - Verifies that it has not expired
	 * - Revokes the current token and generates a new one (rotation)
	 */
	async refreshToken(
		refreshToken: string,
		ip?: string,
		userAgent?: string,
	): Promise<AuthResponse> {
		// Hash the received token for comparison with the DB
		const tokenHash = this.hashToken(refreshToken);

		const storedToken = await this.refreshTokenRepo.findOne({
			where: { token_hash: tokenHash, is_revoked: false },
			relations: ['user'],
		});

		if (!storedToken) {
			throw new UnauthorizedError('Refresh token inválido');
		}

		// Verify expiration
		if (storedToken.expires_at < new Date()) {
			// Revoke expired token
			await this.refreshTokenRepo.update(storedToken.id, { is_revoked: true });
			throw new UnauthorizedError('Refresh token expirado');
		}

		// Verify that the user is still active
		if (!storedToken.user.is_active) {
			await this.refreshTokenRepo.update(storedToken.id, { is_revoked: true });
			throw new UnauthorizedError('Usuario desactivado');
		}

		// Revoke the current token (token rotation)
		await this.refreshTokenRepo.update(storedToken.id, { is_revoked: true });

		return this.generateAuthResponse(storedToken.user, ip, userAgent);
	}

	// ═══════════════════════════════════════════════
	//  LOGOUT
	// ═══════════════════════════════════════════════

	/**
	 * Log out - revokes the refresh token
	 */
	async logout(refreshToken: string): Promise<{ message: string }> {
		const tokenHash = this.hashToken(refreshToken);

		const result = await this.refreshTokenRepo.update(
			{ token_hash: tokenHash, is_revoked: false },
			{ is_revoked: true },
		);

		// Do not reveal whether the token existed or not
		return { message: 'Sesión cerrada correctamente' };
	}

	/**
	 * Close all sessions of a user
	 * Useful when unauthorised access is suspected
	 */
	async logoutAll(userId: string): Promise<{ message: string }> {
		await this.refreshTokenRepo.update(
			{ user_id: userId, is_revoked: false },
			{ is_revoked: true },
		);

		return { message: 'Todas las sesiones cerradas correctamente' };
	}

	// ═══════════════════════════════════════════════
	//  TOKEN VALIDATION
	// ═══════════════════════════════════════════════

	/**
	 * Validate a JWT access token
	 * Returns the decoded payload or an error
	 */
	async validateToken(token: string): Promise<TokenPayload> {
		try {
			const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;

			// Verify that the user still exists and is active
			const user = await this.userRepo.findOne({
				where: { id: payload.sub, is_active: true },
			});

			if (!user) {
				throw new UnauthorizedError('Token inválido: usuario no encontrado');
			}

			return payload;
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				throw new UnauthorizedError('Token expirado');
			}
			if (error instanceof jwt.JsonWebTokenError) {
				throw new UnauthorizedError('Token inválido');
			}
			throw error;
		}
	}

	// ═══════════════════════════════════════════════
	//  HEALTH CHECK
	// ═══════════════════════════════════════════════

	async getHealth(): Promise<HealthResponse> {
		return createHealthResponse('auth');
	}

	// ═══════════════════════════════════════════════
	//  PRIVATE METHODS
	// ═══════════════════════════════════════════════

	/**
	 * Generate authentication response with access + refresh tokens
	 */
	private async generateAuthResponse(
		user: UserEntity,
		ip?: string,
		userAgent?: string,
	): Promise<AuthResponse> {
		const chatUserId = await this.resolveChatUserId(user);

		// Generate JWT access token
		const payload: TokenPayload = {
			sub: user.id,
			chat_user_id: chatUserId ?? user.id,
			username: user.username,
			email: user.email,
		};

		const accessToken = jwt.sign(payload, this.jwtSecret, {
			expiresIn: ACCESS_TOKEN_EXPIRY,
		});

		// Generate refresh token (random + hash for DB)
		const refreshToken = crypto.randomBytes(64).toString('hex');
		const tokenHash = this.hashToken(refreshToken);

		// Calculate expiration date
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

		// Save refresh token in DB
		const refreshTokenEntity = this.refreshTokenRepo.create({
			token_hash: tokenHash,
			user_id: user.id,
			expires_at: expiresAt,
			is_revoked: false,
			user_agent: userAgent || null,
			ip_address: ip || null,
		});

		await this.refreshTokenRepo.save(refreshTokenEntity);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
			token_type: 'Bearer',
			expires_in: 900, // 15 minutes in seconds
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				display_name: user.display_name,
			},
		};
	}

	/**
	 * Handle failed login
	 * Increments the counter and locks the account if the limit is exceeded
	 */
	private async handleFailedLogin(user: UserEntity): Promise<void> {
		const attempts = user.failed_login_attempts + 1;

		const updateData: Partial<UserEntity> = {
			failed_login_attempts: attempts,
		};

		// Lock account if the maximum number of attempts is exceeded
		if (attempts >= MAX_FAILED_ATTEMPTS) {
			const lockUntil = new Date();
			lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
			updateData.locked_until = lockUntil;
		}

		await this.userRepo.update(user.id, updateData);
	}

	/**
	 * Handle successful login
	 * Resets the failed attempt counter
	 */
	private async handleSuccessfulLogin(user: UserEntity): Promise<void> {
		await this.userRepo.update(user.id, {
			failed_login_attempts: 0,
			locked_until: null,
			last_login: new Date(),
		});
	}

	/**
	 * Hash token with SHA-256 for secure storage
	 */
	private hashToken(token: string): string {
		return crypto.createHash('sha256').update(token).digest('hex');
	}

	/**
	 * Resolves the profile id from the users-service to use as the chat identity.
	 * If not stored in auth, attempts to retrieve it by login and persists the mapping.
	 */
	private async resolveChatUserId(user: UserEntity): Promise<string | null> {
		if (user.user_profile_id) {
			return user.user_profile_id;
		}

		try {
			const usersServiceUrl = process.env.USERS_SERVICE_URL || 'http://users-service:3006';
			const response = await axios.get(`${usersServiceUrl}/users/login/${encodeURIComponent(user.username)}`, {
				timeout: 5000,
			});

			const profileId = response.data?.id as string | undefined;
			if (profileId) {
				user.user_profile_id = profileId;
				await this.userRepo.update(user.id, { user_profile_id: profileId });
				return profileId;
			}
		} catch {
			// Maintain compatibility: if users-service fails, we continue with user.id.
		}

		return null;
	}

	/**
	 * Deletes expired or revoked refresh tokens.
	 *
	 * This is a maintenance routine that can be run from a cron job.
	 */
	async cleanupExpiredTokens(): Promise<number> {
		const result = await this.refreshTokenRepo
			.createQueryBuilder()
			.delete()
			.where('expires_at < :now', { now: new Date() })
			.orWhere('is_revoked = :revoked', { revoked: true })
			.execute();

		const deleted = result.affected || 0;
		return deleted;
	}
	// ═══════════════════════════════════════════════
	//  OAUTH 42
	// ═══════════════════════════════════════════════

	/**
	 * Builds the 42 authorisation URL to start the OAuth flow.
	 *
	 * Does no I/O; only assembles the URL from environment variables.
	 */
	getOAuth42AuthUrl(): string {
		const clientId = process.env.OAUTH_42_CLIENT_ID;
		const redirectUri = process.env.OAUTH_42_REDIRECT_URI || 'http://localhost:3000/auth/42/callback';

		if (!clientId) {
			throw new Error('OAUTH_42_CLIENT_ID no configurado');
		}

		return `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=public`;
	}

	/**
	 * Processes the OAuth 42 callback and transforms the external login into an own session.
	 *
	 * Flow:
	 * 1. Exchanges the code for a 42 access token.
	 * 2. Queries the remote user profile.
	 * 3. Syncs the local profile in users-service.
	 * 4. Issues our own JWT tokens.
	 */
	async handleOAuth42Callback(
		code: string,
		ip?: string,
		userAgent?: string,
	): Promise<AuthResponse> {
		try {
			// Step 1: exchange the code for a 42 access token.
			const tokenResponse = await axios.post('https://api.intra.42.fr/oauth/token', {
				grant_type: 'authorization_code',
				client_id: process.env.OAUTH_42_CLIENT_ID,
				client_secret: process.env.OAUTH_42_CLIENT_SECRET,
				code,
				redirect_uri: process.env.OAUTH_42_REDIRECT_URI,
			});

			const { access_token } = tokenResponse.data;

			// Step 2: fetch the profile of the authenticated user on 42.
			const userResponse = await axios.get('https://api.intra.42.fr/v2/me', {
				headers: { Authorization: `Bearer ${access_token}` },
			});

			const user42 = userResponse.data as any;

			// Step 2b: extract profile stats for persistence.
			let skills: any[] = [];
			let levels: any[] = [];
			let dashesUsers: any[] = [];
			let titles: any[] = [];
			let projectsUsers: any[] = [];

			// We only use data from the main cursus (id 21) for the ProfilePage.
			if (Array.isArray(user42.cursus_users) && user42.cursus_users.length > 0) {
				const cursus21 = user42.cursus_users.find(
					(cursusUser: any) => cursusUser?.cursus_id === 21 || cursusUser?.cursus?.slug === '42cursus',
				);

				if (cursus21) {
					if (typeof cursus21.level === 'number') {
						levels = [
							{
								id: cursus21.cursus_id || 21,
								name: cursus21.cursus?.name || '42cursus',
								level: cursus21.level,
							},
						];
					}

					if (Array.isArray(cursus21.skills)) {
						skills = cursus21.skills.map((skill: any) => ({
							id: skill.id,
							name: skill.name,
							level: skill.level,
						}));
					}
				}
			}

			if (Array.isArray(user42.titles)) {
				const selectedTitleIds = new Set(
					Array.isArray(user42.titles_users)
						? user42.titles_users
							.filter((titleUser: any) => titleUser?.selected)
							.map((titleUser: any) => String(titleUser?.title_id))
						: [],
				);

				titles = user42.titles
					.filter((title: any) => title && title.id && title.name)
					.map((title: any) => ({ id: title.id, name: title.name, selected: selectedTitleIds.has(String(title.id)) }));
			}

			if (Array.isArray(user42.projects_users)) {
				projectsUsers = user42.projects_users
					.filter((projectUser: any) => Array.isArray(projectUser?.cursus_ids) && projectUser.cursus_ids.includes(21))
					.map((projectUser: any) => ({
						id: projectUser.id,
						name: projectUser?.project?.name || 'Unnamed project',
						status: projectUser.status || 'unknown',
						final_mark: projectUser.final_mark,
					}));
			}

			// Check for dashes in user42
			if (Array.isArray(user42.dashes_users)) {
				dashesUsers = user42.dashes_users;
			}

			// Step 3: map only the fields allowed by UpsertOAuth42UserDto
			// and sync the local profile in users-service.
			const upsertPayload = {
				id: user42.id,
				login: user42.login,
				email: user42.email,
				first_name: user42.first_name,
				last_name: user42.last_name,
				displayname: user42.displayname,
				usual_full_name: user42.usual_full_name,
				pool_month: user42.pool_month,
				pool_year: user42.pool_year,
				wallet: user42.wallet,
				correction_point: user42.correction_point,
				location: user42.location,
				phone: user42.phone,
				staff: user42['staff?'] ?? user42.staff,
				alumni: user42['alumni?'] ?? user42.alumni,
				active: user42['active?'] ?? user42.active,
				skills,
				levels,
				titles,
				projects_users: projectsUsers,
				dashes_users: dashesUsers,
				image: user42.image
					? {
						link: user42.image.link,
						versions: user42.image.versions
							? {
								large: user42.image.versions.large,
								medium: user42.image.versions.medium,
								small: user42.image.versions.small,
								micro: user42.image.versions.micro,
							}
							: undefined,
					}
					: undefined,
				campus: Array.isArray(user42.campus)
					? user42.campus.map((c: any) => ({ name: c.name }))
					: undefined,
			};

			const usersServiceUrl = process.env.USERS_SERVICE_URL || 'http://users-service:3006';
			const upsertResponse = await axios.post(
				`${usersServiceUrl}/users/oauth/42/upsert`,
				upsertPayload,
				{ timeout: 10000 },
			);

			const profile = upsertResponse.data;

			// Normalise identifiers for the internal user of the auth-service.
			const normalizedUsername = (profile.login || user42.login || '').toLowerCase().trim();
			const normalizedEmail = (profile.email || user42.email || `${user42.login}@intra.42`).toLowerCase().trim();
			const displayName = profile.display_name || user42.usual_full_name || user42.login;

			// Step 4: find or create the internal user in the auth-service DB.
			let authUser = await this.userRepo.findOne({
				where: [
					{ username: normalizedUsername },
					{ email: normalizedEmail },
				],
			});

			if (!authUser) {
				// New user authenticated only via OAuth42: we create internal credentials
				// with a random password (not used directly by the user).
				const randomPassword = crypto.randomBytes(32).toString('hex');
				const hashedPassword = await bcrypt.hash(randomPassword, BCRYPT_SALT_ROUNDS);

				authUser = this.userRepo.create({
					username: normalizedUsername,
					email: normalizedEmail,
					password: hashedPassword,
					display_name: displayName,
					user_profile_id: profile.id,
					is_active: true,
					failed_login_attempts: 0,
				});
			} else {
				// Existing user: sync some basic fields.
				authUser.display_name = displayName;
				authUser.user_profile_id = profile.id;
				authUser.is_active = true;
			}

			authUser.last_login = new Date();
			const savedAuthUser = await this.userRepo.save(authUser);

			// Step 5: generate the system's own tokens.
			return this.generateAuthResponse(savedAuthUser, ip, userAgent);
		} catch (error: any) {
			throw new UnauthorizedError('Error al autenticar con 42');
		}
	}

}

// ═══════════════════════════════════════════════
//  Typed errors for the controller
// ═══════════════════════════════════════════════

export class ConflictError extends Error {
	readonly statusCode = 409;
	constructor(message: string) {
		super(message);
		this.name = 'ConflictError';
	}
}

export class UnauthorizedError extends Error {
	readonly statusCode = 401;
	constructor(message: string) {
		super(message);
		this.name = 'UnauthorizedError';
	}
}

export class ForbiddenError extends Error {
	readonly statusCode = 403;
	constructor(message: string) {
		super(message);
		this.name = 'ForbiddenError';
	}
}
