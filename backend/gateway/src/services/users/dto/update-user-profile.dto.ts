import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserProfileDto {
	@IsOptional()
	@IsString()
	@MaxLength(160)
	display_name?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	avatar_url?: string;
}
