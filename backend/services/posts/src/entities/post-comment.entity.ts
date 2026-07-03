import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	Index,
	ManyToOne,
	JoinColumn,
} from 'typeorm';
import { PostEntity } from './post.entity';

@Entity('post_comments')
export class PostCommentEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('IDX_POST_COMMENT_POST')
	@Column({ type: 'uuid' })
	post_id!: string;

	@ManyToOne(() => PostEntity, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'post_id' })
	post!: PostEntity;

	@Index('IDX_POST_COMMENT_AUTHOR')
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

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;
}
