import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'chat_conversation_reads' })
@Index('idx_chat_reads_user_conv', ['user_id', 'conversation_id'], { unique: true })
export class ChatConversationReadEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column('uuid')
	user_id!: string;

	@Column('uuid')
	conversation_id!: string;

	@Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	last_read_at!: Date;
}
