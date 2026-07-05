import { IsString, MaxLength } from 'class-validator';

export class UpdateUserAvatarDto {
	@IsString()
	@MaxLength(11_000_000)
	image_base64!: string;
}