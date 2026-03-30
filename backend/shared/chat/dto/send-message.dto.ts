import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
	@IsString()
	@MaxLength(4000)
	message!: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	attachments?: string[];
}