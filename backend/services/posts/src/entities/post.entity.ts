import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
} from 'typeorm';

@Entity('posts')
export class PostEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('IDX_POST_AUTHOR')
	@Column({ type: 'uuid' })
	author_id!: string;

	@Column({ type: 'varchar', length: 80 })
	author_login!: string;

	@Column({ type: 'varchar', length: 160, nullable: true })
	author_display_name!: string | null;

	@Column({ type: 'varchar', length: 255, nullable: true })
	author_avatar_url!: string | null;

	@Column({ type: 'varchar', length: 120, nullable: true })
	author_campus!: string | null;

	@Column({ type: 'varchar', length: 120, nullable: true })
	author_campus_country!: string | null;

	@Column({ type: 'numeric', precision: 8, scale: 2, nullable: true })
	author_level!: string | number | null;

	@Column({ type: 'varchar', length: 120, nullable: true })
	author_cursus_grade!: string | null;

	@Column({ type: 'int', default: 0 })
	author_correction_point!: number;

	@Column({ type: 'boolean', default: true })
	author_active!: boolean;

	@Column({ type: 'timestamp', nullable: true })
	author_last_login_at!: Date | null;

	@Column({ type: 'text' })
	content!: string;

	@Column({ type: 'varchar', length: 20, default: 'public' })
	visibility!: 'public' | 'friends' | 'private';

	@Column({ type: 'int', default: 0 })
	likes_count!: number;

	@Column({ type: 'int', default: 0 })
	comments_count!: number;

	// Excluded from default SELECTs (select: false) so listing the feed never
	// pulls image bytes for every post — only the dedicated image endpoint
	// queries this column explicitly.
	@Column({ type: 'bytea', nullable: true, select: false })
	image_data!: Buffer | null;

	@Column({ type: 'varchar', length: 100, nullable: true })
	image_mime_type!: string | null;

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updated_at!: Date;
}
