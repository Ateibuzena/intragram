import { IsString, MaxLength } from 'class-validator';

export class CreateConversationDto {
	@IsString()
	@MaxLength(100)
	recipientId: string;
}