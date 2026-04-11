/**
 * Entidad de usuario del auth-service.
 * Modela credenciales, estado y auditoría de sesión.
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
	 * Password hasheado con bcrypt.
	 * Nunca se devuelve en respuestas.
	 */
	@Column({ type: 'varchar', length: 255, select: false })
	password!: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	display_name!: string | null;

	@Column({ type: 'uuid', nullable: true })
	@Index('IDX_USER_PROFILE_ID')
	user_profile_id!: string | null;

	@Column({ type: 'boolean', default: true })
	is_active!: boolean;

	@Column({ type: 'timestamp', nullable: true })
	last_login!: Date | null;

	/**
	 * Contador de intentos fallidos de login.
	 * Se usa para bloqueo temporal de cuenta.
	 */
	@Column({ type: 'int', default: 0 })
	failed_login_attempts!: number;

	/**
	 * Fecha hasta la cual la cuenta está bloqueada.
	 */
	@Column({ type: 'timestamp', nullable: true })
	locked_until!: Date | null;

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updated_at!: Date;
}
