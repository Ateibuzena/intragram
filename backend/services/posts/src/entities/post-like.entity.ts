import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { PostEntity } from './post.entity';

@Entity('post_likes')
@Index('IDX_POST_LIKE_UNIQUE', ['user_id', 'post_id'], { unique: true })
export class PostLikeEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('IDX_POST_LIKE_POST')
	@Column({ type: 'uuid' })
	post_id!: string;

	@ManyToOne(() => PostEntity, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'post_id' })
	post!: PostEntity;

	@Column({ type: 'uuid' })
	user_id!: string;

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;
}
