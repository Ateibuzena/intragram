import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { UserPostEntity } from './user-post.entity';

@Entity('user_post_likes')
@Index('IDX_POST_LIKE_UNIQUE', ['user_id', 'post_id'], { unique: true })
export class UserPostLikeEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@ManyToOne(() => UserPostEntity, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'post_id' })
	post!: UserPostEntity;

	@Column({ type: 'uuid' })
	user_id!: string;

	@Column({ type: 'uuid' })
	post_id!: string;

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;
}
