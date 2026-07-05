import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAvatarImageColumns1710000001100 implements MigrationInterface {
	name = 'AddUserAvatarImageColumns1710000001100';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "avatar_image_data" bytea');
		await queryRunner.query('ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "avatar_image_mime_type" varchar(100)');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "avatar_image_mime_type"');
		await queryRunner.query('ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "avatar_image_data"');
	}
}