import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitChatSchema1710000002000 implements MigrationInterface {
	name = 'InitChatSchema1710000002000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "chat_conversations" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"participants" text array NOT NULL,
				"created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
				"updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
				"last_message" text,
				"last_message_at" timestamptz,
				CONSTRAINT "PK_chat_conversations_id" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "chat_messages" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"conversationId" uuid NOT NULL,
				"senderId" uuid NOT NULL,
				"message" text NOT NULL,
				"attachments" text array NOT NULL DEFAULT '{}',
				"created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
				CONSTRAINT "PK_chat_messages_id" PRIMARY KEY ("id"),
				CONSTRAINT "FK_chat_messages_conversation_id" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE
			)
		`);
		await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_chat_messages_conversation_id" ON "chat_messages" ("conversationId")');
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "chat_conversation_reads" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"user_id" uuid NOT NULL,
				"conversation_id" uuid NOT NULL,
				"last_read_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
				CONSTRAINT "PK_chat_conversation_reads_id" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "idx_chat_reads_user_conv" ON "chat_conversation_reads" ("user_id", "conversation_id")');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('DROP INDEX IF EXISTS "idx_chat_reads_user_conv"');
		await queryRunner.query('DROP TABLE IF EXISTS "chat_conversation_reads"');
		await queryRunner.query('DROP INDEX IF EXISTS "idx_chat_messages_conversation_id"');
		await queryRunner.query('DROP TABLE IF EXISTS "chat_messages"');
		await queryRunner.query('DROP TABLE IF EXISTS "chat_conversations"');
	}
}
