/**
 * Entidad de amistad/relación entre usuarios.
 */

import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	Index,
} from 'typeorm';

@Entity('user_friendships')
@Index('IDX_USER_FRIEND_UNIQUE', ['user_id', 'friend_id'], { unique: true })
export class UserFriendshipEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ type: 'uuid' })
	user_id!: string;

	@Column({ type: 'uuid' })
	friend_id!: string;

	@Column({ type: 'varchar', length: 20, default: 'accepted' })
	status!: 'pending' | 'accepted' | 'blocked';

	@CreateDateColumn({ type: 'timestamp' })
	created_at!: Date;
}
