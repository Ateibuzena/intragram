/**
 * Entity for post comments in Intragram.
 */

import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
} from 'typeorm';
import { UserProfileEntity } from './user-profile.entity';

@Entity('user_post_comments')
export class UserPostCommentEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('IDX_POST_COMMENT_POST')
	@Column({ type: 'uuid' })
	post_id!: string;

	@ManyToOne(() => UserProfileEntity, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'author_id' })
	author!: UserProfileEntity;

	@Index('IDX_POST_COMMENT_AUTHOR')
	@Column({ type: 'uuid' })
	author_id!: string;

	@Column({ type: 'text' })
	content!: string;

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;
}
