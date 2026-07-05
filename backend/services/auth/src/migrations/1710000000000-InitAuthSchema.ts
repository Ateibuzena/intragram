import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAuthSchema1710000000000 implements MigrationInterface {
	name = 'InitAuthSchema1710000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "users" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"username" varchar(50) NOT NULL,
				"email" varchar(255) NOT NULL,
				"password" varchar(255) NOT NULL,
				"display_name" varchar(100),
				"user_profile_id" uuid,
				"is_active" boolean NOT NULL DEFAULT true,
				"last_login" timestamp,
				"failed_login_attempts" integer NOT NULL DEFAULT 0,
				"locked_until" timestamp,
				"created_at" timestamp NOT NULL DEFAULT now(),
				"updated_at" timestamp NOT NULL DEFAULT now(),
				CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
				CONSTRAINT "UQ_users_username" UNIQUE ("username"),
				CONSTRAINT "UQ_users_email" UNIQUE ("email")
			)
		`);
		await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_USER_USERNAME" ON "users" ("username")');
		await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_USER_EMAIL" ON "users" ("email")');
		await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_USER_PROFILE_ID" ON "users" ("user_profile_id")');
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "refresh_tokens" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"token_hash" varchar(255) NOT NULL,
				"user_id" uuid NOT NULL,
				"expires_at" timestamp NOT NULL,
				"is_revoked" boolean NOT NULL DEFAULT false,
				"user_agent" varchar(500),
				"ip_address" varchar(45),
				"created_at" timestamp NOT NULL DEFAULT now(),
				CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
				CONSTRAINT "FK_refresh_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
			)
		`);
		await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_REFRESH_TOKEN_HASH" ON "refresh_tokens" ("token_hash")');
		await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_REFRESH_TOKEN_USER" ON "refresh_tokens" ("user_id")');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_REFRESH_TOKEN_USER"');
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_REFRESH_TOKEN_HASH"');
		await queryRunner.query('DROP TABLE IF EXISTS "refresh_tokens"');
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_USER_PROFILE_ID"');
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_USER_EMAIL"');
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_USER_USERNAME"');
		await queryRunner.query('DROP TABLE IF EXISTS "users"');
	}
}
