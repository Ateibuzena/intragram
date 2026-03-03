/**
 * Entidad de Refresh Token
 * Tabla 'refresh_tokens' en PostgreSQL
 * 
 * Permite:
 * - Renovar access tokens sin re-autenticación
 * - Revocar sesiones individuales
 * - Auditoría de sesiones activas por usuario
 * 
 * Seguridad:
 * - Tokens hasheados en BBDD (no se almacena el token en texto plano)
 * - Expiración configurable
 * - Revocación individual y masiva
 */

import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	Index,
	ManyToOne,
	JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('refresh_tokens')
export class RefreshTokenEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	/**
	 * Hash SHA-256 del refresh token
	 * El token original solo se envía al cliente una vez
	 */
	@Column({ type: 'varchar', length: 255 })
	@Index('IDX_REFRESH_TOKEN_HASH')
	token_hash!: string;

	@Column({ type: 'uuid' })
	@Index('IDX_REFRESH_TOKEN_USER')
	user_id!: string;

	@ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: UserEntity;

	@Column({ type: 'timestamp' })
	expires_at!: Date;

	@Column({ type: 'boolean', default: false })
	is_revoked!: boolean;

	/**
	 * User-Agent del cliente que creó la sesión
	 * Útil para auditoría y detección de sesiones sospechosas
	 */
	@Column({ type: 'varchar', length: 500, nullable: true })
	user_agent!: string | null;

	/**
	 * IP del cliente que creó la sesión
	 */
	@Column({ type: 'varchar', length: 45, nullable: true })
	ip_address!: string | null;

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;
}
