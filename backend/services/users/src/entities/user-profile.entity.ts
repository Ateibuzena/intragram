import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
} from 'typeorm';

@Entity('user_profiles')
export class UserProfileEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ type: 'int', unique: true })
	@Index('IDX_USER_PROFILE_42_ID')
	forty_two_id!: number;

	@Column({ type: 'varchar', length: 80, unique: true })
	@Index('IDX_USER_PROFILE_LOGIN')
	login!: string;

	@Column({ type: 'varchar', length: 255, nullable: true })
	@Index('IDX_USER_PROFILE_EMAIL')
	email!: string | null;

	@Column({ type: 'varchar', length: 120, nullable: true })
	first_name!: string | null;

	@Column({ type: 'varchar', length: 120, nullable: true })
	last_name!: string | null;

	@Column({ type: 'varchar', length: 160, nullable: true })
	display_name!: string | null;

	@Column({ type: 'varchar', length: 255, nullable: true })
	avatar_url!: string | null;

	@Column({ type: 'varchar', length: 120, nullable: true })
	campus!: string | null;

	@Column({ type: 'varchar', length: 120, nullable: true })
	pool_month!: string | null;

	@Column({ type: 'varchar', length: 20, nullable: true })
	pool_year!: string | null;

	@Column({ type: 'int', default: 0 })
	wallet!: number;

	@Column({ type: 'int', default: 0 })
	correction_point!: number;

	@Column({ type: 'varchar', length: 120, nullable: true })
	location!: string | null;

	@Column({ type: 'varchar', length: 40, nullable: true })
	phone!: string | null;

	@Column({ type: 'boolean', default: false })
	staff!: boolean;

	@Column({ type: 'boolean', default: false })
	alumni!: boolean;

	@Column({ type: 'boolean', default: true })
	active!: boolean;

	@Column({ type: 'timestamp', nullable: true })
	last_login_at!: Date | null;

	@Column({ type: 'jsonb', nullable: true })
	raw_profile!: Record<string, unknown> | null;

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updated_at!: Date;
}
