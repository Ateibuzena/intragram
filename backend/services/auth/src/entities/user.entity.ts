/**
 * User entity of the auth-service.
 * Models credentials, status, and session auditing.
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
	 * Password hashed with bcrypt.
	 * Never returned in responses.
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
	 * Failed login attempt counter.
	 * Used for temporary account lockout.
	 */
	@Column({ type: 'int', default: 0 })
	failed_login_attempts!: number;

	/**
	 * Date until which the account is locked.
	 */
	@Column({ type: 'timestamp', nullable: true })
	locked_until!: Date | null;

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updated_at!: Date;
}
