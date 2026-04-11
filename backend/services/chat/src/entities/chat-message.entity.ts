import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Index } from 'typeorm';
import { ChatConversationEntity } from './chat-conversation.entity';

/**
 * Mensaje individual dentro de una conversación de chat.
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

	// Identificador del usuario emisor (referencia lógica al user-service)
	@Column('uuid')
	senderId!: string;

	@Column({ type: 'text' })
	message!: string;

	@Column('text', { array: true, default: '{}' })
	attachments!: string[];

	@Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	created_at!: Date;
}
