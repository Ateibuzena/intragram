/**
 * Feed post entity of Intragram.
 * Related to the user profile of the users-service.
 */

import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
} from 'typeorm';
import { UserProfileEntity } from './user-profile.entity';

@Entity('user_posts')
export class UserPostEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@ManyToOne(() => UserProfileEntity, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'author_id' })
	author!: UserProfileEntity;

	@Index('IDX_USER_POST_AUTHOR')
	@Column({ type: 'uuid' })
	author_id!: string;

	@Column({ type: 'text' })
	content!: string;

	@Column({ type: 'varchar', length: 20, default: 'public' })
	visibility!: 'public' | 'friends' | 'private';

	@Column({ type: 'int', default: 0 })
	likes_count!: number;

	@Column({ type: 'int', default: 0 })
	comments_count!: number;

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updated_at!: Date;
}
