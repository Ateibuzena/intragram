import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatMessageEntity } from './chat-message.entity';

/**
 * Conversation de chat entre usuarios.
 * Mantiene el resumen usado en el frontend (last_message, last_message_at, etc.).
 */
@Entity({ name: 'chat_conversations' })
export class ChatConversationEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	// Identificadores de usuarios participantes (referencian al user-service por id)
	@Column('text', { array: true })
	participants!: string[];

	@Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	created_at!: Date;

	@Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	updated_at!: Date;

	@Column({ type: 'text', nullable: true })
	last_message!: string | null;

	@Column({ type: 'timestamptz', nullable: true })
	last_message_at!: Date | null;

	// Lets the frontend render a "📷 Photo" icon/label for the conversation
	// preview instead of baking that text into last_message.
	@Column({ type: 'boolean', default: false })
	last_message_has_image!: boolean;

	@OneToMany(() => ChatMessageEntity, (message: { conversation: any; }) => message.conversation, { cascade: true })
	messages!: ChatMessageEntity[];
}
