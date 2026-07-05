import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Index } from 'typeorm';
import { ChatConversationEntity } from './chat-conversation.entity';

/**
 * Individual message within a chat conversation.
 */
@Entity({ name: 'chat_messages' })
export class ChatMessageEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@ManyToOne(() => ChatConversationEntity, (conversation: { messages: any; }) => conversation.messages, {
		onDelete: 'CASCADE',
	})
	@Index('idx_chat_messages_conversation_id')
	conversation!: ChatConversationEntity;

	@Column('uuid')
	conversationId!: string;

	// Identifier of the sending user (logical reference to the user-service)
	@Column('uuid')
	senderId!: string;

	@Column({ type: 'text' })
	message!: string;

	@Column('text', { array: true, default: '{}' })
	attachments!: string[];

	// Excluded from default SELECTs (select: false) so listing/polling messages
	// never pulls image bytes for every message — only the dedicated image
	// endpoint queries this column explicitly. Same pattern as PostEntity.
	@Column({ type: 'bytea', nullable: true, select: false })
	image_data!: Buffer | null;

	@Column({ type: 'varchar', length: 100, nullable: true })
	image_mime_type!: string | null;

	@Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	created_at!: Date;
}
