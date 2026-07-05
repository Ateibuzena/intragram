import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateNotificationDto {
	@IsUUID()
	recipient_id!: string;

	@IsUUID()
	actor_id!: string;

	@IsIn(['like', 'comment'])
	type!: 'like' | 'comment';

	@IsUUID()
	post_id!: string;

	@IsOptional()
	@IsString()
	@MaxLength(160)
	comment_preview?: string;
}
