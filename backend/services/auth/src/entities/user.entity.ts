/**
 * Entidad de Usuario
 * Tabla 'users' en PostgreSQL
 * 
 * Medidas de seguridad:
 * - El password se almacena hasheado con bcrypt (salt rounds: 12)
 * - El email tiene índice único para evitar duplicados
 * - El username tiene índice único
 * - Se registra la fecha de último login
 * - Campo is_active para soft-delete / bloqueo de cuentas
 */

import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
} from 'typeorm';

@Entity('users')
export class UserEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ type: 'varchar', length: 50, unique: true })
	@Index('IDX_USER_USERNAME')
	username!: string;

	@Column({ type: 'varchar', length: 255, unique: true })
	@Index('IDX_USER_EMAIL')
	email!: string;

	/**
	 * Password hasheado con bcrypt
	 * NUNCA se devuelve en las respuestas de la API
	 */
	@Column({ type: 'varchar', length: 255, select: false })
	password!: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	display_name!: string | null;

	@Column({ type: 'boolean', default: true })
	is_active!: boolean;

	@Column({ type: 'timestamp', nullable: true })
	last_login!: Date | null;

	/**
	 * Contador de intentos fallidos de login
	 * Se resetea tras un login exitoso
	 * Se usa para bloqueo temporal de cuenta (lockout)
	 */
	@Column({ type: 'int', default: 0 })
	failed_login_attempts!: number;

	/**
	 * Fecha hasta la cual la cuenta está bloqueada
	 * Si es null o pasada -> la cuenta no está bloqueada
	 */
	@Column({ type: 'timestamp', nullable: true })
	locked_until!: Date | null;

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updated_at!: Date;
}
