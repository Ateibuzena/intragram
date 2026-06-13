import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('user_post_likes')
@Index('IDX_POST_LIKE_UNIQUE', ['user_id', 'post_id'], { unique: true })
export class UserPostLikeEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ type: 'uuid' })
	user_id!: string;

	@Column({ type: 'uuid' })
	post_id!: string;

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;
}
