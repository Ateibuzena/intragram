/**
 * Notification entity of the users-service.
 * Stores likes and comments directed at a user's posts, so the frontend can
 * show a combined badge/list without polling posts-service directly.
 * Friend requests are intentionally NOT duplicated here — they already live
 * in UserFriendshipEntity and are merged into the UI only client-side.
 */

import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type NotificationType = 'like' | 'comment';

@Entity('notifications')
export class NotificationEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('IDX_NOTIFICATION_RECIPIENT')
	@Column({ type: 'uuid' })
	recipient_id!: string;

	@Column({ type: 'uuid' })
	actor_id!: string;

	@Column({ type: 'varchar', length: 20 })
	type!: NotificationType;

	@Column({ type: 'uuid' })
	post_id!: string;

	// Short excerpt of the comment, only set when type === 'comment'.
	@Column({ type: 'varchar', length: 160, nullable: true })
	comment_preview!: string | null;

	@Column({ type: 'boolean', default: false })
	read!: boolean;

	@CreateDateColumn({ type: 'timestamptz' })
	created_at!: Date;
}
