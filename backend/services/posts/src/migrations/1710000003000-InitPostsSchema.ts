import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitPostsSchema1710000003000 implements MigrationInterface {
	name = 'InitPostsSchema1710000003000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "posts" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"author_id" uuid NOT NULL,
				"author_login" varchar(80) NOT NULL,
				"author_display_name" varchar(160),
				"author_avatar_url" varchar(255),
				"author_campus" varchar(120),
				"author_campus_country" varchar(120),
				"author_level" numeric(8,2),
				"author_cursus_grade" varchar(120),
				"author_correction_point" integer NOT NULL DEFAULT 0,
				"author_active" boolean NOT NULL DEFAULT true,
				"author_last_login_at" timestamp,
				"content" text NOT NULL,
				"visibility" varchar(20) NOT NULL DEFAULT 'public',
				"likes_count" integer NOT NULL DEFAULT 0,
				"comments_count" integer NOT NULL DEFAULT 0,
				"image_data" bytea,
				"image_mime_type" varchar(100),
				"created_at" timestamp NOT NULL DEFAULT now(),
				"updated_at" timestamp NOT NULL DEFAULT now(),
				CONSTRAINT "PK_posts_id" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_POST_AUTHOR" ON "posts" ("author_id")');
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "post_comments" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"post_id" uuid NOT NULL,
				"author_id" uuid NOT NULL,
				"author_login" varchar(80) NOT NULL,
				"author_display_name" varchar(160),
				"author_avatar_url" varchar(255),
				"author_campus" varchar(120),
				"author_campus_country" varchar(120),
				"author_level" numeric(8,2),
				"author_cursus_grade" varchar(120),
				"author_correction_point" integer NOT NULL DEFAULT 0,
				"author_active" boolean NOT NULL DEFAULT true,
				"author_last_login_at" timestamp,
				"content" text NOT NULL,
				"created_at" timestamp NOT NULL DEFAULT now(),
				CONSTRAINT "PK_post_comments_id" PRIMARY KEY ("id"),
				CONSTRAINT "FK_post_comments_post_id" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE
			)
		`);
		await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_POST_COMMENT_POST" ON "post_comments" ("post_id")');
		await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_POST_COMMENT_AUTHOR" ON "post_comments" ("author_id")');
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "post_likes" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"post_id" uuid NOT NULL,
				"user_id" uuid NOT NULL,
				"created_at" timestamp NOT NULL DEFAULT now(),
				CONSTRAINT "PK_post_likes_id" PRIMARY KEY ("id"),
				CONSTRAINT "FK_post_likes_post_id" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE
			)
		`);
		await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_POST_LIKE_POST" ON "post_likes" ("post_id")');
		await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "IDX_POST_LIKE_UNIQUE" ON "post_likes" ("user_id", "post_id")');
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "post_saves" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"post_id" uuid NOT NULL,
				"user_id" uuid NOT NULL,
				"created_at" timestamp NOT NULL DEFAULT now(),
				CONSTRAINT "PK_post_saves_id" PRIMARY KEY ("id"),
				CONSTRAINT "FK_post_saves_post_id" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE
			)
		`);
		await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_POST_SAVE_POST" ON "post_saves" ("post_id")');
		await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "IDX_POST_SAVE_UNIQUE" ON "post_saves" ("user_id", "post_id")');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_POST_SAVE_UNIQUE"');
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_POST_SAVE_POST"');
		await queryRunner.query('DROP TABLE IF EXISTS "post_saves"');
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_POST_LIKE_UNIQUE"');
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_POST_LIKE_POST"');
		await queryRunner.query('DROP TABLE IF EXISTS "post_likes"');
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_POST_COMMENT_AUTHOR"');
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_POST_COMMENT_POST"');
		await queryRunner.query('DROP TABLE IF EXISTS "post_comments"');
		await queryRunner.query('DROP INDEX IF EXISTS "IDX_POST_AUTHOR"');
		await queryRunner.query('DROP TABLE IF EXISTS "posts"');
	}
}
