import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitUsersSchema1710000001000 implements MigrationInterface {
	name = 'InitUsersSchema1710000001000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "user_profiles" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"forty_two_id" integer NOT NULL,
				"login" varchar(80) NOT NULL,
				"email" varchar(255),
				"first_name" varchar(120),
				"last_name" varchar(120),
				"display_name" varchar(160),
				"avatar_url" varchar(255),
				"campus" varchar(120),
				"campus_id" integer,
				"campus_country" varchar(120),
				"campus_city" varchar(120),
				"pool_month" varchar(120),
				"pool_year" varchar(20),
				"wallet" integer NOT NULL DEFAULT 0,
				"correction_point" integer NOT NULL DEFAULT 0,
				"location" varchar(120),
				"phone" varchar(40),
				"staff" boolean NOT NULL DEFAULT false,
				"alumni" boolean NOT NULL DEFAULT false,
				"active" boolean NOT NULL DEFAULT true,
				"forty_two_active" boolean DEFAULT NULL,
				"last_login_at" timestamp,
				"skills" jsonb,
				"levels" jsonb,
				"titles" jsonb,
				"projects_users" jsonb,
				"dashes_users" jsonb,
				"achievements" jsonb,
				"background_theme" varchar(40) DEFAULT NULL,
				"raw_profile" jsonb,
				"created_at" timestamp NOT NULL DEFAULT now(),
				"updated_at" timestamp NOT NULL DEFAULT now(),
				CONSTRAINT "PK_user_profiles_id" PRIMARY KEY ("id"),
				CONSTRAINT "UQ_user_profiles_forty_two_id" UNIQUE ("forty_two_id"),
				CONSTRAINT "UQ_user_profiles_login" UNIQUE ("login")
			)
		`);
		await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_USER_PROFILE_42_ID" ON "user_profiles" ("forty_two_id")');
		await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_USER_PROFILE_LOGIN" ON "user_profiles" ("login")');
		await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_USER_PROFILE_EMAIL" ON "user_profiles" ("email")');
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "user_friendships" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"user_id" uuid NOT NULL,
				"friend_id" uuid NOT NULL,
				"status" varchar(20) NOT NULL DEFAULT 'accepted',
				"created_at" timestamp NOT NULL DEFAULT now(),
				CONSTRAINT "PK_user_friendships_id" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "IDX_USER_FRIEND_UNIQUE" ON "user_friendships" ("user_id", "friend_id")');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_USER_FRIEND_UNIQUE"');
		await queryRunner.query('DROP TABLE IF EXISTS "user_friendships"');
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_USER_PROFILE_EMAIL"');
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_USER_PROFILE_LOGIN"');
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_USER_PROFILE_42_ID"');
		await queryRunner.query('DROP TABLE IF EXISTS "user_profiles"');
	}
}
