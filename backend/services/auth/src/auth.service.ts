/**
 * Servicio de Autenticación
 * Lógica de negocio para registro, login, tokens y seguridad
 * 
 * ═══════════════════════════════════════════════════
 *  MEDIDAS DE CIBERSEGURIDAD IMPLEMENTADAS
 * ═══════════════════════════════════════════════════
 * 
 * 1. HASHING DE CONTRASEÑAS
 *    - bcrypt con 12 salt rounds (resistente a brute force)
 *    - Nunca se almacena ni devuelve la contraseña en texto plano
 * 
 * 2. TOKENS JWT
 *    - Access token: corta duración (15 min)
 *    - Refresh token: larga duración (7 días), hasheado en BBDD
 *    - Rotación de refresh tokens en cada uso
 * 
 * 3. PROTECCIÓN CONTRA BRUTE FORCE
 *    - Contador de intentos fallidos por usuario
 *    - Bloqueo temporal de cuenta tras 5 intentos fallidos (15 min)
 *    - Mensajes de error genéricos (no revelan si el usuario existe)
 * 
 * 4. PREVENCIÓN DE INYECCIÓN SQL
 *    - TypeORM con queries parametrizadas
 *    - Validación estricta de DTOs con class-validator
 * 
 * 5. SANITIZACIÓN DE DATOS
 *    - Emails normalizados a lowercase
 *    - Usernames normalizados a lowercase
 *    - Whitelist de propiedades en DTOs
 * 
 * 6. REVOCACIÓN DE SESIONES
 *    - Logout invalida el refresh token
 *    - Posibilidad de revocar todas las sesiones de un usuario
 * 
 * 7. AUDITORÍA
 *    - Registro de IP y User-Agent en cada sesión
 *    - Fecha de último login
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { UserEntity } from './entities/user.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// ─── Constantes de seguridad ───────────────────────
const BCRYPT_SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// Mensajes de error genéricos (no revelan información del sistema)
const INVALID_CREDENTIALS_MSG = 'Credenciales inválidas';
const ACCOUNT_LOCKED_MSG = 'Cuenta bloqueada temporalmente. Inténtalo más tarde';
const USER_EXISTS_MSG = 'El nombre de usuario o email ya está en uso';

interface TokenPayload {
	sub: string;    // user id
	username: string;
	email: string;
	iat?: number;
	exp?: number;
}

export interface AuthResponse {
	access_token: string;
	refresh_token: string;
	token_type: string;
	expires_in: number;
	user: {
		id: string;
		username: string;
		email: string;
		display_name: string | null;
	};
}

@Injectable()
export class AuthService implements OnModuleInit {
	private readonly jwtSecret: string;

	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepo: Repository<UserEntity>,
		@InjectRepository(RefreshTokenEntity)
		private readonly refreshTokenRepo: Repository<RefreshTokenEntity>,
	) {
		// JWT secret desde variable de entorno (obligatorio en producción)
		this.jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';

		if (process.env.NODE_ENV === 'production' && this.jwtSecret === 'dev-secret-change-in-production') {
			throw new Error('❌ JWT_SECRET debe estar configurado en producción');
		}
	}

	async onModuleInit() {
		console.log('🔐 AuthService inicializado correctamente');
		console.log(`📊 Configuración: bcrypt rounds=${BCRYPT_SALT_ROUNDS}, access_token=${ACCESS_TOKEN_EXPIRY}, refresh_token=${REFRESH_TOKEN_EXPIRY_DAYS}d`);
	}

	// ═══════════════════════════════════════════════
	//  REGISTRO
	// ═══════════════════════════════════════════════

	/**
	 * Registrar un nuevo usuario
	 * - Normaliza email y username a lowercase
	 * - Hashea la contraseña con bcrypt
	 * - Genera tokens de acceso
	 */
	async register(
		registerDto: RegisterDto,
		ip?: string,
		userAgent?: string,
	): Promise<AuthResponse> {
		const { username, email, password, display_name } = registerDto;

		// Normalizar datos
		const normalizedUsername = username.toLowerCase().trim();
		const normalizedEmail = email.toLowerCase().trim();

		// Verificar si el usuario ya existe (username o email)
		const existingUser = await this.userRepo.findOne({
			where: [
				{ username: normalizedUsername },
				{ email: normalizedEmail },
			],
		});

		if (existingUser) {
			throw new ConflictError(USER_EXISTS_MSG);
		}

		// Hashear contraseña
		const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

		// Crear usuario
		const user = this.userRepo.create({
			username: normalizedUsername,
			email: normalizedEmail,
			password: hashedPassword,
			display_name: display_name || normalizedUsername,
			is_active: true,
			failed_login_attempts: 0,
		});

		const savedUser = await this.userRepo.save(user);
		console.log(`✅ Usuario registrado: ${savedUser.username} (${savedUser.id})`);

		// Generar tokens
		return this.generateAuthResponse(savedUser, ip, userAgent);
	}

	// ═══════════════════════════════════════════════
	//  LOGIN
	// ═══════════════════════════════════════════════

	/**
	 * Autenticar usuario
	 * - Acepta login por username o email
	 * - Verifica bloqueo de cuenta
	 * - Valida contraseña con bcrypt
	 * - Genera nuevos tokens
	 */
	async login(
		loginDto: LoginDto,
		ip?: string,
		userAgent?: string,
	): Promise<AuthResponse> {
		const { identifier, password } = loginDto;
		const normalizedIdentifier = identifier.toLowerCase().trim();

		// Determinar si es email o username
		const isEmail = normalizedIdentifier.includes('@');

		// Buscar usuario con password (select: false by default)
		const user = await this.userRepo
			.createQueryBuilder('user')
			.addSelect('user.password')
			.where(
				isEmail ? 'user.email = :identifier' : 'user.username = :identifier',
				{ identifier: normalizedIdentifier },
			)
			.getOne();

		// Usuario no encontrado - devolver error genérico
		if (!user) {
			// Timing attack mitigation: siempre hashear algo
			await bcrypt.hash('dummy-password', BCRYPT_SALT_ROUNDS);
			throw new UnauthorizedError(INVALID_CREDENTIALS_MSG);
		}

		// Verificar si la cuenta está activa
		if (!user.is_active) {
			throw new UnauthorizedError(INVALID_CREDENTIALS_MSG);
		}

		// Verificar bloqueo de cuenta
		if (user.locked_until && user.locked_until > new Date()) {
			throw new ForbiddenError(ACCOUNT_LOCKED_MSG);
		}

		// Verificar contraseña
		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			// Incrementar intentos fallidos
			await this.handleFailedLogin(user);
			throw new UnauthorizedError(INVALID_CREDENTIALS_MSG);
		}

		// Login exitoso: resetear intentos fallidos
		await this.handleSuccessfulLogin(user);

		console.log(`✅ Login exitoso: ${user.username} (${user.id})`);

		return this.generateAuthResponse(user, ip, userAgent);
	}

	// ═══════════════════════════════════════════════
	//  REFRESH TOKEN
	// ═══════════════════════════════════════════════

	/**
	 * Renovar access token usando refresh token
	 * - Verifica que el token existe y no está revocado
	 * - Verifica que no ha expirado
	 * - Revoca el token actual y genera uno nuevo (rotación)
	 */
	async refreshToken(
		refreshToken: string,
		ip?: string,
		userAgent?: string,
	): Promise<AuthResponse> {
		// Hashear el token recibido para comparar con la BBDD
		const tokenHash = this.hashToken(refreshToken);

		const storedToken = await this.refreshTokenRepo.findOne({
			where: { token_hash: tokenHash, is_revoked: false },
			relations: ['user'],
		});

		if (!storedToken) {
			throw new UnauthorizedError('Refresh token inválido');
		}

		// Verificar expiración
		if (storedToken.expires_at < new Date()) {
			// Revocar token expirado
			await this.refreshTokenRepo.update(storedToken.id, { is_revoked: true });
			throw new UnauthorizedError('Refresh token expirado');
		}

		// Verificar que el usuario sigue activo
		if (!storedToken.user.is_active) {
			await this.refreshTokenRepo.update(storedToken.id, { is_revoked: true });
			throw new UnauthorizedError('Usuario desactivado');
		}

		// Revocar el token actual (rotación de tokens)
		await this.refreshTokenRepo.update(storedToken.id, { is_revoked: true });

		console.log(`🔄 Token renovado para: ${storedToken.user.username}`);

		return this.generateAuthResponse(storedToken.user, ip, userAgent);
	}

	// ═══════════════════════════════════════════════
	//  LOGOUT
	// ═══════════════════════════════════════════════

	/**
	 * Cerrar sesión - revoca el refresh token
	 */
	async logout(refreshToken: string): Promise<{ message: string }> {
		const tokenHash = this.hashToken(refreshToken);

		const result = await this.refreshTokenRepo.update(
			{ token_hash: tokenHash, is_revoked: false },
			{ is_revoked: true },
		);

		// No revelar si el token existía o no
		return { message: 'Sesión cerrada correctamente' };
	}

	/**
	 * Cerrar todas las sesiones de un usuario
	 * Útil cuando se sospecha de acceso no autorizado
	 */
	async logoutAll(userId: string): Promise<{ message: string }> {
		await this.refreshTokenRepo.update(
			{ user_id: userId, is_revoked: false },
			{ is_revoked: true },
		);

		console.log(`🔒 Todas las sesiones revocadas para usuario: ${userId}`);
		return { message: 'Todas las sesiones cerradas correctamente' };
	}

	// ═══════════════════════════════════════════════
	//  VALIDACIÓN DE TOKEN
	// ═══════════════════════════════════════════════

	/**
	 * Validar un access token JWT
	 * Devuelve el payload decodificado o un error
	 */
	async validateToken(token: string): Promise<TokenPayload> {
		try {
			const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;

			// Verificar que el usuario sigue existiendo y activo
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

	async getHealth(): Promise<{ status: string; database: string; timestamp: string }> {
		try {
			// Verificar conexión a la BBDD
			await this.userRepo.query('SELECT 1');
			return {
				status: 'ok',
				database: 'connected',
				timestamp: new Date().toISOString(),
			};
		} catch {
			return {
				status: 'error',
				database: 'disconnected',
				timestamp: new Date().toISOString(),
			};
		}
	}

	// ═══════════════════════════════════════════════
	//  MÉTODOS PRIVADOS
	// ═══════════════════════════════════════════════

	/**
	 * Generar respuesta de autenticación con access + refresh tokens
	 */
	private async generateAuthResponse(
		user: UserEntity,
		ip?: string,
		userAgent?: string,
	): Promise<AuthResponse> {
		// Generar access token JWT
		const payload: TokenPayload = {
			sub: user.id,
			username: user.username,
			email: user.email,
		};

		const accessToken = jwt.sign(payload, this.jwtSecret, {
			expiresIn: ACCESS_TOKEN_EXPIRY,
		});

		// Generar refresh token (random + hashear para BBDD)
		const refreshToken = crypto.randomBytes(64).toString('hex');
		const tokenHash = this.hashToken(refreshToken);

		// Calcular fecha de expiración
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

		// Guardar refresh token en BBDD
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
			expires_in: 900, // 15 minutos en segundos
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				display_name: user.display_name,
			},
		};
	}

	/**
	 * Manejar login fallido
	 * Incrementa el contador y bloquea la cuenta si excede el límite
	 */
	private async handleFailedLogin(user: UserEntity): Promise<void> {
		const attempts = user.failed_login_attempts + 1;

		const updateData: Partial<UserEntity> = {
			failed_login_attempts: attempts,
		};

		// Bloquear cuenta si excede el máximo de intentos
		if (attempts >= MAX_FAILED_ATTEMPTS) {
			const lockUntil = new Date();
			lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
			updateData.locked_until = lockUntil;

			console.log(`🔒 Cuenta bloqueada: ${user.username} (${attempts} intentos fallidos) hasta ${lockUntil.toISOString()}`);
		}

		await this.userRepo.update(user.id, updateData);
	}

	/**
	 * Manejar login exitoso
	 * Resetea el contador de intentos fallidos
	 */
	private async handleSuccessfulLogin(user: UserEntity): Promise<void> {
		await this.userRepo.update(user.id, {
			failed_login_attempts: 0,
			locked_until: null,
			last_login: new Date(),
		});
	}

	/**
	 * Hashear token con SHA-256 para almacenamiento seguro
	 */
	private hashToken(token: string): string {
		return crypto.createHash('sha256').update(token).digest('hex');
	}

	/**
	 * Limpiar refresh tokens expirados (mantenimiento)
	 * Se recomienda ejecutar periódicamente con un cron job
	 */
	async cleanupExpiredTokens(): Promise<number> {
		const result = await this.refreshTokenRepo
			.createQueryBuilder()
			.delete()
			.where('expires_at < :now', { now: new Date() })
			.orWhere('is_revoked = :revoked', { revoked: true })
			.execute();

		const deleted = result.affected || 0;
		if (deleted > 0) {
			console.log(`🧹 ${deleted} tokens expirados/revocados eliminados`);
		}
		return deleted;
	}
}

// ═══════════════════════════════════════════════
//  Errores tipados para el controlador
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
