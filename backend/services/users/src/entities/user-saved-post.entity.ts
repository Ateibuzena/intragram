/**
 * Entidad de posts guardados (favoritos) por usuario.
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
import { UserPostEntity } from './user-post.entity';

@Entity('user_saved_posts')
@Index('IDX_USER_SAVED_POST_UNIQUE', ['user_id', 'post_id'], { unique: true })
export class UserSavedPostEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@ManyToOne(() => UserProfileEntity, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: UserProfileEntity;

	@Column({ type: 'uuid' })
	user_id!: string;

	@ManyToOne(() => UserPostEntity, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'post_id' })
	post!: UserPostEntity;

	@Column({ type: 'uuid' })
	post_id!: string;

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;
}
